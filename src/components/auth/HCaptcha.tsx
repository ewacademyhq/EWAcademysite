"use client";

import Script from "next/script";
import { forwardRef, useImperativeHandle, useRef } from "react";

declare global {
  interface Window {
    hcaptcha?: {
      render: (
        container: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export interface HCaptchaHandle {
  reset: () => void;
}

/**
 * Widget de hCaptcha — requerido una vez que se activa "Enable Captcha
 * protection" en Supabase Auth (ver src/lib/supabase/client.ts no hace
 * falta tocarlo: el token se pasa por llamada vía `options.captchaToken`).
 * Mientras esa protección esté apagada en Supabase, el login/registro
 * funciona igual aunque este widget nunca se complete.
 */
export const HCaptcha = forwardRef<HCaptchaHandle, { onVerify: (token: string) => void }>(
  function HCaptcha({ onVerify }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      reset() {
        if (window.hcaptcha && widgetIdRef.current) {
          window.hcaptcha.reset(widgetIdRef.current);
        }
      },
    }));

    function render() {
      if (!window.hcaptcha || !containerRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
        sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!,
        callback: onVerify,
        "expired-callback": () => onVerify(""),
      });
    }

    return (
      <>
        <Script
          src="https://js.hcaptcha.com/1/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={render}
        />
        <div ref={containerRef} />
      </>
    );
  }
);
