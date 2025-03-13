export const loadFHIRSchedule = async (file: File) => {
  try {
    const text = await file.text();
    const fhirData = JSON.parse(text);
    
    // Convert FHIR format back to app format
    const schedule: any = { Activity: [] };
    const activities = new Set<string>();
    
    fhirData.schedule.forEach((item: any) => {
      if (!schedule[item.day]) {
        schedule[item.day] = [];
      }
      schedule[item.day].push(item.time);
      activities.add(item.activity);
    });
    
    schedule.Activity = Array.from(activities);
    
    return schedule;
  } catch (error) {
    console.error('Error loading FHIR schedule:', error);
    throw error;
  }
}; 
export { };