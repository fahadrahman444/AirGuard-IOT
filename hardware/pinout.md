# Hardware Wiring & Pinout Guide — AirGuard IoT

This document provides the hardware pin mapping and wiring schematic for the **AirGuard IoT** edge station using an **Arduino Uno R3** and an **ESP8266 Wi-Fi** module.

---

## 1. Pin Mapping Summary Table

| Peripheral / Sensor | Sensor Pin | Arduino Uno Pin | ESP8266 Pin | Notes / Logic Level |
| :--- | :--- | :--- | :--- | :--- |
| **MQ-135 (Air Quality)** | VCC | 5V | — | Preheating required (~20s) |
| | GND | GND | — | Common Ground |
| | AOUT | **A0** | — | Analog Voltage Output |
| **MQ-2 (Combustible Gas)** | VCC | 5V | — | Preheating required (~20s) |
| | GND | GND | — | Common Ground |
| | AOUT | **A1** | — | Analog Voltage Output |
| **O₂ Sensor (Grove / ME2-O2)** | VCC | 5V | — | Electrochemical module |
| | GND | GND | — | Common Ground |
| | AOUT | **A2** | — | Linear voltage (0–25% O₂) |
| **Dust Sensor (Sharp GP2Y1010AU0F)** | VCC | 5V | — | Through 150Ω resistor & 220µF cap |
| | GND | GND | — | Common Ground |
| | LED Pin | **D7** | — | Pulse trigger pin (0.32ms pulse) |
| | V0 (Analog Out) | **A3** | — | Analog dust concentration reading |
| **DHT11 / DHT22 (Temp & Humidity)** | VCC | 5V / 3.3V | — | 10kΩ pull-up resistor on Data |
| | GND | GND | — | Common Ground |
| | DATA | **D4** | — | Digital One-Wire bus |
| **16×2 LCD (I2C Adapter)** | VCC | 5V | — | PCF8574 I2C adapter module |
| | GND | GND | — | Common Ground |
| | SDA | **A4** | — | Hardware I2C SDA |
| | SCL | **A5** | — | Hardware I2C SCL |
| **Buzzer (Active 5V)** | POS (+) | **D8** | — | Acoustic emergency alert |
| | NEG (-) | GND | — | Common Ground |
| **Status LEDs** | Green LED | **D9** | — | Safe condition (through 220Ω resistor) |
| | Yellow LED | **D10** | — | Moderate warning (through 220Ω resistor)|
| | Red LED | **D11** | — | Critical alert (through 220Ω resistor) |
| **ESP8266 Wi-Fi Module** | 3V3 / VCC | 3.3V (external/regulator)| VCC / EN | Needs minimum 250mA @ 3.3V |
| | GND | GND | GND | Common Ground with Arduino |
| | RX | — | **RX** | Connect to Arduino D3 (via voltage divider) |
| | TX | **D2** | **TX** | Direct connection to Arduino D2 |

---

## 2. Arduino Uno to ESP8266 Serial Gateway Protection

> [!WARNING]
> The ESP8266 GPIO pins are strictly 3.3V tolerant. Arduino digital outputs produce 5V logic.
> **Never** connect the Arduino Uno TX directly to ESP8266 RX without voltage division or a logic level shifter.

```
Arduino D3 (Soft TX)  ---> [ 1kΩ Resistor ] ---> ESP8266 RX
                                         |
                                   [ 2kΩ Resistor ]
                                         |
                                        GND
```
* Arduino D2 (Soft RX) connects directly to ESP8266 TX (3.3V logic is safely read as HIGH by 5V ATmega328P).

---

## 3. Power Distribution Architecture

* **Primary Input:** 5V / 2A External DC power supply via barrel jack or regulated USB.
* **5V Rail:** Powers Arduino Uno, MQ-135, MQ-2, O2 sensor, Dust sensor, LCD, and Buzzer.
* **3.3V Rail:** Powers the ESP8266 Wi-Fi module. Ensure an external AMS1117-3.3 regulator or dedicated high-current 3.3V rail is used (Arduino Uno built-in 3.3V regulator supplies maximum 50–150mA, which may cause ESP8266 brownouts during Wi-Fi transmission).
