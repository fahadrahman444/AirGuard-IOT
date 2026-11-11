# Bill of Materials (BOM) — AirGuard IoT

This document details the active hardware components, quantities, functional descriptions, and operating specifications for constructing the **AirGuard IoT** station using a high-performance **ESP32-S3** microcontroller with integrated 2.4 GHz Wi-Fi and Bluetooth, streaming visual analytics to a **Real-Time Web Application**.

---

## 1. Active Component List (Phase 1 Prototype)

| # | Item Description | Part / Model | Qty | Operating Voltage | Purpose / Role |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | **All-in-One IoT Microcontroller** | **ESP32-S3** (ESP32-S3-DevKitC-1 / WROOM) | 1 | 3.3V (5V Vin / USB-C) | Dual-Core Xtensa LX7 @ 240MHz: Unified edge acquisition, signal filtering, local alerts & native Wi-Fi/MQTT streaming |
| 2 | **Air Quality Sensor** | **MQ-135** | 1 | 5V (3.3V scaled ADC) | Detects CO₂, NH₃, alcohol, benzene, and toxic smoke |
| 3 | **Carbon Monoxide & Flammable Gas Sensor** | **MQ-9** | 1 | 5V (3.3V scaled ADC) | Detects Carbon Monoxide (CO), Methane (CH₄), and LPG |
| 4 | **Optical Dust Sensor** | **Sharp GP2Y1010AU0F** | 1 | 5V (3.3V scaled ADC) | Particulate matter (PM2.5 / PM10) detection in µg/m³ |
| 5 | **Temperature & Humidity Sensor** | **DHT11** or **DHT22** | 1 | 3.3V–5V | Ambient temperature & relative humidity logging |
| 6 | **Acoustic Alarm** | **Active Buzzer** | 1 | 3.3V–5V | Immediate local sound alarm upon threshold breach |
| 7 | **Status Indicators** | **5mm LEDs** (Green, Yellow, Red) | 3 | 2V–3V (with 220Ω) | Visual tri-color safety level indication |
| 8 | **Resistors & Capacitors** | 220Ω, 1kΩ, 2kΩ, 150Ω, 10kΩ, 220µF cap | 1 kit | Passive | Current limiting, analog ADC voltage scaling & dust filter |
| 9 | **Power Source** | **5V / 2A DC Adapter** or USB-C Power / 18650 Pack | 1 | 5V DC | System power supply |
| 10 | **Prototyping Hardware** | Solderless Breadboard & Jumper Wires | 1 set | — | Interconnection and breadboard prototyping |

---

## 2. Planned Future Scope (Phase 2 Upgrade)

| Component Description | Part / Model | Reserved Pin | Status / Budget Justification |
| :--- | :--- | :--- | :--- |
| **Electrochemical O₂ Sensor Module** | **ME2-O2** or Grove O₂ Sensor | ESP32-S3 **GPIO 5 (ADC1_CH4)** | **Deferred to Phase 2**: Due to commercial electrochemical cell procurement costs, O₂ sensing is scheduled for future release once dedicated lab grant funds are secured. Pin GPIO 5 (ADC1) and firmware hooks remain reserved for plug-and-play addition. |

---

> [!NOTE]
> * **All-in-One Architecture Advantage**: Adopting the **ESP32-S3** eliminates the previous dual-board (Arduino Mega + ESP8266) approach. This removes inter-chip UART bridges, eliminates serial baud bottlenecks, avoids 5V-to-3.3V level-shifter risks, and simplifies power distribution onto a single compact footprint.
> * **Targeted Gas Detection**: Incorporating the **MQ-9** sensor specifically addresses lethal odorless Carbon Monoxide (CO) poisoning hazards in enclosed lab/indoor spaces in tandem with combustible gas and flammable vapor detection.
> * **Display Architecture**: The physical 16×2 character LCD has been superseded by a dedicated **Real-Time Web Application**. This eliminates physical display viewing constraints, reduces breadboard clutter, and enables remote multi-device monitoring across laptops, tablets, and smartphones.
