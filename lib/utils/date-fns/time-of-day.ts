export function getTimeOfDay() {
  // get the local time of day, morning afternoon, evening or night
  const now = new Date()
  const hour = now.getHours()

  let timeOfDay = "morning"

  if (hour >= 12 && hour < 18) {
    timeOfDay = "afternoon"
  } else if (hour >= 18) {
    timeOfDay = "evening"
  } else if (hour < 6) {
    timeOfDay = "night"
  }

  return timeOfDay
}
