/**
 * AirGuard IoT - All-in-One ESP32-S3 Environmental Station
 * Hardware: ESP32-S3 (ESP32-S3-DevKitC-1 / ESP32-S3-WROOM)
 * 
 * Features:
 *   - Edge sensor acquisition & calibration (MQ-135, MQ-9, Sharp Optical Dust GP2Y1010AU0F, DHT11/22)
 *   - Carbon Monoxide (CO) & Combustible gas detection via MQ-9
 *   - Local audio-visual safety alarms (Active Buzzer + Tri-Color Status LEDs)
 *   - Autonomous 2.4 GHz Wi-Fi connectivity
 *   - MQTT publishing to Cloud Broker / Real-Time Web Application
 *   - Reserved ADC1 channel for Phase 2 Electrochemical O2 sensor
 * 
 * Authors: 
 *   1. MD. Fahad Rahman (ID: 0432320005101071) - Team Leader
 *   2. Zannatul Nayem (ID: 0432320005101063)
 *   3. Shafayet Hossain Shafin (ID: 0432320005101088)
 * Batch: 54th Batch | Section: 6B1
 * Course: CSE402 - Internet of Things Lab (Autumn 2026)
 * Institution: University of Information Technology and Sciences (UITS)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// ============================================================================
// 1. PIN ALLOCATION (ESP32-S3)
// Note: All analog inputs use ADC1 channels (safe for simultaneous Wi-Fi usage)
// ============================================================================
#define PIN_MQ135        1   // ADC1_CH0 - MQ-135 Air Quality Sensor
#define PIN_MQ9          2   // ADC1_CH1 - MQ-9 Carbon Monoxide & Combustible Gas Sensor
#define PIN_DUST_VO      4   // ADC1_CH3 - Sharp GP2Y1010AU0F Dust Analog Output
// #define PIN_O2        5   // ADC1_CH4 - [RESERVED FOR PHASE 2] ME2-O2 Sensor

#define PIN_DUST_LED     6   // Sharp Optical Dust Pulse Trigger
#define PIN_DHT          7   // DHT11 / DHT22 Digital One-Wire Data
#define PIN_BUZZER       8   // Active Acoustic Buzzer Alert
#define PIN_LED_GREEN    9   // Status Indicator: Safe / Normal
#define PIN_LED_YELLOW   10  // Status Indicator: Warning / Elevated
#define PIN_LED_RED      11  // Status Indicator: Critical / Danger

// ============================================================================
// 2. NETWORK & MQTT CONFIGURATION
// ============================================================================
const char* WIFI_SSID       = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD   = "YOUR_WIFI_PASSWORD";

// MQTT Broker (e.g. HiveMQ public broker / EMQX / ThingSpeak)
const char* MQTT_BROKER     = "broker.hivemq.com";
const int   MQTT_PORT       = 1883;
const char* MQTT_TOPIC_PUB  = "airguard/telemetry";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ============================================================================
// 3. SENSOR & TIMING CONFIGURATION
// ============================================================================
#define DHTTYPE DHT11
DHT dht(PIN_DHT, DHTTYPE);

// Sampling timing
unsigned long lastSampleTime = 0;
const unsigned long SAMPLE_INTERVAL = 3000; // 3 seconds

// Safety threshold limits (12-bit ADC: 0 - 4095)
const int THRESHOLD_MQ135_WARN   = 1200;
const int THRESHOLD_MQ135_DANGER = 2000;
const int THRESHOLD_MQ9_WARN     = 1000;
const int THRESHOLD_MQ9_DANGER   = 1600;

// ============================================================================
// 4. FUNCTION IMPLEMENTATIONS
// ============================================================================

void setupWiFi() {
  delay(10);
  Serial.print("Connecting to Wi-Fi SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected! Local IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[Wi-Fi] Connection timeout. Operating in offline/local alert mode.");
  }
}

void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  while (!mqttClient.connected()) {
    Serial.print("[MQTT] Connecting to broker: ");
    Serial.print(MQTT_BROKER);
    Serial.print("...");

    String clientId = "AirGuard-ESP32S3-" + String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" connected successfully!");
    } else {
      Serial.print(" failed, state=");
      Serial.print(mqttClient.state());
      Serial.println(". Retrying in 5 seconds...");
      delay(5000);
      break; // Non-blocking retry to maintain local alarm responsiveness
    }
  }
}

float readDustDensity() {
  // Sharp GP2Y1010AU0F pulse timing sequence (0.32ms pulse)
  digitalWrite(PIN_DUST_LED, LOW); // Turn on dust sensor IRED
  delayMicroseconds(280);
  int voVal = analogRead(PIN_DUST_VO); // 12-bit ADC read (0 - 4095)
  delayMicroseconds(40);
  digitalWrite(PIN_DUST_LED, HIGH); // Turn off dust sensor IRED
  delayMicroseconds(9680);

  // Convert 12-bit ADC reading to voltage (ESP32-S3: 3.3V / 4095)
  float voltage = voVal * (3.3 / 4095.0);

  // Linear dust density approximation: mg/m3 = 0.17 * voltage - 0.1
  float dustVal = (0.17 * voltage - 0.1) * 1000.0; // convert to ug/m3
  return (dustVal > 0.0) ? dustVal : 0.0;
}

void updateAlarms(int mq135Val, int mq9Val) {
  bool isDanger = (mq135Val > THRESHOLD_MQ135_DANGER) || 
                  (mq9Val > THRESHOLD_MQ9_DANGER);

  bool isWarning = (!isDanger) && ((mq135Val > THRESHOLD_MQ135_WARN) || (mq9Val > THRESHOLD_MQ9_WARN));

  if (isDanger) {
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_BUZZER, HIGH);
  } else if (isWarning) {
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_YELLOW, HIGH);
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  } else {
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_BUZZER, LOW);
  }
}

void setup() {
  Serial.begin(115200);

  // Initialize output control pins
  pinMode(PIN_DUST_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);

  digitalWrite(PIN_DUST_LED, HIGH); // Sensor LED idle off
  digitalWrite(PIN_BUZZER, LOW);

  // Set ADC attenuation to 11dB (allows full 0 - 3.1V / 3.3V range)
  analogSetAttenuation(ADC_11db);

  // Initialize DHT sensor
  dht.begin();

  Serial.println(F("\n========================================================"));
  Serial.println(F("AirGuard IoT - ESP32-S3 All-in-One Environmental Station"));
  Serial.println(F("Dual-Core Xtensa LX7 @ 240MHz with Integrated Wi-Fi"));
  Serial.println(F("Sensors: MQ-135, MQ-9 (CO/Gas), Sharp Dust, DHT11/22"));
  Serial.println(F("Expansion Slot: ADC1_CH4 (GPIO 5) reserved for Future O2"));
  Serial.println(F("Telemetry streamed to Real-Time Web Application"));
  Serial.println(F("========================================================"));

  // Visual LED boot sequence check
  digitalWrite(PIN_LED_GREEN, HIGH);
  delay(300);
  digitalWrite(PIN_LED_YELLOW, HIGH);
  delay(300);
  digitalWrite(PIN_LED_RED, HIGH);
  delay(300);
  digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_RED, LOW);

  // Network initialization
  setupWiFi();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
}

void loop() {
  // Maintain MQTT broker connection
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      reconnectMQTT();
    }
    mqttClient.loop();
  }

  // Periodic sensor telemetry acquisition
  unsigned long now = millis();
  if (now - lastSampleTime >= SAMPLE_INTERVAL) {
    lastSampleTime = now;

    float temperature = dht.readTemperature();
    float humidity    = dht.readHumidity();
    int mq135Value    = analogRead(PIN_MQ135);
    int mq9Value      = analogRead(PIN_MQ9);
    float dustDensity = readDustDensity();

    if (isnan(temperature) || isnan(humidity)) {
      temperature = 0.0;
      humidity = 0.0;
    }

    // Evaluate thresholds & activate local acoustic/LED alerts
    updateAlarms(mq135Value, mq9Value);

    // Format JSON payload for Web Dashboard & Cloud
    // Example: {"temp":26.8,"hum":62.5,"aqi":412,"co_gas":198,"dust":28.4}
    String jsonPayload = "{";
    jsonPayload += "\"temp\":" + String(temperature, 1) + ",";
    jsonPayload += "\"hum\":" + String(humidity, 1) + ",";
    jsonPayload += "\"aqi\":" + String(mq135Value) + ",";
    jsonPayload += "\"co_gas\":" + String(mq9Value) + ",";
    jsonPayload += "\"dust\":" + String(dustDensity, 1);
    jsonPayload += "}";

    // Print to Serial monitor
    Serial.print("[Telemetry] ");
    Serial.println(jsonPayload);

    // Publish to MQTT broker
    if (mqttClient.connected()) {
      mqttClient.publish(MQTT_TOPIC_PUB, jsonPayload.c_str());
    }
  }
}
