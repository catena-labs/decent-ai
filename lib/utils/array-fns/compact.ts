export function compact<T>(array: (T | false | null | undefined)[]): T[] {
  return array.filter(Boolean) as T[]
}
