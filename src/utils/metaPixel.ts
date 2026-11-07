// ============================================================
// Meta Pixel (Facebook Pixel) — helper para disparar eventos
// Pixel ID: 985047124527608
// ============================================================

declare global {
  interface Window {
    fbq?: (
      command: string,
      eventName: string,
      params?: Record<string, unknown>,
      extra?: Record<string, unknown>,
    ) => void;
  }
}

/** Dispara um evento padrão do Meta Pixel (se o fbq estiver carregado) */
export function metaPixel(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
}

/** Dispara um evento personalizado (custom event) */
export function metaPixelCustom(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
  }
}

/** Dispara PageView — util para SPA onde a pagina nao recarrega */
export function metaPixelPageView() {
  metaPixel('PageView');
}