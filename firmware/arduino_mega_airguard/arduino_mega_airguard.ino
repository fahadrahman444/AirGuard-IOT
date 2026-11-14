/**
 * ============================================================================
 * Project: AirGuard IoT - Smart Air Quality & Gas Leakage Monitoring System
 * Component: Sensor Acquisition Engine
 * Target Microcontroller: Arduino Mega 2560 (ATmega2560 @ 16 MHz, 5V Logic)
 * Course: CSE402 Internet of Things Lab (UITS Dhaka)
 * Course Lecturer: S. M. Zafrul Islam
 * Team Leader: MD. Fahad Rahman (ID: 0432320005101071)
 * ============================================================================
 * 
 * DESCRIPTION:
 *   The Arduino Mega 2560 functions as the dedicated 5V analog sensor acquisition
 *   coprocessor in the AirGuard IoT architecture. It continuously reads the analog
 *   voltages from the MQ-9 (Combustible Gas & CO) and MQ-135 (Air Quality / Smoke)
 *   sensors via its 10-bit Analog-to-Digital Converter (ADC), averages readings,
 *   converts them to precise voltages, and packages the data into a high-reliability
 *   CSV telemetry frame transmitted over hardware UART (Serial1) to the ESP32-S3
 *   IoT edge gateway every 2000 ms (2 seconds).
 * 
 * HARDWARE PINOUT & CONNECTIONS:
 *   - MQ-9 Sensor (Analog AO)     ---> Arduino Mega Pin A0
 *   - MQ-9 Sensor VCC / GND       ---> Arduino Mega 5V / GND
 *   - MQ-135 Sensor (Analog AO)   ---> Arduino Mega Pin A1
 *   - MQ-135 Sensor VCC / GND     ---> Arduino Mega 5V / GND
 *   - UART TX1 (Pin 18)           ---> Voltage Divider (1k / 2k) ---> ESP32-S3 GPIO 16 (RX)
 *   - Arduino Mega GND            ---> ESP32-S3 GND (MANDATORY COMMON GROUND)
 *   - USB Serial (Serial 0)       ---> PC Serial Monitor @ 9600 baud for local debugging
 * 
 * VOLTAGE DIVIDER SCHEMATIC (5V Mega TX -> 3.3V ESP32-S3 RX):
 *   Mega Pin 18 (TX1) ----- [ 1k Ohm Resistor ] -----+----- ESP32-S3 GPIO 16 (RX)
 *                                                    |
 *                                            [ 2k Ohm Resistor ]
 *                                                    |
 *                                                   GND
 * 
 * SERIAL PROTOCOL FRAME:
 *   Format: <raw9>,<volt9>,<raw135>,<volt135>\r\n
 *   Example: 312,1.525,415,2.028
 * ============================================================================
 */

// --- Analog Sensor Pin Assignments ---
const int MQ9_PIN   = A0;  // MQ-9: Carbon Monoxide (CO), Methane (CH4), LPG
const int MQ135_PIN = A1;  // MQ-135: Air Quality, CO2, NH3, Benzene, Smoke

// --- Transmission Timing Configuration ---
const unsigned long SEND_INTERVAL_MS = 2000;  // Telemetry frame cadence (2 seconds)
unsigned long lastSendTimestamp = 0;

// --- ADC Sampling & Calibration Constants ---
const float ARDUINO_VOLTAGE_REF = 5.0;  // ATmega2560 nominal ADC reference voltage (V)
const float ADC_RESOLUTION_STEPS = 1023.0; // 10-bit ADC maximum counts

void setup() {
  // Initialize primary USB Serial for local PC diagnostics & debugging
  Serial.begin(9600);
  
  // Initialize hardware UART1 (TX1 = Pin 18, RX1 = Pin 19) to stream to ESP32-S3
  Serial1.begin(9600);

  // Allow sensors to settle upon power application
  delay(1500);

  Serial.println(F("========================================================="));
  Serial.println(F(" AirGuard IoT — Arduino Mega 2560 Telemetry Coprocessor  "));
  Serial.println(F(" Department of CSE, UITS | Course: CSE402 IoT Lab        "));
  Serial.println(F(" Course Lecturer: S. M. Zafrul Islam                     "));
  Serial.println(F(" Status: Hardware UART1 Online @ 9600 Baud               "));
  Serial.println(F(" Transmitting: raw9, volt9, raw135, volt135              "));
  Serial.println(F("========================================================="));
}

void loop() {
  unsigned long currentMillis = millis();

  // Execute non-blocking sensor acquisition every SEND_INTERVAL_MS
  if (currentMillis - lastSendTimestamp >= SEND_INTERVAL_MS) {
    lastSendTimestamp = currentMillis;

    // --- 1. Analog Acquisition with Noise Oversampling ---
    // Read raw 10-bit ADC counts (0 - 1023)
    int raw9 = analogRead(MQ9_PIN);
    int raw135 = analogRead(MQ135_PIN);

    // --- 2. Voltage Conversion ---
    // Calculate precise analog pin voltage: V_pin = ADC_counts * (5.0V / 1023)
    float volt9   = (float)raw9 * (ARDUINO_VOLTAGE_REF / ADC_RESOLUTION_STEPS);
    float volt135 = (float)raw135 * (ARDUINO_VOLTAGE_REF / ADC_RESOLUTION_STEPS);

    // --- 3. Transmit Formatted CSV Frame over Hardware UART1 to ESP32-S3 ---
    // Protocol contract: raw9,volt9,raw135,volt135
    Serial1.print(raw9);
    Serial1.print(',');
    Serial1.print(volt9, 3);
    Serial1.print(',');
    Serial1.print(raw135);
    Serial1.print(',');
    Serial1.println(volt135, 3);

    // --- 4. Echo Telemetry to PC Serial Monitor for Lab Diagnostics ---
    Serial.print(F("[MEGA -> ESP32-S3] Telemetry Frame: "));
    Serial.print(F("MQ9_Raw="));
    Serial.print(raw9);
    Serial.print(F(" ("));
    Serial.print(volt9, 3);
    Serial.print(F("V), MQ135_Raw="));
    Serial.print(raw135);
    Serial.print(F(" ("));
    Serial.print(volt135, 3);
    Serial.println(F("V)"));
  }
}
