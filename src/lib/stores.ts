import { writable } from 'svelte/store';

export const roomCode = writable("");
export const roomName = writable("");
export const isPublic = writable(false);
export const host = writable(0);
export const pov = writable(0);
export const connected = writable(false);

function createEventLog() {
  const { subscribe, set, update } = writable([] as string[]);
  return {
    subscribe,
    set,
    update,
    append: (newEvent: string) => update((log) => {
      log.push(newEvent);
      return log;
    })
  };
}

export const lastAction = writable(null);
export const eventLog = createEventLog();