# Hardware Wiring, Pinout Diagram & Arduino IDE Setup Guide — AirGuard IoT

This document provides a comprehensive, component-by-component hardware connection guide, complete ESP32-S3 DevKit pinout diagrams, schematic circuit diagrams, and step-by-step Arduino IDE 2.x setup instructions for assembling and programming the **AirGuard IoT** station.

---

## 1. Master Pin Connection Table

| Peripheral / Sensor | Sensor Pin | ESP32-S3 Pin | Function / Mode | Operating Voltage & Protection |
| :--- | :--- | :--- | :--- | :--- |
| **MQ-135 (Air Quality)** | VCC | **5V (Vin / Ext)** | Power Input | 5V DC heater supply (~20s preheat) |
| | GND | **GND** | Ground | Common Ground |
| | AOUT | **GPIO 1** | Analog (ADC1_CH0) | Stepped down to $\le 3.3\text{V}$ via 1kΩ/2kΩ voltage divider |
| **MQ-9 (CO & Combustible Gas)** | VCC | **5V (Vin / Ext)** | Power Input | 5V DC heater supply (~20s preheat) |
| | GND | **GND** | Ground | Common Ground |
| | AOUT | **GPIO 2** | Analog (ADC1_CH1) | Stepped down to $\le 3.3\text{V}$ via 1kΩ/2kΩ voltage divider |
| **[RESERVED] O₂ Sensor (Phase 2)** | AOUT | **GPIO 5** | Analog (ADC1_CH4) | Reserved for future ME2-O2 electrochemical module |
| **Sharp GP2Y1010AU0F (Dust)** | Pin 1 (V-LED) | **5V (Vin / Ext)** | Sensor Power | Connected through **150Ω resistor** |
| | Pin 2 (LED-GND) | **GND** | Ground | Common Ground |
| | Pin 3 (LED) | **GPIO 6** | Digital Output | Pulse trigger pin (0.32ms pulse sequence) |
| | Pin 4 (S-GND) | **GND** | Ground | Common Ground |
| | Pin 5 (V0) | **GPIO 4** | Analog (ADC1_CH3) | Stepped down to $\le 3.3\text{V}$ via voltage divider |
| | Pin 6 (VCC) | **5V (Vin / Ext)** | Sensor Power | Directly connected to 5V rail |
| **DHT11 / DHT22 (Temp & Hum)** | Pin 1 (VCC) | **3.3V** | Power Input | Connected to ESP32-S3 3.3V rail |
| | Pin 2 (DATA) | **GPIO 7** | Digital GPIO | Digital One-Wire bus with **10kΩ pull-up** to 3.3V |
| | Pin 4 (GND) | **GND** | Ground | Common Ground (Pin 3 is NC/unused) |
| **Active Buzzer** | POS (+) | **GPIO 8** | Digital Output | Acoustic emergency siren trigger |
| | NEG (-) | **GND** | Ground | Common Ground |
| **Status LED: Green (Normal)** | Anode (+) | **GPIO 9** | Digital Output | Through **220Ω current limiting resistor** |
| | Cathode (-) | **GND** | Ground | Common Ground |
| **Status LED: Yellow (Warning)** | Anode (+) | **GPIO 10** | Digital Output | Through **220Ω current limiting resistor** |
| | Cathode (-) | **GND** | Ground | Common Ground |
| **Status LED: Red (Critical)** | Anode (+) | **GPIO 11** | Digital Output | Through **220Ω current limiting resistor** |
| | Cathode (-) | **GND** | Ground | Common Ground |

---

## 2. ESP32-S3 DevKit Physical Pinout Diagram

Below is the standard dual-row pin allocation map for the **ESP32-S3-DevKitC-1** (44-pin board):

```
                       +-------------------------+
                       |       [ USB-C CDC ]     |
                       |       ESP32-S3 DevKit   |
                       +-------------------------+
          3.3V Power --| 3V3                 GND |-- Common Ground
      (DHT11/22 VCC)   | 3V3                 TX  |-- USB UART TX (GPIO 43)
                       | RST                 RX  |-- USB UART RX (GPIO 44)
    MQ-135 Analog In --| GPIO 1 (ADC1_0) GPIO 42 |--
      MQ-9 Analog In --| GPIO 2 (ADC1_1) GPIO 41 |--
                       | GPIO 3          GPIO 40 |--
 Dust Sensor Analog  --| GPIO 4 (ADC1_3) GPIO 39 |--
  Reserved Phase 2 O₂--| GPIO 5 (ADC1_4) GPIO 38 |--
 Dust Pulse Trigger  --| GPIO 6          GPIO 37 |--
     DHT11/22 Data   --| GPIO 7          GPIO 36 |--
       Active Buzzer --| GPIO 8          GPIO 35 |--
      Green Safe LED --| GPIO 9          GPIO 0  |-- Boot Button (Do Not Pull Low)
   Yellow Warn LED   --| GPIO 10         GPIO 45 |--
      Red Danger LED --| GPIO 11         GPIO 46 |--
                       | GPIO 12         GPIO 47 |--
                       | GPIO 13         GPIO 48 |--
                       | GPIO 14         GPIO 21 |--
                       +-------------------------+
                       | 5V (Vin)            GND |-- Common Ground
                       +-------------------------+
                              |               |
                              +--- 5V Rail    +--- Common Ground Rail
```

---

## 3. Detailed Component Wiring & Circuit Diagrams

### 3.1 Gas Sensor Voltage Dividers (MQ-135 & MQ-9)
Gas sensors operate on 5V VCC to power their internal heating coils. Consequently, their analog output (`AOUT`) can reach up to 4.5V–5V when saturated with gas. To protect the ESP32-S3 3.3V ADC inputs, wire a 2:1 resistive divider between each sensor's `AOUT` and the ESP32-S3 ADC pin:

```
Sensor AOUT (0–5V) --------+
                           |
                        [ 1kΩ Resistor ]
                           |
                           +----------------> To ESP32-S3 ADC Pin
                           |                  (GPIO 1 for MQ-135, GPIO 2 for MQ-9)
                        [ 2kΩ Resistor ]
                           |
                          GND
```

* **Calculation:** $V_{\text{ADC}} = V_{\text{AOUT}} \times \frac{2\text{k}\Omega}{1\text{k}\Omega + 2\text{k}\Omega} = V_{\text{AOUT}} \times 0.667$.
* When $V_{\text{AOUT}} = 5.0\text{V}$, $V_{\text{ADC}} = 3.33\text{V}$ (fully safe for ESP32-S3 ADC with `ADC_11db` attenuation).

---

### 3.2 Sharp GP2Y1010AU0F Optical Dust Sensor Wiring
The optical dust sensor includes a 6-pin connector harness. It requires a **150Ω resistor** and a **220µF electrolytic capacitor** to stabilize the optical pulse power rail:

```
Connector Pin #   Wire Color (Typical)     Connection Destination
-------------------------------------------------------------------------
Pin 1 (V-LED)     White / Gray            To 5V Rail via 150Ω Resistor
Pin 2 (LED-GND)   Blue                    Directly to Common Ground (GND)
Pin 3 (LED)       Green                   To ESP32-S3 GPIO 6 (Pulse Output)
Pin 4 (S-GND)     Yellow                  Directly to Common Ground (GND)
Pin 5 (V0)        Black                   To ESP32-S3 GPIO 4 (via voltage divider)
Pin 6 (VCC)       Red                     Directly to 5V Rail
```

**Pulse Filter Circuit:**
```
5V Rail --------[ 150Ω Resistor ]---------+-------> Pin 1 (V-LED)
                                          |
                                    +  [ 220µF ]  -
                                    Electrolytic Cap
                                          |
GND --------------------------------------+-------> Pin 2 (LED-GND)
```

---

### 3.3 DHT11 / DHT22 Climate Sensor Wiring
* **Pin 1 (VCC):** Connect to **3.3V** rail of ESP32-S3.
* **Pin 2 (DATA):** Connect to **GPIO 7**. Insert a **10kΩ pull-up resistor** between Pin 2 (DATA) and 3.3V.
* **Pin 3 (NC):** Leave unconnected.
* **Pin 4 (GND):** Connect to **GND** rail.

---

### 3.4 Active Buzzer & Tri-Color LED Wiring
* **Active Buzzer:**
  * Positive lead (`+` / longer leg) $\rightarrow$ **GPIO 8**
  * Negative lead (`-` / shorter leg) $\rightarrow$ **GND**
* **Status LEDs (Current Limiting):**
  * **Green LED:** Anode $\rightarrow$ **220Ω resistor** $\rightarrow$ **GPIO 9**; Cathode $\rightarrow$ **GND**
  * **Yellow LED:** Anode $\rightarrow$ **220Ω resistor** $\rightarrow$ **GPIO 10**; Cathode $\rightarrow$ **GND**
  * **Red LED:** Anode $\rightarrow$ **220Ω resistor** $\rightarrow$ **GPIO 11**; Cathode $\rightarrow$ **GND**

---

## 4. Critical ESP32-S3 Engineering Rules

> [!IMPORTANT]
> **Strict Rule 1: ADC1 Exclusive Usage**
> The ESP32-S3 has two ADC blocks: ADC1 (GPIO 1–10) and ADC2 (GPIO 11–20).
> Whenever the Wi-Fi radio is operational, the Wi-Fi firmware driver claims control of ADC2. Calling `analogRead()` on ADC2 pins while connected to Wi-Fi produces invalid data or lockups.
> **All analog lines in this project are strictly connected to ADC1 (GPIO 1, 2, 4, 5).**

> [!WARNING]
> **Strict Rule 2: 3.3V Maximum Logic Level**
> Never connect 5V directly to any ESP32-S3 GPIO or ADC pin. Always use the specified 1kΩ / 2kΩ voltage dividers on the analog lines of MQ-135, MQ-9, and GP2Y1010AU0F.

---

## 5. Arduino IDE 2.x Step-by-Step Configuration & Flashing

Follow these steps to set up Arduino IDE, install required libraries, and flash the AirGuard firmware:

### Step 1: Install the ESP32 Board Package
1. Open **Arduino IDE 2.x**.
2. Navigate to **File $\rightarrow$ Preferences**.
3. In **Additional boards manager URLs**, add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click **OK**.
5. Go to **Tools $\rightarrow$ Board $\rightarrow$ Boards Manager...** (or click the board icon in the left toolbar).
6. Search for `esp32` by **Espressif Systems** and click **Install** (version 2.0.14 or later / 3.x).

---

### Step 2: Install Required Libraries
Open **Tools $\rightarrow$ Manage Libraries...** (or press `Ctrl+Shift+I`) and install:
1. **PubSubClient** by *Nick O'Leary* (v2.8.0 or later) — For MQTT communication.
2. **DHT sensor library** by *Adafruit* (v1.4.4 or later) — For DHT11/DHT22 temperature & humidity.
3. **Adafruit Unified Sensor** by *Adafruit* — Required dependency for DHT sensor library.

---

### Step 3: Configure Board Settings in Arduino IDE
Under the **Tools** menu, configure the following options:
* **Board:** `ESP32S3 Dev Module` (or your specific module variant, e.g., `NodeMCU-32S3`)
* **USB CDC On Boot:** `Enabled` *(Crucial: allows `Serial.print()` to work over native USB-C)*
* **Flash Size:** `8MB (64Mb)` *(or 4MB/16MB depending on your module)*
* **Partition Scheme:** `Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)`
* **PSRAM:** `OPI PSRAM` *(or `Disabled` if using a basic module without PSRAM)*
* **Upload Speed:** `921600`
* **Port:** Select the active COM port (e.g., `COM3`, `COM5`)

---

### Step 4: Open and Customize Firmware
1. Open `firmware/esp32_airguard/esp32_airguard.ino` in Arduino IDE.
2. Update lines 56–57 with your 2.4 GHz Wi-Fi hotspot details:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_Name";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   ```
3. Verify the MQTT topic and broker configuration (default: `broker.hivemq.com` on port `1883`).

---

### Step 5: Compile and Upload
1. Click the **Verify** (checkmark) button to compile the code.
2. Connect your ESP32-S3 board to your PC via USB-C cable.
3. Click the **Upload** (right arrow) button.
   *(Note: If the upload fails to establish handshake, hold down the `BOOT` button on the ESP32-S3 board, click Upload, and release `BOOT` once "Connecting..." appears in the console).*
4. Open the **Serial Monitor** (**Tools $\rightarrow$ Serial Monitor** or `Ctrl+Shift+M`).
5. Set the baud rate to **`115200 baud`**.
6. Observe the visual boot check, Wi-Fi connection output, and live JSON telemetry stream!
