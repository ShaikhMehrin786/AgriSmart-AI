/**
 * IoT Sensor Telemetry & Stream Simulation Service
 * Fulfills SIH-2026 Problem Statement Bonus Module F & Section 12 (IoT Architecture)
 * 
 * Pipeline:
 *   Sensors (real or simulated) -> ESP32/Raspberry Pi Gateway -> Cloud API -> AI/ML Engine -> Farmer UI
 */

// In-memory ring buffer for the latest 100 sensor telemetry readings
const telemetryBuffer = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Generate a realistic simulated sensor telemetry packet
 * Emulates an ESP32 edge node reading capacitive soil moisture, DHT22, and analog pH probe
 */
function generateSimulatedTelemetry(options = {}) {
  const {
    sensorId = 'AGRI-NODE-01',
    crop = 'Tomato',
    fieldZone = 'Zone-North-04',
    weather = null
  } = options;

  const now = new Date();
  const hour = now.getHours();

  // Emulate diurnal temperature cycle (cooler at night, warmer afternoon)
  const baseTemp = weather?.temperature ?? (22 + 8 * Math.sin(((hour - 6) / 24) * 2 * Math.PI));
  const baseHumidity = weather?.humidity ?? Math.max(35, Math.min(95, 75 - (baseTemp - 20) * 2.5));
  
  // Soil moisture decreases during midday evapotranspiration, stays higher at night
  const soilMoisture = Math.max(15, Math.min(85, Math.round(38 + 12 * Math.cos(((hour - 14) / 24) * 2 * Math.PI) + (Math.random() * 4 - 2))));
  
  // Soil pH generally stable around 6.3 - 6.8
  const pH = Number((6.4 + (Math.random() * 0.4 - 0.2)).toFixed(2));
  
  // Electrical Conductivity (EC) in dS/m for salinity
  const ec = Number((1.2 + (Math.random() * 0.3 - 0.15)).toFixed(2));

  // Node battery level (simulate slow discharge or solar charging)
  const batteryPct = hour >= 8 && hour <= 17 ? 98 : 91;

  const packet = {
    sensorId,
    fieldZone,
    crop,
    timestamp: now.toISOString(),
    telemetry: {
      soilMoisture: {
        value: soilMoisture,
        unit: '%',
        status: soilMoisture < 25 ? 'CRITICALLY_DRY' : (soilMoisture > 70 ? 'SATURATED' : 'OPTIMAL'),
        depth: '15cm (Root Zone)'
      },
      temperature: {
        value: Number(baseTemp.toFixed(1)),
        unit: '°C'
      },
      humidity: {
        value: Number(baseHumidity.toFixed(1)),
        unit: '%'
      },
      pH: {
        value: pH,
        unit: 'pH',
        status: (pH >= 6.0 && pH <= 7.2) ? 'OPTIMAL' : 'ADJUSTMENT_NEEDED'
      },
      electricalConductivity: {
        value: ec,
        unit: 'dS/m',
        status: ec < 2.0 ? 'NORMAL' : 'SALINITY_WARNING'
      }
    },
    hardwareStatus: {
      nodeStatus: 'ONLINE',
      firmwareVersion: 'v2.4.1-esp32-freertos',
      protocol: 'MQTT / HTTPS REST',
      batteryLevel: batteryPct,
      signalRssi: -67
    }
  };

  telemetryBuffer.unshift(packet);
  if (telemetryBuffer.length > MAX_BUFFER_SIZE) {
    telemetryBuffer.pop();
  }

  return packet;
}

/**
 * Ingest real telemetry from an active physical or streamed edge node
 */
function ingestSensorTelemetry(payload = {}) {
  const {
    sensorId = 'EXTERNAL-NODE',
    fieldZone = 'Zone-01',
    crop = 'General Crop',
    soilMoisture = 40,
    temperature = 25,
    humidity = 60,
    pH = 6.5,
    batteryLevel = 100
  } = payload;

  const packet = {
    sensorId,
    fieldZone,
    crop,
    timestamp: new Date().toISOString(),
    telemetry: {
      soilMoisture: {
        value: Number(soilMoisture),
        unit: '%',
        status: Number(soilMoisture) < 25 ? 'CRITICALLY_DRY' : (Number(soilMoisture) > 70 ? 'SATURATED' : 'OPTIMAL'),
        depth: '15cm'
      },
      temperature: {
        value: Number(temperature),
        unit: '°C'
      },
      humidity: {
        value: Number(humidity),
        unit: '%'
      },
      pH: {
        value: Number(pH),
        unit: 'pH',
        status: (Number(pH) >= 6.0 && Number(pH) <= 7.2) ? 'OPTIMAL' : 'ADJUSTMENT_NEEDED'
      }
    },
    hardwareStatus: {
      nodeStatus: 'ONLINE',
      batteryLevel: Number(batteryLevel),
      ingestionMode: 'DIRECT_API_INGEST'
    }
  };

  telemetryBuffer.unshift(packet);
  if (telemetryBuffer.length > MAX_BUFFER_SIZE) {
    telemetryBuffer.pop();
  }

  return packet;
}

/**
 * Get recent historical telemetry buffer
 */
function getRecentTelemetry(limit = 20) {
  if (telemetryBuffer.length === 0) {
    // Prime buffer with initial reading
    generateSimulatedTelemetry();
  }
  return telemetryBuffer.slice(0, limit);
}

module.exports = {
  generateSimulatedTelemetry,
  ingestSensorTelemetry,
  getRecentTelemetry
};
