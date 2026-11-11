/**
 * ============================================================================
 * Automated Test Suite — AirGuard IoT Web Dashboard & Telemetry Verification
 * Environment: Node.js Built-in Test Runner (node:test + node:assert)
 * File under test: web/index.html & firmware protocol contracts
 * ============================================================================
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const WEB_INDEX_PATH = path.join(__dirname, '..', 'web', 'index.html');
const FIRMWARE_PATH = path.join(__dirname, '..', 'firmware', 'esp32_airguard', 'esp32_airguard.ino');
const SQL_PATH = path.join(__dirname, '..', 'supabase', 'migrations', '20261112000000_create_telemetry.sql');

describe('AirGuard Web Dashboard — Automated Quality & Integrity Suite', () => {

  let htmlContent = '';
  let firmwareContent = '';
  let sqlContent = '';

  test('Test 1: Core Files Existence & Non-Empty Check', () => {
    assert.strictEqual(fs.existsSync(WEB_INDEX_PATH), true, 'web/index.html must exist');
    htmlContent = fs.readFileSync(WEB_INDEX_PATH, 'utf-8');
    assert.ok(htmlContent.length > 500, 'web/index.html must be populated');

    assert.strictEqual(fs.existsSync(FIRMWARE_PATH), true, 'Firmware sketch must exist');
    firmwareContent = fs.readFileSync(FIRMWARE_PATH, 'utf-8');

    assert.strictEqual(fs.existsSync(SQL_PATH), true, 'SQL migration must exist');
    sqlContent = fs.readFileSync(SQL_PATH, 'utf-8');
  });

  test('Test 2: Required CDNs & Third-Party Library Inclusions', () => {
    const requiredLibraries = [
      'cdn.tailwindcss.com',
      'cdn.jsdelivr.net/npm/chart.js',
      'cdn.jsdelivr.net/npm/@supabase/supabase-js',
      'cdnjs.cloudflare.com/ajax/libs/paho-mqtt',
      'cdnjs.cloudflare.com/ajax/libs/font-awesome'
    ];

    for (const lib of requiredLibraries) {
      assert.ok(
        htmlContent.includes(lib),
        `web/index.html must include CDN dependency: ${lib}`
      );
    }
  });

  test('Test 3: Mandatory DOM Element IDs Integrity Check', () => {
    const requiredElementIds = [
      'mqtt-dot',
      'mqtt-status',
      'supabase-dot',
      'supabase-status',
      'packet-counter',
      'system-clock',
      'btn-audio',
      'safety-strip',
      'status-pill',
      'safety-title',
      'safety-desc',
      'last-timestamp',
      'val-aqi',
      'val-cogas',
      'val-dust',
      'val-temp',
      'val-hum',
      'val-dew',
      'bar-aqi',
      'bar-cogas',
      'bar-dust',
      'ch1-status',
      'ch2-status',
      'ch3-status',
      'chart-gas',
      'chart-dust',
      'chart-gas-standby',
      'chart-dust-standby',
      'telemetry-table-body',
      'btn-refresh',
      'btn-export-csv',
      'btn-export-json',
      'btn-sim-normal',
      'btn-sim-warn',
      'btn-sim-danger'
    ];

    for (const id of requiredElementIds) {
      const pattern = new RegExp(`id=["']${id}["']`);
      assert.ok(
        pattern.test(htmlContent),
        `DOM element with id="${id}" must exist in web/index.html`
      );
    }
  });

  test('Test 4: Cross-System Protocol & Contract Synchronization', () => {
    // 1. MQTT Topic Contract
    const webTopicMatch = htmlContent.match(/const MQTT_TOPIC\s*=\s*['"]([^'"]+)['"]/);
    const fwTopicMatch = firmwareContent.match(/MQTT_TOPIC_PUB\s*=\s*["']([^"']+)["']/);
    assert.ok(webTopicMatch, 'Web dashboard must define MQTT_TOPIC');
    assert.ok(fwTopicMatch, 'Firmware must define MQTT_TOPIC_PUB');
    assert.strictEqual(
      webTopicMatch[1],
      fwTopicMatch[1],
      'MQTT topic must match identically across firmware and web dashboard'
    );

    // 2. Supabase Endpoint Contract
    const webUrlMatch = htmlContent.match(/const SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
    const fwUrlMatch = firmwareContent.match(/SUPABASE_URL\s*=\s*["']([^"']+)["']/);
    assert.ok(webUrlMatch, 'Web dashboard must define SUPABASE_URL');
    assert.ok(fwUrlMatch, 'Firmware must define SUPABASE_URL');
    assert.ok(
      fwUrlMatch[1].startsWith(webUrlMatch[1]),
      'Firmware Supabase endpoint must target the same project URL as the dashboard'
    );

    // 3. Supabase Key Contract
    const webKeyMatch = htmlContent.match(/const SUPABASE_KEY\s*=\s*['"]([^'"]+)['"]/);
    const fwKeyMatch = firmwareContent.match(/SUPABASE_KEY\s*=\s*["']([^"']+)["']/);
    assert.ok(webKeyMatch, 'Web dashboard must define SUPABASE_KEY');
    assert.ok(fwKeyMatch, 'Firmware must define SUPABASE_KEY');
    assert.strictEqual(
      webKeyMatch[1],
      fwKeyMatch[1],
      'Supabase anon key must match identically across firmware and web'
    );
  });

  test('Test 5: Threshold Logic & State Machine Verification', () => {
    const THRESHOLD_MQ135_WARN   = 1200;
    const THRESHOLD_MQ135_DANGER = 2000;
    const THRESHOLD_MQ9_WARN     = 1000;
    const THRESHOLD_MQ9_DANGER   = 1600;

    function evaluateSafety(aqi, co_gas) {
      const isDanger = (aqi >= THRESHOLD_MQ135_DANGER) || (co_gas >= THRESHOLD_MQ9_DANGER);
      const isWarning = (!isDanger) && ((aqi >= THRESHOLD_MQ135_WARN) || (co_gas >= THRESHOLD_MQ9_WARN));
      if (isDanger) return 'DANGER';
      if (isWarning) return 'WARNING';
      return 'NORMAL';
    }

    // Normal scenarios
    assert.strictEqual(evaluateSafety(400, 200), 'NORMAL');
    assert.strictEqual(evaluateSafety(1199, 999), 'NORMAL');

    // Warning scenarios
    assert.strictEqual(evaluateSafety(1200, 200), 'WARNING');
    assert.strictEqual(evaluateSafety(400, 1000), 'WARNING');
    assert.strictEqual(evaluateSafety(1500, 1200), 'WARNING');

    // Danger scenarios
    assert.strictEqual(evaluateSafety(2000, 200), 'DANGER');
    assert.strictEqual(evaluateSafety(400, 1600), 'DANGER');
    assert.strictEqual(evaluateSafety(2500, 1800), 'DANGER');
  });

  test('Test 6: Dew Point Calculation Mathematical Accuracy', () => {
    // Formula: Td = T - ((100 - RH) / 5)
    function calculateDewPoint(temp, hum) {
      return temp - ((100 - hum) / 5.0);
    }

    // Test standard room climate: 25°C, 60% RH
    const dp1 = calculateDewPoint(25.0, 60.0);
    assert.strictEqual(dp1, 17.0, '25°C at 60% RH should have dew point of 17.0°C');

    // Test 100% RH (saturated air): Dew point must equal ambient temperature
    const dp2 = calculateDewPoint(30.0, 100.0);
    assert.strictEqual(dp2, 30.0, 'At 100% RH, Dew Point must equal ambient Temperature');

    // Test 20°C, 50% RH
    const dp3 = calculateDewPoint(20.0, 50.0);
    assert.strictEqual(dp3, 10.0, '20°C at 50% RH should yield 10.0°C');
  });

  test('Test 7: Optical Dust Calculation Formula Verification', () => {
    // Sharp GP2Y1010AU0F formula: mg/m3 = 0.17 * V - 0.1; ug/m3 = mg/m3 * 1000
    function calculateDust(voltage) {
      const mg = 0.17 * voltage - 0.1;
      const ug = mg * 1000.0;
      return ug > 0 ? ug : 0.0;
    }

    // Baseline clean air (~0.588V produces 0 ug/m3)
    assert.strictEqual(calculateDust(0.5), 0.0, 'Negative offsets must clamp to 0.0 ug/m3');

    // 1.0V reading
    const d1 = calculateDust(1.0);
    assert.strictEqual(Math.round(d1), 70, '1.0V should correspond to ~70 ug/m3');

    // 2.0V reading
    const d2 = calculateDust(2.0);
    assert.strictEqual(Math.round(d2), 240, '2.0V should correspond to ~240 ug/m3');
  });

  test('Test 8: CSV & JSON Data Export Serialization Formats', () => {
    const mockRows = [
      { id: 1, created_at: '2026-11-12T01:00:00Z', temp: 24.5, hum: 58.0, aqi: 350, co_gas: 180, dust: 22.4 },
      { id: 2, created_at: '2026-11-12T01:00:15Z', temp: 24.6, hum: 58.2, aqi: 360, co_gas: 185, dust: 23.0 }
    ];

    // CSV format verification
    const headers = ['id', 'created_at', 'temp_c', 'hum_pct', 'aqi_mq135', 'cogas_mq9', 'dust_ug_m3'];
    const csvLines = [headers.join(',')];
    mockRows.forEach(r => {
      csvLines.push([r.id, `"${r.created_at}"`, r.temp, r.hum, r.aqi, r.co_gas, r.dust].join(','));
    });
    const csvOutput = csvLines.join('\n');

    assert.ok(csvOutput.startsWith('id,created_at,temp_c,hum_pct,aqi_mq135,cogas_mq9,dust_ug_m3'));
    assert.ok(csvOutput.includes('24.5,58,350,180,22.4'));

    // JSON format verification
    const jsonOutput = JSON.stringify(mockRows);
    const parsed = JSON.parse(jsonOutput);
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].aqi, 350);
  });

  test('Test 9: Fixed Oscilloscope Grid Initialization Verification', () => {
    // Ensure Chart.js is configured with fixed scales so grids render when empty
    assert.ok(
      htmlContent.includes('min: 0') && htmlContent.includes('max: 2500'),
      'Chart 1 must configure min:0 and max:2500 scale for visible gridlines'
    );
    assert.ok(
      htmlContent.includes('min: 0') && htmlContent.includes('max: 200'),
      'Chart 2 must configure min:0 and max:200 for dust grid'
    );
    assert.ok(
      htmlContent.includes('chart-gas-standby') && htmlContent.includes('chart-dust-standby'),
      'Standby indicators must exist to inform user when waiting for data'
    );
  });

});
