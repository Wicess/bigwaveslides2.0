/**
 * TrustBand
 * ---------
 * A "trusted by / our partners" strip that appears on the homepage. It shows a
 * row of partner company logos that scroll sideways forever (a "marquee").
 *
 * The logos are stored in Cloudflare R2 (our media/file storage) rather than in
 * the project folder, so we just point at their public URLs.
 */
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Marquee } from "@/components/ui/marquee";
import { Reveal } from "@/components/motion/reveal";
import { optimizedSrc } from "@/lib/image-loader";

// Base URL of the R2 bucket folder that holds the partner logo images.
const R2 = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev/partners";
// List of logo file names. The .map() below turns each one into a full URL
// (e.g. "https://.../partners/33679843.jpg") so we can drop them straight
// into <img src=...>.
const PARTNERS = [
  "33679843.jpg",
  "40036748.jpg",
  "52816299.jpg",
  "58899539.jpg",
  "75382947.jpg",
  "77574493.jpg",
  "90893822.jpg",
  "91429835.jpg",
].map((f) => `${R2}/${f}`);

export async function TrustBand() {
  const t = await getTranslations("Home");

  return (
    <section className="border-border relative overflow-hidden border-b bg-white py-10 sm:py-12">
      <Container>
        <Reveal>
          <p className="text-primary-700 text-center text-sm font-bold tracking-[0.22em] uppercase">
            {t("ourPartners")}
          </p>
        </Reveal>
      </Container>

      {/*
        Logo wall — the <Marquee> component endlessly scrolls its children
        sideways. `durationSeconds={44}` sets how long one full loop takes
        (bigger = slower), and `reverse` flips the scroll direction.
      */}
      <Reveal className="mt-8" delay={0.1}>
        <Marquee durationSeconds={44} reverse>
          {PARTNERS.map((src, i) => (
            // Each logo sits in a fixed-size box. The "group/logo" name lets the
            // <img> react to THIS box being hovered (see group-hover/logo below).
            <span
              key={src}
              className="group/logo grid h-12 w-20 shrink-0 place-items-center sm:h-16 sm:w-28"
            >
              {}
              {/*
                Logos come from many brands with different colors/backgrounds.
                To make them look like one consistent set we:
                  - grayscale + opacity-60: dim them to a uniform muted gray.
                  - [mix-blend-mode:multiply]: blends the image with the white
                    section behind it, so any white box around a logo
                    disappears and the logo looks transparent.
                On hover the trick is reversed: group-hover/logo:grayscale-0
                brings back the real color, opacity-100 makes it solid, and
                scale-105 gently zooms it. `transition-all duration-300`
                animates that change smoothly over 0.3s.
              */}
              {/* Phones have no hover to restore the color, so the muted
                  grayscale treatment only applies from md up — on mobile the
                  logos show at full color and full opacity. */}
              {/* Explicit height + w-auto, NOT max-h-full: percentage
                  max-heights don't resolve inside this content-sized grid
                  track, so the image used to render oversized and visually
                  cropped to its middle band. A fixed height guarantees the
                  whole logo is always visible. */}
              <img
                src={optimizedSrc(src, 160)}
                alt={`Partner ${i + 1}`}
                loading="lazy"
                className="h-9 w-auto object-contain [mix-blend-mode:multiply] transition-all duration-300 sm:h-12 md:opacity-60 md:grayscale md:group-hover/logo:scale-105 md:group-hover/logo:opacity-100 md:group-hover/logo:grayscale-0"
              />
            </span>
          ))}
        </Marquee>
      </Reveal>
    </section>
  );
}
