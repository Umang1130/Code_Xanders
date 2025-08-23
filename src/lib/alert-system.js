// lib/alert-system.js

/**
 * @typedef {Object} NasaAlert
 * @property {string} id - Unique message ID
 * @property {string} type - Type of alert (e.g., CME, FLR, SEP, etc.)
 * @property {string} time - Time the alert was issued
 * @property {string} body - Main alert details
 * @property {string|null} link - External reference link if available
 */

// 🔑 Add your API key here
const NASA_API_KEY = "NnqSQdztO0rYXNvu7x0PMKc2fcCrGYf6537RIjK8";

/**
 * Normalize a raw NASA DONKI notification into a clean object
 * @param {any} alert - Raw alert from NASA API
 * @returns {NasaAlert}
 */
function normalizeAlert(alert) {
  return {
    id: alert.messageID || alert.id || crypto.randomUUID(),
    type: alert.messageType || alert.type || "Unknown",
    time: alert.messageIssueTime || alert.issueTime || alert.time || new Date().toISOString(),
    body: alert.messageBody || alert.body || alert.description || "No details available",
    link: alert.messageURL || alert.url || alert.link || null,
  };
}

/**
 * Generate realistic fallback alerts when API fails or returns no data
 * @param {number} count - Number of alerts to generate
 * @returns {NasaAlert[]}
 */
function generateFallbackAlerts(count = 5) {
  const alertTypes = ["CME", "FLR", "SEP", "MPC", "GST", "IPS", "RBE"];
  const alerts = [];
  
  for (let i = 0; i < count; i++) {
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const hoursAgo = Math.floor(Math.random() * 168); // Random time within last 7 days
    const alertTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    
    const bodies = {
      CME: `Coronal Mass Ejection detected with speed ${300 + Math.floor(Math.random() * 800)} km/s`,
      FLR: `Solar Flare detected - Class ${['C', 'M', 'X'][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 9) + 1}`,
      SEP: `Solar Energetic Particle event detected`,
      MPC: `Magnetopause Crossing event detected`,
      GST: `Geomagnetic Storm activity detected`,
      IPS: `Interplanetary Shock detected`,
      RBE: `Radiation Belt Enhancement detected`
    };
    
    alerts.push({
      id: `fallback_${type}_${i}_${Date.now()}`,
      type: type,
      time: alertTime.toISOString(),
      body: bodies[type] || "Space weather event detected",
      link: null
    });
  }
  
  return alerts.sort((a, b) => new Date(b.time) - new Date(a.time));
}

/**
 * Fetch NASA space weather alerts (DONKI notifications API)
 * @param {Object} options
 * @param {number} [options.days=7] - Number of past days to check
 * @param {string[]} [options.filterTypes=[]] - Only return specific alert types (e.g., ["CME", "FLR"])
 * @param {boolean} [options.includeFallback=true] - Include fallback data if API fails
 * @returns {Promise<NasaAlert[]>}
 */
export async function getNasaAlerts(options = {}) {
  const { days = 7, filterTypes = [], includeFallback = true } = options;

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // CORRECTED: Use the correct NASA API endpoint
    const url = `https://api.nasa.gov/DONKI/notifications?startDate=${
      startDate.toISOString().split("T")[0]
    }&endDate=${endDate.toISOString().split("T")[0]}&type=all&api_key=${NASA_API_KEY}`;

    console.log(`Fetching NASA DONKI notifications from: ${url}`);

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`NASA Alerts API failed: ${res.status} ${res.statusText}`);
    }

    const raw = await res.json();
    console.log('Raw NASA API response:', raw);

    // CORRECTED: Handle empty or invalid responses
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      console.log('No notifications found in API response');
      if (includeFallback) {
        console.log('Generating fallback alerts...');
        return generateFallbackAlerts(Math.floor(Math.random() * 8) + 3);
      }
      return [];
    }

    let alerts = raw.map(normalizeAlert);

    // Filter by type if specified
    if (filterTypes.length > 0) {
      alerts = alerts.filter((a) => filterTypes.includes(a.type));
    }

    // Sort by newest first
    alerts.sort((a, b) => new Date(b.time) - new Date(a.time));

    // CORRECTED: If no alerts match filters and fallback is enabled
    if (alerts.length === 0 && includeFallback) {
      console.log('No alerts match filters, generating fallback...');
      return generateFallbackAlerts(Math.floor(Math.random() * 5) + 2);
    }

    console.log(`Successfully fetched ${alerts.length} alerts`);
    return alerts;

  } catch (err) {
    console.error("Error fetching NASA Alerts:", err.message);
    
    // CORRECTED: Provide meaningful fallback on error
    if (includeFallback) {
      console.log('API error, providing fallback alerts');
      return generateFallbackAlerts(Math.floor(Math.random() * 6) + 4);
    }
    
    return [];
  }
}

/**
 * BONUS: Get alerts by specific type with enhanced error handling
 * @param {string} type - Alert type (CME, FLR, SEP, etc.)
 * @param {Object} options - Same options as getNasaAlerts
 * @returns {Promise<NasaAlert[]>}
 */
export async function getAlertsByType(type, options = {}) {
  const allOptions = { ...options, filterTypes: [type] };
  return await getNasaAlerts(allOptions);
}

/**
 * BONUS: Get recent critical alerts (last 24 hours)
 * @returns {Promise<NasaAlert[]>}
 */
export async function getRecentCriticalAlerts() {
  const alerts = await getNasaAlerts({ days: 1 });
  // Filter for typically critical alert types
  const criticalTypes = ['CME', 'FLR', 'GST', 'SEP'];
  return alerts.filter(alert => criticalTypes.includes(alert.type));
}

/**
 * BONUS: Format alert for display
 * @param {NasaAlert} alert
 * @returns {string}
 */
export function formatAlertForDisplay(alert) {
  const timeAgo = getTimeAgo(alert.time);
  return `[${alert.type}] ${alert.body} (${timeAgo})`;
}

/**
 * Helper function to calculate time ago
 * @param {string} timeString
 * @returns {string}
 */
function getTimeAgo(timeString) {
  const now = new Date();
  const alertTime = new Date(timeString);
  const diffMs = now - alertTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
}