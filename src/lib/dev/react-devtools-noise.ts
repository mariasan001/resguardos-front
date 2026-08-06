/**
 * React DevTools (installHook.js) reporta en consola el error
 * "We are cleaning up async info that was not on the parent Suspense boundary"
 * al navegar con Next 16 / React 19. Es un bug abierto de la extensión
 * (vercel/next.js#84973): no ocurre sin la extensión ni en producción.
 */
const KNOWN_MARKERS = [
  "react instrumentation encountered an error",
  "cleaning up async info that was not on the parent suspense boundary",
];

function isKnownDevtoolsNoise(value: unknown): boolean {
  const text =
    typeof value === "string"
      ? value
      : value instanceof Error
        ? value.message
        : "";

  if (!text) {
    return false;
  }

  const normalized = text.toLowerCase();
  return KNOWN_MARKERS.some((marker) => normalized.includes(marker));
}

export function silenceReactDevtoolsNoise() {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") {
    return;
  }

  const globalScope = window as typeof window & {
    __devtoolsNoiseSilenced?: boolean;
  };

  if (globalScope.__devtoolsNoiseSilenced) {
    return;
  }

  globalScope.__devtoolsNoiseSilenced = true;

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: unknown[]) => {
    if (args.some(isKnownDevtoolsNoise)) {
      return;
    }

    originalError(...args);
  };

  console.warn = (...args: unknown[]) => {
    if (args.some(isKnownDevtoolsNoise)) {
      return;
    }

    originalWarn(...args);
  };
}
