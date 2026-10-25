**Course Code: CSE402**

**Course Title: Internet of Things Lab**

**Project Proposal**

**Submitted to:**

Abrar Mahbub Tanim

Lecturer

		**Submitted by:**

Name: MD Fahad Rahman

ID: 0432320005101071

Section: 6B1

Department of CSE

Autumn 26

University of Information Technology and Sciences

October 25, 2026

---

# Project Title
**AirGuard IoT:** An IoT-Based Smart Air Quality, Gas Leakage, and Environmental Monitoring System Using Arduino Uno and Cloud Computing

---

# Domain
* **Primary Domain:** Environmental Monitoring & Public Health
* **Secondary Domain:** Smart Home & Industrial Safety (aligned with Domain-Specific IoT Applications)

---

# Problem Statement
Poor indoor and ambient air quality, undetected hazardous gas leakages (e.g., LPG, carbon monoxide, methane), and oxygen depletion present acute safety and long-term health risks in residential homes, educational laboratories, and industrial workplaces. Traditional detection methods rely on isolated, non-networked alarm units that lack:
1. Real-time multi-parameter data aggregation (particulate dust, oxygen, hazardous gases, temperature, and humidity).
2. Remote accessibility and persistent cloud data logging for trend evaluation.
3. Early warning telemetry that notifies stakeholders before toxic gas concentrations or oxygen deficiencies reach critical thresholds.

---

# Proposed Solution
**AirGuard IoT** is an edge-to-cloud environmental monitoring and safety system engineered around the **Arduino Uno** platform paired with an **ESP8266 Wi-Fi** module. 

The system collects real-time physical telemetry from an array of dedicated analog and digital environmental sensors:
* Gas sensors (MQ-135 and MQ-2) for air pollution and combustible/toxic gas detection.
* Electrochemical oxygen sensor for measuring O₂ concentration.
* Optical dust sensor for particulate matter (PM) detection.
* Digital climate sensor (DHT11/DHT22) for ambient temperature and relative humidity.

The sensor data is acquired and conditioned by the Arduino Uno, forwarded to the ESP8266 via UART Serial communication, and transmitted over 2.4 GHz Wi-Fi using lightweight **MQTT / HTTP** protocols to a cloud IoT platform (such as ThingSpeak or Adafruit IO). If any parameter violates predefined safety thresholds, the edge system immediately activates a local audio-visual alert (active buzzer and warning LEDs) while streaming high-priority alert triggers to the cloud dashboard.

---

# Objectives
1. **Multi-Parameter Environmental Sensing:** Continuously monitor Air Quality Index (AQI), hazardous gas levels, oxygen concentration (% O₂), airborne dust density, temperature, and relative humidity.
2. **Early Gas Leakage & Toxic Gas Detection:** Rapidly detect combustible gases (LPG, methane) and smoke to mitigate domestic and industrial fire and poisoning hazards.
3. **Edge-to-Cloud Telemetry:** Reliably transfer sensor metrics from the Arduino Uno to the cloud via the ESP8266 Wi-Fi transceiver utilizing lightweight IoT protocols.
4. **Cloud Analytics & Visualization:** Present real-time telemetry graphs, status indicators, and historical logs on a user-friendly cloud dashboard.
5. **Automated Dual-Layer Alerting:** Trigger instantaneous local audio-visual alarms (buzzer + LED indicators) and dispatch remote notifications when environmental thresholds are breached.

---

# Hardware Requirements
* **Microcontroller:** Arduino Uno R3 (ATmega328P) — Central edge data acquisition and processing unit.
* **Connectivity Transceiver:** ESP8266 Wi-Fi Module (ESP-01 / NodeMCU Shield) — Serial-to-Wi-Fi gateway.
* **Environmental & Gas Sensors:**
  * **MQ-135:** Air quality sensor (detects CO₂, NH₃, alcohol, benzene, and smoke).
  * **MQ-2:** Combustible gas sensor (detects LPG, propane, methane, hydrogen, and smoke).
  * **O₂ Sensor Module:** Electrochemical oxygen sensor (measures atmospheric O₂ percentage).
  * **Optical Dust Sensor:** Sharp GP2Y1010AU0F / Nova PM sensor (measures airborne particulate matter).
  * **DHT11 / DHT22:** Digital sensor for ambient temperature and relative humidity.
* **Actuators & Display:**
  * 16x2 LCD Display with I2C module (for immediate on-site visual readings).
  * Active 5V Buzzer (acoustic emergency alert).
  * Status LEDs (Green = Safe, Yellow = Warning, Red = Danger).
* **Power Supply & Miscellaneous:**
  * 5V / 2A DC Power Adapter or 9V Battery with voltage regulator.
  * Logic Level Converter / Resistor Voltage Divider (5V to 3.3V UART protection for ESP8266).
  * Breadboard, jumper wires, and pull-up resistors.

---

# Software and Technologies
* **Embedded Development & Firmware:**
  * **Arduino IDE:** C / C++ embedded programming.
  * **Key Firmware Libraries:** `WiFiClient.h`, `PubSubClient.h` (MQTT), `DHT.h`, `LiquidCrystal_I2C.h`, `SoftwareSerial.h`.
* **IoT Communication Protocols:**
  * **MQTT (Message Queuing Telemetry Transport):** Lightweight publish-subscribe protocol for low-bandwidth cloud messaging.
  * **HTTP / REST API:** Secure POST telemetry transmission.
  * **UART / Serial:** Microcontroller-to-Wi-Fi inter-module communication.
* **Cloud & Visualization Platform:**
  * **ThingSpeak / Adafruit IO / Blynk Cloud:** Cloud broker, live metric charting, data storage, and automated notification triggers.

---

# Feasibility Analysis
* **Technical Feasibility:** The architecture utilizes industry-standard, well-documented components. The Arduino Uno readily interfaces with analog/digital sensor pins, and the ESP8266 provides robust Wi-Fi telemetry using standard AT-commands or serial bridge firmware.
* **Economic Feasibility:** The system is built with readily available, cost-effective commercial-off-the-shelf (COTS) sensors and microcontrollers, making it substantially cheaper than proprietary commercial air-quality and gas detection systems.
* **Operational Feasibility:** The device requires standard 5V USB/DC power and a 2.4 GHz Wi-Fi hotspot. Setup is plug-and-play with minimal calibration and maintenance required for continuous indoor or laboratory monitoring.

---

# Project Scope and Limitations
### Project Scope:
* Real-time monitoring of indoor living spaces, science/computer laboratories, and commercial kitchens.
* Multi-sensor data synchronization with cloud dashboards for remote observation.
* Dual-tier alarming (on-site buzzer/LEDs and remote cloud status indication).

### Limitations:
* **Memory & Processing Constraints:** The Arduino Uno possesses limited SRAM (2 KB) and Flash (32 KB); intensive networking stacks are handled by the ESP8266.
* **Sensor Warm-up Time:** Metal oxide semiconductor (MQ) sensors require a preheating stabilization cycle (approx. 20–30 seconds) upon power-up for calibrated accuracy.
* **Network Dependency:** Cloud logging and remote telemetry require an active 2.4 GHz Wi-Fi Internet connection (local audio-visual alarms function independently of internet availability).

---

# Expected Outcome
1. A fully assembled and operational hardware prototype integrating Arduino Uno, ESP8266, and 5 distinct sensing modules.
2. A live cloud-based monitoring dashboard displaying real-time numerical and graphical telemetry of air purity, gas concentration, oxygen percentage, dust levels, temperature, and humidity.
3. An automated safety response system that sounds local alarms and updates cloud alert flags within 2 seconds of detecting hazardous gas concentrations or oxygen deficiencies.
