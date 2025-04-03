import { default as dayjs } from "dayjs"
import { default as duration } from "dayjs/plugin/duration"

dayjs.extend(duration)

function formatCount(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"} ago`
}

export function formatTimeFromToday(timestamp: dayjs.ConfigType): string {
  const now = dayjs()
  const targetDate = dayjs(timestamp)
  const timeDiff = dayjs.duration(now.diff(targetDate))

  /**
   * If it's the same day, display the time difference in hours, or minutes
   */
  if (now.isSame(targetDate, "day")) {
    if (timeDiff.hours()) {
      return formatCount(timeDiff.hours(), "hour")
    }

    if (timeDiff.minutes()) {
      return formatCount(timeDiff.minutes(), "minute")
    }

    return "just now"
  }

  /**
   * If it's the day before, display "Yesterday"
   */
  if (now.subtract(1, "day").isSame(targetDate, "day")) {
    return "yesterday"
  }

  /**
   * If it's more than a year ago, display the time difference in years
   */
  if (timeDiff.years()) {
    return formatCount(timeDiff.years(), "year")
  }

  /**
   * If it's more than a month ago, display the time difference in months
   */
  if (timeDiff.months()) {
    return formatCount(timeDiff.months(), "month")
  }

  /**
   * If it's more than a week ago, display the time difference in weeks
   */
  if (timeDiff.weeks()) {
    return formatCount(timeDiff.weeks(), "week")
  }

  // If the time difference is between 24 hours and 48 hours,
  // display "2 days" instead of "1 day", to avoid confusion
  // with "Yesterday".
  const days = timeDiff.days() === 1 ? 2 : timeDiff.days()
  return formatCount(days, "day")
}
