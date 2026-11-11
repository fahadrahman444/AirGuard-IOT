# AirGuard IoT

> **An IoT-Based Smart Air Quality, Carbon Monoxide & Gas Leakage, and Environmental Monitoring System Using ESP32-S3, Dual-Sink Hybrid Cloud (MQTT + Supabase), and Real-Time Web Application**

[![GitHub Repository](https://img.shields.io/badge/GitHub-AirGuard--IOT-blue?logo=github)](https://github.com/fahadrahman444/AirGuard-IOT)
[![Hardware](https://img.shields.io/badge/Platform-ESP32--S3-red?logo=espressif)](https://www.espressif.com/en/products/socs/esp32-s3)
[![Protocol](https://img.shields.io/badge/Protocol-MQTT%20(Hot)%20%2B%20Supabase%20REST%20(Cold)-green)](https://mqtt.org/)
[![Database](https://img.shields.io/badge/Database-Supabase%20Postgres-3ecf8e?logo=supabase)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Academic Information

* **Institution:** University of Information Technology and Sciences (UITS)
* **Department:** Department of Computer Science & Engineering (CSE)
* **Course Code:** CSE402
* **Course Title:** Internet of Things Lab
* **Semester:** 7th Semester (Autumn 2026)
* **Submitted to:** Abrar Mahbub Tanim, Lecturer, Department of CSE, UITS
* **Submitted by (Project Team):**
  * **MD. Fahad Rahman (Team Leader)** (ID: `0432320005101071`)
  * **Zannatul Nayem** (ID: `0432320005101063`)
  * **Shafayet Hossain Shafin** (ID: `0432320005101088`)
  * **Batch:** 54th Batch  |  **Section:** 6B1

---

## 📄 Official Project Proposal Document

* **Proposal PDF:** [AirGuard_IoT_Project_Proposal.pdf](AirGuard_IoT_Project_Proposal.pdf) *(Formatted according to official UITS academic standards)*
* **Markdown Proposal:** [docs/project_proposal.md](docs/project_proposal.md)

---

## 1. Project Overview

**AirGuard IoT** is an end-to-end edge-to-cloud environmental monitoring station designed to detect atmospheric degradation, lethal carbon monoxide (CO), combustible gas leaks, airborne dust particles, and ambient climate conditions in real time (with an analog hardware interface reserved for future oxygen sensing). 

Driven by an all-in-one **ESP32-S3** microcontroller (Dual-Core Xtensa LX7 @ 240 MHz), the system unifies high-speed deterministic analog acquisition, on-site alarm triggering, and integrated 2.4 GHz Wi-Fi connectivity on a single silicon platform. 

The edge node implements a **Dual-Sink Hybrid Cloud Architecture**:
1. **Sink 1 (Hot Path — Sub-100ms Live Push):** High-frequency telemetry streamed every **3 seconds** over MQTT to a broker for instant browser gauge animations and alarm alerts.
2. **Sink 2 (Cold Path — Durable Storage):** Low-frequency telemetry committed every **15 seconds** over HTTPS REST directly to **Supabase Postgres** for durable historical persistence and instant chart backfilling upon page load.

---

## 2. Key Features

- **Single-Chip All-in-One Architecture:** Powered by the **ESP32-S3**, eliminating dual-MCU wiring, level-shifters, and UART communication bottlenecks.
- **Dual-Sink Hybrid Cloud Ingestion:** Decoupled Hot Path (MQTT @ 3s) and Cold Path (Supabase @ 15s) guarantees sub-100ms real-time responsiveness without chart cold-start delays.
- **Multi-Gas Air Quality Monitoring:** Continuously quantifies indoor/ambient air pollution (CO₂, NH₃, benzene, smoke) via an MQ-135 sensor.
- **Carbon Monoxide & Flammable Gas Leakage Detection:** Detects dangerous CO gas alongside combustible fuels (methane, LPG) using an MQ-9 sensor to avoid poisoning and fire hazards.
- **Particulate Matter (Dust) Detection:** Optical dust sensing (Sharp GP2Y1010AU0F) assessing fine suspended particulates in µg/m³.
- **Climate Monitoring:** Digital temperature and relative humidity tracking using a DHT11/DHT22 sensor.
- **Dual-Layer Alert System:** Instantaneous on-site audio-visual alarms (active buzzer + tri-color LEDs) paired with remote web/cloud alert banners and audio siren.
- **Real-Time Web Dashboard:** Responsive single-page dashboard with SVG progress gauges, rolling Chart.js plots, historical database table, and zero server hosting overhead.
- **Future Scope / Phase 2 Upgrade (Oxygen Concentration):** Dedicated ADC1 channel (`GPIO 5`) is reserved for electrochemical O₂ sensing (ME2-O2 / Grove O₂), deferred from Phase 1 due to sensor procurement costs.

---

## 3. System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Sensing_Layer["Sensing Layer (Active Phase 1)"]
        MQ135["MQ-135 (Air Quality & Smoke)"]
        MQ9["MQ-9 (Carbon Monoxide & Combustible Gas)"]
        DUST["Sharp GP2Y1010 Dust Sensor"]
        DHT["DHT11 / DHT22 (Temp & Humidity)"]
        O2["[Future Phase 2] ME2-O2 Sensor"]:::future
    end

    classDef future stroke-dasharray: 5 5,stroke:#999,color:#777;

    subgraph ESP32S3_SoC["All-in-One Controller (ESP32-S3)"]
        SENS_ADC["ADC1 Sampling & Voltage Scaling"]
        LOGIC["Dual-Core Xtensa LX7 (Threshold Logic)"]
        WIFI_RADIO["Integrated 2.4 GHz 802.11 b/g/n Wi-Fi"]
        ALARM["Active Buzzer & Tri-Color Status LEDs"]
        DISPATCH{"Dual-Sink Dispatcher"}
    end

    subgraph Cloud_Layer["Cloud Ingestion & Persistence"]
        BROKER["MQTT Broker (HiveMQ)<br>Port 1883"]
        SUPABASE[("Supabase Postgres DB<br>PostgREST API")]
    end

    subgraph Web_Layer["Client Presentation Layer (web/index.html)"]
        GAUGES["Live SVG Dials & Hazard Banner"]
        CHARTS["Chart.js Rolling Time-Series"]
        TABLE["Historical Database Log Table"]
    end

    Sensing_Layer -->|Analog (ADC1) & Digital One-Wire| SENS_ADC
    SENS_ADC --> LOGIC
    LOGIC -->|Threshold Trigger| ALARM
    LOGIC --> WIFI_RADIO
    WIFI_RADIO --> DISPATCH

    DISPATCH -->|"Every 3s (Hot Path)"| BROKER
    DISPATCH -->|"Every 15s (Cold Path)"| SUPABASE

    BROKER -->|"WSS Port 8884"| GAUGES
    BROKER -->|"WSS Port 8884"| CHARTS
    SUPABASE -->|"HTTPS REST Select (On Load)"| CHARTS
    SUPABASE -->|"HTTPS REST Select"| TABLE
```

---

## 4. Repository Structure

```
AirGuard-IOT/
├── AirGuard_IoT_Project_Proposal.pdf  # Official submission PDF (A4 UITS theme)
├── docs/
│   ├── AirGuard_IoT_Project_Proposal.pdf
│   ├── project_proposal.md            # Markdown proposal with academic metadata
│   └── assets/
│       └── uits_logo.png              # Official UITS university crest
├── hardware/
│   ├── pinout.md                      # ESP32-S3 pin mapping, ADC1 rules, schematics & Arduino IDE setup
│   └── bill_of_materials.md           # Complete components list & specifications
├── firmware/
│   └── esp32_airguard/
│       └── esp32_airguard.ino         # Dual-Sink ESP32-S3 firmware (MQTT + Supabase)
├── supabase/
│   └── migrations/
│       └── 20261112000000_create_telemetry.sql # Database schema & RLS policies
├── web/
│   └── index.html                     # Responsive real-time web dashboard (MQTT + Supabase)
├── generate_pdf.js                    # Automated PDF proposal generator
├── .gitignore                         # Git ignore rules for embedded development
└── README.md                          # Main project documentation
```

---

## 5. Hardware Pinout Quick Reference

| Sensor / Peripheral | Sensor Pin | ESP32-S3 Pin | Function / Description |
| :--- | :--- | :--- | :--- |
| **MQ-135** | AOUT | **GPIO 1 (ADC1_CH0)** | Analog Air Quality Voltage (via 1kΩ/2kΩ divider) |
| **MQ-9** | AOUT | **GPIO 2 (ADC1_CH1)** | Analog CO & Flammable Gas Voltage (via 1kΩ/2kΩ divider) |
| **O₂ Sensor (Phase 2 Upgrade)** | AOUT | **GPIO 5 (ADC1_CH4)** | Analog Oxygen Channel *(Reserved for Phase 2 ME2-O2 upgrade)* |
| **Sharp GP2Y1010** | V0 / LED | **GPIO 4 (ADC1_CH3)** / **GPIO 6** | Dust Analog Output & Optical LED Pulse Trigger |
| **DHT11 / DHT22** | DATA | **GPIO 7** | Digital One-Wire Climate Telemetry |
| **Active Buzzer** | POS (+) | **GPIO 8** | Acoustic Emergency Alarm Trigger |
| **Status LEDs** | Green / Yellow / Red | **GPIO 9** / **GPIO 10** / **GPIO 11** | Visual Safety Indicators (Normal / Warning / Danger) |

> [!IMPORTANT]
> All analog pins are intentionally designated on **ADC1** so analog sampling remains uninterrupted when the ESP32-S3 Wi-Fi stack is active.

*For complete electrical schematics and resistor values, consult [hardware/pinout.md](hardware/pinout.md).*

---

## 6. Getting Started (Arduino IDE 2.x & Web App)

For a complete step-by-step wiring guide, ASCII pin connection diagrams, and breadboard schematics, see **[hardware/pinout.md](hardware/pinout.md)**.

### Step 1: Database Setup (Supabase)
1. Open your project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor**, paste the contents of [`supabase/migrations/20261112000000_create_telemetry.sql`](supabase/migrations/20261112000000_create_telemetry.sql), and click **Run**.
3. Verify that the `telemetry` table is created with Row Level Security (RLS) active.

### Step 2: Flashing ESP32-S3 Firmware
1. Open Arduino IDE 2.x.
2. In **Boards Manager**, install `esp32` by Espressif Systems.
3. In **Library Manager**, install `PubSubClient`, `DHT sensor library`, and `Adafruit Unified Sensor`.
4. Open [`firmware/esp32_airguard/esp32_airguard.ino`](firmware/esp32_airguard/esp32_airguard.ino).
5. Update `WIFI_SSID` and `WIFI_PASSWORD` with your local 2.4 GHz credentials.
6. Set Board to **ESP32S3 Dev Module** and enable **USB CDC On Boot**.
7. Click **Verify** $\rightarrow$ **Upload**. Open Serial Monitor at **115200 baud**.

### Step 3: Launching the Real-Time Web Dashboard
1. Open [`web/index.html`](web/index.html) directly in any modern web browser (or serve via VS Code Live Server / GitHub Pages).
2. The dashboard will:
   - Query **Supabase** on startup to backfill historical time-series curves.
   - Connect to **MQTT over WebSockets** to animate live gauge dials every 3 seconds.
   - Provide instantaneous visual banners and audio tones if hazard limits are breached!

---

## 7. License

This project is licensed under the [MIT License](LICENSE).
