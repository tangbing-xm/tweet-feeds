const WIDGETS_SRC = "https://platform.twitter.com/widgets.js";

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => Promise<void>;
        createTweet: (
          tweetId: string,
          container: HTMLElement,
          options?: Record<string, unknown>,
        ) => Promise<HTMLElement | undefined>;
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;

function waitForWidgets(timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.twttr?.widgets) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("Twitter widgets did not initialize in time."));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

/**
 * Loads Twitter widgets.js exactly once on the client and resolves when
 * `window.twttr.widgets` is available.
 */
export function ensureTwitterWidgets(timeoutMs = 8000): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.twttr?.widgets) return Promise.resolve();

  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${WIDGETS_SRC}"]`,
    );

    if (!existing) {
      const script = document.createElement("script");
      script.src = WIDGETS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        void waitForWidgets(timeoutMs).then(resolve).catch(reject);
      };
      script.onerror = () => reject(new Error("Failed to load Twitter widgets.js"));
      document.head.appendChild(script);
      return;
    }

    // Script exists (maybe added by browser cache or other path) — wait for init.
    void waitForWidgets(timeoutMs).then(resolve).catch(reject);
  });

  return loadPromise;
}


