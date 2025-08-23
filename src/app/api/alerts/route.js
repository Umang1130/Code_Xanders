import { getNasaAlerts } from "@/lib/alert-system";

export default async function handler(req, res) {
  // Set CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  try {
    // Extract query parameters with defaults
    const { 
      days = 7, 
      filterTypes = '', 
      includeFallback = 'true' 
    } = req.query;

    // Parse filterTypes from comma-separated string
    const typesArray = filterTypes ? filterTypes.split(',').map(t => t.trim()) : [];

    // CORRECTED: Pass options object instead of individual parameters
    const options = {
      days: parseInt(days) || 7,
      filterTypes: typesArray,
      includeFallback: includeFallback === 'true'
    };

    console.log('Fetching alerts with options:', options);

    const alerts = await getNasaAlerts(options);

    // Add metadata to response
    const response = {
      success: true,
      count: alerts.length,
      alerts: alerts,
      metadata: {
        fetchTime: new Date().toISOString(),
        daysRequested: options.days,
        typesRequested: options.filterTypes.length > 0 ? options.filterTypes : 'all',
        fallbackEnabled: options.includeFallback
      }
    };

    res.status(200).json(response);

  } catch (err) {
    console.error('API handler error:', err);
    
    // Return detailed error information
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch NASA alerts",
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
}

// BONUS: Add a named export for direct usage
export async function getAlerts(options = {}) {
  try {
    return await getNasaAlerts(options);
  } catch (error) {
    console.error('Direct getAlerts error:', error);
    throw error;
  }
}