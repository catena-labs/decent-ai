type TypedEntryValue<T extends Record<string, unknown>> =
  T[keyof T] extends undefined ? T[keyof T] : Exclude<T[keyof T], undefined>

/**
 * Object.entries that allows passing in a type for the entries. It ensures that
 * the value type includes 'undefined' only if explicitly specified in the
 * object type.
 */
export function typedEntries<T extends Record<string, unknown>>(
  obj: T
): [keyof T, TypedEntryValue<T>][] {
  return Object.entries(obj) as [keyof T, TypedEntryValue<T>][]
}
