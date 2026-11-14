/**
 * ============================================================================
 * Project: AirGuard IoT - UART Bridge & Dual-Sink Web Station
 * Target Microcontroller: ESP32-S3 (ESP32-S3-DevKitC-1 / WROOM-1)
 * Data Source: Arduino Mega 2560 via UART (Serial1 on GPIO 16 RX)
 * Architecture: Dual-Sink Hybrid (MQTT Live Stream + Supabase Persistent Cloud)
 * Active Sensors: MQ-9 (CO & Flammable Gas) + MQ-135 (Air Quality)
 * Deferred (Future Work): Sharp Optical Dust Sensor & DHT Climate Sensor
 * ============================================================================
 * 
 * UART WIRING (Mega -> ESP32-S3):
 *   - Arduino Mega TX1 (Pin 18) ---> Resistor Divider (1k/2k) ---> ESP32-S3 GPIO 16 (RX)
 *   - Arduino Mega GND          --------------------------------> ESP32-S3 GND (Common Ground!)
 * 
 * WEB ARCHITECTURE:
 *   - SINK 1 (Hot Path): Publishes live JSON to HiveMQ MQTT broker (broker.hivemq.com:1883)
 *     Topic: "airguard/telemetry" (instant gauge update on web/index.html)
 *   - SINK 2 (Cold Path): Commits JSON every 15s to Supabase Postgres over HTTPS REST
 *     Endpoint: https://zamvuyyqfwehxlnijeat.supabase.co/rest/v1/telemetry
 * ============================================================================
 */

#include <WiFi.h>              // Native ESP32 Wi-Fi stack
#include <WiFiClientSecure.h>  // TLS/HTTPS client for Supabase REST API
#include <HTTPClient.h>        // HTTP REST client for Supabase POSTs
#include <PubSubClient.h>      // Lightweight MQTT protocol client

// ============================================================================
// 1. PIN DEFINITIONS & UART CONFIGURATION
// ============================================================================
const int RX_PIN = 16;   // From Mega TX1 (Pin 18) via 1k/2k voltage divider
const int TX_PIN = 17;   // Unused for receive-only, but required by Serial1.begin()

// Optional On-Board Actuators (Tri-Color LEDs & Buzzer)
#define PIN_BUZZER       8   // Active Acoustic Buzzer
#define PIN_LED_GREEN    9   // Green LED (Nominal / Safe)
#define PIN_LED_YELLOW   10  // Yellow LED (Warning / Elevated)
#define PIN_LED_RED      11  // Red LED (Critical Danger / Evacuate)

// ============================================================================
// 2. NETWORK, MQTT & SUPABASE CONFIGURATION
// ============================================================================
// >>> REPLACE WITH YOUR 2.4 GHz WI-FI CREDENTIALS <<<
const char* WIFI_SSID       = "DESKTOP-DBS3BAM 5731";
const char* WIFI_PASSWORD   = ";E7i3569";

// Sink 1: HiveMQ Public MQTT Broker (Hot Path)
const char* MQTT_BROKER     = "broker.hivemq.com";
const int   MQTT_PORT       = 1883;
const char* MQTT_TOPIC_PUB  = "airguard/telemetry";

// Sink 2: Supabase Cloud Configuration (Cold Path)
const char* SUPABASE_URL    = "https://zamvuyyqfwehxlnijeat.supabase.co/rest/v1/telemetry";
const char* SUPABASE_KEY    = "sb_publishable_4YDEh6TVbN9LtMtdz8QsHw_VuIT3Bpt";

// Network Clients
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ============================================================================
// 3. THRESHOLDS & SCHEDULING
// ============================================================================
// Note: Mega ADC is 10-bit (0-1023). We map raw values to 12-bit (0-4095)
// so they align with the AirGuard web dashboard scales & alert thresholds.
const int THRESHOLD_MQ135_WARN   = 1200;  // Moderate air pollution warning
const int THRESHOLD_MQ135_DANGER = 2000;  // Hazardous smoke / toxic contamination
const int THRESHOLD_MQ9_WARN     = 1000;  // Elevated Carbon Monoxide (CO)
const int THRESHOLD_MQ9_DANGER   = 1600;  // Hazardous CO / combustible gas leak

// Cold-path commit cadence (Supabase REST every 15 seconds)
unsigned long lastSupabaseTime = 0;
const unsigned long SUPABASE_INTERVAL = 15000;

// Holding registers for latest valid sensor readings
int   latestMq9Raw     = 0;
float latestMq9Volt    = 0.0;
int   latestMq135Raw   = 0;
float latestMq135Volt  = 0.0;

int   scaledAqi        = 0;  // Scaled 0-4095 for Dashboard (MQ-135)
int   scaledCoGas      = 0;  // Scaled 0-4095 for Dashboard (MQ-9)

bool  newDataAvailable = false;

// ============================================================================
// 4. WI-FI & MQTT MANAGEMENT
// ============================================================================
void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print(F("[Wi-Fi] Connecting to: "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println(F("[Wi-Fi] Connected successfully!"));
    Serial.print(F("[Wi-Fi] IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println(F("[Wi-Fi] Timed out. Continuing in offline local alarm mode."));
  }
}

void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  if (!mqttClient.connected()) {
    Serial.print(F("[MQTT] Connecting to broker ("));
    Serial.print(MQTT_BROKER);
    Serial.print(F(")... "));

    String clientId = "AirGuard-ESP32S3-" + String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(F("Connected!"));
      Serial.print(F("[MQTT] Live telemetry topic: "));
      Serial.println(MQTT_TOPIC_PUB);
    } else {
      Serial.print(F("Failed (state: "));
      Serial.print(mqttClient.state());
      Serial.println(F("). Will retry in next loop cycle."));
    }
  }
}

// ============================================================================
// 5. SUPABASE REST SINK (COLD PATH)
// ============================================================================
void postToSupabase(const String& jsonPayload) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure clientSecure;
  clientSecure.setInsecure(); // Zero-overhead TLS
  clientSecure.setTimeout(2);

  HTTPClient http;
  http.setTimeout(2000);

  if (http.begin(clientSecure, SUPABASE_URL)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    http.addHeader("Prefer", "return=minimal");

    int httpCode = http.POST(jsonPayload);

    if (httpCode == HTTP_CODE_CREATED || httpCode == HTTP_CODE_OK || httpCode == 204) {
      Serial.println(F("[Supabase] Data logged to Postgres table (201 Created)."));
    } else {
      Serial.print(F("[Supabase] HTTP response code: "));
      Serial.println(httpCode);
    }
    http.end();
  } else {
    Serial.println(F("[Supabase] Could not connect to host."));
  }
}

// ============================================================================
// 6. LOCAL ALARMS (OPTIONAL HARDWARE ACTUATION)
// ============================================================================
void updateAlarms(int aqiVal, int coGasVal) {
  bool isDanger = (aqiVal >= THRESHOLD_MQ135_DANGER) || (coGasVal >= THRESHOLD_MQ9_DANGER);
  bool isWarning = (!isDanger) && ((aqiVal >= THRESHOLD_MQ135_WARN) || (coGasVal >= THRESHOLD_MQ9_WARN));

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

// ============================================================================
// 7. SETUP ROUTINE
// ============================================================================
void setup() {
  Serial.begin(115200);   // USB Monitor to PC
  delay(500);

  // Initialize hardware pins
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);

  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_GREEN, HIGH);
  digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_RED, LOW);

  // Initialize UART link from Arduino Mega
  Serial1.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);
  Serial1.setTimeout(50);

  Serial.println(F("\n========================================================"));
  Serial.println(F(" AirGuard IoT - ESP32-S3 UART Web Bridge"));
  Serial.println(F(" Active Sensors: MQ-9 & MQ-135 (via Arduino Mega)"));
  Serial.println(F(" Web Sync: HiveMQ (MQTT Hot) + Supabase (HTTPS Cold)"));
  Serial.println(F("========================================================"));

  setupWiFi();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

  Serial.println(F("[SYSTEM] Ready! Listening for Mega UART stream...\n"));
}

// ============================================================================
// 8. MAIN LOOP
// ============================================================================
void loop() {
  // Maintain Wi-Fi and MQTT connectivity
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      reconnectMQTT();
    }
    mqttClient.loop();
  }

  // --- Step 1: Read and parse incoming CSV packet from Arduino Mega ---
  if (Serial1.available()) {
    String line = Serial1.readStringUntil('\n');
    line.trim();

    if (line.length() > 0) {
      int c1 = line.indexOf(',');
      int c2 = line.indexOf(',', c1 + 1);
      int c3 = line.indexOf(',', c2 + 1);

      if (c1 > 0 && c2 > 0 && c3 > 0) {
        // Parse CSV values
        latestMq9Raw    = line.substring(0, c1).toInt();
        latestMq9Volt   = line.substring(c1 + 1, c2).toFloat();
        latestMq135Raw  = line.substring(c2 + 1, c3).toInt();
        latestMq135Volt = line.substring(c3 + 1).toFloat();

        // Scale 10-bit Mega values (0-1023) to 12-bit (0-4095) for dashboard compatibility
        scaledAqi   = map(latestMq135Raw, 0, 1023, 0, 4095);
        scaledCoGas = map(latestMq9Raw, 0, 1023, 0, 4095);

        newDataAvailable = true;

        // Print debug monitor
        Serial.print(F("[MEGA IN] MQ-9: "));
        Serial.print(latestMq9Raw);
        Serial.print(F(" ("));
        Serial.print(latestMq9Volt, 2);
        Serial.print(F("V) | MQ-135: "));
        Serial.print(latestMq135Raw);
        Serial.print(F(" ("));
        Serial.print(latestMq135Volt, 2);
        Serial.print(F("V) -> Scaled [AQI: "));
        Serial.print(scaledAqi);
        Serial.print(F(", CO/Gas: "));
        Serial.print(scaledCoGas);
        Serial.println(F("]"));

        // Update local alarms
        updateAlarms(scaledAqi, scaledCoGas);

        // --- Step 2: SINK 1 (HOT PATH) - Publish to MQTT ---
        // Note: 'temp', 'hum', and 'dust' are set to nominal defaults (deferred to future work)
        String jsonPayload = "{";
        jsonPayload += "\"temp\":25.0,";
        jsonPayload += "\"hum\":50.0,";
        jsonPayload += "\"aqi\":" + String(scaledAqi) + ",";
        jsonPayload += "\"co_gas\":" + String(scaledCoGas) + ",";
        jsonPayload += "\"dust\":0.0";
        jsonPayload += "}";

        if (mqttClient.connected()) {
          mqttClient.publish(MQTT_TOPIC_PUB, jsonPayload.c_str());
          Serial.println(F("[MQTT PUB] Live telemetry pushed to broker."));
        }

        // --- Step 3: SINK 2 (COLD PATH) - Commit to Supabase every 15s ---
        unsigned long now = millis();
        if (now - lastSupabaseTime >= SUPABASE_INTERVAL) {
          lastSupabaseTime = now;
          postToSupabase(jsonPayload);
        }
      } else {
        Serial.print(F("[WARN] Corrupted UART line: "));
        Serial.println(line);
      }
    }
  }
}
