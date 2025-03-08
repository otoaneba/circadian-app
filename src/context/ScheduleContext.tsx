import React, { createContext, useContext, useState } from 'react';

export interface Schedule {
  Activity: string[];
  [key: string]: string[];
}

interface ScheduleContextType {
  schedule: any;
  setSchedule: (schedule: any) => void;
  baseSchedule: {
    wakeTime: string;
    bedTime: string;
    mealTime: string;
  } | null;
  setBaseSchedule: (schedule: { wakeTime: string; bedTime: string; mealTime: string; }) => void;
}

export const ScheduleContext = createContext<ScheduleContextType>({
  schedule: null,
  setSchedule: () => {},
  baseSchedule: null,
  setBaseSchedule: () => {},
});

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedule, setSchedule] = useState(null);
  const [baseSchedule, setBaseSchedule] = useState<{
    wakeTime: string;
    bedTime: string;
    mealTime: string;
  } | null>(null);

  return (
    <ScheduleContext.Provider value={{ 
      schedule, 
      setSchedule, 
      baseSchedule, 
      setBaseSchedule 
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