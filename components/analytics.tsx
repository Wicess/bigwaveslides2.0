import Script from "next/script";
import { env } from "@/lib/env";

/**
 * GA4 + Microsoft Clarity, loaded only when their IDs are configured.
 *
 * `lazyOnload` defers both to browser idle time — AFTER the page is interactive
 * — so these third-party tags (Clarity in particular is main-thread heavy) stop
 * inflating Total Blocking Time / INP. Analytics don't need to fire immediately,
 * so this is a pure performance win with no data loss.
 */
export function Analytics() {
  const ga = env.NEXT_PUBLIC_GA_ID;
  const clarity = env.NEXT_PUBLIC_CLARITY_ID;
  if (!ga && !clarity) return null;

  return (
    <>
      {ga ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="lazyOnload"
          />
          <Script id="ga4" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      ) : null}

      {clarity ? (
        <Script id="clarity" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");`}
        </Script>
      ) : null}
    </>
  );
}
