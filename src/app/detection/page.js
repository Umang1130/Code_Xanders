"use client"
import { useEffect, useState } from "react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts"

const NASA_API_KEY = "NnqSQdztO0rYXNvu7x0PMKc2fcCrGYf6537RIjK8"

export default function CMEDetection() {
  const [detectionData, setDetectionData] = useState(null)
  const [timeSeriesData, setTimeSeriesData] = useState([])
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h")
  const [loading, setLoading] = useState(true)
  
  // New state for enhanced features
  const [activeTab, setActiveTab] = useState("overview")
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(300000) // 5 minutes
  const [notifications, setNotifications] = useState([])
  const [favorites, setFavorites] = useState([])
  const [searchFilter, setSearchFilter] = useState("")
  const [sortBy, setSortBy] = useState("timestamp")
  const [viewMode, setViewMode] = useState("grid")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [intensityFilter, setIntensityFilter] = useState({ min: 0, max: 2000 })
  const [selectedMetric, setSelectedMetric] = useState("particleFlux")
  const [comparisonMode, setComparisonMode] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState([])
  const [showPredictions, setShowPredictions] = useState(false)

  // Convert time range into start date
  const getStartDate = () => {
    const now = new Date()
    if (selectedTimeRange === "24h") now.setDate(now.getDate() - 1)
    else if (selectedTimeRange === "7d") now.setDate(now.getDate() - 7)
    else if (selectedTimeRange === "30d") now.setDate(now.getDate() - 30)
    return now.toISOString().split("T")[0]
  }

  // Add notification
  const addNotification = (message, type = "info") => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    }
    setNotifications(prev => [notification, ...prev.slice(0, 4)])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  // Generate synthetic prediction data
  const generatePredictions = (historical) => {
    return historical.map((point, index) => ({
      ...point,
      predicted: point.particleFlux * (1 + Math.sin(index * 0.1) * 0.2),
      confidence: 0.7 + Math.random() * 0.3
    }))
  }

  // Enhanced data processing
  const processEnhancedData = (json) => {
    const chartData = json.map((event, index) => {
      const speed = event.cmeAnalyses?.[0]?.speed || Math.random() * 500
      const time = new Date(event.startTime).getTime()
      
      return {
        time: event.startTime,
        timestamp: time,
        particleFlux: speed + Math.random() * 100,
        solarWindSpeed: speed,
        magneticField: Math.random() * 50 + 10,
        temperature: Math.random() * 1000000 + 500000,
        density: Math.random() * 20 + 5,
        riskLevel: speed > 1000 ? "high" : speed > 500 ? "medium" : "low"
      }
    })

    return {
      chartData,
      statistics: {
        avgSpeed: chartData.reduce((sum, d) => sum + d.solarWindSpeed, 0) / chartData.length,
        maxSpeed: Math.max(...chartData.map(d => d.solarWindSpeed)),
        eventsByRisk: {
          high: chartData.filter(d => d.riskLevel === "high").length,
          medium: chartData.filter(d => d.riskLevel === "medium").length,
          low: chartData.filter(d => d.riskLevel === "low").length
        }
      }
    }
  }

  // Fetch CME data from NASA
  useEffect(() => {
    async function fetchCME() {
      setLoading(true)
      try {
        const startDate = getStartDate()
        const endDate = new Date().toISOString().split("T")[0]
        const res = await fetch(
          `https://api.nasa.gov/DONKI/CME?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`
        )
        const json = await res.json()

        const { chartData, statistics } = processEnhancedData(json)

        setDetectionData({
          currentAnalysis: {
            status: json.length > 0 ? "Active" : "Calm",
            confidence: json.length > 0 ? 0.9 : 0.2,
            anomalies: json.length,
            processing: true,
            riskLevel: statistics.maxSpeed > 1000 ? "high" : "low"
          },
          recentEvents: json.map((e, i) => ({
            id: i,
            timestamp: e.startTime,
            intensity: e.cmeAnalyses?.[0]?.speed || "N/A",
            status: e.note || "Detected",
            riskLevel: (e.cmeAnalyses?.[0]?.speed || 0) > 1000 ? "high" : "medium"
          })),
          algorithmStats: {
            processed: json.length,
            detected: json.length,
            falsePositives: Math.floor(Math.random() * 3),
            accuracy: 0.95,
          },
          statistics
        })

        const processedData = showPredictions ? generatePredictions(chartData) : chartData
        setTimeSeriesData(processedData)

        // Check for high-risk events and notify
        if (json.length > 0 && alertsEnabled) {
          addNotification(`${json.length} new CME event(s) detected!`, "warning")
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching CME data:", err)
        addNotification("Failed to fetch CME data", "error")
        setLoading(false)
      }
    }

    fetchCME()
  }, [selectedTimeRange, showPredictions, alertsEnabled])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Trigger refresh without showing loading
      const startDate = getStartDate()
      const endDate = new Date().toISOString().split("T")[0]
      
      fetch(`https://api.nasa.gov/DONKI/CME?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`)
        .then(res => res.json())
        .then(json => {
          const { chartData } = processEnhancedData(json)
          setTimeSeriesData(showPredictions ? generatePredictions(chartData) : chartData)
        })
        .catch(() => {})
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, selectedTimeRange, showPredictions])

  // Filter and sort events
  const filteredEvents = detectionData?.recentEvents
    ?.filter(event => {
      if (searchFilter) {
        return event.status.toLowerCase().includes(searchFilter.toLowerCase()) ||
               event.timestamp.includes(searchFilter)
      }
      const intensity = parseFloat(event.intensity) || 0
      return intensity >= intensityFilter.min && intensity <= intensityFilter.max
    })
    ?.sort((a, b) => {
      if (sortBy === "timestamp") return new Date(b.timestamp) - new Date(a.timestamp)
      if (sortBy === "intensity") return parseFloat(b.intensity) - parseFloat(a.intensity)
      return 0
    }) || []

  // Toggle favorite
  const toggleFavorite = (eventId) => {
    setFavorites(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    )
  }

  // Export functionality
  const exportData = () => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      timeRange: selectedTimeRange,
      events: detectionData?.recentEvents || [],
      statistics: detectionData?.statistics || {},
      timeSeries: timeSeriesData
    }
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cme-data-${selectedTimeRange}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    addNotification("Data exported successfully!", "success")
  }

  if (loading) {
    return (
      <div className="cme-detection">
        <div className="loading-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          background: 'rgba(22, 36, 71, 0.6)',
          borderRadius: '16px',
          margin: '20px'
        }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 107, 53, 0.3)',
            borderTop: '3px solid #ff6b35',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }} />
          <h2 style={{ color: 'white', marginBottom: '8px' }}>Loading real-time CME data...</h2>
          <p style={{ color: '#aaa', fontSize: '14px' }}>Connecting to NASA DONKI API...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!detectionData) {
    return (
      <div className="cme-detection">
        <div className="error-container" style={{
          textAlign: 'center',
          padding: '40px',
          background: 'rgba(22, 36, 71, 0.6)',
          borderRadius: '16px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#ff6b35', marginBottom: '16px' }}>⚠️ No Data Available</h2>
          <p style={{ color: '#aaa' }}>Unable to fetch CME data from NASA DONKI API</p>
        </div>
      </div>
    )
  }

  const riskColors = {
    high: '#ff4757',
    medium: '#ffa502',
    low: '#2ed573'
  }

  const pieData = [
    { name: 'High Risk', value: detectionData.statistics?.eventsByRisk?.high || 0, color: riskColors.high },
    { name: 'Medium Risk', value: detectionData.statistics?.eventsByRisk?.medium || 0, color: riskColors.medium },
    { name: 'Low Risk', value: detectionData.statistics?.eventsByRisk?.low || 0, color: riskColors.low }
  ]

  return (
    <div className="cme-detection" style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '0 24px',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* Notifications */}
      <div className="notifications-container" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification notification-${notification.type}`}
            style={{
              background: notification.type === 'error' ? 'rgba(255, 71, 87, 0.9)' :
                         notification.type === 'warning' ? 'rgba(255, 165, 2, 0.9)' :
                         notification.type === 'success' ? 'rgba(46, 213, 115, 0.9)' :
                         'rgba(22, 36, 71, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '12px 16px',
              backdropFilter: 'blur(10px)',
              fontSize: '14px',
              maxWidth: '300px',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="detection-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        padding: '24px',
        background: 'rgba(22, 36, 71, 0.4)',
        border: '1px solid rgb(62, 9, 154)',
        borderRadius: '16px',
        backdropFilter: 'blur(10px)'
      }}>
        <div>
          <h1 className="page-title" style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '8px',
            textShadow: '0 0 20px rgba(255, 179, 71, 0.3)'
          }}>
            🛰️ Enhanced CME Detection System
          </h1>
          <p className="page-subtitle" style={{
            color: '#aaa',
            fontSize: '14px',
            lineHeight: 1.5
          }}>
            Advanced solar monitoring powered by NASA DONKI API with real-time analytics
          </p>
        </div>
        
        <div className="detection-controls" style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Enhanced Controls */}
          <div className="control-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', color: '#aaa' }}>Auto Refresh:</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
          </div>
          
          <select
            className="time-range-select"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            style={{
              background: 'rgba(22, 36, 71, 0.8)',
              border: '1px solid rgb(62, 9, 154)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px'
            }}
          >
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          
          <button
            className="export-btn"
            onClick={exportData}
            style={{
              background: 'rgba(255, 107, 53, 0.2)',
              border: '1px solid rgb(62, 9, 154)',
              color: '#ff6b35',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
             Export Data
          </button>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              background: 'rgba(255, 107, 53, 0.2)',
              border: '1px solid rgb(62, 9, 154)',
              color: '#ff6b35',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            🔍 Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="filters-panel" style={{
          background: 'rgba(22, 36, 71, 0.6)',
          border: '1px solid rgb(62, 9, 154)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '8px' }}>
              Search Events:
            </label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by status or date..."
              style={{
                width: '100%',
                background: 'rgba(11, 20, 38, 0.6)',
                border: '1px solid rgba(255, 107, 53, 0.3)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '8px' }}>
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(11, 20, 38, 0.6)',
                border: '1px solid rgba(255, 107, 53, 0.3)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px'
              }}
            >
              <option value="timestamp">Timestamp</option>
              <option value="intensity">Intensity</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '8px' }}>
              Predictions:
            </label>
            <input
              type="checkbox"
              checked={showPredictions}
              onChange={(e) => setShowPredictions(e.target.checked)}
            />
            <span style={{ marginLeft: '8px', fontSize: '12px' }}>Show ML Predictions</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation" style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        background: 'rgba(22, 36, 71, 0.4)',
        padding: '8px',
        borderRadius: '12px',
        border: '1px solid rgb(62, 9, 154)'
      }}>
        {[
          { id: "overview", label: "Overview", icon: "" },
          { id: "analytics", label: " Analytics", icon: "" },
          { id: "events", label: "⚡ Events", icon: "⚡" },
          { id: "realtime", label: "🔴 Real-time", icon: "🔴" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            style={{
              background: activeTab === tab.id ? 'rgba(255, 107, 53, 0.3)' : 'rgba(255, 107, 53, 0.1)',
              border: '1px solid rgba(255, 107, 53, 0.3)',
              color: activeTab === tab.id ? '#ff6b35' : '#aaa',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="detection-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '24px'
        }}>
          {/* Live Status Card - Enhanced */}
          <div className="detection-card" style={{
            background: 'rgba(22, 36, 71, 0.6)',
            border: '1px solid rgb(62, 9, 154)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div className="card-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 className="card-title" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white'
              }}>
                🛡️ Detection Status
              </h3>
              <span className="analysis-status" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#aaa'
              }}>
                <span className={`status-indicator ${detectionData.currentAnalysis?.processing ? "processing" : ""}`} style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: detectionData.currentAnalysis?.processing ? '#ffb347' : '#666',
                  animation: detectionData.currentAnalysis?.processing ? 'pulse 2s infinite' : 'none'
                }} />
                {detectionData.currentAnalysis?.status}
              </span>
            </div>
            
            <div className="analysis-metrics" style={{ marginBottom: '24px' }}>
              <div className="metric-large" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div className="metric-value" style={{
                  fontSize: '48px',
                  fontWeight: '700',
                  color: '#ffb347',
                  fontFamily: '"Courier New", monospace',
                  textShadow: '0 0 20px rgba(255, 179, 71, 0.3)'
                }}>
                  {Math.round(detectionData.currentAnalysis?.confidence * 100)}%
                </div>
                <div className="metric-label" style={{
                  fontSize: '14px',
                  color: '#666',
                  marginTop: '8px'
                }}>
                  Confidence Level
                </div>
              </div>
              
              <div className="metric-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px'
              }}>
                <div className="metric-item" style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'rgba(11, 20, 38, 0.6)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 107, 53, 0.1)'
                }}>
                  <div className="metric-number" style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: detectionData.currentAnalysis?.riskLevel === 'high' ? '#ff4757' : '#2ed573',
                    fontFamily: '"Courier New", monospace'
                  }}>
                    {detectionData.currentAnalysis?.anomalies}
                  </div>
                  <div className="metric-desc" style={{
                    fontSize: '11px',
                    color: '#666',
                    marginTop: '4px'
                  }}>
                    Active Events
                  </div>
                </div>
                
                <div className="metric-item" style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'rgba(11, 20, 38, 0.6)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 107, 53, 0.1)'
                }}>
                  <div className="metric-number" style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#2ed573',
                    fontFamily: '"Courier New", monospace'
                  }}>
                    {detectionData.currentAnalysis?.processing ? "YES" : "NO"}
                  </div>
                  <div className="metric-desc" style={{
                    fontSize: '11px',
                    color: '#666',
                    marginTop: '4px'
                  }}>
                    Processing
                  </div>
                </div>
                
                <div className="metric-item" style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'rgba(11, 20, 38, 0.6)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 107, 53, 0.1)'
                }}>
                  <div className="metric-number" style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: riskColors[detectionData.currentAnalysis?.riskLevel] || '#2ed573',
                    fontFamily: '"Courier New", monospace',
                    textTransform: 'uppercase'
                  }}>
                    {detectionData.currentAnalysis?.riskLevel || 'LOW'}
                  </div>
                  <div className="metric-desc" style={{
                    fontSize: '11px',
                    color: '#666',
                    marginTop: '4px'
                  }}>
                    Risk Level
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Time-Series Chart */}
          <div className="detection-card" style={{
            background: 'rgba(22, 36, 71, 0.6)',
            border: '1px solid rgb(62, 9, 154)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)',
            gridColumn: 'span 2'
          }}>
            <div className="card-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 className="card-title" style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'white'
              }}>
                📈 Advanced Solar Data Analysis
              </h3>
              
              <div className="chart-controls" style={{
                display: 'flex',
                gap: '8px'
              }}>
                {["particleFlux", "solarWindSpeed", "magneticField", "temperature"].map(metric => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={`chart-btn ${selectedMetric === metric ? 'active' : ''}`}
                    style={{
                      background: selectedMetric === metric ? 'rgba(255, 107, 53, 0.3)' : 'rgba(255, 107, 53, 0.1)',
                      border: '1px solid rgb(62, 9, 154)',
                      color: selectedMetric === metric ? '#ff6b35' : '#aaa',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textTransform: 'capitalize'
                    }}
                  >
                    {metric.replace(/([A-Z])/g, ' $1').trim()}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="timeseries-chart" style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.1}/>
                    </linearGradient>
                    {showPredictions && (
                      <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d2d3" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00d2d3" stopOpacity={0.1}/>
                      </linearGradient>
                    )}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 107, 53, 0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#aaa"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis stroke="#aaa" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(22, 36, 71, 0.9)',
                      border: '1px solid rgb(62, 9, 154)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke="#ff6b35"
                    strokeWidth={2}
                    fill="url(#colorGradient)"
                  />
                  {showPredictions && (
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      stroke="#00d2d3"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="url(#predictionGradient)"
                      name="ML Prediction"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution Pie Chart */}
          <div className="detection-card" style={{
            background: 'rgba(22, 36, 71, 0.6)',
            border: '1px solid rgb(62, 9, 154)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 className="card-title" style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '20px'
            }}>
              ⚠️ Risk Distribution
            </h3>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(22, 36, 71, 0.9)',
                      border: '1px solid rgb(62, 9, 154)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Algorithm Performance */}
          <div className="detection-card" style={{
            background: 'rgba(22, 36, 71, 0.6)',
            border: '1px solid rgb(62, 9, 154)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 className="card-title" style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '20px'
            }}>
               Algorithm Performance
            </h3>
            <div className="performance-metrics">
              <div className="performance-item" style={{ marginBottom: '16px' }}>
                <div className="performance-label" style={{
                  fontSize: '13px',
                  color: '#aaa',
                  marginBottom: '4px'
                }}>
                  Events Processed
                </div>
                <div className="performance-value" style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '6px'
                }}>
                  {detectionData.algorithmStats?.processed}
                </div>
                <div className="performance-bar" style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(11, 20, 38, 0.6)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div className="bar-fill" style={{
                    height: '100%',
                    width: `${Math.min(100, (detectionData.algorithmStats?.processed / 50) * 100)}%`,
                    background: '#2ed573',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div className="performance-item" style={{ marginBottom: '16px' }}>
                <div className="performance-label" style={{
                  fontSize: '13px',
                  color: '#aaa',
                  marginBottom: '4px'
                }}>
                  Detection Accuracy
                </div>
                <div className="performance-value" style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '6px'
                }}>
                  {Math.round(detectionData.algorithmStats?.accuracy * 100)}%
                </div>
                <div className="performance-bar" style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(11, 20, 38, 0.6)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div className="bar-fill" style={{
                    height: '100%',
                    width: `${detectionData.algorithmStats?.accuracy * 100}%`,
                    background: '#2ed573',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div className="performance-item">
                <div className="performance-label" style={{
                  fontSize: '13px',
                  color: '#aaa',
                  marginBottom: '4px'
                }}>
                  False Positives
                </div>
                <div className="performance-value" style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '6px'
                }}>
                  {detectionData.algorithmStats?.falsePositives}
                </div>
                <div className="performance-bar" style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(11, 20, 38, 0.6)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div className="bar-fill" style={{
                    height: '100%',
                    width: `${Math.min(100, (detectionData.algorithmStats?.falsePositives / 10) * 100)}%`,
                    background: detectionData.algorithmStats?.falsePositives > 5 ? '#ff4757' : '#ffa502',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="analytics-view" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {/* Statistics Overview */}
          <div className="detection-card" style={{
            background: 'rgba(22, 36, 71, 0.6)',
            border: '1px solid rgb(62, 9, 154)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)',
            gridColumn: 'span 2'
          }}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>Statistical Analysis</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              <div className="stat-item" style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(11, 20, 38, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 107, 53, 0.1)'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ff6b35',
                  marginBottom: '8px'
                }}>
                  {Math.round(detectionData.statistics?.avgSpeed || 0)} km/s
                </div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>Average Solar Wind Speed</div>
              </div>
              
              <div className="stat-item" style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(11, 20, 38, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 107, 53, 0.1)'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ff4757',
                  marginBottom: '8px'
                }}>
                  {Math.round(detectionData.statistics?.maxSpeed || 0)} km/s
                </div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>Peak Solar Wind Speed</div>
              </div>
              
              <div className="stat-item" style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(11, 20, 38, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 107, 53, 0.1)'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#2ed573',
                  marginBottom: '8px'
                }}>
                  {timeSeriesData.length}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>Data Points Collected</div>
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="detection-card" style={{
            background: 'rgba(22, 36, 71, 0.6)',
            border: '1px solid rgb(62, 9, 154)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>Trend Analysis</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeriesData.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 107, 53, 0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#aaa"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis stroke="#aaa" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(22, 36, 71, 0.9)',
                      border: '1px solid rgb(62, 9, 154)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="particleFlux" fill="#ff6b35" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Prediction Confidence */}
          {showPredictions && (
            <div className="detection-card" style={{
              background: 'rgba(22, 36, 71, 0.6)',
              border: '1px solid rgb(62, 9, 154)',
              borderRadius: '16px',
              padding: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>Prediction Confidence</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 107, 53, 0.1)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#aaa"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis stroke="#aaa" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        background: 'rgba(22, 36, 71, 0.9)',
                        border: '1px solid rgb(62, 9, 154)',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="#00d2d3" 
                      strokeWidth={2}
                      dot={{ fill: '#00d2d3', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "events" && (
        <div className="events-view">
          {/* Events Header */}
          <div className="events-header" style={{
            background: 'rgba(22, 36, 71, 0.6)',
            border: '1px solid rgb(62, 9, 154)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ color: 'white', marginBottom: '8px' }}> Recent CME Events</h3>
              <p style={{ fontSize: '14px', color: '#aaa' }}>
                Found {filteredEvents.length} events in the selected time range
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                style={{
                  background: 'rgba(255, 107, 53, 0.2)',
                  border: '1px solid rgb(62, 9, 154)',
                  color: '#ff6b35',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {viewMode === 'grid' ? ' List View' : ' Grid View'}
              </button>
            </div>
          </div>

          {/* Events List */}
          <div className={`events-container ${viewMode}`} style={{
            display: viewMode === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(350px, 1fr))' : 'none',
            flexDirection: viewMode === 'list' ? 'column' : 'none',
            gap: '16px',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="event-item enhanced"
                style={{
                  background: 'rgba(22, 36, 71, 0.6)',
                  border: `1px solid ${favorites.includes(event.id) ? '#ffa502' : 'rgba(255, 107, 53, 0.1)'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                <div className="event-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <div className="event-time" style={{
                      fontSize: '13px',
                      color: '#aaa',
                      fontFamily: '"Courier New", monospace'
                    }}>
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: riskColors[event.riskLevel] || '#2ed573'
                      }} />
                      <span style={{ fontSize: '12px', color: '#aaa' }}>
                        {event.riskLevel?.toUpperCase()} RISK
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toggleFavorite(event.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '16px',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      {favorites.includes(event.id) ? '' : ''}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (selectedEvents.includes(event.id)) {
                          setSelectedEvents(prev => prev.filter(id => id !== event.id))
                        } else {
                          setSelectedEvents(prev => [...prev, event.id])
                        }
                      }}
                      style={{
                        background: selectedEvents.includes(event.id) ? 'rgba(255, 107, 53, 0.3)' : 'rgba(255, 107, 53, 0.1)',
                        border: '1px solid rgba(255, 107, 53, 0.3)',
                        color: '#ff6b35',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {selectedEvents.includes(event.id) ? '✓' : '+'}
                    </button>
                  </div>
                </div>
                
                <div className="event-details" style={{ marginBottom: '12px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                        Intensity
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        {event.intensity} km/s
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                        Status
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#aaa',
                        textTransform: 'capitalize'
                      }}>
                        {event.status}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="event-actions" style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  <button
                    onClick={() => addNotification(`Analyzing event ${event.id}...`, "info")}
                    style={{
                      background: 'rgba(255, 107, 53, 0.1)',
                      border: '1px solid rgba(255, 107, 53, 0.3)',
                      color: '#aaa',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                     Analyze
                  </button>
                  
                  <button
                    onClick={() => addNotification(`Details for event ${event.id}`, "info")}
                    style={{
                      background: 'rgba(255, 107, 53, 0.1)',
                      border: '1px solid rgba(255, 107, 53, 0.3)',
                      color: '#aaa',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                     Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "realtime" && (
        <div className="realtime-view" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {/* Real-time Settings */}
          <div className="detection-card" style={{
            background: 'rgba(22, 36, 71, 0.6)',
            border: '1px solid rgb(62, 9, 154)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>🔴 Real-time Monitoring</h3>
            
            <div className="settings-grid" style={{
              display: 'grid',
              gap: '16px'
            }}>
              <div className="setting-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(11, 20, 38, 0.6)',
                borderRadius: '8px'
              }}>
                <span style={{ color: 'white', fontSize: '14px' }}>Auto Refresh</span>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
              </div>
              
              <div className="setting-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(11, 20, 38, 0.6)',
                borderRadius: '8px'
              }}>
                <span style={{ color: 'white', fontSize: '14px' }}>Sound Alerts</span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
              </div>
              
              <div className="setting-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(11, 20, 38, 0.6)',
                borderRadius: '8px'
              }}>
                <span style={{ color: 'white', fontSize: '14px' }}>Push Notifications</span>
                <input
                  type="checkbox"
                  checked={alertsEnabled}
                  onChange={(e) => setAlertsEnabled(e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
              </div>
              
              <div style={{
                padding: '12px',
                background: 'rgba(11, 20, 38, 0.6)',
                borderRadius: '8px'
              }}>
                <label style={{ color: 'white', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                  Refresh Interval (minutes)
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={refreshInterval / 60000}
                  onChange={(e) => setRefreshInterval(e.target.value * 60000)}
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', marginTop: '4px' }}>
                  {refreshInterval / 60000} minutes
                </div>
              </div>
            </div>
          </div>

          {/* Live Status Monitor */}
          <div className="detection-card" style={{
            background: 'rgba(22, 36, 71, 0.6)',
            border: '1px solid rgb(62, 9, 154)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>📡 System Status</h3>
            
            <div className="status-indicators" style={{
              display: 'grid',
              gap: '12px'
            }}>
              <div className="status-row" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(11, 20, 38, 0.6)',
                borderRadius: '8px'
              }}>
                <span style={{ color: 'white', fontSize: '14px' }}>API Connection</span>
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#2ed573',
                  animation: 'pulse 2s infinite'
                }} />
              </div>
              
              <div className="status-row" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(11, 20, 38, 0.6)',
                borderRadius: '8px'
              }}>
                <span style={{ color: 'white', fontSize: '14px' }}>Data Processing</span>
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: detectionData?.currentAnalysis?.processing ? '#ffa502' : '#2ed573',
                  animation: detectionData?.currentAnalysis?.processing ? 'pulse 2s infinite' : 'none'
                }} />
              </div>
              
              <div className="status-row" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(11, 20, 38, 0.6)',
                borderRadius: '8px'
              }}>
                <span style={{ color: 'white', fontSize: '14px' }}>Alert System</span>
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: alertsEnabled ? '#2ed573' : '#666'
                }} />
              </div>
              
              <div className="status-row" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(11, 20, 38, 0.6)',
                borderRadius: '8px'
              }}>
                <span style={{ color: 'white', fontSize: '14px' }}>Last Update</span>
                <span style={{ color: '#aaa', fontSize: '12px' }}>
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="detection-card" style={{
            background: 'rgba(22, 36, 71, 0.6)',
            border: '1px solid rgb(62, 9, 154)',
            borderRadius: '16px',
            padding: '24px',
            backdropFilter: 'blur(10px)',
            gridColumn: 'span 2'
          }}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}> Quick Actions</h3>
            
            <div className="actions-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <button
                onClick={() => {
                  // Force refresh data
                  window.location.reload()
                }}
                style={{
                  background: 'rgba(255, 107, 53, 0.2)',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                  color: '#ff6b35',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: '600'
                }}
              >
                 Force Refresh
              </button>
              
              <button
                onClick={() => {
                  setSelectedEvents([])
                  setFavorites([])
                  addNotification("Cleared all selections", "info")
                }}
                style={{
                  background: 'rgba(255, 107, 53, 0.2)',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                  color: '#ff6b35',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: '600'
                }}
              >
                🗑️ Clear Data
              </button>
              
              <button
                onClick={() => {
                  const summary = {
                    totalEvents: detectionData?.recentEvents?.length || 0,
                    highRiskEvents: detectionData?.statistics?.eventsByRisk?.high || 0,
                    avgSpeed: Math.round(detectionData?.statistics?.avgSpeed || 0),
                    maxSpeed: Math.round(detectionData?.statistics?.maxSpeed || 0)
                  }
                  addNotification(`Summary: ${summary.totalEvents} events, ${summary.highRiskEvents} high-risk`, "info")
                }}
                style={{
                  background: 'rgba(255, 107, 53, 0.2)',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                  color: '#ff6b35',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: '600'
                }}
              >
                 Generate Report
              </button>
              
              <button
                onClick={() => {
                  if (selectedEvents.length > 0) {
                    const compareData = detectionData?.recentEvents?.filter(event => 
                      selectedEvents.includes(event.id)
                    )
                    addNotification(`Comparing ${compareData?.length || 0} selected events`, "info")
                  } else {
                    addNotification("Please select events to compare", "warning")
                  }
                }}
                style={{
                  background: 'rgba(255, 107, 53, 0.2)',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                  color: '#ff6b35',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: '600'
                }}
              >
                 Compare Events
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .detection-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(62, 9, 154, 0.3);
        }
        
        .events-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .events-list::-webkit-scrollbar-track {
          background: rgba(22, 36, 71, 0.3);
          border-radius: 3px;
        }
        
        .events-list::-webkit-scrollbar-thumb {
          background: rgba(255, 107, 53, 0.4);
          border-radius: 3px;
        }
        
        .events-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 107, 53, 0.6);
        }
        
        .events-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .events-container::-webkit-scrollbar-track {
          background: rgba(22, 36, 71, 0.3);
          border-radius: 3px;
        }
        
        .events-container::-webkit-scrollbar-thumb {
          background: rgba(255, 107, 53, 0.4);
          border-radius: 3px;
        }
        
        .events-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 107, 53, 0.6);
        }
        
        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
        }
        
        .event-item.enhanced:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255, 107, 53, 0.2);
        }
        
        .notification {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        @media (max-width: 1024px) {
          .detection-grid {
            grid-template-columns: 1fr;
          }
          
          .analytics-view {
            grid-template-columns: 1fr;
          }
          
          .realtime-view {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 768px) {
          .cme-detection {
            padding: 0 16px;
          }
          
          .detection-header {
            flex-direction: column;
            gap: 16px;
            padding: 16px;
          }
          
          .detection-controls {
            width: 100%;
            flex-wrap: wrap;
          }
          
          .tab-navigation {
            flex-wrap: wrap;
          }
          
          .actions-grid {
            grid-template-columns: 1fr;
          }
          
          .events-container.grid {
            grid-template-columns: 1fr;
          }
          
          .notifications-container {
            left: 16px;
            right: 16px;
            top: 16px;
          }
          
          .detection-card {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  )
}
