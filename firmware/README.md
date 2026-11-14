# AirGuard IoT — Embedded Firmware Architecture & Hardware Guide

> **Dual-Microcontroller Sensor Acquisition & Cloud Gateway Subsystem**  
> **Course:** CSE402 Internet of Things Lab, Department of Computer Science & Engineering, UITS  
> **Course Lecturer:** S. M. Zafrul Islam  
> **Target Hardware:** Arduino Mega 2560 (Sensor Coprocessor) + ESP32-S3 (IoT Edge Gateway)

---

## 1. Architectural Overview

AirGuard IoT splits processing across a two-tier embedded topology:

```
+-------------------------------------------------------------+
|                     SENSING LAYER                           |
|   MQ-9 (Carbon Monoxide & Gas)     MQ-135 (Air Quality)     |
|              [5V AO]                         [5V AO]        |
+-----------------+-------------------------------+-----------+
                  |                               |
                  v                               v
+-------------------------------------------------------------+
|       ARDUINO MEGA 2560 (5V Sensor Acquisition Coprocessor)  |
|   - 10-bit Multi-Channel ADC (0 - 1023 counts @ 5.0V)       |
|   - Deterministic 2-second sampling interval                |
|   - Non-blocking frame serializer                           |
|   - UART1 Hardware Serial (TX1 = Pin 18) @ 9600 Baud        |
+-----------------------------+-------------------------------+
                              |
                     5V TX1   v   CSV Stream (raw9,volt9,raw135,volt135)
               [ 1k / 2k Voltage Divider ]
                              |
                   3.3V RX    v   (GPIO 16)
+-------------------------------------------------------------+
|         ESP32-S3 (3.3V Dual-Core IoT Cloud Gateway)         |
|   - Xtensa Dual-Core LX7 @ 240 MHz                          |
|   - ADC count rescaling: 10-bit (0-1023) -> 12-bit (0-4095) |
|   - Dual-Sink Cloud Dispatcher:                             |
|       * SINK 1 (Hot Path): MQTT JSON @ 2-3s (HiveMQ)        |
|       * SINK 2 (Cold Path): HTTPS REST POST @ 15s (Supabase)|
|   - Local Hardware Watchdog & Offline Alarm State Machine   |
+-------------------------------------------------------------+
```

---

## 2. Firmware Sketches in this Directory

| Sketch Directory | Target MCU | Primary Function | Source File |
| :--- | :--- | :--- | :--- |
| **`arduino_mega_airguard/`** | Arduino Mega 2560 | Reads MQ-9 (`A0`) & MQ-135 (`A1`), calculates analog voltages, and sends CSV frame over `Serial1` (Pin 18) at 9600 baud. | [arduino_mega_airguard.ino](arduino_mega_airguard/arduino_mega_airguard.ino) |
| **`esp32_uart_airguard/`** | ESP32-S3 | Receives CSV frame over `GPIO 16 (RX)`, scales ADC counts to 12-bit (0–4095), manages Wi-Fi, streams MQTT to HiveMQ, and writes to Supabase Postgres over HTTPS REST. | [esp32_uart_airguard.ino](esp32_uart_airguard/esp32_uart_airguard.ino) |
| **`esp32_airguard/`** | ESP32-S3 (Standalone) | Standalone version where sensors are wired directly to ESP32-S3 ADC1 (`GPIO 1`, `GPIO 2`, `GPIO 3`, `GPIO 4`). | [esp32_airguard.ino](esp32_airguard/esp32_airguard.ino) |

---

## 3. Wiring & Electrical Interfacing

### 3.1 Arduino Mega 2560 to MQ Sensors (5V Domain)
* **MQ-9 (Carbon Monoxide & Combustible Gas):**
  * `VCC` -> Arduino Mega `5V`
  * `GND` -> Arduino Mega `GND`
  * `AO`  -> Arduino Mega `A0`
* **MQ-135 (Air Quality, CO₂, Ammonia, Smoke):**
  * `VCC` -> Arduino Mega `5V`
  * `GND` -> Arduino Mega `GND`
  * `AO`  -> Arduino Mega `A1`

### 3.2 Inter-MCU UART Level Shifting (5V Mega -> 3.3V ESP32-S3)
> **CRITICAL ELECTRICAL SAFETY NOTE:**  
> The Arduino Mega 2560 operates on **5.0V logic**. The ESP32-S3 operates on **3.3V logic**. Direct connection of Mega TX1 (5V) to ESP32 GPIO 16 (3.3V) can overstress or damage the ESP32 input stage. A passive resistor divider step-down is required:

```
Arduino Mega TX1 (Pin 18) ----[ 1k Ohm Resistor ]----+---- ESP32-S3 GPIO 16 (RX)
                                                     |
                                             [ 2k Ohm Resistor ]
                                                     |
                                             Arduino / ESP32 GND
```
* **Output Voltage Calculation:**  
  $$V_{\text{out}} = 5.0\text{V} \times \frac{2000}{1000 + 2000} = 3.33\text{V} \quad \text{(Safe for ESP32-S3)}$$
* **Ground Reference:** Connect Arduino Mega `GND` to ESP32-S3 `GND` with a low-resistance jumper to establish an equipotential zero-volt reference plane.

---

## 4. Serial Communication Protocol

The coprocessor emits a newline-terminated comma-separated ASCII frame over `Serial1` every **2000 ms**:

### Frame Syntax:
```text
<raw9>,<volt9>,<raw135>,<volt135>\r\n
```

### Parameter Breakdown:
1. `raw9`: Raw 10-bit ADC integer from MQ-9 (`0` to `1023`)
2. `volt9`: Voltage on MQ-9 analog pin with 3 decimal precision (`0.000` to `5.000` V)
3. `raw135`: Raw 10-bit ADC integer from MQ-135 (`0` to `1023`)
4. `volt135`: Voltage on MQ-135 analog pin with 3 decimal precision (`0.000` to `5.000` V)

### Example Real Transmission:
```text
312,1.525,415,2.028
```

---

## 5. ESP32-S3 Cloud Ingestion (Dual-Sink Architecture)

### Sink 1: Hot Path — HiveMQ MQTT Broker
* **Broker:** `broker.hivemq.com`
* **Port:** `1883` (TCP)
* **Topic:** `airguard/telemetry`
* **Cadence:** Instantaneous on every valid UART frame received (~2 seconds)
* **Payload Format:**
  ```json
  {
    "device_id": "AIRGUARD-ESP32S3-01",
    "timestamp": 1731630000,
    "aqi": 1660,
    "co_gas": 1248,
    "dust": 0.0,
    "temp": 25.0,
    "hum": 50.0,
    "status": "NORMAL"
  }
  ```

### Sink 2: Cold Path — Supabase PostgreSQL (PostgREST API)
* **Endpoint:** `https://zamvuyyqfwehxlnijeat.supabase.co/rest/v1/telemetry`
* **Transport:** HTTPS TLS 1.2 POST with `apikey` and `Authorization: Bearer` headers
* **Cadence:** Every 15,000 ms (15 seconds)
* **Purpose:** Historical chart persistence, offline backfilling, and audit table logging.

---

## 6. How to Flash the Firmware

### Step 1: Flashing Arduino Mega 2560
1. Open **Arduino IDE**.
2. Go to **Tools -> Board -> Arduino AVR Boards -> Arduino Mega or Mega 2560**.
3. Select the COM port corresponding to your Arduino Mega.
4. Open [firmware/arduino_mega_airguard/arduino_mega_airguard.ino](arduino_mega_airguard/arduino_mega_airguard.ino).
5. Click **Upload**. Open the Serial Monitor at **9600 baud** to verify that telemetry frames are being printed.

### Step 2: Flashing ESP32-S3
1. In Arduino IDE, go to **Tools -> Board -> ESP32 Arduino -> ESP32S3 Dev Module**.
2. Select your Wi-Fi credentials in `esp32_uart_airguard.ino`:
   ```cpp
   const char* WIFI_SSID     = "YOUR_WIFI_NAME";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   ```
3. Set **Upload Speed:** `921600`, **USB Mode:** `Hardware CDC and JTAG`.
4. Select the COM port corresponding to the ESP32-S3 and click **Upload**.
5. Open the Serial Monitor at **115200 baud**. Once Wi-Fi connects, it will log UART frame receptions, MQTT publishes, and Supabase commits.
