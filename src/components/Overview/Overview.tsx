import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import { Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, ReferenceDot, Label, Area } from 'recharts';
import Logging from '../Logging/Logging';
import Profile from '../Profile/Profile';
import './Overview.css';
import { useSchedule } from '../../context/ScheduleContext';

// Add this helper function to round to nearest quarter hour
const roundToNearestQuarter = (time: number) => {
  const quarters = Math.round(time * 4) / 4;
  return Number(quarters.toFixed(2)); // Ensure we don't get floating point errors
};

// Add this interface at the top of the file with other imports
interface Schedule {
  Activity: string[];
  [key: string]: string[];
}

const Overview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { schedule, baseSchedule } = useSchedule();

  const getCurrentTimeDecimal = useCallback(() => {
    const now = new Date();
    const time = now.getHours() + now.getMinutes() / 60;
    return roundToNearestQuarter(time); // Round to nearest quarter hour
  }, []);

  const [currentTime, setCurrentTime] = useState(getCurrentTimeDecimal());

  useEffect(() => {
    // Update immediately on mount
    setCurrentTime(getCurrentTimeDecimal());

    const timer = setInterval(() => {
      const newTime = getCurrentTimeDecimal();
      setCurrentTime(newTime);
      console.log("Current time updated:", newTime); // Debug log
    }, 15000); // Update every 15 seconds

    return () => clearInterval(timer);
  }, [getCurrentTimeDecimal]); // Add getCurrentTimeDecimal to dependencies

  // Force re-render when currentTime changes
  useEffect(() => {
    // This effect will run whenever currentTime changes
  }, [currentTime]);

  const getHeaderLogo = () => {
    switch (location.pathname) {
      case '/logging':
        return (
          <>
            <h3>Logging</h3>
          </>
        );
      case '/profile':
        return (
          <>      
            <h3>Profile</h3>
          </>
        );
      default:
        return (
          <>
            <h3>Overview</h3>
          </>
        );
    }
  };

  // Update the generateTemperatureData function
  const generateTemperatureData = (wakeTime: string) => {
    const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number);
    const wakeTimeDecimal = wakeHours + wakeMinutes / 60;
    const tMinTime = wakeTimeDecimal - 2;

    // Generate data points for a 24-hour period
    return Array.from({ length: 97 }, (_, i) => {
      const hour = roundToNearestQuarter(i / 4);
      
      // Adjust phase so the minimum (not maximum) occurs at T-min
      const phase = (hour - tMinTime - 6) * (Math.PI / 12);
      // const temp = 98 + Math.sin(phase) * 2;
      const temp = 98 + (1.6 * Math.cos(phase));
      
      return {
        time: hour,
        temperature: temp,
        isLightSensitive: hour >= (tMinTime - 4) && hour <= (tMinTime + 4),
        isDeadZone: hour >= 10 && hour <= 16,
      };
    });
  };

  // Add this state for the toggle
  const [highlightedCurve, setHighlightedCurve] = useState<'current' | 'target'>('current');

  // Add this function to render the combined chart
  const renderCombinedChart = () => {
    if (!schedule || !baseSchedule) return null;

    // Generate data for both curves
    const currentWakeTime = baseSchedule.wakeTime;
    const targetWakeTime = schedule['Day 1'][0];
    const currentData = generateTemperatureData(currentWakeTime);
    const targetData = generateTemperatureData(targetWakeTime);

    // Combine the data
    const combinedData = currentData.map((item, index) => ({
      time: item.time,
      currentTemp: item.temperature,
      targetTemp: targetData[index].temperature,
      isLightSensitive: item.isLightSensitive,
      isDeadZone: item.isDeadZone,
    }));

    // Calculate T-min times for both curves
    const [currentWakeHours] = currentWakeTime.split(':').map(Number);
    const [targetWakeHours] = targetWakeTime.split(':').map(Number);
    const currentTMinTime = currentWakeHours - 2;
    const targetTMinTime = targetWakeHours - 2;

    // Calculate current temperature using the same phase formula as generateTemperatureData
    const phase = (currentTime - currentTMinTime - 6) * (Math.PI / 12);
    const currentTemp = 98 + Math.sin(phase) * 2;

    // Get light exposure times from schedule
    const getLightExposureTimes = (daySchedule: string[], activities: string[]) => {
      const times: { start: number; end: number; }[] = [];
      
      activities.forEach((activity, index) => {
        if (activity.toLowerCase().includes('light exposure start')) {
          const [startHour] = daySchedule[index].split(':').map(Number);
          const [endHour] = daySchedule[index + 1].split(':').map(Number);
          times.push({ start: startHour, end: endHour });
        }
      });
      
      return times;
    };

    // Get current and target light exposure times
    const currentLightExposures = getLightExposureTimes(schedule['Day 1'], schedule.Activity);
    const targetLightExposures = getLightExposureTimes(schedule['Day 1'], schedule.Activity);
    console.log("currentLightExposures", currentLightExposures);

    const legendPayload = [
      {
        value: 'Light Sensitive Zone',
        type: 'rect',
        color: 'rgba(255,107,107, 0.2)',
        id: 'lightSensitive'
      },
      {
        value: 'Dead Zone',
        type: 'rect',
        color: 'rgba(113,128,150, 0.2)',
        id: 'deadZone'
      },
      {
        value: 'Light Exposure',
        type: 'rect',
        color: '#ebf8ff',
        id: 'lightExposure'
      },
      {
        value: 'Light Avoidance Zone',
        type: 'rect',
        color: 'rgba(81, 87, 253, 0.41)',
        id: 'lightAvoidance'
      },
    ];

    // Add this custom legend component
    const CustomLegend = () => {
      return (
        <div className="custom-legend">
          {legendPayload.map((item) => (
            <div 
              key={item.id} 
              className="legend-item"
              style={{ opacity: highlightedCurve === 'current' ? 1 : 0.3 }}
            >
              <span 
                className={`legend-icon ${item.type}`}
                style={{ 
                  backgroundColor: item.type === 'rect' ? item.color : 'transparent',
                  borderTop: item.type === 'line' ? `2px solid ${item.color}` : 
                            item.type === 'dotted line' ? `3px dotted ${item.color}` : 'none'
                }}
              />
              <span className="legend-label">{item.value}</span>
            </div>
          ))}
        </div>
      );
    };

    // In the renderCombinedChart function, add this helper to convert time string to decimal
    const timeToDecimal = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours + minutes / 60;
    };

    // Calculate light avoidance zone (6 to 4 hours before bedtime)
    const getBedtimeHours = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours + minutes / 60;
    };

    // Calculate light avoidance zone (6 to 4 hours before bedtime)
    const bedtimeHours = baseSchedule.bedTime ? getBedtimeHours(baseSchedule.bedTime) : 22;
    const lightAvoidanceStartTime = bedtimeHours - 6; // 6 hours before bedtime
    const lightAvoidanceEndTime = bedtimeHours - 4;   // 4 hours before bedtime

    return (
      <div className="temperature-chart">
        <h3> Temperature Rhythms</h3>
        <div className="chart-controls">
          <button 
            className={`toggle-button ${highlightedCurve === 'current' ? 'active' : ''}`}
            onClick={() => setHighlightedCurve('current')}
          >
            Current Rhythm {highlightedCurve}
          </button>
          <button 
            className={`toggle-button ${highlightedCurve === 'target' ? 'active' : ''}`}
            onClick={() => setHighlightedCurve('target')}
          >
            Day 1 Rhythm
          </button>
        </div>
       
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 25, bottom: 20 }}>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            
            {/* Current rhythm zones */}
            <ReferenceArea
              name="Light Sensitive Zone"
              x1={currentTMinTime - 4}
              x2={currentTMinTime + 4}
              y1={96}
              y2={100}
              fill="rgba(230, 57, 70, 1)"
              fillOpacity={highlightedCurve === 'current' ? 0.6 : 0}
            />
            <ReferenceArea
              name="Dead Zone"
              x1={currentTMinTime + 6}
              x2={currentTMinTime + 10}
              y1={96}
              y2={100}
              fill="rgba(113,128,150, 0.2)"
              fillOpacity={highlightedCurve === 'current' ? 0.6 : 0}
            />

            {/* Light avoidance zone */}
            <ReferenceArea
              name="Light Avoidance Zone"
              x1={lightAvoidanceStartTime}
              x2={lightAvoidanceEndTime}
              y1={96}
              y2={100}
              fill="rgba(0, 53, 84, 1)"
              fillOpacity={highlightedCurve === 'current' ? 0.6 : 0}
            />

            {/* Target rhythm zones */}
            <ReferenceArea
              name="Light Sensitive Zone"
              x1={targetTMinTime - 4 < 0 ? 0 : targetTMinTime - 4}
              x2={targetTMinTime + 4 > 24 ? 24 : targetTMinTime + 4}
              y1={96}
              y2={100}
              fill="rgba(255,107,107, 0.2)"
              fillOpacity={highlightedCurve === 'target' ? 0.6 : 0}
            />
            <ReferenceArea
              name="Dead Zone"
              x1={targetTMinTime + 6}
              x2={targetTMinTime + 10}
              y1={96}
              y2={100}
              fill="rgba(113,128,150, 0.2)"
              fillOpacity={highlightedCurve === 'target' ? 0.6 : 0}
            />

            {/* Light exposure zones */}
              <ReferenceArea
                x1={currentLightExposures[0].start}
                x2={currentLightExposures[0].end < currentLightExposures[0].start ? 24 : currentLightExposures[0].end}
                y1={96}
                y2={100}
                label={{
                  value: "Light Exposure",
                  position: "center",
                  fill: "#4299e1",
                  fontSize: 10,
                  opacity: highlightedCurve === 'current' ? 1 : 0
                }}
                fill="rgba(252, 191, 73, 1)"
                fillOpacity={highlightedCurve === 'current' ? 0.9 : 0}
                stroke="#4299e1"
                strokeOpacity={highlightedCurve === 'current' ? 0.2 : 0}
              />
           

            {/* {targetLightExposures.map((exposure, index) => (
              <ReferenceArea
                key={`target-light-${index}`}
                x1={exposure.start}
                x2={exposure.end}
                y1={96}
                y2={100}
                fill="#f0fff4"
                fillOpacity={highlightedCurve === 'target' ? 0.3 : 0}
                stroke="#38A169"
                strokeOpacity={highlightedCurve === 'target' ? 0.2 : 0}
              />
            ))} */}

            {/* Current rhythm curve */}
            {/* <Line
              type="monotone"
              dataKey="currentTemp"
              stroke="#2b6cb0"
              strokeWidth={highlightedCurve === 'current' ? 1 : 0.5}
              dot={false}
              opacity={highlightedCurve === 'current' ? 1 : 0.3}
            /> */}
            {/* Current T-min line */}
            {/* <ReferenceLine
              x={currentTMinTime}
              stroke="#E53E3E"
              opacity={highlightedCurve === 'current' ? 1 : 0.05}
              strokeWidth={highlightedCurve === 'current' ? 1 : 0.05}
              style={{ strokeWidth: highlightedCurve === 'current' ? '2px' : '1px' }}
            /> */}
            {/* Current wake time line */}
            <ReferenceLine
              x={currentWakeHours}
              stroke="#2b6cb0"              
              strokeDasharray="3 3"
              opacity={highlightedCurve === 'current' ? 1 : 0.05}
              label={{ 
                value: "☀️ Current Wake",
                position: "top",
                fill: "#2b6cb0",
                fontSize: 12,
                opacity: highlightedCurve === 'current' ? 1 : 0.05
              }}
            />



            {/* Target rhythm curve */}
            <Line
              type="monotone"
              dataKey="targetTemp"
              stroke="#38A169"
              strokeWidth={highlightedCurve === 'target' ? 1 : 0.5}
              dot={false}
              opacity={highlightedCurve === 'target' ? 1 : 0.2}
            />
            {/* Target T-min line */}
            <ReferenceLine
              x={targetTMinTime}
              stroke="red"
              opacity={highlightedCurve === 'target' ? 1 : 0.01}
              label={{ 
                value: "Target T-min",
                position: "top",
                fill: "#38A169",
                fontSize: 12,
                opacity: highlightedCurve === 'target' ? 1 : 0.05
              }}
            />

            {/* Target wake time line */}
            <ReferenceLine
              x={targetWakeHours}
              stroke="orange"
              strokeWidth={highlightedCurve === 'target' ? 2 : 1}
              strokeDasharray="5 5"
              opacity={highlightedCurve === 'target' ? 1 : 0.05}
              label={{ 
                value: "Target Wake",
                position: "top",
                fill: "#38A169",
                fontSize: 12,
                opacity: highlightedCurve === 'target' ? 1 : 0.05
              }}
            />

            {/* Current time marker */}
            <ReferenceDot
              x={currentTime}
              y={currentTemp}
              r={6}
              fill="#38B2AC"
              stroke="#fff"
              strokeWidth={2}
              className="current-time-dot"
              label={{
                value: "Current Time",
                position: "top",
                offset: 15,
                fill: "#38B2AC",
                fontSize: 12
              }}
            />

            <XAxis
              dataKey="time"
              tickFormatter={(value) => `${Math.floor(value).toString().padStart(2, '0')}:00`}
              domain={[0, 24]}
              ticks={Array.from({ length: 13 }, (_, i) => i * 2)}
              interval={0}
            />
            <YAxis
              domain={[96, 100]}
              tickFormatter={(value) => {
                return ((value == 96.0 || value == 100.0) ? `` : '')
              }}
              hide={true}
              tick={false}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)}°F`, 'Temperature']}
              labelFormatter={(label: number) => {
                const hours = Math.floor(label);
                const minutes = Math.round((label % 1) * 60);
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              }}
            />
        
          </LineChart>
        </ResponsiveContainer>
        <CustomLegend />
      </div>
    );
  };

  return (
    <div className="overview-wrapper">
      <nav className="side-nav">
        <div className="logo">
          {getHeaderLogo()} 
        </div>
        <div 
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
          Overview
        </div>
        <div 
          className={`nav-item ${location.pathname === '/logging' ? 'active' : ''}`}
          onClick={() => navigate('/logging')}
        >
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          Log
        </div>
        <div 
          className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          Profile
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <div className="overview-container">
              <div className="temperature-charts">
                {renderCombinedChart()}
                <aside className="sidebar">
                  <h2>💡 Helpful Tips</h2>
                </aside>
                <section className="resources-section">
                  <h2>📖 Resources</h2>
                  <p>
                      For more information on circadian rhythms and jet lag management, explore this detailed guide:{" "}
                      <a href="https://ai.hubermanlab.com/s/xM6A8jwu" target="_blank" rel="noopener noreferrer">
                        Huberman Lab Jet Lag Protocol
                      </a>
                  </p>
                </section>
              </div>
            </div>
          } />
          <Route path="/logging" element={<Logging />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
};

export default Overview;