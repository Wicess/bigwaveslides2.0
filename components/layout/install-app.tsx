"use client";

/*
 * InstallApp — the "download the app" button (PWA install).
 *
 * Behavior by platform:
 *  - Android/Chrome: captures the browser's `beforeinstallprompt` event and
 *    fires the NATIVE install dialog on tap.
 *  - iOS (Safari/Chrome): Apple doesn't allow programmatic installs, so a tap
 *    opens a polished bottom sheet with the exact "Add to Home Screen" steps.
 *  - Any other browser without prompt support: same sheet with generic steps.
 *  - Already installed (running standalone): renders nothing.
 *
 * Also registers the minimal service worker (/sw.js) that makes the site
 * installable. Two visual variants: "chip" (icon button for the dark header
 * top bar, mobile only) and "drawer" (labeled button for the mobile menu).
 */

import * as React from "react";
import Image from "next/image";
import { Download, Share, SquarePlus, X, MoreVertical } from "lucide-react";
import { trackEvent } from "@/lib/analytics/client";
import { APP_INSTALLED_COOKIE } from "@/lib/loyalty";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Persisted once the app is installed, so the install button stays hidden in
// the browser tab across future visits (not just while running standalone).
const INSTALLED_KEY = "bws_pwa_installed";

const STRINGS = {
  en: {
    install: "Install app",
    title: "Get the Splash Republic app",
    subtitle:
      "Add us to your home screen — one tap to browse slides and book your date.",
    iosSteps: [
      { icon: Share, text: "Tap the Share button in Safari's toolbar" },
      { icon: SquarePlus, text: "Scroll down and tap “Add to Home Screen”" },
      { icon: Download, text: "Tap “Add” — the app lands on your home screen" },
    ],
    genericSteps: [
      { icon: MoreVertical, text: "Open your browser menu (⋮)" },
      {
        icon: SquarePlus,
        text: "Tap “Install app” or “Add to Home screen”",
      },
      { icon: Download, text: "Confirm — the app lands on your home screen" },
    ],
    close: "Close",
  },
} as const;

export function InstallApp({
  variant = "chip",
}: {
  variant?: "chip" | "drawer";
}) {
  const t = STRINGS.en;

  const [mounted, setMounted] = React.useState(false);
  const [standalone, setStandalone] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const deferredRef = React.useRef<BeforeInstallPromptEvent | null>(null);
  const recordedRef = React.useRef(false);

  React.useEffect(() => {
    setMounted(true);

    // Hide the button when the app is installed — whether we're running inside
    // it (any app display mode) OR we're in a browser tab but the PWA is known
    // to be installed (persisted flag + getInstalledRelatedApps below).
    const mq = window.matchMedia(
      "(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)",
    );
    const isInstalledFlag = () => {
      try {
        return localStorage.getItem(INSTALLED_KEY) === "1";
      } catch {
        return false;
      }
    };
    // Record the install once (for the +5% app discount + the admin monitor).
    // Guarded by a per-mount ref AND the server cookie, so it fires once per
    // browser; it re-arms only after the cookie expires (a year).
    const recordInstall = (reason: string) => {
      if (
        recordedRef.current ||
        document.cookie.includes(`${APP_INSTALLED_COOKIE}=1`)
      )
        return;
      recordedRef.current = true;
      trackEvent({
        type: "APP_INSTALL",
        path: window.location.pathname,
        meta: {
          reason,
          standalone:
            mq.matches ||
            (navigator as unknown as { standalone?: boolean }).standalone ===
              true,
          platform: navigator.platform,
        },
      });
    };
    const compute = () => {
      const inApp =
        mq.matches ||
        (navigator as unknown as { standalone?: boolean }).standalone ===
          true ||
        isInstalledFlag();
      setStandalone(inApp);
      if (inApp) recordInstall("standalone");
    };
    compute();
    mq.addEventListener?.("change", compute);

    // Already installed from a previous session? Ask the browser directly so we
    // can hide the button even in a normal tab (Android Chrome).
    (
      navigator as Navigator & {
        getInstalledRelatedApps?: () => Promise<unknown[]>;
      }
    )
      .getInstalledRelatedApps?.()
      .then((apps) => {
        if (apps && apps.length > 0) {
          try {
            localStorage.setItem(INSTALLED_KEY, "1");
          } catch {
            /* ignore */
          }
          setStandalone(true);
          recordInstall("related-apps");
        }
      })
      .catch(() => {});

    // iOS (incl. iPadOS which masquerades as MacIntel with touch).
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );

    // Android/Chrome hands us the native prompt here; stash it for the tap.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {
        /* ignore */
      }
      deferredRef.current = null;
      setStandalone(true);
      setSheetOpen(false);
      recordInstall("appinstalled");
    };
    window.addEventListener("appinstalled", onInstalled);

    // The service worker that makes the site installable.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener?.("change", compute);
    };
  }, []);

  if (!mounted || standalone) return null;

  const onClick = async () => {
    const deferred = deferredRef.current;
    if (!isIOS && deferred) {
      // Native Android install dialog.
      await deferred.prompt();
      const choice = await deferred.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") deferredRef.current = null;
      return;
    }
    // iOS (or no native prompt available): show the step-by-step sheet.
    setSheetOpen(true);
  };

  const steps = isIOS ? t.iosSteps : t.genericSteps;

  return (
    <>
      {variant === "chip" ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={t.install}
          className="relative grid size-9 place-items-center rounded-md border border-[#a3e635]/40 bg-white/5 text-white transition-colors hover:bg-white/10 sm:size-11 md:hidden"
        >
          {/* Gentle bounce draws the eye; static under reduced-motion. */}
          <Download className="size-4 motion-safe:animate-bounce sm:size-[18px]" />
          {/* Blinking lime signal dot — "tap me". */}
          <span aria-hidden className="absolute -top-1 -right-1 flex size-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#a3e635] opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[#a3e635]" />
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="border-border text-foreground hover:bg-muted hover:text-primary relative inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors"
        >
          <Download className="size-4 motion-safe:animate-bounce" />
          {t.install}
          <span aria-hidden className="absolute -top-1 -right-1 flex size-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#a3e635] opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[#a3e635]" />
          </span>
        </button>
      )}

      {/* Install-instructions bottom sheet (iOS + unsupported browsers). */}
      {sheetOpen ? (
        <div
          className="fixed inset-0 z-[100]"
          role="dialog"
          aria-modal="true"
          aria-label={t.title}
        >
          <button
            type="button"
            aria-label={t.close}
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />
          <div className="bg-background absolute inset-x-0 bottom-0 rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.25)]">
            <div className="bg-muted-foreground/30 mx-auto h-1 w-10 rounded-full" />
            <div className="mt-5 flex items-start gap-4">
              <span className="border-border shrink-0 rounded-2xl border bg-white p-2 shadow-sm">
                <Image
                  src="/pwa/icon-192.png"
                  alt="Splash Republic app icon"
                  width={56}
                  height={56}
                  className="size-14 rounded-xl"
                />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg leading-tight font-bold">
                  {t.title}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm leading-snug">
                  {t.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label={t.close}
                className="text-muted-foreground hover:text-foreground ml-auto shrink-0 p-1 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <ol className="mt-6 space-y-4">
              {steps.map((step, i) => (
                <li key={i} className="flex items-center gap-3.5">
                  <span className="bg-primary grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <step.icon className="text-primary size-5 shrink-0" />
                  <span className="text-sm leading-snug">{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </>
  );
}
