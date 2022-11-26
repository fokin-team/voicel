import { ComputedRef, Ref } from 'vue';

/**
 * Any function
 */
export type Fn = () => void;

/**
 * A ref that allow to set null or undefined
 */
export type RemovableRef<T> = Omit<Ref<T>, 'value'> & {
  get value(): T
  set value(value: T | null | undefined)
};

/**
 * @deprecated Use `RemovableRef`
 */
export type RemoveableRef<T> = RemovableRef<T>;

/**
 * Maybe it's a ref, or a plain value
 *
 * ```ts
 * type MaybeRef<T> = T | Ref<T>
 * ```
 */
export type MaybeRef<T> = T | Ref<T>;

/**
 * Maybe it's a computed ref, or a getter function
 *
 * ```ts
 * type MaybeReadonlyRef<T> = (() => T) | ComputedRef<T>
 * ```
 */
export type MaybeReadonlyRef<T> = (() => T) | ComputedRef<T>;

/**
 * Maybe it's a ref, or a plain value, or a getter function
 *
 * ```ts
 * type MaybeComputedRef<T> = (() => T) | T | Ref<T> | ComputedRef<T>
 * ```
 */
export type MaybeComputedRef<T> = MaybeReadonlyRef<T> | MaybeRef<T>;

export interface Pausable {
  /**
   * A ref indicate whether a pausable instance is active
   */
  isActive: Ref<boolean>

  /**
   * Temporary pause the effect from executing
   */
  pause: Fn

  /**
   * Resume the effects
   */
  resume: Fn
}
