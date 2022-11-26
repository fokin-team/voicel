import { Listeners, Listener } from './types';

class Emitter {
  private events: Map<string, Listeners>;

  constructor() {
    this.events = new Map();
  }

  private uId() {
    const a = new Uint32Array(3);
    window.crypto.getRandomValues(a);
    return (performance.now().toString(36) + Array.from(a).map((A) => A.toString(36)).join('')).replace(/\./g, '');
  }

  /**
   * Add event listener
   * @param label Event name
   * @param callback Callback
   * @return {number}
   */
  addListener<T>(label: string, callback: (arg: T) => void): string {
    if (typeof callback === 'function') {
      if (!this.events.has(label)) {
        this.events.set(label, []);
      }
      const id = this.uId();
      this.events.get(label)?.push({ id, callback } as Listener);
      return id;
    }
    throw new Error('Invalid callback type. Callback must be function');
  }

  /**
   * Remove monitor
   * @param label Event name
   * @param id Event id
   * @return {boolean}
   */
  removeListener(label: string, id: string): boolean {
    const listeners = this.events.get(label);

    if (listeners) {
      const index = listeners.findIndex((listener) => listener.id === id);

      if (index > -1) {
        const result = listeners.slice(index, 1);
        this.events.set(label, result);

        return true;
      }
    }
    return false;
  }

  /**
   * monitor
   * @param label Event name
   * @param arg parameter
   * @return {boolean}
   */
  emit(label: string, arg?: Event | CloseEvent | unknown): boolean {
    const events = this.events.get(label);

    if (events) {
      events.forEach((listener) => {
        listener.callback(arg);
      });

      return true;
    }
    return false;
  }
}

export { Emitter };
