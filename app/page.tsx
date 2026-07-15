import Script from "next/script";
import { bodyContent } from "./body-content";
import { siteScript } from "./site-script";

// Step 1 (static lift-and-shift): this page renders the legacy site's body
// markup and JS verbatim, ported into Next.js with zero visual/behavioral
// change. Cart/checkout/email logic gets rebuilt in later migration steps
// (Turso, Stripe, Resend) — this step only proves the shell renders identically.

export default function Home() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
      <Script id="egoff-site-script" strategy="afterInteractive">
        {siteScript}
      </Script>
    </>
  );
}
