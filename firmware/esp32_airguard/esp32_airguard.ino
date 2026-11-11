/**
 * ============================================================================
 * Project: AirGuard IoT - Smart Environmental & Gas Safety Station
 * Target Microcontroller: ESP32-S3 (ESP32-S3-DevKitC-1 / WROOM-1)
 * Development Environment: Arduino IDE 2.x
 * ============================================================================
 * 
 * DESCRIPTION:
 *   An all-in-one IoT edge firmware running on the dual-core ESP32-S3.
 *   This sketch performs:
 *     1. Deterministic analog sampling of MQ-135 (Air Quality) and MQ-9
 *        (Carbon Monoxide & Combustible Gas) via ADC1 channels.
 *     2. Optical microsecond pulse triggering and sampling of the Sharp
 *        GP2Y1010AU0F dust sensor for particulate matter (PM2.5 / PM10).
 *     3. Digital one-wire climate acquisition (Temperature & Humidity) via DHT11/DHT22.
 *     4. Autonomous local safety alarming using an active acoustic buzzer and
 *        tri-color safety status LEDs (Green = Safe, Yellow = Warning, Red = Danger).
 *     5. Autonomous 2.4 GHz 802.11 b/g/n Wi-Fi connectivity with auto-reconnect.
 *     6. JSON telemetry serialization and publishing to an MQTT broker
 *        for streaming to a Real-Time Web Application.
 *     7. Reserved ADC1 hook (GPIO 5) for Phase 2 ME2-O2 electrochemical sensing.
 * 
 * CRITICAL HARDWARE DESIGN NOTE:
 *   - Only ADC1 pins (GPIO 1 to 10) are used for analog sensors. On ESP32-S3,
 *     ADC2 cannot be sampled when the Wi-Fi stack is active.
 *   - Gas sensors (MQ-135, MQ-9) produce 0–5V analog signals and must be
 *     stepped down to 0–3.3V via 1kΩ / 2kΩ voltage dividers before entering
 *     the ESP32-S3 ADC pins.
 * 
 * ACADEMIC METADATA:
 *   Course: CSE402 - Internet of Things Lab (Autumn 2026)
 *   Institution: University of Information Technology and Sciences (UITS)
 *   Department: Department of Computer Science & Engineering (CSE)
 *   Team Members:
 *     1. MD. Fahad Rahman (Team Leader) - ID: 0432320005101071
 *     2. Zannatul Nayem                 - ID: 0432320005101063
 *     3. Shafayet Hossain Shafin        - ID: 0432320005101088
 *   Batch: 54th Batch | Section: 6B1
 * ============================================================================
 */

// ============================================================================
// REQUIRED LIBRARIES
// ============================================================================
// Install via Arduino IDE Library Manager:
//   1. "PubSubClient" by Nick O'Leary (v2.8.0 or later)
//   2. "DHT sensor library" by Adafruit (v1.4.4 or later)
//   3. "Adafruit Unified Sensor" by Adafruit (dependency for DHT)
#include <WiFi.h>          // ESP32 core Wi-Fi networking library
#include <PubSubClient.h>    // Lightweight MQTT client protocol library
#include <DHT.h>             // Adafruit digital temperature & humidity driver

// ============================================================================
// 1. PIN DEFINITIONS & CHANNEL ALLOCATIONS (ESP32-S3)
// ============================================================================

// --- Analog Inputs (Strictly assigned to ADC1 for Wi-Fi coexistence) ---
#define PIN_MQ135        1   // ESP32-S3 GPIO 1 (ADC1_CH0): MQ-135 Air Quality Analog Voltage
#define PIN_MQ9          2   // ESP32-S3 GPIO 2 (ADC1_CH1): MQ-9 CO & Flammable Gas Analog Voltage
#define PIN_DUST_VO      4   // ESP32-S3 GPIO 4 (ADC1_CH3): Sharp GP2Y1010AU0F Analog Output (V0)
// #define PIN_O2        5   // ESP32-S3 GPIO 5 (ADC1_CH4): Reserved for Phase 2 ME2-O2 Sensor

// --- Digital Actuators & Control Pins ---
#define PIN_DUST_LED     6   // ESP32-S3 GPIO 6: Sharp GP2Y1010AU0F Optical IRED Trigger Pin
#define PIN_DHT          7   // ESP32-S3 GPIO 7: DHT11 / DHT22 Digital One-Wire Data Bus
#define PIN_BUZZER       8   // ESP32-S3 GPIO 8: Active 5V/3.3V Acoustic Buzzer Signal Pin
#define PIN_LED_GREEN    9   // ESP32-S3 GPIO 9: Green LED (Normal / Safe Atmospheric Level)
#define PIN_LED_YELLOW   10  // ESP32-S3 GPIO 10: Yellow LED (Warning / Elevated Contaminant Level)
#define PIN_LED_RED      11  // ESP32-S3 GPIO 11: Red LED (Critical Danger / Evacuate Alert)

// ============================================================================
// 2. NETWORK & MQTT BROKER CONFIGURATION
// ============================================================================

// Replace with your local 2.4 GHz Wi-Fi hotspot credentials:
const char* WIFI_SSID       = "YOUR_WIFI_SSID";       // 2.4 GHz Wi-Fi Network Name
const char* WIFI_PASSWORD   = "YOUR_WIFI_PASSWORD";   // Wi-Fi Password

// MQTT Broker Endpoint (Default: Public HiveMQ Broker)
// Alternative brokers: "broker.emqx.io" or "mqtt.thingspeak.com"
const char* MQTT_BROKER     = "broker.hivemq.com";
const int   MQTT_PORT       = 1883;                     // Standard unencrypted MQTT port
const char* MQTT_TOPIC_PUB  = "airguard/telemetry";     // Publish topic for web telemetry

// Network client objects
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ============================================================================
// 3. SENSOR CALIBRATION & THRESHOLD CONSTANTS
// ============================================================================

// DHT Sensor Type: Select DHT11 or DHT22
#define DHTTYPE DHT11
DHT dht(PIN_DHT, DHTTYPE);

// Sampling Interval: Read physical sensors every 3000 milliseconds (3 seconds)
unsigned long lastSampleTime = 0;
const unsigned long SAMPLE_INTERVAL = 3000;

// Safety Thresholds (based on 12-bit ADC range: 0 to 4095)
// With a 1kΩ/2kΩ voltage divider, 5V input corresponds to ~3.33V on the ADC (~4095 counts).
const int THRESHOLD_MQ135_WARN   = 1200;  // Moderate air pollution / volatile organic vapor warning
const int THRESHOLD_MQ135_DANGER = 2000;  // Hazardous air pollution / heavy smoke danger
const int THRESHOLD_MQ9_WARN     = 1000;  // Elevated Carbon Monoxide (CO) concentration warning
const int THRESHOLD_MQ9_DANGER   = 1600;  // Dangerous CO / combustible gas leak (Immediate Alarm)

// Sharp GP2Y1010AU0F Optical Pulse Timing Constants (Microseconds)
// According to Sharp datasheet: IRED must be turned ON for 0.32ms (320µs),
// sampled at 0.28ms (280µs), and turned OFF for 9.68ms (9680µs).
const int DUST_SAMPLE_TIME_US    = 280;   // Wait 280µs after turning LED ON before reading ADC
const int DUST_DELTA_TIME_US     = 40;    // Remaining ON time (280 + 40 = 320µs total ON duration)
const int DUST_SLEEP_TIME_US     = 9680;  // Off duration before next cycle (10ms total period)

// ============================================================================
// 4. FUNCTION DECLARATIONS & IMPLEMENTATIONS
// ============================================================================

/**
 * @brief Connects the ESP32-S3 to the designated 2.4 GHz Wi-Fi hotspot.
 * Non-fatal: If connection fails, system continues local monitoring and alarms.
 */
void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print(F("[Wi-Fi] Connecting to network: "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);  // Set ESP32-S3 as a Wi-Fi Station
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Attempt connection for up to 10 seconds (20 iterations * 500ms)
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println(F("[Wi-Fi] Connection successful!"));
    Serial.print(F("[Wi-Fi] IP Address assigned: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println(F("[Wi-Fi] Connection timed out. Running in standalone local alarm mode."));
  }
}

/**
 * @brief Connects / reconnects to the MQTT broker with a randomized client ID.
 * Non-blocking: returns promptly if broker is unreachable to avoid freezing local alarms.
 */
void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    return; // Cannot connect to MQTT without active Wi-Fi link
  }

  if (!mqttClient.connected()) {
    Serial.print(F("[MQTT] Attempting broker connection ("));
    Serial.print(MQTT_BROKER);
    Serial.print(F(")... "));

    // Generate unique MQTT client ID using ESP32 pseudo-random generator
    String clientId = "AirGuard-ESP32S3-" + String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(F("Connected!"));
      Serial.print(F("[MQTT] Telemetry will be published to: "));
      Serial.println(MQTT_TOPIC_PUB);
    } else {
      Serial.print(F("Failed (state: "));
      Serial.print(mqttClient.state());
      Serial.println(F("). Will retry in next loop cycle."));
    }
  }
}

/**
 * @brief Executes the precision optical pulse sequence for the Sharp GP2Y1010AU0F.
 * 
 * Hardware Sequence:
 *   1. Drive LED pulse pin LOW (activates optical infrared emitter diode).
 *   2. Wait exactly 280 microseconds for stable optical reflection.
 *   3. Read analog output voltage on ADC1 (GPIO 4).
 *   4. Wait 40 microseconds, then drive LED pulse pin HIGH (deactivates emitter).
 *   5. Wait 9680 microseconds (completes 10ms cycle).
 *   6. Convert raw ADC reading into particulate concentration in µg/m³.
 * 
 * @return float Particulate matter dust density in µg/m³
 */
float readDustDensity() {
  // Step 1: Turn ON dust sensor IRED (Active LOW circuit)
  digitalWrite(PIN_DUST_LED, LOW);
  delayMicroseconds(DUST_SAMPLE_TIME_US);

  // Step 2: Sample analog output voltage from internal phototransistor
  int voRaw = analogRead(PIN_DUST_VO);
  delayMicroseconds(DUST_DELTA_TIME_US);

  // Step 3: Turn OFF dust sensor IRED
  digitalWrite(PIN_DUST_LED, HIGH);
  delayMicroseconds(DUST_SLEEP_TIME_US);

  // Step 4: Convert 12-bit ADC value (0-4095) to actual sensor voltage (0 - 3.3V)
  float voVoltage = voRaw * (3.3 / 4095.0);

  // Step 5: Convert voltage to dust density using Sharp's empirical linear approximation:
  // Formula: Density (mg/m³) = 0.17 * Voltage - 0.1
  // Multiply by 1000 to convert mg/m³ to µg/m³
  float dustDensity = (0.17 * voVoltage - 0.1) * 1000.0;

  // Clamp negative baseline offset to 0.0 µg/m³
  if (dustDensity < 0.0) {
    dustDensity = 0.0;
  }

  return dustDensity;
}

/**
 * @brief Evaluates sensor readings against safety limits and triggers local alarms.
 * 
 * Logic Matrix:
 *   - CRITICAL DANGER: (MQ-135 > DANGER) OR (MQ-9 > DANGER)
 *     -> Red LED ON, Yellow OFF, Green OFF, Buzzer ON (Continuous Emergency Siren)
 *   - WARNING: (MQ-135 > WARN) OR (MQ-9 > WARN)
 *     -> Yellow LED ON, Red OFF, Green OFF, Buzzer OFF
 *   - SAFE / NORMAL: All parameters within safe limits
 *     -> Green LED ON, Yellow OFF, Red OFF, Buzzer OFF
 * 
 * @param mq135Val 12-bit ADC reading from MQ-135 Air Quality Sensor
 * @param mq9Val   12-bit ADC reading from MQ-9 CO & Flammable Gas Sensor
 */
void updateAlarms(int mq135Val, int mq9Val) {
  bool isDanger = (mq135Val >= THRESHOLD_MQ135_DANGER) || 
                  (mq9Val >= THRESHOLD_MQ9_DANGER);

  bool isWarning = (!isDanger) && 
                   ((mq135Val >= THRESHOLD_MQ135_WARN) || (mq9Val >= THRESHOLD_MQ9_WARN));

  if (isDanger) {
    // Critical hazard condition: Activate Red LED and acoustic siren
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_BUZZER, HIGH);
  } else if (isWarning) {
    // Elevated contaminant condition: Activate Yellow caution LED
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_YELLOW, HIGH);
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  } else {
    // Normal healthy condition: Activate Green LED, silence buzzer
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_BUZZER, LOW);
  }
}

// ============================================================================
// 5. ARDUINO SETUP ROUTINE
// ============================================================================
void setup() {
  // Initialize USB Serial interface for PC debugging & terminal logging
  Serial.begin(115200);
  delay(500); // Allow hardware USB CDC enumeration

  // Configure digital output control pins
  pinMode(PIN_DUST_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);

  // Set initial safe actuator states
  digitalWrite(PIN_DUST_LED, HIGH); // Sharp sensor IRED is idle OFF (Active LOW)
  digitalWrite(PIN_BUZZER, LOW);     // Buzzer silenced initially

  // Configure ESP32-S3 ADC attenuation:
  // ADC_11db provides full-scale voltage measurement from 0V up to ~3.1V–3.3V
  analogSetAttenuation(ADC_11db);

  // Initialize the digital DHT climate sensor
  dht.begin();

  // Print system header banner
  Serial.println(F("\n========================================================"));
  Serial.println(F("    AirGuard IoT - ESP32-S3 Environmental Station"));
  Serial.println(F("========================================================"));
  Serial.println(F("Processor: Dual-Core Xtensa LX7 @ 240MHz"));
  Serial.println(F("Active Sensors:"));
  Serial.println(F("  - MQ-135 (Air Quality, CO2, NH3, Smoke) on GPIO 1 (ADC1_CH0)"));
  Serial.println(F("  - MQ-9 (Carbon Monoxide & Combustible Gas) on GPIO 2 (ADC1_CH1)"));
  Serial.println(F("  - Sharp GP2Y1010AU0F (Particulate Dust) on GPIO 4 (ADC1_CH3)"));
  Serial.println(F("  - DHT11 / DHT22 (Temperature & Humidity) on GPIO 7"));
  Serial.println(F("Expansion Interface:"));
  Serial.println(F("  - Reserved Phase 2 O2 Sensor Channel on GPIO 5 (ADC1_CH4)"));
  Serial.println(F("Local Alarms:"));
  Serial.println(F("  - Active Buzzer on GPIO 8"));
  Serial.println(F("  - Tri-Color LEDs on GPIO 9 (Green), GPIO 10 (Yellow), GPIO 11 (Red)"));
  Serial.println(F("========================================================"));

  // Perform self-test visual LED sequence upon boot
  digitalWrite(PIN_LED_GREEN, HIGH);
  delay(250);
  digitalWrite(PIN_LED_YELLOW, HIGH);
  delay(250);
  digitalWrite(PIN_LED_RED, HIGH);
  delay(250);
  digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_RED, LOW); // Retain Green LED ON

  // Establish Wi-Fi network connectivity
  setupWiFi();

  // Configure MQTT broker endpoint and port
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

  Serial.println(F("[SYSTEM] Initialization complete. Entering main monitoring loop.\n"));
}

// ============================================================================
// 6. ARDUINO MAIN LOOP
// ============================================================================
void loop() {
  // Maintain active Wi-Fi and MQTT connectivity
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      reconnectMQTT();
    }
    mqttClient.loop(); // Process incoming MQTT keep-alive packets
  }

  // Non-blocking timer: Sample sensors and publish telemetry every SAMPLE_INTERVAL (3s)
  unsigned long currentTime = millis();
  if (currentTime - lastSampleTime >= SAMPLE_INTERVAL) {
    lastSampleTime = currentTime;

    // --- 1. Read Climate Sensors ---
    float temperature = dht.readTemperature(); // Celsius
    float humidity    = dht.readHumidity();    // Relative Humidity (%)

    // Fallback validation for DHT sensor disconnections
    if (isnan(temperature) || isnan(humidity)) {
      temperature = 0.0;
      humidity    = 0.0;
    }

    // --- 2. Read Gas & Particulate Sensors ---
    int mq135Value    = analogRead(PIN_MQ135);   // 12-bit ADC reading (0 - 4095)
    int mq9Value      = analogRead(PIN_MQ9);     // 12-bit ADC reading (0 - 4095)
    float dustDensity = readDustDensity();       // Calculated dust density in µg/m³

    // --- 3. Evaluate Thresholds & Trigger Local Alarms ---
    updateAlarms(mq135Value, mq9Value);

    // --- 4. Serialize Structured JSON Telemetry ---
    // Output Format:
    // {"temp":27.4,"hum":63.2,"aqi":385,"co_gas":210,"dust":26.8}
    String jsonPayload = "{";
    jsonPayload += "\"temp\":" + String(temperature, 1) + ",";
    jsonPayload += "\"hum\":" + String(humidity, 1) + ",";
    jsonPayload += "\"aqi\":" + String(mq135Value) + ",";
    jsonPayload += "\"co_gas\":" + String(mq9Value) + ",";
    jsonPayload += "\"dust\":" + String(dustDensity, 1);
    jsonPayload += "}";

    // --- 5. Print to USB Serial Monitor for Debugging ---
    Serial.print(F("[TELEMETRY] "));
    Serial.println(jsonPayload);

    // --- 6. Publish Payload to Cloud MQTT Broker ---
    if (mqttClient.connected()) {
      bool published = mqttClient.publish(MQTT_TOPIC_PUB, jsonPayload.c_str());
      if (published) {
        Serial.println(F("[MQTT] Telemetry successfully published to broker."));
      } else {
        Serial.println(F("[MQTT] Warning: Telemetry publishing failed."));
      }
    }
  }
}
