import React, { useState, useEffect } from 'react';
import './Logging.css';

// Define types for the schedule
interface Schedule {
   Activity: string[];
   [key: string]: string[] | string[];
 }

const Logging: React.FC = () => {

   const [direction, setDirection] = useState<string>("East (Advance Clock)");
   const [wakeCurrent, setWakeCurrent] = useState<string>("07:00");
   const [bedtimeCurrent, setBedtimeCurrent] = useState<string>("23:00");
   const [mealTimeCurrent, setMealTimeCurrent] = useState<string>("12:00");
   const [wakeLocal, setWakeLocal] = useState<string>("06:00");
   const [bedtimeLocal, setBedtimeLocal] = useState<string>("22:00");
   const [timeShift, setTimeShift] = useState<number>(6);
   const [daysAvailable, setDaysAvailable] = useState<number>(3);
   const [schedule, setSchedule] = useState<Schedule | null>(null);
   const [useCustomSchedule, setUseCustomSchedule] = useState<boolean>(false);
 
   useEffect(() => {
     if (!useCustomSchedule) {
       setWakeLocal(wakeCurrent);
       setBedtimeLocal(bedtimeCurrent);
     }
   }, [wakeCurrent, bedtimeCurrent, useCustomSchedule]);
 
   const adjustTime = (baseTime: string, shift: number, days: number, advance: boolean = true): string => {
     const [hours, minutes] = baseTime.split(":").map(Number);
     const baseDate = new Date();
     baseDate.setHours(hours, minutes, 0, 0);
     const delta = shift * days * 60 * 60 * 1000;
     const newTime = new Date(baseDate.getTime() + (advance ? -delta : delta));
     return newTime.toTimeString().slice(0, 5);
   };
 
   const generateSchedule = (): void => {
     const baseDate = new Date();
 
     // Destructure time strings into hours and minutes
     const [wakeHours, wakeMinutes] = wakeCurrent.split(":").map(Number);
     const [bedHours, bedMinutes] = bedtimeCurrent.split(":").map(Number);
     const [mealHours, mealMinutes] = mealTimeCurrent.split(":").map(Number);
     const [wakeLocalHours, wakeLocalMinutes] = wakeLocal.split(":").map(Number);
     const [bedLocalHours, bedLocalMinutes] = bedtimeLocal.split(":").map(Number);
 
     // Set times on baseDate
     const wakeCurrentDt = new Date(baseDate.setHours(wakeHours, wakeMinutes, 0, 0));
     baseDate.setTime(wakeCurrentDt.getTime()); // Reset baseDate to avoid mutation issues
     const bedtimeCurrentDt = new Date(baseDate.setHours(bedHours, bedMinutes, 0, 0));
     baseDate.setTime(wakeCurrentDt.getTime());
     const mealTimeCurrentDt = new Date(baseDate.setHours(mealHours, mealMinutes, 0, 0));
     baseDate.setTime(wakeCurrentDt.getTime());
     const wakeLocalDt = new Date(baseDate.setHours(wakeLocalHours, wakeLocalMinutes, 0, 0));
     baseDate.setTime(wakeCurrentDt.getTime());
     const bedtimeLocalDt = new Date(baseDate.setHours(bedLocalHours, bedLocalMinutes, 0, 0));
 
     const tMinDt = new Date(wakeCurrentDt.getTime() - 90 * 60 * 1000);
     const shiftPerDay = timeShift / daysAvailable;
     const advance = direction === "East (Advance Clock)";
 
     const activities: string[] = [
       "New Wake-Up",
       "Light Exposure Start",
       "Light Exposure End",
       "Exercise Start",
       "Exercise End",
       "New Meal Time",
       "Light Avoidance Start",
       "Light Avoidance End",
       "New Bedtime",
     ];
 
     const newSchedule: Schedule = { Activity: activities };
     for (let day = 1; day <= daysAvailable; day++) {
       const wakeNew = adjustTime(wakeCurrent, shiftPerDay, day, advance);
       const bedtimeNew = adjustTime(bedtimeCurrent, shiftPerDay, day, advance);
       const mealTimeNew = adjustTime(mealTimeCurrent, shiftPerDay, day, advance);
 
       const lightTimeStart = new Date(
         tMinDt.getTime() + (advance ? 2 : -6) * 60 * 60 * 1000
       ).toTimeString().slice(0, 5);
       const lightTimeEnd = new Date(
         tMinDt.getTime() + (advance ? 4 : -4) * 60 * 60 * 1000
       ).toTimeString().slice(0, 5);
       const exerciseStart = new Date(
         tMinDt.getTime() + (advance ? 1 : -4) * 60 * 60 * 1000
       ).toTimeString().slice(0, 5);
       const exerciseEnd = new Date(
         tMinDt.getTime() + (advance ? 4 : -1) * 60 * 60 * 1000
       ).toTimeString().slice(0, 5);
       const lightAvoidStart = new Date(
         (advance ? bedtimeLocalDt : wakeLocalDt).getTime() + (advance ? -6 : 2) * 60 * 60 * 1000
       ).toTimeString().slice(0, 5);
       const lightAvoidEnd = new Date(
         (advance ? bedtimeLocalDt : wakeLocalDt).getTime() + (advance ? -4 : 4) * 60 * 60 * 1000
       ).toTimeString().slice(0, 5);
 
       newSchedule[`Day ${day}`] = [
         wakeNew,
         lightTimeStart,
         lightTimeEnd,
         exerciseStart,
         exerciseEnd,
         mealTimeNew,
         lightAvoidStart,
         lightAvoidEnd,
         bedtimeNew,
       ];
     }
     setSchedule(newSchedule);
   };
 
   const tMin = (): string => {
     const [hours, minutes] = wakeCurrent.split(":").map(Number);
     const date = new Date();
     date.setHours(hours, minutes, 0, 0);
     date.setMinutes(date.getMinutes() - 90);
     return date.toTimeString().slice(0, 5);
   };

   return (
      <div className="zoner-container">

         <h1>Input Your Time Shift Details</h1>
         <p className="subtitle">Find out your new sleep schedule based on your time shift details.</p>
         <section className="input-section">

            <h3>1: Traveling Direction</h3>
            <div className="input-group">
               <select value={direction} onChange={(e) => setDirection(e.target.value)}>
                  <option value="East (Advance Clock)">East (Advance Clock)</option>
                  <option value="West (Delay Clock)">West (Delay Clock)</option>
               </select>
            </div>

            <div className="input-group">
               <h3>2: Current Sleep Schedule (Local Time Zone)</h3>
               <div className="time-inputs">
                  <label>
                  Wake-Up Time:
                  <input type="time" value={wakeCurrent} onChange={(e) => setWakeCurrent(e.target.value)} />
                  </label>
                  <label>
                  Bedtime:
                  <input type="time" value={bedtimeCurrent} onChange={(e) => setBedtimeCurrent(e.target.value)} />
                  </label>
                  <label>
                  Main Meal Time:
                  <input type="time" value={mealTimeCurrent} onChange={(e) => setMealTimeCurrent(e.target.value)} />
                  </label>
               </div>
            </div>

            <div className="input-group">
               <h3>3: Target Schedule (Destination Time Zone)</h3>
               <div className="custom-schedule-toggle">
                  <label className="checkbox-label">
                     <input
                        type="checkbox"
                        checked={useCustomSchedule}
                        onChange={(e) => {
                           setUseCustomSchedule(e.target.checked);
                           if (!e.target.checked) {
                              // Reset to current schedule values when unchecking
                              setWakeLocal(wakeCurrent);
                              setBedtimeLocal(bedtimeCurrent);
                           }
                        }}
                     />
                     Customize target sleep schedule
                  </label>
               </div>
               
               {useCustomSchedule ? (
                  <div className="time-inputs">
                     <label>
                        Target Wake-Up Time:
                        <input 
                           type="time" 
                           value={wakeLocal} 
                           onChange={(e) => setWakeLocal(e.target.value)} 
                        />
                     </label>
                     <label>
                        Target Bedtime:
                        <input 
                           type="time" 
                           value={bedtimeLocal} 
                           onChange={(e) => setBedtimeLocal(e.target.value)} 
                        />
                     </label>
                  </div>
               ) : (
                  <div className="mirrored-schedule">
                     <p>Using same schedule as current:</p>
                     <div className="time-display">
                        <span>Wake-Up Time: {wakeCurrent}</span>
                        <span>Bedtime: {bedtimeCurrent}</span>
                     </div>
                  </div>
               )}
            </div>

            <div className="input-group">
               <h3>4: Adjustment Details</h3>
               <div className="number-inputs">
                  <label>
                  Hours to Shift:
                  <input
                     type="number"
                     min="1"
                     max="12"
                     value={timeShift}
                     onChange={(e) => setTimeShift(Number(e.target.value))}
                  />
                  </label>
                  <label>
                  Days for Adjustment:
                  <input
                     type="number"
                     min="1"
                     max="7"
                     value={daysAvailable}
                     onChange={(e) => setDaysAvailable(Number(e.target.value))}
                  />
                  </label>
               </div>
            </div>

            <button onClick={generateSchedule}>Generate Schedule</button>
            </section>

            <section className="tmin-section">
            <div className="info-box">
               <h4>📍 Temperature-minimum (T-min): Your Circadian Anchor</h4>
               <p>
                  <strong>Temperature-minimum (T-min)</strong> is calculated as 90 minutes before your current wake-up time. It
                  is used as a reference for us to plan your schedule.
               </p>
               <p>
                  <strong>Your estimated T-min:</strong> {tMin()}
               </p>
            </div>
         </section>

         {schedule && (
         <section className="schedule-section">
            <h2>📅 Personalized Adjustment Schedule</h2>
            <p>Adjust your circadian rhythm day-by-day based on your time shift details:</p>
            <table>
               <thead>
               <tr>
                  <th>Activity</th>
                  {Object.keys(schedule)
                     .filter((key) => key !== "Activity")
                     .map((day) => (
                     <th key={day}>{day}</th>
                     ))}
               </tr>
               </thead>
               <tbody>
               {schedule.Activity.map((activity, index) => (
                  <tr key={activity}>
                     <td>{activity}</td>
                     {Object.keys(schedule)
                     .filter((key) => key !== "Activity")
                     .map((day) => (
                        <td key={`${day}-${index}`}>{schedule[day][index]}</td>
                     ))}
                  </tr>
               ))}
               </tbody>
            </table>
         </section>
         )}

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
   );
};

export default Logging;
