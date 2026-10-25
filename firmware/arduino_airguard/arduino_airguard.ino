/**
 * AirGuard IoT - Arduino Edge Node
 * Hardware: Arduino Uno R3
 * Authors: MD Fahad Rahman (ID: 0432320005101071)
 * Course: CSE402 - Internet of Things Lab (Autumn 26)
 * Institution: University of Information Technology and Sciences
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <SoftwareSerial.h>

// --- Pin Definitions ---
#define PIN_MQ135      A0
#define PIN_MQ2        A1
#define PIN_O2         A2
#define PIN_DUST_VO    A3
#define PIN_DHT        4
#define PIN_DUST_LED   7
#define PIN_BUZZER     8
#define PIN_LED_GREEN  9
#define PIN_LED_YELLOW 10
#define PIN_LED_RED    11

// SoftwareSerial for ESP8266 Gateway (RX=2, TX=3)
SoftwareSerial espSerial(2, 3);

// DHT Configuration
#define DHTTYPE DHT11
DHT dht(PIN_DHT, DHTTYPE);

// 16x2 I2C LCD (Standard address 0x27 or 0x3F)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Timing variables for non-blocking execution
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 3000; // Sample every 3 seconds

// Thresholds for warning and danger
const int THRESHOLD_MQ135_WARN = 300;
const int THRESHOLD_MQ135_DANGER = 500;
const int THRESHOLD_MQ2_DANGER   = 400;
const float THRESHOLD_O2_MIN     = 19.5; // Normal air is ~20.9% O2

void setup() {
  Serial.begin(9600);
  espSerial.begin(9600);

  pinMode(PIN_DUST_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);

  digitalWrite(PIN_DUST_LED, HIGH); // Sharp optical sensor LED off initially
  digitalWrite(PIN_BUZZER, LOW);

  dht.begin();
  lcd.init();
  lcd.backlight();

  lcd.setCursor(0, 0);
  lcd.print("AirGuard IoT");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  delay(1500);
  lcd.clear();
}

float readDustDensity() {
  // Pulse Sharp GP2Y1010AU0F LED for 0.32ms
  digitalWrite(PIN_DUST_LED, LOW);
  delayMicroseconds(280);
  int voVal = analogRead(PIN_DUST_VO);
  delayMicroseconds(40);
  digitalWrite(PIN_DUST_LED, HIGH);
  delayMicroseconds(9680);

  float voltage = voVal * (5.0 / 1024.0);
  // Linear approximation: dust (mg/m3) = 0.17 * voltage - 0.1
  float dustVal = (0.17 * voltage - 0.1) * 1000.0; // convert to ug/m3
  return (dustVal > 0.0) ? dustVal : 0.0;
}

float readO2Percentage() {
  int raw = analogRead(PIN_O2);
  float voltage = raw * (5.0 / 1024.0);
  // Standard electrochemical sensor mapping (approx 20.9% at calibration)
  float o2 = (voltage / 2.0) * 20.9;
  return o2;
}

void updateAlarms(int mq135Val, int mq2Val, float o2Val) {
  bool isDanger = (mq135Val > THRESHOLD_MQ135_DANGER) || 
                  (mq2Val > THRESHOLD_MQ2_DANGER) || 
                  (o2Val < THRESHOLD_O2_MIN);

  bool isWarning = (!isDanger) && (mq135Val > THRESHOLD_MQ135_WARN);

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

void displayLCD(float temp, float hum, int mq135, int mq2, float o2, float dust) {
  static bool pageToggle = false;
  lcd.clear();
  if (!pageToggle) {
    lcd.setCursor(0, 0);
    lcd.print("T:");
    lcd.print((int)temp);
    lcd.print("C H:");
    lcd.print((int)hum);
    lcd.print("%");

    lcd.setCursor(0, 1);
    lcd.print("AQ:");
    lcd.print(mq135);
    lcd.print(" Gs:");
    lcd.print(mq2);
  } else {
    lcd.setCursor(0, 0);
    lcd.print("O2:");
    lcd.print(o2, 1);
    lcd.print("%");

    lcd.setCursor(0, 1);
    lcd.print("PM:");
    lcd.print((int)dust);
    lcd.print("ug/m3");
  }
  pageToggle = !pageToggle;
}

void loop() {
  unsigned long now = millis();
  if (now - lastReadTime >= READ_INTERVAL) {
    lastReadTime = now;

    float temperature = dht.readTemperature();
    float humidity    = dht.readHumidity();
    int mq135Value    = analogRead(PIN_MQ135);
    int mq2Value      = analogRead(PIN_MQ2);
    float o2Value     = readO2Percentage();
    float dustDensity = readDustDensity();

    if (isnan(temperature) || isnan(humidity)) {
      temperature = 0.0;
      humidity = 0.0;
    }

    updateAlarms(mq135Value, mq2Value, o2Value);
    displayLCD(temperature, humidity, mq135Value, mq2Value, o2Value, dustDensity);

    // Format telemetry payload as JSON
    // {"temp":28.5,"hum":65.0,"aqi":180,"gas":95,"o2":20.8,"dust":34.2}
    String jsonPayload = "{";
    jsonPayload += "\"temp\":" + String(temperature, 1) + ",";
    jsonPayload += "\"hum\":" + String(humidity, 1) + ",";
    jsonPayload += "\"aqi\":" + String(mq135Value) + ",";
    jsonPayload += "\"gas\":" + String(mq2Value) + ",";
    jsonPayload += "\"o2\":" + String(o2Value, 1) + ",";
    jsonPayload += "\"dust\":" + String(dustDensity, 1);
    jsonPayload += "}";

    // Transmit to ESP8266 and USB debug terminal
    espSerial.println(jsonPayload);
    Serial.println(jsonPayload);
  }
}
