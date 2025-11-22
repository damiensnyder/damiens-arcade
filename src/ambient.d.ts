// Svelte 5 runes ambient declarations
declare function $state<T>(initial: T): T;
declare function $state<T>(): T | undefined;
declare function $derived<T>(expression: T): T;
declare function $effect(fn: () => void | (() => void)): void;
declare function $props<T>(): T;
