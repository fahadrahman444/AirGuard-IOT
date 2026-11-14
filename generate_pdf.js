const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const LOGO_PATH = path.join(__dirname, 'docs/assets/uits_logo.png');

function generateUITSStudentProposal(outputPath) {
  return new Promise((resolve, reject) => {
    // A4: 595.28 x 841.89 pt
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 48, bottom: 48, left: 50, right: 50 },
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
    const bottomLimit = pageHeight - 48; // 793.89 pt

    function checkSpace(needed) {
      if (doc.y + needed > bottomLimit) {
        doc.addPage();
      }
    }

    function renderSectionHeader(title, spaceBefore = 0.4, spaceAfter = 0.22) {
      checkSpace(35);
      doc.moveDown(spaceBefore);
      doc.font('Helvetica-Bold')
         .fontSize(11.5)
         .fillColor(PRIMARY)
         .text(title, leftMargin, doc.y, { width: contentWidth, align: 'left' });
      doc.moveDown(spaceAfter);
    }

    function renderParagraph(text, lineGap = 2.0, moveAfter = 0.22) {
      checkSpace(24);
      doc.font('Helvetica')
         .fontSize(9.2)
         .fillColor(DARK_TEXT)
         .text(text, leftMargin, doc.y, {
           width: contentWidth,
           align: 'left',
           lineGap: lineGap
         });
      doc.moveDown(moveAfter);
    }

    function renderBullet(prefix, text, indent = 15, lineGap = 1.9, moveAfter = 0.2) {
      checkSpace(18);
      const bulletX = leftMargin + indent - 10;
      const textX = leftMargin + indent;
      const textWidth = contentWidth - indent;
      const startY = doc.y;

      doc.font('Helvetica-Bold')
         .fontSize(9.2)
         .fillColor(DARK_TEXT)
         .text('•', bulletX, startY);

      if (prefix && text) {
        doc.font('Helvetica-Bold')
           .fontSize(9.2)
           .fillColor(DARK_TEXT)
           .text(prefix + ' ', textX, startY, {
             width: textWidth,
             continued: true,
             lineGap: lineGap
           });
        doc.font('Helvetica')
           .fontSize(9.2)
           .fillColor(DARK_TEXT)
           .text(text, {
             width: textWidth,
             align: 'left',
             lineGap: lineGap
           });
      } else if (prefix && !text) {
        doc.font('Helvetica-Bold')
           .fontSize(9.2)
           .fillColor(DARK_TEXT)
           .text(prefix, textX, startY, {
             width: textWidth,
             align: 'left',
             lineGap: lineGap
           });
      } else {
        doc.font('Helvetica')
           .fontSize(9.2)
           .fillColor(DARK_TEXT)
           .text(text, textX, startY, {
             width: textWidth,
             align: 'left',
             lineGap: lineGap
           });
      }
      doc.moveDown(moveAfter);
    }

    // ==========================================
    // PAGE 1: HEADER, TEAM INFO & FOUNDATIONS (SECTIONS 1-4)
    // ==========================================
    doc.addPage();

    // 1. Header: UITS Logo & University Identity
    const logoWidth = 136;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = 48; // Scaled top margin matching left margin (50 pt)

    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, logoX, logoY, { width: logoWidth });
    }

    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor(PRIMARY)
       .text('UNIVERSITY OF INFORMATION TECHNOLOGY AND SCIENCES (UITS)', leftMargin, 100, { width: contentWidth, align: 'center' });

    doc.font('Helvetica-Bold')
       .fontSize(9.2)
       .fillColor(MUTED)
       .text('Department of Computer Science & Engineering (CSE)', leftMargin, 115, { width: contentWidth, align: 'center' });

    doc.font('Helvetica-Bold')
       .fontSize(9.5)
       .fillColor(SECONDARY)
       .text('Course Code: CSE402   •   Course Title: Internet of Things Lab', leftMargin, 129, { width: contentWidth, align: 'center' });

    doc.font('Helvetica-Bold')
       .fontSize(14.5)
       .fillColor(PRIMARY)
       .text('PROJECT PROPOSAL', leftMargin, 144, { width: contentWidth, align: 'center' });

    // Hairline divider
    doc.strokeColor(LINE_COLOR)
       .lineWidth(0.8)
       .moveTo(leftMargin, 164)
       .lineTo(pageWidth - rightMargin, 164)
       .stroke();

    // 2. Academic Submission Cards (Panel Box with Team Members)
    const cardY = 169;
    const cardHeight = 90;
    const colWidth = (contentWidth - 16) / 2;
    const leftColX = leftMargin + 10;
    const rightColX = leftMargin + colWidth + 12;

    doc.roundedRect(leftMargin, cardY, contentWidth, cardHeight, 4)
       .fillAndStroke(BG_BOX, LINE_COLOR);

    // Left Column: Submitted to
    doc.font('Helvetica-Bold').fontSize(8.2).fillColor(SECONDARY).text('SUBMITTED TO:', leftColX, cardY + 6);
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY).text('S. M. Zafrul Islam', leftColX, cardY + 19);
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text('Lecturer, Department of CSE', leftColX, cardY + 32);
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text('University of Information Technology & Sciences (UITS)', leftColX, cardY + 45);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Permanent Campus: Baridhara Nayanagar, Dhaka-1212', leftColX, cardY + 58);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Submission Date: October 26, 2026', leftColX, cardY + 72);

    // Right Column: Submitted by (Team Members)
    doc.font('Helvetica-Bold').fontSize(8.2).fillColor(SECONDARY).text('SUBMITTED BY (PROJECT TEAM):', rightColX, cardY + 6);

    // Member 1 (Team Leader)
    doc.font('Helvetica-Bold').fontSize(8.4).fillColor(PRIMARY).text('1. MD. Fahad Rahman (Team Leader)', rightColX, cardY + 19, { continued: true });
    doc.font('Helvetica').fontSize(8.0).fillColor(DARK_TEXT).text(' (ID: 0432320005101071)');

    // Member 2
    doc.font('Helvetica-Bold').fontSize(8.4).fillColor(PRIMARY).text('2. Zannatul Nayem', rightColX, cardY + 32, { continued: true });
    doc.font('Helvetica').fontSize(8.0).fillColor(DARK_TEXT).text('  (ID: 0432320005101063)');

    // Member 3
    doc.font('Helvetica-Bold').fontSize(8.4).fillColor(PRIMARY).text('3. Shafayet Hossain Shafin', rightColX, cardY + 45, { continued: true });
    doc.font('Helvetica').fontSize(8.0).fillColor(DARK_TEXT).text('  (ID: 0432320005101088)');

    doc.font('Helvetica-Bold').fontSize(8.2).fillColor(DARK_TEXT)
       .text('Batch: 54th Batch  |  Section: 6B1  |  Autumn 2026', rightColX, cardY + 60);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
       .text('Program: B.Sc. in Computer Science & Engineering', rightColX, cardY + 72);

    doc.y = cardY + cardHeight + 8;

    // --- 1. Project Title ---
    renderSectionHeader('1. Project Title', 0.25, 0.18);
    doc.font('Helvetica-Bold')
       .fontSize(9.2)
       .fillColor(PRIMARY)
       .text('AirGuard IoT: An IoT-Based Smart Air Quality, Gas Leakage, and Environmental Monitoring System Using ESP32-S3 and Real-Time Web Application', leftMargin, doc.y, {
         width: contentWidth,
         align: 'left',
         lineGap: 1.8
       });
    doc.moveDown(0.2);

    // --- 2. Domain & Application Scope ---
    renderSectionHeader('2. Domain & Application Scope', 0.35, 0.18);
    renderBullet('Primary Domain:', 'Environmental Sensing & Public Health (Aligned with Domain-Specific IoT Architectures).', 15, 1.8, 0.18);
    renderBullet('Secondary Domain:', 'Smart Campus & Industrial Safety (Targeted for UITS CSE Hardware/IoT Labs, Server Rooms & Academic Buildings).', 15, 1.8, 0.18);

    // --- 3. Problem Statement ---
    renderSectionHeader('3. Problem Statement', 0.35, 0.18);
    renderParagraph('Dhaka consistently ranks among the worlds most air-polluted metropolises, experiencing severe seasonal particulate spikes (PM2.5/PM10), combustible gas risks, and poor indoor air ventilation. Within enclosed institutional environments—such as UITS computer science laboratories, server clusters, and educational buildings—undetected hazardous gas leaks (LPG, carbon monoxide, methane) and excessive airborne dust present acute respiratory risks and fire hazards. Conventional protection mechanisms suffer from severe architectural limitations:', 1.9, 0.18);
    renderBullet('Lack of Multi-Parameter Integration:', 'Traditional detectors operate as isolated units, unable to simultaneously sample particulate dust density, toxic/combustible gases, ambient temperature, and relative humidity.', 15, 1.8, 0.18);
    renderBullet('No Remote Telemetry or Cloud Logging:', 'Standard alarms are standalone buzzers lacking wireless connectivity or historical trend logs for predictive laboratory maintenance.', 15, 1.8, 0.18);
    renderBullet('Delayed Emergency Response:', 'Off-premises university faculty, lab officers, and safety administrators receive no low-latency push notifications when dangerous conditions develop after hours.', 15, 1.8, 0.18);

    // --- 4. Proposed Solution & Architecture ---
    renderSectionHeader('4. Proposed Solution & System Architecture', 0.35, 0.18);
    renderParagraph('AirGuard IoT delivers a robust edge-to-cloud environmental safety platform engineered specifically for educational laboratories and institutional facilities, powered by a high-performance ESP32-S3 microcontroller (Dual-Core Xtensa LX7 @ 240 MHz) with integrated 2.4 GHz Wi-Fi and Bluetooth.', 1.9, 0.18);
    renderParagraph('The system captures multi-point physical telemetry from a synchronized multi-sensor array: MQ-135 (air pollution/smoke/toxic vapor), MQ-9 (Carbon Monoxide and combustible gas leakage), a Sharp GP2Y1010AU0F optical dust sensor (quantifying suspended particulates in µg/m³), and a DHT11/DHT22 digital sensor (logging ambient temperature and relative humidity). The architecture features dedicated ADC1 expansion routing (GPIO 5) on the ESP32-S3 for future integration of an electrochemical O2 sensor in Phase 2.', 1.9, 0.18);
    renderParagraph('The ESP32-S3 executes deterministic analog/digital signal conditioning leveraging its 12-bit ADC1 channels. Combining data acquisition, threshold intelligence, and wireless transmission on a single silicon SoC eliminates the communication latency, baud-rate bottlenecks, and level-shifting complexities of legacy multi-board configurations. Telemetry is transmitted over 2.4 GHz campus Wi-Fi using the lightweight MQTT protocol to a dedicated, custom-developed Real-Time Web Application. The web platform delivers interactive gauges, historical charting, and live remote alerts, while local audio-visual buzzers and LEDs provide immediate on-site safety warning.', 1.9, 0.18);

    // ==========================================
    // PAGE 2: OBJECTIVES, HARDWARE, SOFTWARE (SECTIONS 5-7)
    // ==========================================
    doc.addPage();
    doc.y = 66; // Top margin matching page 1 (content begins cleanly below running header)

    // --- 5. Objectives ---
    renderSectionHeader('5. Project Objectives', 0.1, 0.25);
    renderParagraph('The AirGuard IoT project is guided by the following key technical and laboratory deployment objectives:', 2.2, 0.26);
    renderBullet('Comprehensive Environmental Sensing:', 'Continuously quantify Air Quality Index (AQI), combustible gas concentration (PPM), suspended dust density (µg/m³), ambient temperature, and relative humidity.', 15, 2.2, 0.28);
    renderBullet('Early Gas Hazard Detection:', 'Rapidly detect combustible gas leaks (LPG, methane) and toxic smoke to prevent domestic fire outbreaks, equipment destruction, and asphyxiation accidents.', 15, 2.2, 0.28);
    renderBullet('Unified Single-Chip IoT Processing:', 'Eliminate inter-MCU communication bottlenecks by processing sensor telemetry, on-site alarms, and MQTT wireless publishing directly on a single ESP32-S3 platform.', 15, 2.2, 0.28);
    renderBullet('Custom Web Application Visualization:', 'Develop a responsive, full-featured web dashboard displaying real-time analytical metrics, interactive graphs, and historical logs, replacing restrictive on-site character LCDs.', 15, 2.2, 0.28);
    renderBullet('Automated Dual-Layer Alarming:', 'Execute immediate local acoustic/visual alert sequences (active buzzer + tri-color LEDs) alongside real-time web socket/cloud alert banners when safety thresholds are breached.', 15, 2.2, 0.28);

    // --- 6. Hardware Requirements ---
    renderSectionHeader('6. Hardware Requirements & Component Specifications', 0.5, 0.25);
    renderParagraph('The hardware architecture is partitioned into active edge acquisition modules and modular expansion interfaces:', 2.2, 0.26);
    renderBullet('All-in-One IoT Microcontroller:', 'ESP32-S3 (ESP32-S3-DevKitC-1 / WROOM, Dual-Core 240 MHz, 512 KB SRAM, 8 MB Flash, Native 2.4 GHz 802.11 b/g/n Wi-Fi & BLE 5) — Unified edge acquisition, signal processing, and direct cloud transmission engine.', 15, 2.2, 0.26);
    renderBullet('Active Environmental & Gas Sensor Suite:', '', 15, 2.0, 0.2);
    renderBullet('MQ-135 Gas Sensor:', 'Air quality sensor detecting CO2, NH3, benzene, alcohol, and ambient hazardous smoke.', 26, 2.2, 0.26);
    renderBullet('MQ-9 Gas Sensor:', 'Carbon Monoxide (CO) and combustible gas (methane, LPG) sensor for asphyxiation and fire hazard prevention.', 26, 2.2, 0.26);
    renderBullet('Optical Dust Sensor (Sharp GP2Y1010AU0F):', 'Infrared optical particulate sensor quantifying fine PM2.5 / PM10 density measurement in µg/m³.', 26, 2.2, 0.26);
    renderBullet('Climate Sensor (DHT11 / DHT22):', 'Calibrated digital sensor logging relative humidity and ambient temperature.', 26, 2.2, 0.26);
    renderBullet('Future Phase Expansion Feature:', 'Electrochemical O2 Sensor Module (ME2-O2 / Grove O2) — Reserved expansion interface for oxygen depletion tracking, planned for Phase 2 implementation subject to project grant allocation.', 26, 2.2, 0.26);
    renderBullet('Local Actuators & On-Site Indicators:', '5V active acoustic buzzer for immediate emergency warning, and tri-color status LEDs (Green = Normal, Yellow = Warning, Red = Critical Danger).', 15, 2.2, 0.26);
    renderBullet('Power & Interface Accessories:', 'Regulated 5V/2A DC power supply, 1kΩ/2kΩ analog ADC voltage divider resistors, 150Ω resistor, 220µF electrolytic capacitor, solderless breadboard, and jumper wires.', 15, 2.2, 0.26);

    // --- 7. Software and Technologies ---
    renderSectionHeader('7. Software, Firmware & Web Stack', 0.5, 0.25);
    renderParagraph('The software architecture integrates bare-metal deterministic C++ embedded firmware with a lightweight cloud web stack:', 2.2, 0.26);
    renderBullet('Embedded Firmware:', 'ESP-IDF / Arduino IDE (C / Embedded C++) utilizing non-blocking FreeRTOS sensor sampling and ADC1-safe sampling algorithms.', 15, 2.2, 0.26);
    renderBullet('Firmware Libraries:', 'WiFi.h, PubSubClient.h (MQTT), and DHT.h.', 15, 2.2, 0.26);
    renderBullet('Communication Protocols:', 'MQTT (Message Queuing Telemetry Transport) for low-latency publish/subscribe messaging over Wi-Fi 802.11 b/g/n, and HTTP REST API fallback.', 15, 2.2, 0.26);
    renderBullet('Real-Time Web Application Stack:', 'Modern responsive web dashboard built with HTML5/CSS3, JavaScript (React / Chart.js / WebSockets), displaying live gauge dials, real-time pollution time-series, historical telemetry archives, and threshold alert banners.', 15, 2.2, 0.26);

    // ==========================================
    // PAGE 3: FEASIBILITY, SCOPE, DELIVERABLES, ROLES & TIMELINE (SECTIONS 8-12)
    // ==========================================
    doc.addPage();
    doc.y = 66; // Top margin matching page 1 (content begins cleanly below running header)

    // --- 8. Feasibility Analysis ---
    renderSectionHeader('8. Feasibility Analysis', 0.1, 0.2);
    renderBullet('Technical Feasibility:', 'The ESP32-S3 provides high-speed 240 MHz dual-core processing, 512 KB SRAM, and hardware floating-point acceleration, effortlessly handling multi-sensor calibrations, digital filtering, and secure MQTT transmission concurrently without requiring a secondary coprocessor.', 15, 2.0, 0.22);
    renderBullet('Economic Feasibility:', 'The system is built entirely from accessible commercial-off-the-shelf (COTS) components. Leveraging the all-in-one ESP32-S3 reduces overall bill-of-materials cost compared to multi-board systems while preserving top-tier multi-hazard air safety monitoring.', 15, 2.0, 0.22);
    renderBullet('Operational Feasibility:', 'The system requires standard 5V power and a 2.4 GHz Wi-Fi hotspot. Laboratory stakeholders and students can inspect live environmental metrics on any smartphone, tablet, or PC browser without needing to physically stand next to the device.', 15, 2.0, 0.22);

    // --- 9. Project Scope and Limitations ---
    renderSectionHeader('9. Project Scope & Limitations', 0.42, 0.2);
    renderBullet('Project Scope:', 'Designed for real-time monitoring across UITS computer science laboratories, server rooms, university project exhibition halls, and residential living spaces.', 15, 2.0, 0.22);
    renderBullet('Processing Headroom:', 'The ESP32-S3 dual-core processor delivers abundant computational headroom, ensuring zero risk of memory exhaustion or task blocking during continuous sampling.', 15, 2.0, 0.22);
    renderBullet('Budget Scope & Future O2 Integration:', 'Due to prohibitive procurement costs, electrochemical O2 percentage sensing is omitted from the initial prototype and scheduled as a planned future update; ESP32-S3 ADC1 channel GPIO 5 is reserved for seamless plug-and-play upgrade.', 15, 2.0, 0.22);
    renderBullet('Network Dependency:', 'Cloud logging and web application telemetry require active Wi-Fi internet connectivity. However, local audio-visual alarm functions (buzzer & LEDs) operate completely autonomously even when offline.', 15, 2.0, 0.22);

    // --- 10. Expected Outcome & Deliverables ---
    renderSectionHeader('10. Expected Outcome & Deliverables', 0.42, 0.2);
    renderBullet('1. Functional Hardware Prototype:', 'A fully assembled hardware station integrating the ESP32-S3 and 4 primary sensing modules (with expansion readiness for future O2 addition).', 15, 2.0, 0.22);
    renderBullet('2. Interactive Real-Time Web Application:', 'A responsive, feature-rich web dashboard displaying live gauges, time-series telemetry plots, historical logs, and safety indicator cards for air quality, gases, dust, and climate.', 15, 2.0, 0.22);
    renderBullet('3. Sub-2s Emergency Safety Alarming:', 'An automated safety response mechanism sounding local sirens and streaming web alert flags within 2 seconds of threshold violations.', 15, 2.0, 0.22);

    // --- 11. Team Work Distribution & Responsibilities ---
    renderSectionHeader('11. Team Work Distribution & Responsibilities', 0.42, 0.2);
    renderBullet('MD. Fahad Rahman (Team Leader - 0432320005101071):', 'Overall system architecture, multi-sensor calibration & interfacing (MQ-135, MQ-9, GP2Y1010AU0F, DHT), future O2 pin allocation, ESP32-S3 firmware engineering, and FreeRTOS task coordination.', 15, 2.0, 0.22);
    renderBullet('Zannatul Nayem (0432320005101063):', 'ESP32-S3 Wi-Fi stack & network manager, MQTT cloud broker configuration, payload serialization, and REST API telemetry transmission pipeline.', 15, 2.0, 0.22);
    renderBullet('Shafayet Hossain Shafin (0432320005101088):', 'Real-Time Web Application frontend/backend development (dashboard UI, live metric cards, Chart.js time-series graphs), local audio-visual alarm circuit integration, testing, and technical documentation.', 15, 2.0, 0.22);

    // --- 12. Project Implementation Milestones ---
    renderSectionHeader('12. Project Implementation Milestones (July – Nov 15, 2026)', 0.42, 0.2);
    renderBullet('Phase 1 (July – August 2026):', 'Requirements analysis, COTS sensor procurement (MQ-135, MQ-9, GP2Y1010AU0F, DHT), sensor burn-in, calibration testing, and breadboard baseline prototyping.', 15, 2.0, 0.22);
    renderBullet('Phase 2 (September 2026):', 'ESP32-S3 edge acquisition firmware, ADC1 voltage divider protection circuit, and autonomous on-site audio-visual buzzer/LED alarm circuit integration.', 15, 2.0, 0.22);
    renderBullet('Phase 3 (October 2026):', 'ESP32-S3 Wi-Fi & MQTT cloud publish/subscribe pipeline configuration, and interactive Real-Time Web Application dashboard development.', 15, 2.0, 0.22);
    renderBullet('Phase 4 (Nov 1 – Nov 15, 2026):', 'Hardware enclosure packaging, end-to-end lab benchmarking under simulated gas/smoke, system calibration, and first functional prototype ready before Nov 15, 2026.', 15, 2.0, 0.22);

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
           .text('AirGuard IoT — Project Proposal  |  CSE402 IoT Lab', leftMargin, 36, { width: contentWidth / 2, align: 'left', lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(8).fillColor(PRIMARY)
           .text('Department of CSE  •  UITS', leftMargin + contentWidth / 2, 36, { width: contentWidth / 2, align: 'right', lineBreak: false });
        doc.strokeColor(LINE_COLOR).lineWidth(0.5)
           .moveTo(leftMargin, 48).lineTo(pageWidth - rightMargin, 48).stroke();
      }

      // Running footer on all pages (balanced at y = 794, 48 pt above bottom edge)
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
         .text(`Page ${i + 1} of ${totalPages}   —   Department of Computer Science & Engineering, UITS   —   AirGuard IoT Proposal`, leftMargin, 794, {
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
    console.log('Successfully generated proposal PDF with O2 marked as future scope:');
    console.log(' - ' + targetPath);
    console.log(' - ' + docsTargetPath);
  })
  .catch(err => {
    console.error('Failed to generate PDF:', err);
    process.exit(1);
  });
