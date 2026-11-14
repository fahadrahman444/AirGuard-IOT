# Bill of Materials (BOM) — AirGuard IoT

This document details the active hardware components, quantities, functional descriptions, and operating specifications for constructing the **AirGuard IoT** station using a high-performance **ESP32-S3** microcontroller with integrated 2.4 GHz Wi-Fi and Bluetooth, streaming visual analytics to a **Real-Time Web Application**.

---

## 1. Active Hardware Components List

| # | Item Description | Part / Model | Qty | Operating Voltage | Purpose / Role |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | **Sensor Coprocessor** | **Arduino Mega 2560** (ATmega2560 @ 16MHz) | 1 | 5V DC (USB / DC Barrel) | Multi-channel 5V analog acquisition engine for MQ-9 and MQ-135 sensors with UART1 stream @ 9600 baud |
| 2 | **IoT Cloud Gateway & MCU** | **ESP32-S3** (ESP32-S3-DevKitC-1 / WROOM) | 1 | 3.3V (5V Vin / USB-C) | Dual-Core Xtensa LX7 @ 240MHz: High-speed UART reception, 12-bit scaling, HiveMQ MQTT stream, and Supabase HTTPS REST commits |
| 3 | **Carbon Monoxide & Flammable Gas Sensor** | **MQ-9** | 1 | 5V (Analog AO to Mega A0) | Detects Carbon Monoxide (CO), Methane (CH₄), and LPG |
| 4 | **Air Quality Sensor** | **MQ-135** | 1 | 5V (Analog AO to Mega A1) | Detects CO₂, NH₃, alcohol, benzene, and toxic smoke vapors |
| 5 | **Ambient Weather Data Engine** | **Open-Meteo Cloud API** (WMO Model) | 1 | Cloud Ingestion | Real-time Dhaka (UITS Campus) temperature, humidity, wind, pressure, and 3-day forecast sync |
| 6 | **Level Shifter / Resistor Kit** | 1kΩ, 2kΩ, 220Ω, 10kΩ resistors | 1 kit | Passive | Inter-MCU UART voltage divider (5V TX1 -> 3.3V RX) and circuit pull-downs |
| 7 | **Power Supply** | 5V / 2A DC Adapter or Dual USB Ports | 1 | 5V DC | Stable regulated power rails for sensors and microcontrollers |
| 8 | **Prototyping Hardware** | Solderless Breadboard & Dupont Jumpers | 1 set | — | Interconnection and breadboard prototyping |

---

## 2. Planned Future Scope (Phase 2 Upgrade)

| Component Description | Part / Model | Reserved Pin | Status / Budget Justification |
| :--- | :--- | :--- | :--- |
| **Optical Dust Sensor** | **Sharp GP2Y1010AU0F** | ESP32-S3 **GPIO 4 (ADC) / GPIO 6 (Pulse)** | **Phase 2 Future Scope**: Optical particulate matter detection (PM2.5 / PM10) in µg/m³. UI card badged and driver hooks reserved. |
| **Electrochemical O₂ Sensor Module** | **ME2-O2** or Grove O₂ Sensor | ESP32-S3 **GPIO 5 (ADC1_CH4)** | **Phase 2 Future Scope**: Commercial electrochemical oxygen cell measuring 19.5%–23.5% Vol. UI card badged and ADC1 pin reserved. |

---

> [!NOTE]
> * **All-in-One Architecture Advantage**: Adopting the **ESP32-S3** eliminates the previous dual-board (Arduino Mega + ESP8266) approach. This removes inter-chip UART bridges, eliminates serial baud bottlenecks, avoids 5V-to-3.3V level-shifter risks, and simplifies power distribution onto a single compact footprint.
> * **Targeted Gas Detection**: Incorporating the **MQ-9** sensor specifically addresses lethal odorless Carbon Monoxide (CO) poisoning hazards in enclosed lab/indoor spaces in tandem with combustible gas and flammable vapor detection.
> * **Display Architecture**: The physical 16×2 character LCD has been superseded by a dedicated **Real-Time Web Application**. This eliminates physical display viewing constraints, reduces breadboard clutter, and enables remote multi-device monitoring across laptops, tablets, and smartphones.
