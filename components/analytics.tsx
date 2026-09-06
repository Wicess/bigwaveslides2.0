import Script from "next/script";
import { env } from "@/lib/env";

/**
 * GA4, Microsoft Clarity and Ahrefs Web Analytics, each loaded only when its
 * ID is configured.
 *
 * `lazyOnload` defers both to browser idle time — AFTER the page is interactive
 * — so these third-party tags (Clarity in particular is main-thread heavy) stop
 * inflating Total Blocking Time / INP. Analytics don't need to fire immediately,
 * so this is a pure performance win with no data loss.
 */
export function Analytics() {
  const ga = env.NEXT_PUBLIC_GA_ID;
  const clarity = env.NEXT_PUBLIC_CLARITY_ID;
  const ahrefs = env.NEXT_PUBLIC_AHREFS_KEY;
  if (!ga && !clarity && !ahrefs) return null;

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

      {ahrefs ? (
        // A PLAIN <script async>, not next/script — deliberately.
        //
        // With next/script the tag never reaches the HTML: for a server
        // component the props are serialised into the RSC payload and the
        // element is created client-side at idle. Ahrefs verifies by fetching
        // the page and looking for the tag, executes no JavaScript, and so
        // reported "Script isn't found" even though the key was present in the
        // payload. Any third party that verifies by scanning source has the
        // same problem.
        //
        // `async` keeps it off the critical path, which was the point of
        // deferring in the first place. React hoists this into <head>, so it
        // is exactly the snippet Ahrefs documents.
        <script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key={ahrefs}
          async
        />
      ) : null}

      {clarity ? (
        <Script id="clarity" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");`}
        </Script>
      ) : null}
    </>
  );
}
