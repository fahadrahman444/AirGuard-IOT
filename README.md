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
* **Submitted to:** S. M. Zafrul Islam, Lecturer, Department of CSE, UITS
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

**AirGuard IoT** is an end-to-end edge-to-cloud environmental monitoring station designed to detect atmospheric degradation, lethal carbon monoxide (CO), combustible gas leaks, airborne dust particles, and ambient climate conditions in real time (with hardware hooks reserved for future oxygen sensing). 

Driven by a collaborative **Arduino Mega 2560** (5V Sensor Acquisition Coprocessor) and an **ESP32-S3** (3.3V Dual-Core IoT Cloud Gateway @ 240 MHz), the system unifies high-speed deterministic analog acquisition, on-site alarm triggering, and integrated 2.4 GHz Wi-Fi connectivity.

The edge node implements a **Dual-Sink Hybrid Cloud Architecture**:
1. **Sink 1 (Hot Path — Sub-Second Live Push):** High-frequency telemetry streamed every **2 seconds** over MQTT to HiveMQ (`broker.hivemq.com:1883`) for instant browser oscilloscope traces, gauge animations, and real-time audio/push notifications.
2. **Sink 2 (Cold Path — Durable Storage):** Low-frequency telemetry committed every **15 seconds** over HTTPS REST directly to **Supabase Postgres** for durable historical persistence, cold-start backfilling, and official compliance PDF reporting.

---

## 2. Key Features

- **Dual-MCU Bench Architecture:** Combines the **Arduino Mega 2560** (multi-channel 5V ADC acquisition engine) with the **ESP32-S3** (Dual-Core IoT edge gateway) interfaced via hardware UART with a protective voltage divider.
- **Dual-Sink Hybrid Cloud Ingestion:** Decoupled Hot Path (MQTT @ 2s) and Cold Path (Supabase @ 15s) guarantees sub-second responsiveness without database quota exhaustion.
- **Multi-Gas Air Quality Monitoring (MQ-135):** Continuously quantifies indoor/ambient air pollution, calculating real-world concentrations for $\text{CO}_2$ (400–800 PPM normal) and $\text{NH}_3$ (Ammonia vapor).
- **Carbon Monoxide & Flammable Gas Detection (MQ-9):** Detects lethal odorless Carbon Monoxide ($\text{CO}$) alongside combustible fuels ($\text{CH}_4$, LPG) to prevent hypoxia and fire hazards.
- **Atmospheric Gas Spectrum Reference Table:** Built-in interactive dashboard guide displaying Clean Air Baselines vs Live Sensor PPM vs International Hazard Limits (OSHA, WHO, ASHRAE).
- **Live Dhaka Meteorological Station:** Integrated Open-Meteo Cloud API automatically synchronizing Dhaka (UITS Campus Area • `23.81°N, 90.41°E`) ambient temperature, relative humidity, barometric pressure, wind speed/direction, and 3-day forecast.
- **Gas Dispersion Safety Correlation:** Real-time ventilation index correlating wind speed with indoor/outdoor gas accumulation risk (Stagnant vs Moderate vs High Aeration).
- **Interactive Timeline History Views:** Switch between `⚡ LIVE STREAM (2s)`, `📊 HOURLY BREAKDOWN`, and `📅 24-HOUR DAY TIMELINE` to analyze diurnal air quality shifts.
- **Auto-Zoom Oscilloscope Traces:** Interactive toggle that magnifies subtle sensor fluctuations against standard fixed oscilloscope scales.
- **1-Click Official Inspection Certificate (PDF):** Instant academic/industrial compliance report generator with pre-filled UITS course credentials and Course Lecturer **S. M. Zafrul Islam**.
- **OneSignal Web Push & Audio Alerts:** Instant browser push notifications and acoustic siren alerts during critical gas leakage conditions.
- **Phase 2 Future Scope Badging:** Optical dust sensing (Sharp GP2Y1010) and Electrochemical Oxygen ($O_2$ ME2-O2) reserved and badged on dashboard.

---

## 3. System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Sensing_Layer["Sensing Layer (Active Hardware + Phase 2 Scope)"]
        MQ135["MQ-135 (Air Quality, CO2, NH3, Smoke)"]
        MQ9["MQ-9 (Carbon Monoxide & Combustible Gas)"]
        METEO["Open-Meteo Cloud (Dhaka Weather & Wind)"]
        DUST["[Future Phase 2] Sharp GP2Y1010 Dust Sensor"]:::future
        O2["[Future Phase 2] ME2-O2 Oxygen Sensor"]:::future
    end

    classDef future stroke-dasharray: 5 5,stroke:#999,color:#777;

    subgraph Coprocessor["Sensor Acquisition Coprocessor (Arduino Mega 2560)"]
        MEGA_ADC["10-bit ADC Acquisition (A0 = MQ-9, A1 = MQ-135)"]
        MEGA_UART["UART1 Serial Transmitter (TX1 = Pin 18 @ 9600 Baud)"]
    end

    subgraph ESP32S3_Gateway["IoT Edge Cloud Gateway (ESP32-S3)"]
        UART_RX["UART Hardware Serial (GPIO 16 RX via 1k/2k Divider)"]
        SCALER["10-bit to 12-bit Scale & PPM Estimation Engine"]
        DISPATCH{"Dual-Sink Dispatcher"}
        WIFI_RADIO["2.4 GHz Wi-Fi Stack"]
    end

    subgraph Cloud_Layer["Dual-Sink Cloud Infrastructure"]
        BROKER["HiveMQ MQTT Broker<br>broker.hivemq.com:1883"]
        SUPABASE[("Supabase Postgres DB<br>HTTPS REST Endpoint")]
    end

    subgraph Web_Layer["Client Presentation Layer (GitHub Pages)"]
        DASHBOARD["AirGuard Web Dashboard (web/index.html)"]
        WEATHER_STATION["Dhaka Microclimate Station Widget"]
        CHARTS["Dual Chart.js Oscilloscopes"]
        AUDIT_TABLE["Historical Supabase Ledger Table"]
        PDF_REPORT["1-Click Official Inspection PDF Certificate"]
    end

    MQ9 & MQ135 -->|Analog 5V AO| MEGA_ADC
    MEGA_ADC --> MEGA_UART
    MEGA_UART -->|5V TX1 CSV Frame| UART_RX
    UART_RX --> SCALER
    SCALER --> DISPATCH
    DISPATCH -->|Every 2s (Hot Path MQTT)| BROKER
    DISPATCH -->|Every 15s (Cold Path HTTPS)| SUPABASE

    BROKER -->|WSS Port 8884| DASHBOARD
    SUPABASE -->|HTTPS REST Select| DASHBOARD
    METEO -->|Open-Meteo API JSON| WEATHER_STATION
    DASHBOARD --> CHARTS & AUDIT_TABLE & PDF_REPORT
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
│   ├── pinout.md                      # Arduino Mega + ESP32-S3 pin mapping, voltage divider & schematics
│   └── bill_of_materials.md           # Complete components list, models & specifications
├── firmware/
│   ├── README.md                      # Comprehensive firmware guide, protocols, and flashing instructions
│   ├── arduino_mega_airguard/
│   │   └── arduino_mega_airguard.ino  # Arduino Mega 2560 sensor acquisition sketch
│   ├── esp32_uart_airguard/
│   │   └── esp32_uart_airguard.ino    # ESP32-S3 UART bridge, MQTT streamer & Supabase client
│   └── esp32_airguard/
│       └── esp32_airguard.ino         # Standalone direct ESP32-S3 firmware
├── supabase/
│   └── migrations/
│       └── 20261112000000_create_telemetry.sql # Database schema & RLS policies
├── test/
│   └── dashboard_verification.test.js # Automated 10-point test runner (Node.js test framework)
├── web/
│   ├── index.html                     # Real-time web dashboard (TailwindCSS, Chart.js, MQTT, Open-Meteo)
│   └── OneSignalSDKWorker.js          # Web Push Service Worker
├── generate_pdf.js                    # Automated PDF proposal generator
├── .gitignore                         # Git ignore rules for embedded development
└── README.md                          # Main project documentation
```

---

## 5. Gas Spectrum & Real-World Safety Standards

The AirGuard IoT system references established international occupational safety benchmarks:

| Target Gas Compound | Detecting Sensor | Clean Air Normal Baseline | Permissible Safe Limit | Critical Hazard Limit | Governing Standard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **$\text{CO}_2$ (Carbon Dioxide)** | **MQ-135** | 400 – 420 PPM | $< 1,000\text{ PPM}$ | $> 5,000\text{ PPM}$ | **ASHRAE 62.1 / OSHA PEL** |
| **$\text{NH}_3$ (Ammonia Vapor)** | **MQ-135** | $< 0.1 - 1.0\text{ PPM}$ | $< 25\text{ PPM}$ | $> 50\text{ PPM}$ | **OSHA PEL / NIOSH REL** |
| **$\text{CO}$ (Carbon Monoxide)** | **MQ-9** | $0.1 - 2.0\text{ PPM}$ | $< 35 - 50\text{ PPM}$ | $> 100\text{ PPM}$ | **OSHA 8-hr TWA / WHO** |
| **$\text{CH}_4$ / LPG (Combustible)** | **MQ-9** | $\approx 1.9\text{ PPM}$ | $< 1,000\text{ PPM}$ ($< 5\%\text{ LEL}$) | $> 5,000\text{ PPM}$ ($10\%\text{ LEL}$) | **NFPA 54 / OSHA Safety Band** |
| **Suspended PM2.5 (Dust)** | **GP2Y1010** | $< 10\text{ }\mu\text{g/m}^3$ | $< 15\text{ }\mu\text{g/m}^3$ | $> 75\text{ }\mu\text{g/m}^3$ | **WHO Global Air Quality** |
| **$\text{O}_2$ (Oxygen Concentration)** | **ME2-O2** | $20.9\%\text{ Vol}$ | $19.5\% - 23.5\%\text{ Vol}$ | $< 19.5\%\text{ (Hypoxia)}$ | **OSHA Enclosed Space Rule** |

---

## 6. Hardware Pinout Quick Reference (Active Dual-MCU Bench)

```
Arduino Mega Pin A0 <--- MQ-9 AO (Analog 0-5V)
Arduino Mega Pin A1 <--- MQ-135 AO (Analog 0-5V)

Mega TX1 (Pin 18) --- [ 1kΩ Resistor ] ---+---> ESP32-S3 GPIO 16 (RX)
                                          |
                                  [ 2kΩ Resistor ]
                                          |
Mega GND ---------------------------------+---> ESP32-S3 GND (Common Ground)
```

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

### Step 3: Launching the Real-Time Web Dashboard (GitHub Pages)
The web application is engineered as a zero-dependency, production-grade SCADA telemetry terminal deployed directly onto **GitHub Pages** via **GitHub Actions**:

* **Live Dashboard URL:** [https://fahadrahman444.github.io/AirGuard-IOT/](https://fahadrahman444.github.io/AirGuard-IOT/)
* **Automated CI/CD Workflow:** [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) automatically deploys the `web/` application on every push to `main`.
* **Activation in GitHub:** In your repository on GitHub, navigate to **Settings $\rightarrow$ Pages**, and under **Build and deployment $\rightarrow$ Source**, select **GitHub Actions**.
* **Local Run:** You can also open [`web/index.html`](web/index.html) directly in any modern browser or via VS Code Live Server.

The terminal automatically:
1. Queries **Supabase** upon loading to backfill the last 30 historical records into the dual oscilloscopes.
2. Connects to **HiveMQ MQTT over WSS** (`wss://broker.hivemq.com:8884/mqtt`) to stream sub-100ms real-time updates every 3 seconds.
3. Provides an acoustic siren and visual safety codes (Normal / Warning / Critical Hazard) conforming to OSHA/ISO safety limits.
4. Allows exporting recorded telemetry to **CSV** and **JSON** for academic lab reports.

---

## 7. License

This project is licensed under the [MIT License](LICENSE).
