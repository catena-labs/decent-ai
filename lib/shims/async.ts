/* eslint-disable @typescript-eslint/no-explicit-any -- need it for polyfill */
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- need it for polyfill  */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- need it for polyfill  */
/**
 * Polyfill Symbol.asyncIterator
 *
 * @see {@link https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html#caveats}
 */
;(Symbol as any).asyncIterator =
  Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator")
