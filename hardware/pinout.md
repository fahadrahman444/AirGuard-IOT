# Hardware Wiring & Pinout Guide — AirGuard IoT (ESP32-S3)

This document provides the hardware pin mapping, wiring schematic, and electrical protection details for the **AirGuard IoT** edge station using an **ESP32-S3** microcontroller board.

---

## 1. Pin Mapping Summary Table

| Peripheral / Sensor | Sensor Pin | ESP32-S3 Pin | Function / Type | Notes & Operating Voltage |
| :--- | :--- | :--- | :--- | :--- |
| **MQ-135 (Air Quality)** | VCC | 5V (Vin / Ext) | Power | Preheating required (~20s) |
| | GND | GND | Power | Common Ground |
| | AOUT | **GPIO 1** | Analog (ADC1_CH0) | Scaled to $\le 3.3\text{V}$ via 1kΩ/2kΩ divider |
| **MQ-9 (Carbon Monoxide & Combustible Gas)** | VCC | 5V (Vin / Ext) | Power | Preheating required (~20s) |
| | GND | GND | Power | Common Ground |
| | AOUT | **GPIO 2** | Analog (ADC1_CH1) | Scaled to $\le 3.3\text{V}$ via 1kΩ/2kΩ divider |
| **[RESERVED] O₂ Sensor** | AOUT | **GPIO 5** | Analog (ADC1_CH4) | *Reserved for Phase 2 ME2-O2 Upgrade* |
| **Dust Sensor (GP2Y1010AU0F)** | VCC | 5V (Vin / Ext) | Power | Powered through 150Ω resistor & 220µF capacitor |
| | GND | GND | Power | Common Ground |
| | LED Pin | **GPIO 6** | Digital Output | Pulse trigger pin (0.32ms pulse sequence) |
| | V0 (Analog Out) | **GPIO 4** | Analog (ADC1_CH3) | Scaled to $\le 3.3\text{V}$ via voltage divider |
| **DHT11 / DHT22 (Temp/Hum)** | VCC | 3.3V | Power | Native 3.3V rail |
| | GND | GND | Power | Common Ground |
| | DATA | **GPIO 7** | Digital GPIO | Digital One-Wire bus with 10kΩ pull-up |
| **Active Buzzer** | POS (+) | **GPIO 8** | Digital Output | Local acoustic alarm trigger |
| | NEG (-) | GND | Power | Common Ground |
| **Status LEDs** | Green LED | **GPIO 9** | Digital Output | Normal / Safe status (via 220Ω resistor) |
| | Yellow LED | **GPIO 10** | Digital Output | Moderate warning status (via 220Ω resistor) |
| | Red LED | **GPIO 11** | Digital Output | Critical emergency status (via 220Ω resistor) |

---

## 2. Critical Engineering Design Rules

### A. ADC1 Exclusivity for Wi-Fi Coexistence
> [!IMPORTANT]
> The ESP32-S3 features two analog-to-digital converter blocks: **ADC1** and **ADC2**.
> When the 2.4 GHz Wi-Fi radio is active, the Wi-Fi driver internally claims **ADC2**, causing any `analogRead()` calls on ADC2 to return invalid or colliding readings.
> **All analog sensors in this project are strictly mapped to ADC1 channels (GPIO 1, 2, 4, 5)** to guarantee continuous, reliable sampling while streaming data over MQTT.

### B. 5V Analog to 3.3V ADC Protection (Voltage Dividers)
> [!WARNING]
> ESP32-S3 GPIO and ADC pins are rated for a maximum of **3.3V**.
> Gas sensors (MQ-135, MQ-9) and the Sharp Dust sensor require a 5V supply rail for internal heating elements and optical emitters, meaning their analog outputs can reach up to 4.5V–5V under elevated gas concentrations.
> 
> To protect the ESP32-S3 ADC inputs, scale down the analog output voltage using a simple 2:1 resistor divider ($R_1 = 1\text{k}\Omega$, $R_2 = 2\text{k}\Omega$):

```
Sensor Analog Out (0–5V) ---> [ 1kΩ Resistor ] ---> ESP32-S3 ADC Pin (0–3.3V)
                                             |
                                       [ 2kΩ Resistor ]
                                             |
                                            GND
```

$$V_{\text{out}} = V_{\text{in}} \times \left(\frac{2000}{1000 + 2000}\right) = V_{\text{in}} \times 0.667$$

* At $V_{\text{in}} = 5.0\text{V} \implies V_{\text{out}} = 3.33\text{V}$ (safe for ESP32-S3 ADC configured with `ADC_11db` attenuation).

---

## 3. Power Distribution Architecture

* **Primary Power:** 5V / 2A external DC power adapter or USB-C connector.
* **5V Rail (Vin):** Powers the heater circuits of MQ-135 and MQ-9, plus the Sharp GP2Y1010AU0F optical dust sensor.
* **3.3V Rail (ESP32-S3 LDO Output):** Powers the ESP32-S3 MCU core, DHT11/DHT22 climate sensor, status LEDs, and buzzer.
* **Common Ground:** All sensor grounds and ESP32-S3 GND pins must be tied together to ensure a uniform reference potential.
