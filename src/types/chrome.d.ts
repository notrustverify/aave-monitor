// Type definitions for Chrome's sidePanel API
// https://developer.chrome.com/docs/extensions/reference/sidePanel/

declare namespace chrome {
  export namespace sidePanel {
    export function setOptions(options: {
      path?: string;
      enabled?: boolean;
    }): void;

    export function open(options?: { windowId?: number; tabId?: number }): void;

    export function getOptions(
      callback: (options: { path: string; enabled: boolean }) => void
    ): void;
  }
}
