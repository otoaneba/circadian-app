interface FHIRSchedule {
  resourceType: string;
  id: string;
  status: string;
  category: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string;
  };
  effectivePeriod: {
    start: string;
    end: string;
  };
  schedule: Array<{
    activity: string;
    time: string;
    day: string;
  }>;
}

export const convertToFHIR = (schedule: any, baseSchedule: any): FHIRSchedule => {
  const today = new Date();
  const scheduleId = `schedule-${today.getTime()}`;

  const fhirSchedule: FHIRSchedule = {
    resourceType: "CarePlan",
    id: scheduleId,
    status: "active",
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/care-plan-category",
        code: "assess-plan",
        display: "Circadian Rhythm Adjustment Schedule"
      }]
    }],
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "736438001",
        display: "Circadian rhythm sleep disorder"
      }]
    },
    subject: {
      reference: "Patient/example"
    },
    effectivePeriod: {
      start: today.toISOString(),
      end: new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString()
    },
    schedule: []
  };

  // Convert schedule data to FHIR format
  Object.keys(schedule).forEach(day => {
    if (day !== 'Activity') {
      schedule[day].forEach((time: string, index: number) => {
        fhirSchedule.schedule.push({
          activity: schedule.Activity[index],
          time: time,
          day: day
        });
      });
    }
  });

  return fhirSchedule;
}; 

export {}