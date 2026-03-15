export const PING_HOURS = [9, 11, 13, 15, 17, 19, 21];

/**
 * Calculates the exact start time of the Journey (Day 0, Ping 0).
 * It will be the first 9:00 AM after or equal to the registration date.
 */
export function getJourneyStartDate(registrationDateIso: string): Date {
  const regDate = new Date(registrationDateIso);
  const journeyStart = new Date(regDate);

  // If registered before 9am, it starts today at 9am.
  // If registered after 9am, it starts tomorrow at 9am.
  if (regDate.getHours() < PING_HOURS[0]) {
    journeyStart.setHours(PING_HOURS[0], 0, 0, 0);
  } else {
    journeyStart.setDate(journeyStart.getDate() + 1);
    journeyStart.setHours(PING_HOURS[0], 0, 0, 0);
  }

  return journeyStart;
}

/**
 * Calculates the exact scheduled Date for a specific ping (Day 0-6, Ping 0-6).
 */
export function getPingScheduledDate(
  journeyStartDate: Date,
  dayIndex: number,
  pingIndex: number
): Date {
  const scheduledDate = new Date(journeyStartDate);
  scheduledDate.setDate(scheduledDate.getDate() + dayIndex);
  scheduledDate.setHours(PING_HOURS[pingIndex], 0, 0, 0);
  return scheduledDate;
}

export type PingTimeState = "future" | "active" | "missed";

/**
 * Evaluates the state of a specific ping based on the current time.
 * The active window is: [Scheduled Time - 5 minutes] to [Scheduled Time + 20 minutes].
 */
export function evaluatePingState(
  scheduledDate: Date,
  now: Date = new Date()
): PingTimeState {
  const windowStart = new Date(scheduledDate);
  windowStart.setMinutes(windowStart.getMinutes() - 5);

  const windowEnd = new Date(scheduledDate);
  windowEnd.setMinutes(windowEnd.getMinutes() + 20);

  if (now < windowStart) {
    return "future";
  } else if (now > windowEnd) {
    return "missed";
  } else {
    return "active";
  }
}

export type ScheduleEvaluationResult = {
  currentActivePing: { day: number; ping: number; expiresAt: Date } | null;
  nextFuturePing: { day: number; ping: number; startsAt: Date } | null;
  newlyMissedPings: { day: number; ping: number }[];
  isJourneyComplete: boolean;
};

/**
 * Evaluates the entire 7x7 matrix of pings against the current time to determine
 * what the user should see now, and which pings need to be marked as missed.
 */
export function evaluateFullJourneySchedule(
  journeyStartDate: Date,
  currentPingsState: { statuses: string[] }[],
  now: Date = new Date()
): ScheduleEvaluationResult {
  const result: ScheduleEvaluationResult = {
    currentActivePing: null,
    nextFuturePing: null,
    newlyMissedPings: [],
    isJourneyComplete: false,
  };

  // We have exactly 7 days, 7 pings per day = 49 pings
  let allPingsPast = true;

  for (let day = 0; day < 7; day++) {
    for (let ping = 0; ping < 7; ping++) {
      const scheduledDate = getPingScheduledDate(journeyStartDate, day, ping);
      const state = evaluatePingState(scheduledDate, now);
      const statusInDb = currentPingsState[day]?.statuses[ping];

      if (state !== "missed") {
        allPingsPast = false;
      }

      if (state === "missed" && statusInDb === "pending") {
        result.newlyMissedPings.push({ day, ping });
      }

      if (state === "active" && statusInDb === "pending") {
        if (!result.currentActivePing) {
          const expiresAt = new Date(scheduledDate);
          expiresAt.setMinutes(expiresAt.getMinutes() + 20);
          result.currentActivePing = { day, ping, expiresAt };
        }
      }

      if (state === "future") {
        if (!result.nextFuturePing) {
          const startsAt = new Date(scheduledDate);
          startsAt.setMinutes(startsAt.getMinutes() - 5);
          result.nextFuturePing = { day, ping, startsAt };
          // We found the next immediate future ping, so we can break searching for *next* future ping,
          // but we still need to process the rest of the array to ensure we don't have missed ones (though chronologically impossible)
        }
      }
    }
  }

  // If the last ping's window is over, the journey is complete
  if (allPingsPast) {
    result.isJourneyComplete = true;
  }

  return result;
}
