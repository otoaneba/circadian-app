import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, ReferenceDot, Label } from 'recharts';
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
    const timer = setInterval(() => {
      const newTime = getCurrentTimeDecimal();
      setCurrentTime(newTime);
    }, 15000); // Update every 15 seconds

    return () => clearInterval(timer);
  }, [getCurrentTimeDecimal]);

  // Force re-render when currentTime changes
  useEffect(() => {
    // This effect will run whenever currentTime changes
  }, [currentTime]);

  const getHeaderLogo = () => {
    switch (location.pathname) {
      case '/logging':
        return (
          <>
            <svg viewBox="0 0 24 24" className="header-logo">
              <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <h3>Logging</h3>
          </>
        );
      case '/profile':
        return (
          <>      
            <svg viewBox="0 0 24 24" className="header-logo">
              <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <h3>Profile</h3>
          </>
        );
      default:
        return (
          <>
            <svg viewBox="0 0 24 24" className="header-logo">
              <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
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
      const temp = 98 + Math.sin(phase) * 2;
      
      return {
        time: hour,
        temperature: temp,
        isLightSensitive: hour >= (tMinTime - 4) && hour <= (tMinTime + 4),
        isDeadZone: hour >= 10 && hour <= 16,
      };
    });
  };

  // Update renderTemperatureChart to include the current time point
  const renderTemperatureChart = () => {
    if (!schedule || !baseSchedule) return null;

    // Use base wake time instead of Day 1
    const wakeTime = baseSchedule.wakeTime;
    const data = generateTemperatureData(wakeTime);
    const [wakeHours] = wakeTime.split(':').map(Number);
    const tMinTime = wakeHours - 2;

    // Calculate current temperature using the same formula as generateTemperatureData
    const currentTemp = 98 + Math.sin((currentTime - tMinTime) * (Math.PI / 12)) * 2;

    return (
      <div className="temperature-chart">
        <h3>24-Hour Body Temperature Rhythm</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="lightSensitive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6b6b" stopOpacity={0.08}/>
                <stop offset="100%" stopColor="#ff6b6b" stopOpacity={0.08}/>
              </linearGradient>
              <linearGradient id="deadZone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#718096" stopOpacity={0.08}/>
                <stop offset="100%" stopColor="#718096" stopOpacity={0.08}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            
            {/* Light sensitive zone with background */}
            <ReferenceArea
              x1={tMinTime - 4}
              x2={tMinTime + 4}
              y1={96}
              y2={100}
              fill="url(#lightSensitive)"
              fillOpacity={1}
            />
            <ReferenceArea
              x1={tMinTime - 4}
              x2={tMinTime + 4}
              label={{ 
                value: "Light Sensitive Zone", 
                position: "insideBottom",
                fill: "#E53E3E",
                fontSize: 12
              }}
            />
            
            {/* Dead zone with background */}
            <ReferenceArea
              x1={tMinTime + 6}
              x2={tMinTime + 10}
              y1={96}
              y2={100}
              fill="url(#deadZone)"
              fillOpacity={1}
            />
            <ReferenceArea
              x1={tMinTime + 6}
              x2={tMinTime + 10}
              label={{ 
                value: "Circadian Dead Zone", 
                position: "insideBottom",
                fill: "#4A5568",
                fontSize: 12
              }}
            />
            
            {/* T-min point */}
            <ReferenceLine
              x={tMinTime}
              stroke="#E53E3E"
              strokeWidth={2}
              label={{ 
                value: "T-min", 
                position: "insideTopRight",
                fill: "#E53E3E",
                fontSize: 12
              }}
            />

            {/* Add current time marker */}
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
              tickFormatter={(value) => {
                const hours = Math.floor(value);
                return `${hours.toString().padStart(2, '0')}:00`;
              }}
              domain={[0, 24]}
              ticks={Array.from({ length: 13 }, (_, i) => i * 2)}
              interval={0}
            />
            <YAxis
              domain={[96, 100]}
              tickFormatter={(value) => `${value.toFixed(1)}°F`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)}°F`, 'Temperature']}
              labelFormatter={(label: number) => {
                const hours = Math.floor(label);
                const minutes = Math.round((label % 1) * 60);
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              }}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#2b6cb0"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Update the renderTargetTemperatureChart function
  const renderTargetTemperatureChart = () => {
    if (!schedule || !baseSchedule) return null;

    // Use Day 1's wake time for target rhythm
    const targetWakeTime = schedule['Day 1'][0];  // Changed from baseSchedule.wakeTime
    const data = generateTemperatureData(targetWakeTime);
    const [wakeHours] = targetWakeTime.split(':').map(Number);
    const tMinTime = wakeHours - 2;

    return (
      <div className="temperature-chart">
        <h3>Day 1 Temperature Rhythm</h3>  {/* Updated title to be more specific */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="lightSensitive2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6b6b" stopOpacity={0.08}/>
                <stop offset="100%" stopColor="#ff6b6b" stopOpacity={0.08}/>
              </linearGradient>
              <linearGradient id="deadZone2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#718096" stopOpacity={0.08}/>
                <stop offset="100%" stopColor="#718096" stopOpacity={0.08}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            
            {/* Light sensitive zone */}
            <ReferenceArea
              x1={tMinTime - 4}
              x2={tMinTime + 4}
              y1={96}
              y2={100}
              fill="url(#lightSensitive2)"
              fillOpacity={1}
            />
            <ReferenceArea
              x1={tMinTime - 4}
              x2={tMinTime + 4}
              label={{ 
                value: "Light Sensitive Zone", 
                position: "insideBottom",
                fill: "#E53E3E",
                fontSize: 12
              }}
            />
            
            {/* Dead zone */}
            <ReferenceArea
              x1={tMinTime + 6}
              x2={tMinTime + 10}
              y1={96}
              y2={100}
              fill="url(#deadZone2)"
              fillOpacity={1}
            />
            <ReferenceArea
              x1={tMinTime + 6}
              x2={tMinTime + 10}
              label={{ 
                value: "Circadian Dead Zone", 
                position: "insideBottom",
                fill: "#4A5568",
                fontSize: 12
              }}
            />
            
            {/* T-min point */}
            <ReferenceLine
              x={tMinTime}
              stroke="#E53E3E"
              strokeWidth={2}
              label={{ 
                value: "T-min", 
                position: "insideTopRight",
                fill: "#E53E3E",
                fontSize: 12
              }}
            />

            <XAxis
              dataKey="time"
              tickFormatter={(value) => {
                const hours = Math.floor(value);
                return `${hours.toString().padStart(2, '0')}:00`;
              }}
              domain={[0, 24]}
              ticks={Array.from({ length: 13 }, (_, i) => i * 2)}
              interval={0}
            />
            <YAxis
              domain={[96, 100]}
              tickFormatter={(value) => `${value.toFixed(1)}°F`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)}°F`, 'Temperature']}
              labelFormatter={(label: number) => {
                const hours = Math.floor(label);
                const minutes = Math.round((label % 1) * 60);
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              }}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#2b6cb0"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
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

    return (
      <div className="temperature-chart">
        <h3>Combined Temperature Rhythms</h3>
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
        {highlightedCurve === 'current' ? 'yes' : 'no'}
        { }
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              {/* Current rhythm gradients */}
              <linearGradient id="lightSensitiveCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6b6b" stopOpacity={highlightedCurve === 'current' ? 0.08 : 0.04}/>
                <stop offset="100%" stopColor="#ff6b6b" stopOpacity={highlightedCurve === 'current' ? 0.08 : 0.04}/>
              </linearGradient>
              <linearGradient id="deadZoneCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#718096" stopOpacity={highlightedCurve === 'current' ? 0.08 : 0.04}/>
                <stop offset="100%" stopColor="#718096" stopOpacity={highlightedCurve === 'current' ? 0.08 : 0.04}/>
              </linearGradient>

              {/* Target rhythm gradients */}
              <linearGradient id="lightSensitiveTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38A169" stopOpacity={highlightedCurve === 'target' ? 0.08 : 0.04}/>
                <stop offset="100%" stopColor="#38A169" stopOpacity={highlightedCurve === 'target' ? 0.08 : 0.04}/>
              </linearGradient>
              <linearGradient id="deadZoneTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4A5568" stopOpacity={highlightedCurve === 'target' ? 0.08 : 0.04}/>
                <stop offset="100%" stopColor="#4A5568" stopOpacity={highlightedCurve === 'target' ? 0.08 : 0.04}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            
            {/* Current rhythm zones */}
            <ReferenceArea
              x1={currentTMinTime - 4}
              x2={currentTMinTime + 4}
              y1={96}
              y2={100}
              fill="url(#lightSensitiveCurrent)"
              fillOpacity={highlightedCurve === 'current' ? 1 : 0}
              label={{ 
                value: "Light Sensitive Zone", 
                position: "insideBottom",
                fill: "#E53E3E",
                fontSize: 12,
                opacity: highlightedCurve === 'current' ? 1 : 0
              }}
            />
            <ReferenceArea
              x1={currentTMinTime + 6}
              x2={currentTMinTime + 10}
              y1={96}
              y2={100}
              fill="url(#deadZoneCurrent)"
              fillOpacity={highlightedCurve === 'current' ? 1 : 0}
              label={{ 
                value: "Dead Zone", 
                position: "insideBottom",
                fill: "#4A5568",
                fontSize: 12,
                opacity: highlightedCurve === 'current' ? 1 : 0
              }}
            />

            {/* Target rhythm zones */}
            <ReferenceArea
              x1={targetTMinTime - 4}
              x2={targetTMinTime + 4}
              y1={96}
              y2={100}
              fill="url(#lightSensitiveTarget)"
              fillOpacity={highlightedCurve === 'target' ? 1 : 0}
              label={{ 
                value: "Light Sensitive Zone", 
                position: "insideBottom",
                fill: "#38A169",
                fontSize: 12,
                opacity: highlightedCurve === 'target' ? 1 : 0
              }}
            />
            <ReferenceArea
              x1={targetTMinTime + 6}
              x2={targetTMinTime + 10}
              y1={96}
              y2={100}
              fill="url(#deadZoneTarget)"
              fillOpacity={highlightedCurve === 'target' ? 1 : 0}
              label={{ 
                value: "Dead Zone", 
                position: "insideBottom",
                fill: "#4A5568",
                fontSize: 12,
                opacity: highlightedCurve === 'target' ? 1 : 0
              }}
            />

            {/* Existing lines and other elements */}
            <Line
              type="monotone"
              dataKey="currentTemp"
              stroke="#2b6cb0"
              strokeWidth={highlightedCurve === 'current' ? 3 : 1}
              dot={false}
              opacity={highlightedCurve === 'current' ? 1 : 0.3}
            />
            <ReferenceLine
              x={currentTMinTime}
              stroke="#E53E3E"
              strokeWidth={highlightedCurve === 'current' ? 2 : 1}
              opacity={highlightedCurve === 'current' ? 1 : 0.3}
              label={{ 
                value: "Current T-min",
                position: "insideTopRight",
                fill: "#E53E3E",
                fontSize: 12
              }}
            />

            <Line
              type="monotone"
              dataKey="targetTemp"
              stroke="#38A169"
              strokeWidth={highlightedCurve === 'target' ? 3 : 1}
              dot={false}
              opacity={highlightedCurve === 'target' ? 1 : 0.3}
            />
            <ReferenceLine
              x={targetTMinTime}
              stroke="#38A169"
              strokeWidth={highlightedCurve === 'target' ? 2 : 1}
              opacity={highlightedCurve === 'target' ? 1 : 0.3}
              label={{ 
                value: "Target T-min",
                position: "insideTopRight",
                fill: "#38A169",
                fontSize: 12,
                opacity: highlightedCurve === 'target' ? 1 : 0.3
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
              tickFormatter={(value) => `${value.toFixed(1)}°F`}
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
              <h2>Schedule Overview</h2>
              <div className="temperature-charts">
                {/* {renderTemperatureChart()}
                {renderTargetTemperatureChart()} */}
                {renderCombinedChart()}
              </div>
              <div className="schedule-timeline">
                {/* We'll need to access the schedule state here */}
                {schedule && Object.keys(schedule)
                  .filter(key => key !== 'Activity')
                  .map((day: string) => (
                    <div key={day} className="day-column">
                      <h3>{day}</h3>
                      <div className="timeline">
                        {schedule[day].map((time: string, index: number) => (
                          <div key={index} className="timeline-item">
                            <div className="time">{time}</div>
                            <div className="activity">{schedule.Activity[index]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                {!schedule && (
                  <div className="empty-state">
                    <h3>No Schedule Generated Yet</h3>
                    <p>Go to the Log tab to generate your personalized adjustment schedule.</p>
                  </div>
                )}
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