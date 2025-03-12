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

// Add near the top with other interfaces
interface LightAvoidanceWindow {
  start: string;
  end: string;
  previousDay: boolean;
}

const Overview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { schedule, baseSchedule, scheduleData } = useSchedule();

  const getCurrentTimeDecimal = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return hours + minutes / 60; // Return exact time, no rounding
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
  useEffect(() => {}, [currentTime]);

  const getCurrentTMinTime = useCallback(() => {
    if (!baseSchedule?.wakeTime) return null;
    const [wakeHours, wakeMinutes] = baseSchedule.wakeTime.split(':').map(Number);
    const wakeTimeDecimal = wakeHours + wakeMinutes / 60;
    return wakeTimeDecimal - 2;
  }, [baseSchedule?.wakeTime]);

  const getBedtimeHours = useCallback(() => {
    if (!baseSchedule?.bedTime) return null;
    const [hours, minutes] = baseSchedule.bedTime.split(':').map(Number);
    return hours + minutes / 60;
  }, [baseSchedule?.bedTime]);

  const getLightAvoidanceWindow = useCallback(() => {
    if (!scheduleData?.lightAvoidanceWindow) return null;
    return scheduleData.lightAvoidanceWindow;
  }, [scheduleData?.lightAvoidanceWindow]);

  const [currentTMinTime, setCurrentTMinTime] = useState<number | null>(null);
  const [bedTimeHours, setBedTimeHours] = useState<number | null>(null);
  const [lightAvoidanceWindow, setLightAvoidanceWindow] = useState<LightAvoidanceWindow | null>(null);

  useEffect(() => {
    setLightAvoidanceWindow(getLightAvoidanceWindow());
  }, [getLightAvoidanceWindow]);

  useEffect(() => {
    setCurrentTMinTime(getCurrentTMinTime());
  }, [getCurrentTMinTime]);

  useEffect(() => {
    setBedTimeHours(getBedtimeHours());
  }, [getBedtimeHours]);

  useEffect(() => {
    console.log('Schedule Data:', scheduleData);
  }, [scheduleData]);

  // Debug logs
  useEffect(() => {
    // console.log('Base Schedule updated:', baseSchedule);
    // console.log('Current T-min Time:', currentTMinTime);
    // console.log('Bed Time Hours:', bedTimeHours);
    console.log('Light Avoidance Window:', lightAvoidanceWindow);
  }, [baseSchedule, currentTMinTime, bedTimeHours, lightAvoidanceWindow]);

  const getHeaderLogo = () => {
    switch (location.pathname) {
      case '/logging':
        return <h3>Logging</h3>;
      case '/profile':
        return<h3>Profile</h3>
      default:
        return<h3>Overview</h3>
    }
  };

  // Update the generateTemperatureData function
  const generateTemperatureData = (wakeTime: string) => {
    const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number);
    const wakeTimeDecimal = wakeHours + wakeMinutes / 60;
    const tMinTime = wakeTimeDecimal - 2;

    return Array.from({ length: 97 }, (_, i) => {
      const hour = roundToNearestQuarter(i / 4);
      const phase = (hour - tMinTime - 6) * (Math.PI / 12);
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
  // const renderCombinedChart = () => {
  //   if (!schedule || !baseSchedule || !scheduleData) return null;

  //   // Use scheduleData instead of calculating
  //   const {
  //     currentTMinTime,
  //     targetTMinTime,
  //     lightAvoidanceStart,
  //     lightAvoidanceEnd,
  //     currentTemp,
  //     currentTime,
  //     currentLightExposures
  //   } = scheduleData;

  //   // console.log("schedule", schedule);
  //   // console.log("baseSchedule", baseSchedule);

  //   // Generate data for both curves
  //   const currentWakeTime = baseSchedule.wakeTime;
  //   const targetWakeTime = schedule['Day 1'][0];
  //   const currentData = generateTemperatureData(currentWakeTime);
  //   const targetData = generateTemperatureData(targetWakeTime);

  //   // Combine the data
  //   const combinedData = currentData.map((item, index) => ({
  //     time: item.time,
  //     currentTemp: item.temperature,
  //     targetTemp: targetData[index].temperature,
  //     isLightSensitive: item.isLightSensitive,
  //     isDeadZone: item.isDeadZone,
  //   }));

  //   // Calculate T-min times for both curves
  //   const [currentWakeHours] = currentWakeTime.split(':').map(Number);
  //   const [targetWakeHours] = targetWakeTime.split(':').map(Number);

  //   const legendPayload = [
  //     {
  //       value: 'Light Sensitive Zone',
  //       type: 'rect',
  //       color: 'rgba(255,107,107, 0.2)',
  //       id: 'lightSensitive'
  //     },
  //     {
  //       value: 'Dead Zone',
  //       type: 'rect',
  //       color: 'rgba(113,128,150, 0.2)',
  //       id: 'deadZone'
  //     },
  //     {
  //       value: 'Light Exposure',
  //       type: 'rect',
  //       color: '#ebf8ff',
  //       id: 'lightExposure'
  //     },
  //     {
  //       value: 'Light Avoidance Zone',
  //       type: 'rect',
  //       color: 'rgba(81, 87, 253, 0.41)',
  //       id: 'lightAvoidance'
  //     },
  //   ];

  //   // Add this custom legend component
  //   const CustomLegend = () => {
  //     return (
  //       <div className="custom-legend">
  //         {legendPayload.map((item) => (
  //           <div 
  //             key={item.id} 
  //             className="legend-item"
  //             style={{ opacity: highlightedCurve === 'current' ? 1 : 0.3 }}
  //           >
  //             <span 
  //               className={`legend-icon ${item.type}`}
  //               style={{ 
  //                 backgroundColor: item.type === 'rect' ? item.color : 'transparent',
  //                 borderTop: item.type === 'line' ? `2px solid ${item.color}` : 
  //                           item.type === 'dotted line' ? `3px dotted ${item.color}` : 'none'
  //               }}
  //             />
  //             <span className="legend-label">{item.value}</span>
  //           </div>
  //         ))}
  //       </div>
  //     );
  //   };

  //   // In the renderCombinedChart function, add this helper to convert time string to decimal
  //   const timeToDecimal = (timeStr: string) => {
  //     const [hours, minutes] = timeStr.split(':').map(Number);
  //     return hours + minutes / 60;
  //   };

  //   // Calculate light avoidance zone (6 to 4 hours before bedtime)
  //   const getBedtimeHours = (timeStr: string) => {
  //     const [hours, minutes] = timeStr.split(':').map(Number);
  //     return hours + minutes / 60;
  //   };

  //   // Calculate light avoidance zone (6 to 4 hours before bedtime)
  //   const bedtimeHours = baseSchedule.bedTime ? getBedtimeHours(baseSchedule.bedTime) : 22;
  //   const lightAvoidanceStartTime = bedtimeHours - 6; // 6 hours before bedtime
  //   const lightAvoidanceEndTime = bedtimeHours - 4;   // 4 hours before bedtime

  //   console.log("currentTime", currentTime);

  //   return (
  //     <div className="temperature-chart">
  //       <h3> Temperature Rhythms</h3>
  //       <div className="chart-controls">
  //         <button 
  //           className={`toggle-button ${highlightedCurve === 'current' ? 'active' : ''}`}
  //           onClick={() => setHighlightedCurve('current')}
  //         >
  //           Current Rhythm {highlightedCurve}
  //         </button>
  //         <button 
  //           className={`toggle-button ${highlightedCurve === 'target' ? 'active' : ''}`}
  //           onClick={() => setHighlightedCurve('target')}
  //         >
  //           Day 1 Rhythm
  //         </button>
  //       </div>
       
  //       <ResponsiveContainer width="100%" height={300}>
  //         <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 25, bottom: 20 }}>
            
  //           <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            
  //           {/* Current rhythm zones */}
  //           <ReferenceArea
  //             name="Light Sensitive Zone"
  //             x1={currentTMinTime - 4}
  //             x2={currentTMinTime + 4}
  //             y1={96}
  //             y2={100}
  //             fill="rgba(230, 57, 70, 1)"
  //             fillOpacity={highlightedCurve === 'current' ? 0.6 : 0}
  //           />
  //           <ReferenceArea
  //             name="Dead Zone"
  //             x1={currentTMinTime + 6}
  //             x2={currentTMinTime + 10}
  //             y1={96}
  //             y2={100}
  //             fill="rgba(113,128,150, 0.2)"
  //             fillOpacity={highlightedCurve === 'current' ? 0.6 : 0}
  //           />

  //           {/* Light avoidance zone */}
  //           <ReferenceArea
  //             name="Light Avoidance Zone"
  //             x1={lightAvoidanceStartTime}
  //             x2={lightAvoidanceEndTime}
  //             y1={96}
  //             y2={100}
  //             fill="rgba(0, 53, 84, 1)"
  //             fillOpacity={highlightedCurve === 'current' ? 0.6 : 0}
  //           />

  //           {/* Target rhythm zones */}
  //           <ReferenceArea
  //             name="Light Sensitive Zone"
  //             x1={targetTMinTime - 4 < 0 ? 0 : targetTMinTime - 4}
  //             x2={targetTMinTime + 4 > 24 ? 24 : targetTMinTime + 4}
  //             y1={96}
  //             y2={100}
  //             fill="rgba(255,107,107, 0.2)"
  //             fillOpacity={highlightedCurve === 'target' ? 0.6 : 0}
  //           />
  //           <ReferenceArea
  //             name="Dead Zone"
  //             x1={targetTMinTime + 6}
  //             x2={targetTMinTime + 10}
  //             y1={96}
  //             y2={100}
  //             fill="rgba(113,128,150, 0.2)"
  //             fillOpacity={highlightedCurve === 'target' ? 0.6 : 0}
  //           />

  //           {/* Light exposure zones */}
  //           <ReferenceArea
  //             x1={currentLightExposures[0].start}
  //             x2={currentLightExposures[0].end < currentLightExposures[0].start ? 24 : currentLightExposures[0].end}
  //             y1={96}
  //             y2={100}
  //             label={{
  //               value: "Light Exposure",
  //               position: "center",
  //               fill: "#4299e1",
  //               fontSize: 10,
  //               opacity: highlightedCurve === 'current' ? 1 : 0
  //             }}
  //             fill="rgba(252, 191, 73, 1)"
  //             fillOpacity={highlightedCurve === 'current' ? 0.9 : 0}
  //             stroke="#4299e1"
  //             strokeOpacity={highlightedCurve === 'current' ? 0.2 : 0}
  //           />
          
  //           {/* Current wake time line */}
  //           <ReferenceLine
  //             x={currentWakeHours}
  //             stroke="#2b6cb0"              
  //             strokeDasharray="3 3"
  //             opacity={highlightedCurve === 'current' ? 1 : 0.05}
  //             label={{ 
  //               value: "☀️ Current Wake",
  //               position: "top",
  //               fill: "#2b6cb0",
  //               fontSize: 12,
  //               opacity: highlightedCurve === 'current' ? 1 : 0.05
  //             }}
  //           />



  //           {/* Target rhythm curve */}
  //           <Line
  //             type="monotone"
  //             dataKey="targetTemp"
  //             stroke="#38A169"
  //             strokeWidth={highlightedCurve === 'target' ? 1 : 0.5}
  //             dot={false}
  //             opacity={highlightedCurve === 'target' ? 1 : 0.2}
  //           />
  //           {/* Target T-min line */}
  //           <ReferenceLine
  //             x={targetTMinTime}
  //             stroke="red"
  //             opacity={highlightedCurve === 'target' ? 1 : 0.01}
  //             label={{ 
  //               value: "Target T-min",
  //               position: "top",
  //               fill: "#38A169",
  //               fontSize: 12,
  //               opacity: highlightedCurve === 'target' ? 1 : 0.05
  //             }}
  //           />

  //           {/* Target wake time line */}
  //           <ReferenceLine
  //             x={targetWakeHours}
  //             stroke="orange"
  //             strokeWidth={highlightedCurve === 'target' ? 2 : 1}
  //             strokeDasharray="5 5"
  //             opacity={highlightedCurve === 'target' ? 1 : 0.05}
  //             label={{ 
  //               value: "Target Wake",
  //               position: "top",
  //               fill: "#38A169",
  //               fontSize: 12,
  //               opacity: highlightedCurve === 'target' ? 1 : 0.05
  //             }}
  //           />

  //           {/* Current time marker */}
  //           <ReferenceDot
  //             x={currentTime}
  //             y={currentTemp}
  //             r={6}
  //             fill="#38B2AC"
  //             stroke="#fff"
  //             strokeWidth={2}
  //             className="current-time-dot"
  //             label={{
  //               value: `${Math.floor(currentTime).toString().padStart(2, '0')}:${Math.floor((currentTime % 1) * 60).toString().padStart(2, '0')}`,
  //               position: "top",
  //               offset: 15,
  //               fill: "#38B2AC",
  //               fontSize: 12
  //             }}
  //           />

  //           <XAxis
  //             dataKey="time"
  //             tickFormatter={(value) => `${Math.floor(value).toString().padStart(2, '0')}:00`}
  //             domain={[0, 24]}
  //             ticks={Array.from({ length: 13 }, (_, i) => i * 2)}
  //             interval={0}
  //           />
  //           <YAxis
  //             domain={[96, 100]}
  //             tickFormatter={(value) => {
  //               return ((value == 96.0 || value == 100.0) ? `` : '')
  //             }}
  //             hide={true}
  //             tick={false}
  //           />
  //           <Tooltip
  //             formatter={(value: number) => [`${value.toFixed(2)}°F`, 'Temperature']}
  //             labelFormatter={(label: number) => {
  //               const hours = Math.floor(label);
  //               const minutes = Math.round((label % 1) * 60);
  //               return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  //             }}
  //           />
        
  //         </LineChart>
  //       </ResponsiveContainer>
  //       <CustomLegend />
  //     </div>
  //   );
  // };

  const timeToDecimal = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };

  const renderWeeklyCalendar = () => {
    if (!schedule || !scheduleData) return null;
  
    const { currentLightExposures, lightAvoidanceWindows } = scheduleData;
    const scheduleDays = Object.keys(schedule).filter(key => key !== 'Activity');
    const days = ['Current', ...scheduleDays];
    const hours = Array.from({ length: 24 }, (_, i) => i);
  
    // Calculate exact pixel position for current time
    const hourHeight = 60;
    const currentHour = Math.floor(currentTime);
    const currentMinute = (currentTime - currentHour) * 60;
    const pixelPosition = (currentHour * hourHeight) + ((currentMinute / 60) * hourHeight);
    const timeLabel = `${currentHour.toString().padStart(2, '0')}:${Math.floor(currentMinute).toString().padStart(2, '0')}`;
  
    // Helper to get T-min time from wake time
    const getTMinTime = (wakeTime: string) => {
      const [hours, minutes] = wakeTime.split(':').map(Number);
      return hours + minutes / 60 - 2; // T-min is 2 hours before wake time
    };
  
    // Get T-min times for each day
    const getTMinForDay = (day: string) => {
      if (day === 'Current') {
        return currentTMinTime;
      } else {
        const targetWakeTime = schedule[day][0]; // Assuming wake time is first entry
        return getTMinTime(targetWakeTime);
      }
    };

    // const getBedTimeForDay = (day: string) => {
    //   if (day === 'Current') {
    //     return bedTimeHours;
    //   } else {
    //     // Get the bedtime from schedule (assuming it's the last entry)
    //     const bedTime = schedule[day][schedule[day].length - 1];
    //     const [hours, minutes] = bedTime.split(':').map(Number);
    //     return hours + minutes / 60;
    //   }
    // };

    // days.forEach(day => {
    //   const dayBedTime = getBedTimeForDay(day);
    //   console.log(`when is bed time${day}:`, {
    //     bedTime: dayBedTime,
    //     lightAvoidanceStart: dayBedTime ? dayBedTime - 6 : null,
    //     lightAvoidanceEnd: dayBedTime ? dayBedTime - 4 : null,
    //     formattedBedTime: dayBedTime ? 
    //       `${Math.floor(dayBedTime)}:${Math.round((dayBedTime % 1) * 60).toString().padStart(2, '0')}` : 
    //       null,
    //     formattedLightAvoidance: dayBedTime ? 
    //       `${Math.floor(dayBedTime - 6)}:${Math.round(((dayBedTime - 6) % 1) * 60).toString().padStart(2, '0')} - ${Math.floor(dayBedTime - 4)}:${Math.round(((dayBedTime - 4) % 1) * 60).toString().padStart(2, '0')}` : 
    //       null
    //   });
    // });

    return (
      <div className="weekly-calendar">
        <div className="calendar-header">
          <div className="day-header"></div>
          {days.map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
        <div className="calendar-grid">
          <div 
            className="current-time-indicator"
            style={{ 
              top: `${pixelPosition}px`,
              width: '100%'
            }}
          >
            <span className="time-label">{timeLabel}</span>
          </div>
          <div className="time-column">
            {Array.from({ length: 24 }, (_, hour) => (
              <div 
                key={hour} 
                className="time-slot"
                style={{
                  gridRow: hour + 1
                }}
              >
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>
          {days.map(day => {
            const dayTMinTime = getTMinForDay(day);
            // const dayBedTime = getBedTimeForDay(day); 
            const lightAvoidanceWindow = lightAvoidanceWindows[day];

            // Convert light avoidance window times to decimal for comparison
            const avoidanceStartDecimal = lightAvoidanceWindow ? timeToDecimal(lightAvoidanceWindow.start) : null;
            const avoidanceEndDecimal = lightAvoidanceWindow ? timeToDecimal(lightAvoidanceWindow.end) : null;

            // Adjust for previous day if necessary
            const adjustedAvoidanceStart = lightAvoidanceWindow?.previousDay && avoidanceStartDecimal != null ? avoidanceStartDecimal + 24 : avoidanceStartDecimal;
            const adjustedAvoidanceEnd = lightAvoidanceWindow?.previousDay && avoidanceEndDecimal != null ? avoidanceEndDecimal + 24 : avoidanceEndDecimal;

                    // Debug log for each day's zones
          // console.log(`${day} zones:`, {
          //   tMinTime: dayTMinTime,
          //   bedTime: dayBedTime,
          //   lightAvoidanceWindow: dayBedTime ? {
          //     start: dayBedTime - 6,
          //     end: dayBedTime - 4,
          //     startFormatted: `${Math.floor(dayBedTime - 6)}:${Math.round(((dayBedTime - 6) % 1) * 60).toString().padStart(2, '0')}`,
          //     endFormatted: `${Math.floor(dayBedTime - 4)}:${Math.round(((dayBedTime - 4) % 1) * 60).toString().padStart(2, '0')}`
          //   } : null
          // });

          console.log(`${day} Light Avoidance Window:`, {
            start: lightAvoidanceWindow?.start,
            end: lightAvoidanceWindow?.end,
            previousDay: lightAvoidanceWindow?.previousDay,
            adjustedStart: adjustedAvoidanceStart,
            adjustedEnd: adjustedAvoidanceEnd
          });
          
            return (
              <div key={day} className="calendar-day-column">
                asdfasfd
                {hours.map(hour => {
                  const isLightSensitive = dayTMinTime && 
                    hour >= (dayTMinTime - 4) && 
                    hour <= (dayTMinTime + 4);
                  
                  const isDeadZone = dayTMinTime && 
                    hour >= (dayTMinTime + 6) && 
                    hour <= (dayTMinTime + 10);
                  
                  // const isLightAvoidance = dayBedTime && 
                  //   hour >= (dayBedTime - 6) && 
                  //   hour <= (dayBedTime - 4);

                  // Handle light avoidance across midnight
                  let isLightAvoidance = false;
                 
                  if (lightAvoidanceWindow && avoidanceStartDecimal != null && avoidanceEndDecimal != null) {
                    if (lightAvoidanceWindow.previousDay && adjustedAvoidanceStart != null && adjustedAvoidanceEnd != null) {
                      // If previous day, times are after midnight
                      console.log(`${day} hour ${hour} is in light avoidance 111111111:`, {
                        hour,
                        avoidanceEndDecimal,
                      });
                      const hourAdjusted = hour < avoidanceEndDecimal ? hour + 24 : hour;
                      isLightAvoidance = hourAdjusted >= adjustedAvoidanceStart && hourAdjusted <= adjustedAvoidanceEnd;
                      console.log(`${day} hour ${hour} is in light avoidance 222222222:`, {
                        hour,
                        hourAdjusted,
                        isLightAvoidance,
                        avoidanceStartDecimal,
                        avoidanceEndDecimal
                      });
                    } else {
                      // Normal case, same day
                      isLightAvoidance = hour >= avoidanceStartDecimal && hour <= avoidanceEndDecimal;
                    }
                  }

                
                  
                // Debug log for specific hours that are marked as light avoidance
                if (isLightAvoidance) {
                  // console.log(`${day} hour ${hour} is in light avoidance:`, {
                  //   hour: hour,
                  //   bedTime: dayBedTime,
                  //   avoidanceStart: dayBedTime - 6,
                  //   avoidanceEnd: dayBedTime - 4
                  // });
                  console.log(`${day} hour ${hour} is in light avoidance:`, {
                    hour,
                    avoidanceStart: adjustedAvoidanceStart,
                    avoidanceEnd: adjustedAvoidanceEnd,
                    previousDay: lightAvoidanceWindow?.previousDay
                  });
                }

                  const isLightExposure = currentLightExposures?.some(
                    exposure => hour >= exposure.start && hour <= exposure.end
                  );
  
                  // Get the appropriate label
                  let zoneLabel = '';
                  if (isLightSensitive) zoneLabel = 'Light Sensitive';
                  if (isDeadZone) zoneLabel = 'Dead Zone';
                  if (isLightAvoidance) zoneLabel = 'Light Avoidance';
                  if (isLightExposure) zoneLabel = 'Light Exposure';

                  const zoneClasses = [
                    isLightSensitive ? 'light-sensitive-zone' : '',
                    isDeadZone ? 'dead-zone' : '',
                    isLightAvoidance ? 'light-avoidance-zone' : '',
                    isLightExposure ? 'light-exposure-zone' : ''
                  ].filter(Boolean).join(' ');
  
                  return (
                    <div 
                      key={`${day}-${hour}`} 
                      className={`calendar-cell ${zoneClasses}`}
                    >
                      {zoneLabel && <span className="zone-label">{zoneLabel}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
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
              <section className="resources-section">
                <h2>Status</h2>
                <p>Current T-min Time: {currentTMinTime}</p>
                <p>Current Time: {currentTime}</p>
                <p>Bed Time Hours: {bedTimeHours}</p>
                <p>{currentTMinTime && 
                ((currentTMinTime - 4) <= currentTime && currentTime <= currentTMinTime + 4 ? "Currently in light sensitive zone" : 
                bedTimeHours && bedTimeHours - 6 <= currentTime && currentTime <= bedTimeHours - 4 ? "Currently in light avoidance zone" : 
                currentTMinTime && currentTMinTime + 6 <= currentTime && currentTime <= currentTMinTime ? "Currently in dead zone" : 
                "No action required"
                )}</p>
              </section>
              {/* <div className="temperature-charts">
                {renderCombinedChart()}
              </div> */}
              <div className="weekly-calendar">
                {renderWeeklyCalendar()}
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