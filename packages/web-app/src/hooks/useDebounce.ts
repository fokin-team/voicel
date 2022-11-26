import {
  createFilterWrapper,
  debounceFilter,
  DebounceFilterOptions,
  FunctionArgs,
} from '@/utils/shared/filters';

import { MaybeComputedRef } from '@/utils/shared/types';

export function useDebounce<T extends FunctionArgs>(
  fn: T,
  ms: MaybeComputedRef<number> = 200,
  options: DebounceFilterOptions = {},
): T {
  return createFilterWrapper(
    debounceFilter(ms, options),
    fn,
  );
}
