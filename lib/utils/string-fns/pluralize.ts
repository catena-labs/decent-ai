export function pluralize(amount: number, singular: string, plural: string) {
  if (amount === 1) {
    return singular
  }

  return plural
}
