export function emptyStringToUndefined(value?: string | null) {
  return value?.trim() === "" ? undefined : value
}
