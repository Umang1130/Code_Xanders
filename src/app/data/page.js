"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Mock API functions
const generateSolarData = (hours = 24) => {
  const data = [];
  const now = Date.now();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = now - (i * 60 * 60 * 1000);
    data.push({
      timestamp,
      time: new Date(timestamp).toLocaleTimeString(),
      solarWindSpeed: 380 + Math.random() * 200 + Math.sin(i * 0.1) * 50,
      protonDensity: 5 + Math.random() * 15 + Math.sin(i * 0.2) * 3,
      temperature: 80000 + Math.random() * 120000 + Math.cos(i * 0.15) * 30000,
      magneticField: 3 + Math.random() * 8 + Math.sin(i * 0.3) * 2,
      anomaly: Math.random() > 0.9
    });
  }
  return data;
};

const generateParticleFluxData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    energy: (i + 1) * 50,
    protons: Math.random() * 1000 + 100,
    electrons: Math.random() * 800 + 50,
    alphas: Math.random() * 200 + 20
  }));
};

const generateCMEData = () => {
  return [
    {
      id: 'CME-001',
      startTime: '2024-08-23T14:30:00Z',
      speed: 1200,
      direction: 'Earth-directed',
      intensity: 'Moderate',
      estimatedArrival: '2024-08-25T08:00:00Z',
      status: 'Tracking'
    },
    {
      id: 'CME-002',
      startTime: '2024-08-22T09:15:00Z',
      speed: 800,
      direction: 'Off-limb',
      intensity: 'Weak',
      estimatedArrival: null,
      status: 'Dissipating'
    }
  ];
};

// Enhanced Chart Components
const TimeSeriesChart = ({ data, selectedMetric = 'solarWindSpeed' }) => {
  const metrics = {
    solarWindSpeed: { color: '#00d4ff', name: 'Solar Wind Speed', unit: 'km/s' },
    protonDensity: { color: '#ff6b35', name: 'Proton Density', unit: '/cm³' },
    temperature: { color: '#ffd23f', name: 'Temperature', unit: 'K' },
    magneticField: { color: '#9d4edd', name: 'Magnetic Field', unit: 'nT' }
  };
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={metrics[selectedMetric].color} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={metrics[selectedMetric].color} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="time" stroke="#888" fontSize={12} />
        <YAxis stroke="#888" fontSize={12} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1e1e1e', 
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff'
          }}
        />
        <Area
          type="monotone"
          dataKey={selectedMetric}
          stroke={metrics[selectedMetric].color}
          fillOpacity={1}
          fill="url(#colorGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const ParticleFluxChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
      <XAxis dataKey="energy" stroke="#888" fontSize={12} />
      <YAxis stroke="#888" fontSize={12} />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: '#1e1e1e', 
          border: '1px solid #333',
          borderRadius: '8px',
          color: '#fff'
        }}
      />
      <Legend />
      <Line type="monotone" dataKey="protons" stroke="#00d4ff" strokeWidth={2} dot={{ r: 3 }} />
      <Line type="monotone" dataKey="electrons" stroke="#ff6b35" strokeWidth={2} dot={{ r: 3 }} />
      <Line type="monotone" dataKey="alphas" stroke="#ffd23f" strokeWidth={2} dot={{ r: 3 }} />
    </LineChart>
  </ResponsiveContainer>
);

const CMETracker = ({ data }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {data?.map((cme) => (
      <div key={cme.id} style={{
        backgroundColor: 'rgba(31, 41, 55, 0.8)',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid rgba(75, 85, 99, 0.7)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px'
        }}>
          <h4 style={{
            fontWeight: '600',
            color: '#60a5fa',
            margin: '0'
          }}>{cme.id}</h4>
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: cme.status === 'Tracking' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)',
            color: cme.status === 'Tracking' ? '#f87171' : '#9ca3af'
          }}>
            {cme.status}
          </span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          fontSize: '14px'
        }}>
          <div>
            <span style={{ color: '#9ca3af' }}>Speed:</span>
            <span style={{ marginLeft: '8px', color: 'white' }}>{cme.speed} km/s</span>
          </div>
          <div>
            <span style={{ color: '#9ca3af' }}>Direction:</span>
            <span style={{ marginLeft: '8px', color: 'white' }}>{cme.direction}</span>
          </div>
          <div>
            <span style={{ color: '#9ca3af' }}>Intensity:</span>
            <span style={{ marginLeft: '8px', color: 'white' }}>{cme.intensity}</span>
          </div>
          <div>
            <span style={{ color: '#9ca3af' }}>ETA:</span>
            <span style={{ marginLeft: '8px', color: 'white' }}>
              {cme.estimatedArrival ? new Date(cme.estimatedArrival).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function SolarDataDashboard() {
  const [solarData, setSolarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState('aspex');
  const [timeRange, setTimeRange] = useState('24h');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('solarWindSpeed');
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchSolarData = async () => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : 168;
      const timeSeries = generateSolarData(hours);
      const current = timeSeries[timeSeries.length - 1];
      
      setSolarData({
        current: {
          solarWindSpeed: Math.round(current.solarWindSpeed),
          protonDensity: Math.round(current.protonDensity * 10) / 10,
          temperature: Math.round(current.temperature),
          magneticField: Math.round(current.magneticField * 10) / 10
        },
        timeSeries,
        particleFlux: generateParticleFluxData(),
        cmeData: generateCMEData(),
        recentData: timeSeries.slice(-10).reverse(),
        activeCMEs: generateCMEData().filter(cme => cme.status === 'Tracking')
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching solar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolarData();
    
    if (realTimeEnabled) {
      const interval = setInterval(fetchSolarData, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedDataset, timeRange, realTimeEnabled]);

  const currentStats = solarData?.current || {};

  const getStatusStyle = (value, thresholds) => {
    if (value > thresholds[1]) {
      return {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        color: '#f87171',
        borderColor: 'rgba(239, 68, 68, 0.3)'
      };
    } else if (value > thresholds[0]) {
      return {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        color: '#fbbf24',
        borderColor: 'rgba(245, 158, 11, 0.3)'
      };
    } else {
      return {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        color: '#4ade80',
        borderColor: 'rgba(34, 197, 94, 0.3)'
      };
    }
  };

  const getStatusText = (value, thresholds) => {
    return value > thresholds[1] ? 'Critical' : 
           value > thresholds[0] ? 'Elevated' : 
           'Normal';
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1f2937 0%, #1e3a8a 50%, #581c87 100%)',
    color: 'white',
    padding: '24px'
  };

  const maxWidthStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  };

  const cardStyle = {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid rgba(75, 85, 99, 0.7)',
    transition: 'border-color 0.2s ease'
  };

  const headerStyle = {
    ...cardStyle,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };

  const headerTopStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px'
  };

  const titleStyle = {
    fontSize: '30px',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #60a5fa, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0'
  };

  const controlsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px'
  };

  const controlGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  const selectStyle = {
    backgroundColor: '#374151',
    border: '1px solid #4b5563',
    borderRadius: '8px',
    padding: '8px 12px',
    color: 'white',
    outline: 'none',
    fontSize: '14px'
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s ease',
    fontSize: '14px'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px'
  };

  const statsCardStyle = {
    ...cardStyle,
    cursor: 'pointer'
  };

  const statsHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  };

  const statsValueStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '4px'
  };

  const chartsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '24px'
  };

  const chartHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  };

  const loadingStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px'
  };

  const spinnerStyle = {
    width: '32px',
    height: '32px',
    border: '2px solid transparent',
    borderTop: '2px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const tableStyle = {
    width: '100%',
    fontSize: '14px',
    borderCollapse: 'collapse'
  };

  const tableHeaderStyle = {
    textAlign: 'left',
    padding: '12px 16px',
    color: '#9ca3af',
    borderBottom: '1px solid #4b5563'
  };

  const tableCellStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(75, 85, 99, 0.5)'
  };

  const tableRowStyle = {
    transition: 'background-color 0.2s ease',
    cursor: 'pointer'
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .table-row:hover {
            background-color: rgba(75, 85, 99, 0.3);
          }
          
          .button:hover {
            background-color: #1d4ed8;
          }
          
          .export-button {
            background-color: #059669;
          }
          
          .export-button:hover {
            background-color: #047857;
          }
          
          .stats-card:hover {
            border-color: #4b5563;
          }
          
          .pulse {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>
      
      <div style={maxWidthStyle}>
        
        {/* Header */}
        <div style={headerStyle}>
          <div style={headerTopStyle}>
            <div>
              <h1 style={titleStyle}>
                Solar Data Monitoring
              </h1>
              <p style={{ color: '#d1d5db', margin: '4px 0' }}>Real-time Aditya-L1 ASPEX & SUIT payload data</p>
              {lastUpdate && (
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: '8px 0 0 0' }}>
                  Last updated: {lastUpdate.toLocaleTimeString()}
                  {realTimeEnabled && <span style={{ marginLeft: '8px' }} className="pulse">🔴 LIVE</span>}
                </p>
              )}
            </div>
            
            <div style={controlsStyle}>
              <div style={controlGroupStyle}>
                <label style={{ fontSize: '14px', color: '#9ca3af' }}>Dataset</label>
                <select 
                  value={selectedDataset} 
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  style={selectStyle}
                >
                  <option value="aspex">ASPEX (Solar Wind)</option>
                  <option value="suit">SUIT (Imaging)</option>
                  <option value="combined">Combined View</option>
                </select>
              </div>
              
              <div style={controlGroupStyle}>
                <label style={{ fontSize: '14px', color: '#9ca3af' }}>Time Range</label>
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  style={selectStyle}
                >
                  <option value="1h">Last Hour</option>
                  <option value="6h">Last 6 Hours</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                </select>
              </div>
              
              <div style={{ ...controlGroupStyle, justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={realTimeEnabled}
                    onChange={(e) => setRealTimeEnabled(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#d1d5db' }}>Real-time Updates</span>
                </label>
              </div>
              
              
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={statsGridStyle}>
          {[
            { label: 'Solar Wind Speed', value: currentStats.solarWindSpeed, unit: 'km/s', icon: '⚡', thresholds: [400, 500] },
            { label: 'Proton Density', value: currentStats.protonDensity, unit: '/cm³', icon: '🌐', thresholds: [10, 20] },
            { label: 'Plasma Temperature', value: currentStats.temperature, unit: 'K', icon: '🌡️', thresholds: [100000, 200000] },
          ].map((stat, idx) => {
            const statusStyle = getStatusStyle(stat.value, stat.thresholds);
            const statusText = getStatusText(stat.value, stat.thresholds);
            return (
              <div key={idx} style={statsCardStyle} className="stats-card">
                <div style={statsHeaderStyle}>
                  <span style={{ fontSize: '48px' }}>{stat.icon}</span>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    border: '1px solid',
                    ...statusStyle
                  }}>
                    {statusText}
                  </span>
                </div>
                <div style={statsValueStyle}>
                  {stat.value ? `${stat.value} ${stat.unit}` : '--'}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '14px' }}>{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Charts */}
        <div style={chartsGridStyle}>
          <div style={cardStyle}>
            <div style={chartHeaderStyle}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>Solar Wind Parameters</h2>
              <select 
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                style={{ ...selectStyle, fontSize: '12px', padding: '4px 8px' }}
              >
                <option value="solarWindSpeed">Solar Wind Speed</option>
                <option value="protonDensity">Proton Density</option>
                <option value="temperature">Temperature</option>
                <option value="magneticField">Magnetic Field</option>
              </select>
            </div>
            {loading ? (
              <div style={loadingStyle}>
                <div style={spinnerStyle}></div>
              </div>
            ) : (
              <TimeSeriesChart data={solarData?.timeSeries} selectedMetric={selectedMetric} />
            )}
          </div>

          <div style={cardStyle}>
            <div style={chartHeaderStyle}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>Particle Flux Analysis</h2>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#4ade80' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#4ade80', borderRadius: '50%', marginRight: '8px' }}></span>
                Data Quality: Good
              </span>
            </div>
            {loading ? (
              <div style={loadingStyle}>
                <div style={spinnerStyle}></div>
              </div>
            ) : (
              <ParticleFluxChart data={solarData?.particleFlux} />
            )}
          </div>
        </div>

        {/* CME Tracker */}
        <div style={cardStyle}>
          <div style={chartHeaderStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>Coronal Mass Ejection Tracker</h2>
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>
              Active CMEs: <span style={{ color: '#f87171', fontWeight: '600' }}>{solarData?.activeCMEs?.length || 0}</span>
            </span>
          </div>
          {loading ? (
            <div style={loadingStyle}>
              <div style={spinnerStyle}></div>
            </div>
          ) : (
            <CMETracker data={solarData?.cmeData} />
          )}
        </div>

        {/* Recent Data Table */}
        <div style={cardStyle}>
          <div style={chartHeaderStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>Recent Data Points</h2>
            <button style={{ ...buttonStyle, backgroundColor: '#059669' }} className="export-button">
              Export CSV
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ borderBottom: '1px solid #4b5563' }}>
                  <th style={tableHeaderStyle}>Timestamp</th>
                  <th style={tableHeaderStyle}>Solar Wind (km/s)</th>
                  <th style={tableHeaderStyle}>Proton Density (/cm³)</th>
                  <th style={tableHeaderStyle}>Temperature (K)</th>
                  <th style={tableHeaderStyle}>Magnetic Field (nT)</th>
                  <th style={tableHeaderStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {solarData?.recentData?.slice(0, 8).map((row, i) => (
                  <tr key={i} style={tableRowStyle} className="table-row">
                    <td style={tableCellStyle}>{new Date(row.timestamp).toLocaleString()}</td>
                    <td style={tableCellStyle}>{Math.round(row.solarWindSpeed)}</td>
                    <td style={tableCellStyle}>{Math.round(row.protonDensity * 10) / 10}</td>
                    <td style={tableCellStyle}>{Math.round(row.temperature)}</td>
                    <td style={tableCellStyle}>{Math.round(row.magneticField * 10) / 10}</td>
                    <td style={tableCellStyle}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: row.anomaly ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        color: row.anomaly ? '#f87171' : '#4ade80'
                      }}>
                        {row.anomaly ? 'Anomaly' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}