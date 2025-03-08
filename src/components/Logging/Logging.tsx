import React, { useState, useEffect } from 'react';
import './Logging.css';
import { DateTime } from 'luxon';
import { useSchedule } from '../../context/ScheduleContext';

// Define types for the schedule
interface Schedule {
   Activity: string[];
   [key: string]: string[] | string[];
 }

// Add these new types
interface TimeZoneOption {
  city: string;
  timezone: string;
}

// Add this timezone data (you can expand this list)
const timeZoneOptions: TimeZoneOption[] = [
  { city: "New York, USA", timezone: "America/New_York" },
  { city: "London, UK", timezone: "Europe/London" },
  { city: "Paris, France", timezone: "Europe/Paris" },
  { city: "Tokyo, Japan", timezone: "Asia/Tokyo" },
  { city: "Sydney, Australia", timezone: "Australia/Sydney" },
  // Add more cities and their timezones
];

// Add these interfaces
interface Location {
  city: string;
  timezone: string;
  country: string;
}

// First, update how we store locations to include proper timezone info
const locations: Location[] = [
  { city: "New York", country: "USA", timezone: "America/New_York" },
  { city: "Los Angeles", country: "USA", timezone: "America/Los_Angeles" },
  { city: "Chicago", country: "USA", timezone: "America/Chicago" },
  { city: "London", country: "UK", timezone: "Europe/London" },
  { city: "Paris", country: "France", timezone: "Europe/Paris" },
  { city: "Berlin", country: "Germany", timezone: "Europe/Berlin" },
  { city: "Tokyo", country: "Japan", timezone: "Asia/Tokyo" },
  { city: "Sydney", country: "Australia", timezone: "Australia/Sydney" },
  { city: "Dubai", country: "UAE", timezone: "Asia/Dubai" },
  { city: "Singapore", country: "Singapore", timezone: "Asia/Singapore" },
];

const Logging: React.FC = () => {
  const { setSchedule, setBaseSchedule } = useSchedule();
  
  const [mode, setMode] = useState<'travel' | 'manual'>('travel');
  const [direction, setDirection] = useState<string>("East (Advance Clock)");
  const [wakeCurrent, setWakeCurrent] = useState<string>("07:00");
  const [bedtimeCurrent, setBedtimeCurrent] = useState<string>("23:00");
  const [mealTimeCurrent, setMealTimeCurrent] = useState<string>("12:00");
  const [wakeLocal, setWakeLocal] = useState<string>("06:00");
  const [bedtimeLocal, setBedtimeLocal] = useState<string>("22:00");
  const [timeShift, setTimeShift] = useState<number>(6);
  const [daysAvailable, setDaysAvailable] = useState<number>(3);
  const [schedule, setScheduleState] = useState<Schedule | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [destinationLocation, setDestinationLocation] = useState<string>("");
  const [timeZoneDiff, setTimeZoneDiff] = useState<number>(0);
  const [currentLocationInput, setCurrentLocationInput] = useState("");
  const [destinationLocationInput, setDestinationLocationInput] = useState("");
  const [showCurrentSuggestions, setShowCurrentSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
 
  // Then update the useEffect for timezone calculations
  useEffect(() => {
    if (currentLocationInput && destinationLocationInput) {
      const fromLocation = locations.find(
        loc => `${loc.city}, ${loc.country}` === currentLocationInput
      );
      const toLocation = locations.find(
        loc => `${loc.city}, ${loc.country}` === destinationLocationInput
      );

      if (fromLocation && toLocation) {
        const now = DateTime.now();
        const fromTime = now.setZone(fromLocation.timezone);
        const toTime = now.setZone(toLocation.timezone);
        
        // Calculate the difference in hours
        const hoursDiff = (toTime.offset - fromTime.offset) / 60;
        
        setTimeZoneDiff(hoursDiff);
        setTimeShift(Math.abs(hoursDiff));
        setDirection(hoursDiff >= 0 ? "East (Advance Clock)" : "West (Delay Clock)");
      }
    }
  }, [currentLocationInput, destinationLocationInput]);
 
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
    const advance = mode === 'travel' 
      ? timeZoneDiff > 0  // For travel mode, use timezone difference
      : direction === "East (Advance Clock)";  // For manual mode, use direction

    // Set the time shift based on mode
    const actualTimeShift = mode === 'travel' 
      ? Math.abs(timeZoneDiff)  // Use timezone difference for travel
      : timeShift;  // Use calculated shift for manual mode

    // For travel mode, set days based on time zone difference
    if (mode === 'travel') {
      setDaysAvailable(Math.min(Math.max(Math.ceil(Math.abs(timeZoneDiff) / 2), 2), 7));
    }

    const shiftPerDay = actualTimeShift / daysAvailable;

    // Destructure time strings into hours and minutes
    const [wakeHours, wakeMinutes] = wakeCurrent.split(":").map(Number);
    const [bedHours, bedMinutes] = bedtimeCurrent.split(":").map(Number);
    const [mealHours, mealMinutes] = mealTimeCurrent.split(":").map(Number);

    // Set times on baseDate
    const wakeCurrentDt = new Date(baseDate.setHours(wakeHours, wakeMinutes, 0, 0));
    baseDate.setTime(wakeCurrentDt.getTime());
    const bedtimeCurrentDt = new Date(baseDate.setHours(bedHours, bedMinutes, 0, 0));
    baseDate.setTime(wakeCurrentDt.getTime());
    const mealTimeCurrentDt = new Date(baseDate.setHours(mealHours, mealMinutes, 0, 0));

    const tMinDt = new Date(wakeCurrentDt.getTime() - 90 * 60 * 1000);

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

      // Calculate light and exercise times based on direction
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

      // Calculate light avoidance times
      const targetBedtime = mode === 'travel' 
        ? adjustTime(bedtimeCurrent, actualTimeShift, 1, advance)  // Final target for travel
        : bedtimeLocal;  // Manual mode target

      const lightAvoidStart = new Date(
        new Date(`2000/01/01 ${targetBedtime}`).getTime() + (advance ? -6 : 2) * 60 * 60 * 1000
      ).toTimeString().slice(0, 5);
      const lightAvoidEnd = new Date(
        new Date(`2000/01/01 ${targetBedtime}`).getTime() + (advance ? -4 : 4) * 60 * 60 * 1000
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
    setScheduleState(newSchedule);

    // Save the base schedule times
    setBaseSchedule({
      wakeTime: wakeCurrent,
      bedTime: bedtimeCurrent,
      mealTime: mealTimeCurrent,
    });

    setSchedule(newSchedule);
  };

  const tMin = (): string => {
    const [hours, minutes] = wakeCurrent.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() - 90);
    return date.toTimeString().slice(0, 5);
  };

  // Add this function to filter locations
  const filterLocations = (input: string) => {
    if (!input) return [];
    const searchTerm = input.toLowerCase();
    return locations.filter(
      location => 
        location.city.toLowerCase().includes(searchTerm) || 
        location.country.toLowerCase().includes(searchTerm)
    );
  };

  // Add this helper function to calculate hours between two times
  const calculateTimeDifference = (time1: string, time2: string): number => {
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);
    
    // Convert both times to minutes since midnight
    const minutes1Total = hours1 * 60 + minutes1;
    const minutes2Total = hours2 * 60 + minutes2;
    
    // Calculate difference in hours, handling day wraparound
    let diffMinutes = minutes2Total - minutes1Total;
    if (Math.abs(diffMinutes) > 12 * 60) {
      // If difference is more than 12 hours, take the shorter path
      diffMinutes = diffMinutes > 0 
        ? diffMinutes - 24 * 60 
        : diffMinutes + 24 * 60;
    }
    
    return Math.abs(Math.round(diffMinutes / 60));
  };

  // Update this useEffect to fix the direction logic
  useEffect(() => {
    if (mode === 'manual') {
      const shiftHours = calculateTimeDifference(wakeCurrent, wakeLocal);
      setTimeShift(shiftHours);
      
      // Set direction based on whether target time is later or earlier
      const [currentHours, currentMinutes] = wakeCurrent.split(':').map(Number);
      const [targetHours, targetMinutes] = wakeLocal.split(':').map(Number);
      const currentTotal = currentHours * 60 + currentMinutes;
      const targetTotal = targetHours * 60 + targetMinutes;
      let diff = targetTotal - currentTotal;
      if (Math.abs(diff) > 12 * 60) {
        diff = diff > 0 ? diff - 24 * 60 : diff + 24 * 60;
      }
      // Fix: Swap the direction logic - East when target is later, West when earlier
      setDirection(diff >= 0 ? "West (Delay Clock)" : "East (Advance Clock)");
    }
  }, [mode, wakeCurrent, wakeLocal]);

  return (
     <div className="zoner-container">


        <h1>
           {mode === 'travel' 
              ? 'Travel Time Shift Details' 
              : 'Manual Time Shift Details'
           }
        </h1>
        <p className="subtitle">
           {mode === 'travel'
              ? 'Plan your sleep schedule for your upcoming travel.'
              : 'Adjust your sleep schedule for shift work or other schedule changes.'
           }
        </p>

        <section className="input-section">
           <div className="mode-toggle">
              <button 
                 className={`mode-button ${mode === 'travel' ? 'active' : ''}`}
                 onClick={() => setMode('travel')}
              >
                  ✈️ Travel Adjustment
              </button>
              <button 
                 className={`mode-button ${mode === 'manual' ? 'active' : ''}`}
                 onClick={() => setMode('manual')}
              >
                  🔄 Manual Shift
              </button>
           </div>

           {mode === 'travel' ? (
              <>
                 <div className="input-group">
                    <h3>1: Travel Details</h3>
                    <div className="location-inputs">
                       <label>
                          Current Location:
                          <div className="autocomplete">
                             <input
                                type="text"
                                value={currentLocationInput}
                                onChange={(e) => {
                                   setCurrentLocationInput(e.target.value);
                                   setShowCurrentSuggestions(true);
                                }}
                                onFocus={() => setShowCurrentSuggestions(true)}
                                placeholder="Type to search..."
                             />
                             {showCurrentSuggestions && currentLocationInput && (
                                <div className="suggestions">
                                   {filterLocations(currentLocationInput).map((location) => (
                                      <div
                                         key={`${location.city}-${location.country}`}
                                         className="suggestion-item"
                                         onClick={() => {
                                            setCurrentLocation(`${location.city}, ${location.country}`);
                                            setCurrentLocationInput(`${location.city}, ${location.country}`);
                                            setShowCurrentSuggestions(false);
                                         }}
                                      >
                                         {location.city}, {location.country}
                                      </div>
                                   ))}
                                </div>
                             )}
                          </div>
                       </label>
                       <label>
                          Destination:
                          <div className="autocomplete">
                             <input
                                type="text"
                                value={destinationLocationInput}
                                onChange={(e) => {
                                   setDestinationLocationInput(e.target.value);
                                   setShowDestinationSuggestions(true);
                                }}
                                onFocus={() => setShowDestinationSuggestions(true)}
                                placeholder="Type to search..."
                             />
                             {showDestinationSuggestions && destinationLocationInput && (
                                <div className="suggestions">
                                   {filterLocations(destinationLocationInput).map((location) => (
                                      <div
                                         key={`${location.city}-${location.country}`}
                                         className="suggestion-item"
                                         onClick={() => {
                                            setDestinationLocation(`${location.city}, ${location.country}`);
                                            setDestinationLocationInput(`${location.city}, ${location.country}`);
                                            setShowDestinationSuggestions(false);
                                         }}
                                      >
                                         {location.city}, {location.country}
                                      </div>
                                   ))}
                                </div>
                             )}
                          </div>
                       </label>
                       <label>
                          Time Zone Difference:
                          <input 
                             type="number" 
                             value={timeZoneDiff}
                             disabled
                             className="timezone-diff"
                          />
                          <span className="timezone-note">hours ({timeZoneDiff >= 0 ? 'ahead' : 'behind'})</span>
                       </label>
                    </div>
                 </div>
              </>
           ) : (
              null
           )}

           <div className="input-group">
              <h3>{mode === 'manual' ? '1: Current Sleep Schedule' : '2: Current Sleep Schedule'}</h3>
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

           {mode === 'manual' && (
              <>
                 <div className="input-group">
                    <h3>2: Target Schedule</h3>
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
                 </div>

                 <div className="input-group">
                    <h3>3: Adjustment Details</h3>
                    <div className="number-inputs">
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
              </>
           )}

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
