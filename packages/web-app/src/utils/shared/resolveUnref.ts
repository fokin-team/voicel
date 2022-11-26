import { unref } from 'vue';
import type { MaybeComputedRef } from './types';

/**
 * Normalize value/ref/getter to `ref` or `computed`.
 */
export function resolveUnref<T>(r: MaybeComputedRef<T>): T {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return typeof r === 'function'
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    ? (r as any)()
    : unref(r);
}
