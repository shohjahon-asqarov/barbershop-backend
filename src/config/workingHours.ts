/**
 * Default working hours constants
 * Used for barber schedule defaults
 */

export const DEFAULT_WORKING_HOURS = {
  START: "09:00",
  END: "18:00",
  LUNCH_START: "13:00",
  LUNCH_END: "14:00",
} as const;

export const DEFAULT_WORKING_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;
