**Course Code: CSE402**

**Course Title: Internet of Things Lab**

**Project Proposal**

**Submitted to:**

Abrar Mahbub Tanim

Lecturer, Department of CSE
University of Information Technology and Sciences (UITS)
Permanent Campus: Baridhara Nayanagar, Dhaka-1212

		**Submitted by (Project Team):**

1. MD. Fahad Rahman (Team Leader - ID: 0432320005101071)
2. Zannatul Nayem (ID: 0432320005101063)
3. Shafayet Hossain Shafin (ID: 0432320005101088)

Batch: 54th Batch
Section: 6B1
Department of CSE
Program: B.Sc. in Computer Science & Engineering
Semester: 7th (Autumn 2026)
University of Information Technology and Sciences (UITS)
October 26, 2026

---

# 1. Project Title
**AirGuard IoT:** An IoT-Based Smart Air Quality, Carbon Monoxide, Gas Leakage, and Environmental Monitoring System Using ESP32-S3 and Real-Time Web Application

---

# 2. Domain & Application Scope
* **Primary Domain:** Environmental Sensing & Public Health (Aligned with Domain-Specific IoT Architectures).
* **Secondary Domain:** Smart Campus & Industrial Safety (Targeted for UITS CSE Hardware/IoT Labs, Server Rooms & Academic Buildings).

---

# 3. Problem Statement
Dhaka consistently ranks among the world's most air-polluted metropolises, experiencing severe seasonal particulate spikes (PM2.5/PM10), odorless carbon monoxide poisoning risks, combustible gas leaks, and poor indoor air ventilation. Within enclosed institutional environments—such as UITS computer science laboratories, server clusters, and educational buildings—undetected carbon monoxide (CO), flammable gas leaks (methane, LPG), and excessive airborne dust present acute respiratory risks and fire hazards. Conventional protection mechanisms suffer from severe architectural limitations:
1. **Lack of Multi-Parameter Integration:** Traditional detectors operate as isolated units, unable to simultaneously sample particulate dust density, toxic carbon monoxide, combustible gases, ambient temperature, and relative humidity.
2. **No Remote Telemetry or Cloud Logging:** Standard alarms are standalone buzzers lacking wireless connectivity or historical trend logs for predictive laboratory maintenance.
3. **Delayed Emergency Response:** Off-premises university faculty, lab officers, and safety administrators receive no low-latency push notifications when dangerous conditions develop after hours.

---

# 4. Proposed Solution & System Architecture
**AirGuard IoT** delivers a robust edge-to-cloud environmental safety platform engineered specifically for educational laboratories and institutional facilities, powered by a high-performance **ESP32-S3** microcontroller (Dual-Core Xtensa LX7 @ 240 MHz) with integrated 2.4 GHz Wi-Fi and Bluetooth.

The system captures multi-point physical telemetry from a synchronized multi-sensor array:
* **MQ-135 Gas Sensor:** Detects air pollution, CO₂, NH₃, benzene, alcohol, and ambient hazardous smoke.
* **MQ-9 Gas Sensor:** Quantifies lethal Carbon Monoxide (CO) concentration and detects combustible fuels (methane, LPG).
* **Sharp GP2Y1010AU0F Optical Dust Sensor:** Quantifies airborne suspended particulates in $\mu\text{g/m}^3$.
* **Digital Climate Sensor (DHT11/DHT22):** Logs ambient temperature and relative humidity.
* **Future Phase Expansion Interface:** Dedicated ADC1 channel (`GPIO 5`) on the ESP32-S3 reserved for future integration of an electrochemical O₂ sensor in Phase 2.

The ESP32-S3 executes deterministic analog/digital signal conditioning leveraging its 12-bit ADC1 channels. Combining data acquisition, threshold intelligence, and wireless transmission on a single silicon SoC eliminates the communication latency, baud-rate bottlenecks, and level-shifting complexities of legacy multi-board configurations. Telemetry is transmitted over 2.4 GHz Wi-Fi using the lightweight MQTT protocol to a dedicated **Real-Time Web Application**. The web platform delivers interactive gauges, historical charting, and live remote alerts, while local audio-visual buzzers and LEDs provide instantaneous on-site safety warnings.

---

# 5. Project Objectives
1. **Comprehensive Environmental Sensing:** Continuously quantify Air Quality Index (AQI), Carbon Monoxide & combustible gas concentration (PPM), suspended dust density ($\mu\text{g/m}^3$), ambient temperature, and relative humidity.
2. **Early Gas & CO Hazard Detection:** Rapidly detect toxic Carbon Monoxide (CO) accumulation and combustible gas leaks (LPG, methane) to prevent asphyxiation accidents, fire outbreaks, and laboratory damage.
3. **Unified Single-Chip IoT Processing:** Eliminate inter-MCU communication bottlenecks by processing sensor telemetry, on-site alarms, and MQTT wireless publishing directly on a single ESP32-S3 platform.
4. **Custom Web Application Visualization:** Develop a responsive, full-featured web dashboard displaying real-time analytical metrics, interactive graphs, and historical logs, replacing restrictive on-site character LCDs.
5. **Automated Dual-Layer Alarming:** Execute immediate local acoustic/visual alert sequences (active buzzer + tri-color LEDs) alongside real-time web socket/cloud alert banners when safety thresholds are breached.

---

# 6. Hardware Requirements & Component Specifications
* **All-in-One IoT Microcontroller:** ESP32-S3 (ESP32-S3-DevKitC-1 / WROOM, Dual-Core 240 MHz, 512 KB SRAM, 8 MB Flash, Native 2.4 GHz 802.11 b/g/n Wi-Fi & BLE 5) — Unified edge acquisition, signal processing, and direct cloud transmission engine.
* **Active Environmental & Gas Sensor Suite:**
  * **MQ-135 Gas Sensor:** Air quality sensor detecting CO₂, NH₃, benzene, alcohol, and ambient hazardous smoke.
  * **MQ-9 Gas Sensor:** Specialized Carbon Monoxide (CO) and combustible gas (methane, LPG) sensor for asphyxiation and explosion prevention.
  * **Optical Dust Sensor (Sharp GP2Y1010AU0F):** Infrared optical particulate sensor quantifying fine PM2.5 / PM10 density measurement in $\mu\text{g/m}^3$.
  * **Climate Sensor (DHT11 / DHT22):** Calibrated digital sensor logging relative humidity and ambient temperature.
  * **Future Phase Expansion Feature:** Electrochemical O₂ Sensor Module (ME2-O2 / Grove O₂) — Reserved expansion channel on ADC1 (`GPIO 5`) for oxygen depletion tracking, planned for Phase 2 implementation subject to project grant allocation.
* **Local Actuators & On-Site Indicators:** Active acoustic buzzer for immediate emergency warning, and tri-color status LEDs (Green = Normal, Yellow = Warning, Red = Critical Danger).
* **Power & Interface Accessories:** Regulated 5V/2A DC power supply / USB-C, 1kΩ/2kΩ analog ADC voltage divider resistors, 150Ω resistor, 220µF electrolytic capacitor, solderless breadboard, and jumper wires.

---

# 7. Software, Firmware & Web Stack
* **Embedded Firmware:** ESP-IDF / Arduino IDE (C / Embedded C++) utilizing non-blocking FreeRTOS sensor sampling and ADC1-safe sampling algorithms.
* **Firmware Libraries:** `WiFi.h`, `PubSubClient.h` (MQTT), and `DHT.h`.
* **Communication Protocols:** MQTT (Message Queuing Telemetry Transport) for low-latency publish/subscribe messaging over Wi-Fi 802.11 b/g/n, and HTTP REST API fallback.
* **Real-Time Web Application Stack:** Modern responsive web dashboard built with HTML5/CSS3, JavaScript (React / Chart.js / WebSockets), displaying live gauge dials, real-time pollution time-series, historical telemetry archives, and threshold alert banners.

---

# 8. Feasibility Analysis
* **Technical Feasibility:** The ESP32-S3 provides high-speed 240 MHz dual-core processing, 512 KB SRAM, and hardware floating-point acceleration, effortlessly handling multi-sensor calibrations, digital filtering, and secure MQTT transmission concurrently without requiring a secondary coprocessor.
* **Economic Feasibility:** The system is built entirely from accessible commercial-off-the-shelf (COTS) components. Leveraging the all-in-one ESP32-S3 reduces overall bill-of-materials cost compared to multi-board systems while preserving top-tier multi-hazard air safety monitoring.
* **Operational Feasibility:** The system requires standard 5V power and a 2.4 GHz Wi-Fi hotspot. Laboratory stakeholders and students can inspect live environmental metrics on any smartphone, tablet, or PC browser without needing to physically stand next to the device.

---

# 9. Project Scope & Limitations
* **Project Scope:** Designed for real-time monitoring across UITS computer science laboratories, server rooms, university project exhibition halls, and residential living spaces.
* **Processing Headroom:** The ESP32-S3 dual-core processor delivers abundant computational headroom, ensuring zero risk of memory exhaustion or task blocking during continuous sampling.
* **Budget Scope & Future O₂ Integration:** Due to prohibitive procurement costs, electrochemical O₂ percentage sensing is omitted from the initial prototype and scheduled as a planned future update; ESP32-S3 ADC1 channel `GPIO 5` is reserved for seamless plug-and-play upgrade.
* **Network Dependency:** Cloud logging and web application telemetry require active Wi-Fi internet connectivity. However, local audio-visual alarm functions (buzzer & LEDs) operate completely autonomously even when offline.

---

# 10. Expected Outcome & Deliverables
1. **Functional Hardware Prototype:** A fully assembled hardware station integrating the ESP32-S3 and 4 primary sensing modules (with expansion readiness for future O₂ addition).
2. **Interactive Real-Time Web Application:** A responsive, feature-rich web dashboard displaying live gauges, time-series telemetry plots, historical logs, and safety indicator cards for air quality, gases, dust, and climate.
3. **Sub-2s Emergency Safety Alarming:** An automated safety response mechanism sounding local sirens and streaming web alert flags within 2 seconds of threshold violations.

---

# 11. Team Work Distribution & Responsibilities
* **MD. Fahad Rahman (Team Leader - 0432320005101071):** Overall system architecture, multi-sensor calibration & interfacing (MQ-135, MQ-9, GP2Y1010AU0F, DHT), future O₂ pin allocation, ESP32-S3 firmware engineering, and FreeRTOS task coordination.
* **Zannatul Nayem (0432320005101063):** ESP32-S3 Wi-Fi stack & network manager, MQTT cloud broker configuration, payload serialization, and REST API telemetry transmission pipeline.
* **Shafayet Hossain Shafin (0432320005101088):** Real-Time Web Application frontend/backend development (dashboard UI, live metric cards, Chart.js time-series graphs), local audio-visual alarm circuit integration, testing, and technical documentation.

---

# 12. Project Implementation Milestones (July – Nov 15, 2026)
* **Phase 1 (July – August 2026):** Requirements analysis, COTS sensor procurement (MQ-135, MQ-9, GP2Y1010AU0F, DHT), sensor burn-in, calibration testing, and breadboard baseline prototyping.
* **Phase 2 (September 2026):** ESP32-S3 edge acquisition firmware, ADC1 voltage divider protection circuit, and autonomous on-site audio-visual buzzer/LED alarm circuit integration.
* **Phase 3 (October 2026):** ESP32-S3 Wi-Fi & MQTT cloud publish/subscribe pipeline configuration, and interactive Real-Time Web Application dashboard development.
* **Phase 4 (November 1 – November 15, 2026):** Hardware enclosure packaging, end-to-end lab benchmarking under simulated gas/smoke, system calibration, and first functional prototype ready before November 15, 2026.
