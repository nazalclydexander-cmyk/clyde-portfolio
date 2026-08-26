type TurnstileWidgetId = string;

type TurnstileOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
};

type TurnstileInstance = {
  render: (container: HTMLElement, options: TurnstileOptions) => TurnstileWidgetId;
  reset: (widgetId?: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

export {};
