const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const LOGO_PATH = path.join(__dirname, 'docs/assets/uits_logo.png');

function generateUITSStudentProposal(outputPath) {
  return new Promise((resolve, reject) => {
    // A4: 595.28 x 841.89 pt
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 32, bottom: 35, left: 50, right: 50 },
      autoFirstPage: false,
      bufferPages: true
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    // Official UITS Academic Palette
    const PRIMARY = '#0b2545';    // UITS Deep Academic Navy
    const SECONDARY = '#1d4ed8';  // University Blue
    const DARK_TEXT = '#1e293b';  // Slate 800 body
    const MUTED = '#64748b';      // Slate 500 metadata
    const LINE_COLOR = '#cbd5e1'; // Slate 300 hairline borders
    const BG_BOX = '#f8fafc';     // Light slate panel fill

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const leftMargin = 50;
    const rightMargin = 50;
    const contentWidth = pageWidth - leftMargin - rightMargin; // 495.28 pt
    const bottomLimit = pageHeight - 40; // 801 pt

    function checkSpace(needed) {
      if (doc.y + needed > bottomLimit) {
        doc.addPage();
      }
    }

    function renderSectionHeader(title) {
      checkSpace(35);
      doc.moveDown(0.42);
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor(PRIMARY)
         .text(title, leftMargin, doc.y, { width: contentWidth, align: 'left' });
      doc.moveDown(0.24);
    }

    function renderParagraph(text) {
      checkSpace(24);
      doc.font('Helvetica')
         .fontSize(9.5)
         .fillColor(DARK_TEXT)
         .text(text, leftMargin, doc.y, {
           width: contentWidth,
           align: 'left',
           lineGap: 2.2
         });
      doc.moveDown(0.25);
    }

    function renderBullet(prefix, text, indent = 15) {
      checkSpace(18);
      const bulletX = leftMargin + indent - 10;
      const textX = leftMargin + indent;
      const textWidth = contentWidth - indent;
      const startY = doc.y;

      doc.font('Helvetica-Bold')
         .fontSize(9.5)
         .fillColor(DARK_TEXT)
         .text('•', bulletX, startY);

      if (prefix && text) {
        doc.font('Helvetica-Bold')
           .fontSize(9.5)
           .fillColor(DARK_TEXT)
           .text(prefix + ' ', textX, startY, {
             width: textWidth,
             continued: true,
             lineGap: 2.1
           });
        doc.font('Helvetica')
           .fontSize(9.5)
           .fillColor(DARK_TEXT)
           .text(text, {
             width: textWidth,
             align: 'left',
             lineGap: 2.1
           });
      } else if (prefix && !text) {
        doc.font('Helvetica-Bold')
           .fontSize(9.5)
           .fillColor(DARK_TEXT)
           .text(prefix, textX, startY, {
             width: textWidth,
             align: 'left',
             lineGap: 2.1
           });
      } else {
        doc.font('Helvetica')
           .fontSize(9.5)
           .fillColor(DARK_TEXT)
           .text(text, textX, startY, {
             width: textWidth,
             align: 'left',
             lineGap: 2.1
           });
      }
      doc.moveDown(0.23);
    }

    // ==========================================
    // PAGE 1: HEADER, TEAM INFO & FOUNDATIONS (SECTIONS 1-4)
    // ==========================================
    doc.addPage();

    // 1. Header: UITS Logo & University Identity
    const logoWidth = 140;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = 20;

    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, logoX, logoY, { width: logoWidth });
    }

    doc.font('Helvetica-Bold')
       .fontSize(12.5)
       .fillColor(PRIMARY)
       .text('UNIVERSITY OF INFORMATION TECHNOLOGY AND SCIENCES (UITS)', leftMargin, 72, { width: contentWidth, align: 'center' });

    doc.font('Helvetica-Bold')
       .fontSize(9.5)
       .fillColor(MUTED)
       .text('Department of Computer Science & Engineering (CSE)', leftMargin, 87, { width: contentWidth, align: 'center' });

    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor(SECONDARY)
       .text('Course Code: CSE402   •   Course Title: Internet of Things Lab', leftMargin, 101, { width: contentWidth, align: 'center' });

    doc.font('Helvetica-Bold')
       .fontSize(15.5)
       .fillColor(PRIMARY)
       .text('PROJECT PROPOSAL', leftMargin, 116, { width: contentWidth, align: 'center' });

    // Hairline divider
    doc.strokeColor(LINE_COLOR)
       .lineWidth(0.8)
       .moveTo(leftMargin, 137)
       .lineTo(pageWidth - rightMargin, 137)
       .stroke();

    // 2. Academic Submission Cards (Panel Box with Team Members)
    const cardY = 142;
    const cardHeight = 94;
    const colWidth = (contentWidth - 16) / 2;
    const leftColX = leftMargin + 10;
    const rightColX = leftMargin + colWidth + 12;

    doc.roundedRect(leftMargin, cardY, contentWidth, cardHeight, 4)
       .fillAndStroke(BG_BOX, LINE_COLOR);

    // Left Column: Submitted to
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(SECONDARY).text('SUBMITTED TO:', leftColX, cardY + 7);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(PRIMARY).text('Abrar Mahbub Tanim', leftColX, cardY + 21);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('Lecturer, Department of CSE', leftColX, cardY + 35);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('University of Information Technology & Sciences (UITS)', leftColX, cardY + 48);
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text('Permanent Campus: Baridhara Nayanagar, Dhaka-1212', leftColX, cardY + 62);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Submission Date: October 26, 2026', leftColX, cardY + 76);

    // Right Column: Submitted by (Team Members)
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(SECONDARY).text('SUBMITTED BY (PROJECT TEAM):', rightColX, cardY + 7);

    // Member 1
    doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY).text('1. MD. Fahad Rahman', rightColX, cardY + 21, { continued: true });
    doc.font('Helvetica').fontSize(8.5).fillColor(DARK_TEXT).text('  (ID: 0432320005101071)');

    // Member 2
    doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY).text('2. Zannatul Nayem', rightColX, cardY + 35, { continued: true });
    doc.font('Helvetica').fontSize(8.5).fillColor(DARK_TEXT).text('  (ID: 0432320005101063)');

    // Member 3
    doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY).text('3. Shafayet Hossain Shafin', rightColX, cardY + 49, { continued: true });
    doc.font('Helvetica').fontSize(8.5).fillColor(DARK_TEXT).text('  (ID: 0432320005101088)');

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK_TEXT)
       .text('Batch: 54th Batch  |  Section: 6B1  |  Autumn 2026', rightColX, cardY + 65);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
       .text('Program: B.Sc. in Computer Science & Engineering', rightColX, cardY + 77);

    doc.y = cardY + cardHeight + 10;

    // --- 1. Project Title ---
    renderSectionHeader('1. Project Title');
    doc.font('Helvetica-Bold')
       .fontSize(9.5)
       .fillColor(PRIMARY)
       .text('AirGuard IoT: An IoT-Based Smart Air Quality, Gas Leakage, and Environmental Monitoring System Using Arduino Mega 2560, ESP8266, and Real-Time Web Application', leftMargin, doc.y, {
         width: contentWidth,
         align: 'left',
         lineGap: 2.0
       });
    doc.moveDown(0.24);

    // --- 2. Domain & Application Scope ---
    renderSectionHeader('2. Domain & Application Scope');
    renderBullet('Primary Domain:', 'Environmental Sensing & Public Health (Aligned with Domain-Specific IoT Architectures).');
    renderBullet('Secondary Domain:', 'Smart Campus & Industrial Safety (Targeted for UITS CSE Hardware/IoT Labs, Server Rooms & Academic Buildings).');

    // --- 3. Problem Statement ---
    renderSectionHeader('3. Problem Statement');
    renderParagraph('Dhaka consistently ranks among the worlds most air-polluted metropolises, experiencing severe seasonal particulate spikes (PM2.5/PM10), combustible gas risks, and poor indoor air ventilation. Within enclosed institutional environments—such as UITS computer science laboratories, server clusters, and educational buildings—undetected hazardous gas leaks (LPG, carbon monoxide, methane) and oxygen depletion present acute respiratory risks and fire hazards. Conventional protection mechanisms suffer from severe architectural limitations:');
    renderBullet('Lack of Multi-Parameter Integration:', 'Traditional detectors operate as isolated units, unable to simultaneously sample particulate dust density, toxic/combustible gases, oxygen concentration, temperature, and humidity.');
    renderBullet('No Remote Telemetry or Cloud Logging:', 'Standard alarms are standalone buzzers lacking wireless connectivity or historical trend logs for predictive laboratory maintenance.');
    renderBullet('Delayed Emergency Response:', 'Off-premises university faculty, lab officers, and safety administrators receive no low-latency push notifications when dangerous conditions develop after hours.');

    // --- 4. Proposed Solution & Architecture ---
    renderSectionHeader('4. Proposed Solution & System Architecture');
    renderParagraph('AirGuard IoT delivers a robust edge-to-cloud environmental safety platform engineered specifically for educational laboratories and institutional facilities, utilizing a high-performance Arduino Mega 2560 (ATmega2560) paired with an ESP8266 Wi-Fi gateway.');
    renderParagraph('The system captures multi-point physical telemetry from a synchronized multi-sensor array: MQ-135 (air pollution/smoke/toxic vapor), MQ-2 (combustible LPG/methane leakage), an electrochemical oxygen sensor (measuring atmospheric O2 percentage), a Sharp GP2Y1010AU0F optical dust sensor (quantifying suspended particulates in µg/m³), and a DHT11/DHT22 digital sensor (logging ambient temperature and relative humidity).');
    renderParagraph('The Arduino Mega 2560 executes deterministic analog/digital signal conditioning leveraging its 16 analog input channels and dedicated Hardware Serial UART. Structured JSON telemetry is streamed over Hardware Serial1 directly to the ESP8266, eliminating software serial emulation overhead. The ESP8266 transmits this telemetry over 2.4 GHz campus Wi-Fi using lightweight MQTT/HTTP protocols to a dedicated, custom-developed Real-Time Web Application. The web platform delivers interactive gauges, historical charting, and live remote alerts, while local audio-visual buzzers and LEDs provide immediate on-site safety warning.');

    // ==========================================
    // PAGE 2: OBJECTIVES, HARDWARE, SOFTWARE (SECTIONS 5-7)
    // ==========================================
    doc.addPage();
    doc.y = 42;

    // --- 5. Objectives ---
    renderSectionHeader('5. Project Objectives');
    renderBullet('Comprehensive Environmental Sensing:', 'Continuously quantify Air Quality Index (AQI), gas concentration (PPM), atmospheric O2 levels (% O2), suspended dust density (µg/m³), ambient temperature, and relative humidity.');
    renderBullet('Early Gas Hazard Detection:', 'Rapidly detect combustible gas leaks (LPG, methane) and toxic smoke to prevent domestic fire outbreaks, equipment destruction, and asphyxiation accidents.');
    renderBullet('High-Throughput Hardware UART Gateway:', 'Establish reliable, jitter-free wireless data transfer between the Arduino Mega 2560 hardware Serial1 port and cloud brokers via the ESP8266 transceiver.');
    renderBullet('Custom Web Application Visualization:', 'Develop a responsive, full-featured web dashboard displaying real-time analytical metrics, interactive graphs, and historical logs, replacing restrictive on-site character LCDs.');
    renderBullet('Automated Dual-Layer Alarming:', 'Execute immediate local acoustic/visual alert sequences (active buzzer + tri-color LEDs) alongside real-time web socket/cloud alert banners when safety thresholds are breached.');

    // --- 6. Hardware Requirements ---
    renderSectionHeader('6. Hardware Requirements & Component Specifications');
    renderBullet('Microcontroller Board:', 'Arduino Mega 2560 (ATmega2560, 16 MHz, 256 KB Flash, 8 KB SRAM, 4 Hardware UARTs, 16 Analog Inputs) — High-capacity edge data acquisition and processing engine.');
    renderBullet('Wireless Transceiver Module:', 'ESP8266 (ESP-01 / NodeMCU Shield) — Serial-to-Wi-Fi gateway communicating over 2.4 GHz 802.11 b/g/n for cloud telemetry.');
    renderBullet('Environmental & Gas Sensor Suite:', '');
    renderBullet('MQ-135 Gas Sensor:', 'Air quality sensor detecting CO2, NH3, benzene, alcohol, and ambient hazardous smoke.', 26);
    renderBullet('MQ-2 Gas Sensor:', 'Combustible gas sensor detecting LPG, propane, methane, hydrogen, and combustible gas leaks.', 26);
    renderBullet('Electrochemical O2 Sensor Module:', 'Measures ambient atmospheric oxygen levels with calibrated linear output (safe threshold >= 19.5% O2).', 26);
    renderBullet('Optical Dust Sensor (Sharp GP2Y1010AU0F):', 'Infrared optical particulate sensor quantifying fine PM2.5 / PM10 density measurement in µg/m³.', 26);
    renderBullet('Climate Sensor (DHT11 / DHT22):', 'Calibrated digital sensor logging relative humidity and ambient temperature.', 26);
    renderBullet('Local Actuators & On-Site Indicators:', '5V active acoustic buzzer for immediate emergency warning, and tri-color status LEDs (Green = Normal, Yellow = Warning, Red = Critical Danger).');
    renderBullet('Power & Interface Accessories:', 'Regulated 5V/2A DC power supply, 3.3V logic level divider (resistor network protecting ESP8266 RX), solderless breadboard, and jumper wires.');

    // --- 7. Software and Technologies ---
    renderSectionHeader('7. Software, Firmware & Web Stack');
    renderBullet('Embedded Firmware:', 'Arduino IDE (C / Embedded C++) utilizing hardware UART interrupts and non-blocking sensor sampling algorithms.');
    renderBullet('Firmware Libraries:', 'WiFiClient.h, PubSubClient.h (MQTT), and DHT.h (eliminating SoftwareSerial.h and LiquidCrystal_I2C.h for maximum efficiency).');
    renderBullet('Communication Protocols:', 'MQTT (Message Queuing Telemetry Transport) for low-latency publish/subscribe messaging, HTTP REST API POST backup, and Hardware UART Serial communication.');
    renderBullet('Real-Time Web Application Stack:', 'Modern responsive web dashboard built with HTML5/CSS3, JavaScript (React / Chart.js / WebSockets), displaying live gauge dials, real-time pollution time-series, historical telemetry archives, and threshold alert banners.');

    // ==========================================
    // PAGE 3: FEASIBILITY, SCOPE, DELIVERABLES, ROLES & TIMELINE (SECTIONS 8-12)
    // ==========================================
    doc.addPage();
    doc.y = 42;

    // --- 8. Feasibility Analysis ---
    renderSectionHeader('8. Feasibility Analysis');
    renderBullet('Technical Feasibility:', 'The Arduino Mega 2560 provides 4x more SRAM (8 KB), 8x more flash memory (256 KB), and 4 hardware serial ports compared to entry-level boards, effortlessly handling multi-sensor calculations while the web application provides scalable multi-user access without hardware screen limits.');
    renderBullet('Economic Feasibility:', 'The system is built entirely from accessible commercial-off-the-shelf (COTS) components. Eliminating the hardware character LCD simplifies the wiring and reduces hardware failure points while shifting visual presentation to an accessible, zero-marginal-cost web application.');
    renderBullet('Operational Feasibility:', 'The system requires standard 5V power and a 2.4 GHz Wi-Fi hotspot. Laboratory stakeholders and students can inspect live environmental metrics on any smartphone, tablet, or PC browser without needing to physically stand next to the device.');

    // --- 9. Project Scope and Limitations ---
    renderSectionHeader('9. Project Scope & Limitations');
    renderBullet('Project Scope:', 'Designed for real-time monitoring across UITS computer science laboratories, server rooms, university project exhibition halls, and residential living spaces.');
    renderBullet('Processing Headroom:', 'The Arduino Mega 2560 provides ample memory headroom, ensuring zero risk of SRAM stack collision during long-duration multi-sensor sampling.');
    renderBullet('Sensor Stabilization Time:', 'Metal-oxide semiconductor (MQ) sensors require a preheating burn-in stabilization period (~20-30 seconds) upon initial boot.');
    renderBullet('Network Dependency:', 'Cloud logging and web application telemetry require active Wi-Fi internet connectivity. However, local audio-visual alarm functions (buzzer & LEDs) operate completely autonomously even when offline.');

    // --- 10. Expected Outcome & Deliverables ---
    renderSectionHeader('10. Expected Outcome & Deliverables');
    renderBullet('1. Functional Hardware Prototype:', 'A fully assembled hardware station integrating the Arduino Mega 2560, ESP8266, and 5 distinct environmental sensing modules.');
    renderBullet('2. Interactive Real-Time Web Application:', 'A responsive, feature-rich web dashboard displaying live gauges, time-series telemetry plots, historical logs, and safety indicator cards for air quality, gases, oxygen, dust, and climate.');
    renderBullet('3. Sub-2s Emergency Safety Alarming:', 'An automated safety response mechanism sounding local sirens and streaming web alert flags within 2 seconds of threshold violations.');

    // --- 11. Team Work Distribution & Responsibilities ---
    renderSectionHeader('11. Team Work Distribution & Responsibilities');
    renderBullet('MD. Fahad Rahman (0432320005101071):', 'Overall system architecture, multi-sensor calibration & interfacing (MQ-135, MQ-2, O2, GP2Y1010AU0F, DHT), Arduino Mega 2560 firmware engineering, and hardware serial packetization.');
    renderBullet('Zannatul Nayem (0432320005101063):', 'ESP8266 Wi-Fi gateway firmware development, Hardware UART packet parsing, MQTT cloud broker configuration, and REST API telemetry transmission pipeline.');
    renderBullet('Shafayet Hossain Shafin (0432320005101088):', 'Real-Time Web Application frontend/backend development (dashboard UI, live metric cards, Chart.js time-series graphs), local audio-visual alarm circuit integration, testing, and technical documentation.');

    // --- 12. Project Implementation Milestones ---
    renderSectionHeader('12. Project Implementation Milestones');
    renderBullet('Phase 1 (Weeks 1–3):', 'Component procurement, sensor testing, calibration curves generation, and initial Mega 2560 breadboard prototyping.');
    renderBullet('Phase 2 (Weeks 4–6):', 'Arduino Mega 2560 edge conditioning logic, ESP8266 Hardware Serial1 bridge development, and local buzzer/LED alarm integration.');
    renderBullet('Phase 3 (Weeks 7–9):', 'MQTT publish-subscribe pipeline setup, Web Application dashboard construction (live gauges, charts, alert banners), and cloud backend deployment.');
    renderBullet('Phase 4 (Weeks 10–12):', 'System enclosure assembly, lab benchmarking under simulated gas/smoke events, end-to-end web testing, final report preparation, and presentation.');

    // Running Header (Pages 2 & 3) & Running Footer (All Pages)
    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      const oldBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      // Running header on pages 2+
      if (i > 0) {
        doc.font('Helvetica').fontSize(8).fillColor(MUTED)
           .text('AirGuard IoT — Project Proposal  |  CSE402 IoT Lab', leftMargin, 20, { width: contentWidth / 2, align: 'left', lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(8).fillColor(PRIMARY)
           .text('Department of CSE  •  UITS', leftMargin + contentWidth / 2, 20, { width: contentWidth / 2, align: 'right', lineBreak: false });
        doc.strokeColor(LINE_COLOR).lineWidth(0.5)
           .moveTo(leftMargin, 31).lineTo(pageWidth - rightMargin, 31).stroke();
      }

      // Running footer on all pages
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
         .text(`Page ${i + 1} of ${totalPages}   —   Department of Computer Science & Engineering, UITS   —   AirGuard IoT Proposal`, leftMargin, 818, {
           width: contentWidth,
           align: 'center',
           lineBreak: false
         });

      doc.page.margins.bottom = oldBottom;
    }

    doc.end();

    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', (err) => reject(err));
  });
}

const targetPath = path.join(__dirname, 'AirGuard_IoT_Project_Proposal.pdf');
const docsTargetPath = path.join(__dirname, 'docs/AirGuard_IoT_Project_Proposal.pdf');

generateUITSStudentProposal(targetPath)
  .then(() => {
    fs.copyFileSync(targetPath, docsTargetPath);
    console.log('Successfully generated updated proposal PDF for Arduino Mega 2560 & Web App:');
    console.log(' - ' + targetPath);
    console.log(' - ' + docsTargetPath);
  })
  .catch(err => {
    console.error('Failed to generate PDF:', err);
    process.exit(1);
  });
