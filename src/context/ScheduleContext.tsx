import React, { createContext, useContext, useState, useEffect } from 'react';

interface ScheduleData {
  currentWakeTime: string;
  currentTMinTime: number;
  targetWakeTime: string;
  targetTMinTime: number;
  bedTime: string;
  lightAvoidanceStart: number;
  lightAvoidanceEnd: number;
  currentTemp: number;
  currentTime: number;
  currentLightExposures: Array<{
    start: number;
    end: number;
  }>;
  lightAvoidanceWindow: LightAvoidanceWindow;
  lightAvoidanceWindows: Record<string, LightAvoidanceWindow>;
  lightExposureWindows: Record<string, { start: string; end: string }>;
}

interface Schedule {
  Activity: string[];
  [key: string]: string[];
}

interface ScheduleContextType {
  schedule: Schedule | null;
  setSchedule: (schedule: Schedule | null) => void;
  baseSchedule: {
    wakeTime: string;
    bedTime: string;
    mealTime: string;
  } | null;
  setBaseSchedule: (schedule: { wakeTime: string; bedTime: string; mealTime: string; }) => void;
  scheduleData: ScheduleData | null;
}

interface LightAvoidanceWindow {
  start: string; // HH:MM format
  end: string; // HH:MM format
  previousDay: boolean; // True if the window is on the previous day
}

export const ScheduleContext = createContext<ScheduleContextType>({
  schedule: null,
  setSchedule: () => {},
  baseSchedule: null,
  setBaseSchedule: () => {},
  scheduleData: null
});

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [baseSchedule, setBaseSchedule] = useState<{
    wakeTime: string;
    bedTime: string;
    mealTime: string;
  } | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);

  // Helper functions
  const timeToDecimal = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };

  const getCurrentTimeDecimal = () => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  };

  const decimalToTime = (decimal: number): string => {
    const totalMinutes = Math.round(decimal * 60); // Convert to minutes and round
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    // Normalize hours to 0-23 range for display
    const normalizedHours = hours >= 24 ? hours - 24 : hours;
    return `${normalizedHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateLightAvoidanceWindow = (bedtime: string): LightAvoidanceWindow => {
    // Convert bedtime to decimal hours
    const bedtimeDecimal = timeToDecimal(bedtime);
  
    // Calculate the start (6 hours before) and end (4 hours before) of the window
    let startDecimal = bedtimeDecimal - 6;
    let endDecimal = bedtimeDecimal - 4;
  
    // Check if the window crosses midnight
    let previousDay = false;
    if (startDecimal < 0 || endDecimal < 0) {
      previousDay = true;
      // Adjust for wraparound by adding 24 hours
      startDecimal = startDecimal < 0 ? startDecimal + 24 : startDecimal;
      endDecimal = endDecimal < 0 ? endDecimal + 24 : endDecimal;
    }
  
    // Convert back to HH:MM format for display
    const startTime = decimalToTime(startDecimal);
    const endTime = decimalToTime(endDecimal);
  
    return {
      start: startTime,
      end: endTime,
      previousDay,
    };
  };

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

  // Calculate all dependent variables whenever schedule or baseSchedule changes
  useEffect(() => {
    if (!schedule || !baseSchedule) return;

    const currentWakeTime = baseSchedule.wakeTime;
    const targetWakeTime = schedule['Day 1'][0];
    const currentWakeHours = timeToDecimal(currentWakeTime);
    const targetWakeHours = timeToDecimal(targetWakeTime);
    const bedTimeHours = timeToDecimal(baseSchedule.bedTime);
    
    const currentTime = getCurrentTimeDecimal();
    const phase = (currentTime - (currentWakeHours - 2) - 6) * (Math.PI / 12);
    const currentTemp = 98 + Math.sin(phase) * 2;

    const lightAvoidanceWindow = calculateLightAvoidanceWindow(baseSchedule.bedTime);

    // Calculate light avoidance windows for all days
    const lightAvoidanceWindows: Record<string, LightAvoidanceWindow> = {};

    // Current day's light avoidance window (based on baseSchedule.bedTime)
    lightAvoidanceWindows['Current'] = calculateLightAvoidanceWindow(baseSchedule.bedTime);

    // Calculate for each scheduled day (Day 1, Day 2, etc.)
    const scheduleDays = Object.keys(schedule).filter(key => key !== 'Activity');
    scheduleDays.forEach(day => {
      // Assuming the last entry in the schedule for each day is bedtime
      const dayBedTime = schedule[day][schedule[day].length - 1];
      lightAvoidanceWindows[day] = calculateLightAvoidanceWindow(dayBedTime);
    });

    // Get light exposure times
    const currentLightExposures = getLightExposureTimes(schedule['Day 1'], schedule.Activity);

    // Calculate light exposure windows for each day
    const lightExposureWindows: Record<string, { start: string; end: string }> = {};
    
    // For Current day
    if (baseSchedule.wakeTime) {
      const [wakeHours, wakeMinutes] = baseSchedule.wakeTime.split(':').map(Number);
      const wakeTimeDecimal = wakeHours + wakeMinutes / 60;
      const tMinTime = wakeTimeDecimal - 2;
      
      // Light exposure window is during light sensitive period (2 hours after wake)
      lightExposureWindows['Current'] = {
        start: decimalToTime(wakeTimeDecimal),
        end: decimalToTime(wakeTimeDecimal + 2)
      };
    }

    // For scheduled days
    Object.keys(schedule).forEach(day => {
      if (day !== 'Activity') {
        const wakeTime = schedule[day][0];
        const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number);
        const wakeTimeDecimal = wakeHours + wakeMinutes / 60;
        
        lightExposureWindows[day] = {
          start: decimalToTime(wakeTimeDecimal),
          end: decimalToTime(wakeTimeDecimal + 2)
        };
      }
    });

    setScheduleData({
      currentWakeTime,
      currentTMinTime: currentWakeHours - 2,
      targetWakeTime,
      targetTMinTime: targetWakeHours - 2,
      bedTime: baseSchedule.bedTime,
      lightAvoidanceStart: bedTimeHours - 6,
      lightAvoidanceEnd: bedTimeHours - 4,
      currentTemp,
      currentTime,
      currentLightExposures,
      lightAvoidanceWindow,
      lightAvoidanceWindows,
      lightExposureWindows
    });
  }, [schedule, baseSchedule]);

  // Update current time and temperature periodically
  useEffect(() => {
    const timer = setInterval(() => {
      if (scheduleData) {
        const currentTime = getCurrentTimeDecimal();
        const phase = (currentTime - scheduleData.currentTMinTime - 6) * (Math.PI / 12);
        const currentTemp = 98 + Math.sin(phase) * 2;

        setScheduleData(prev => prev ? {
          ...prev,
          currentTime,
          currentTemp
        } : null);
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [scheduleData]);

  // Helper function to format decimal time to HH:MM
  const formatTime = (timeDecimal: number) => {
    const hours = Math.floor(timeDecimal);
    const minutes = Math.round((timeDecimal % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <ScheduleContext.Provider value={{ 
      schedule, 
      setSchedule, 
      baseSchedule,
      setBaseSchedule,
      scheduleData
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

export default ScheduleContext; 