# Bill of Materials (BOM) — AirGuard IoT

This document details the hardware components, quantities, functional descriptions, and operating specifications for constructing the **AirGuard IoT** station.

---

## Component List

| # | Item Description | Part / Model | Qty | Operating Voltage | Purpose / Role |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | Microcontroller Board | Arduino Uno R3 (ATmega328P) | 1 | 5V (USB / DC 7–12V) | Main edge data acquisition & sensor polling |
| 2 | Wi-Fi Transceiver Module | ESP8266 (ESP-01 or NodeMCU) | 1 | 3.3V (250mA peak) | Wi-Fi gateway for cloud MQTT/HTTP telemetry |
| 3 | Air Quality Sensor | MQ-135 | 1 | 5V | Detects CO₂, NH₃, alcohol, benzene, and smoke |
| 4 | Combustible Gas Sensor | MQ-2 | 1 | 5V | Detects LPG, propane, methane, and smoke leakage |
| 5 | Oxygen Sensor Module | Electrochemical O₂ Sensor (ME2-O2 / Grove) | 1 | 3.3V–5V | Atmospheric oxygen concentration (% O₂) |
| 6 | Optical Dust Sensor | Sharp GP2Y1010AU0F / Nova PM | 1 | 5V | Particulate matter (PM2.5 / PM10) detection |
| 7 | Temperature & Humidity Sensor| DHT11 or DHT22 | 1 | 3.3V–5V | Ambient temperature & relative humidity logging |
| 8 | LCD Display | 16×2 Character LCD with I2C Backback | 1 | 5V | On-site visual display of live readings |
| 9 | Acoustic Alarm | Active 5V Buzzer | 1 | 5V | Immediate local sound alarm upon threshold breach |
| 10 | Status Indicators | 5mm LEDs (Green, Yellow, Red) | 3 | 2V–3V (with 220Ω) | Visual tri-color safety level indication |
| 11 | Resistors & Capacitors | 220Ω, 1kΩ, 2kΩ, 150Ω, 220µF cap | 1 kit | Passive | Current limiting, voltage divider & dust filter |
| 12 | Power Source | 5V/2A DC Adapter or 9V / 18650 Battery Pack | 1 | 5V–9V | System power supply |
| 13 | Prototyping Hardware | Solderless Breadboard & Jumper Wires | 1 set | — | Interconnection and breadboard prototyping |
