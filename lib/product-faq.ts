/**
 * Per-product FAQs built from the unit's own attributes. Rendered on the page
 * AND emitted as FAQPage JSON-LD so each product is eligible for FAQ rich
 * results — and answers the exact questions shoppers search before booking or
 * buying. Rental context = booking questions; sale context = buying questions.
 */
export type ProductFaq = { q: string; a: string };

type Opts = {
  name: string;
  locale: string;
  /** Formatted price string, e.g. "$449". */
  price?: string;
  /** Human dimensions string, e.g. "34 ft L × 18 ft W × 27 ft H". */
  dims?: string;
  age?: string | null;
  /** Product kind label, e.g. "inflatable water slide" / "bounce house". */
  kind?: string;
};

/** Booking-intent FAQs for a rental product page. */
export function rentalFaqs(opts: Opts): ProductFaq[] {
  const { name, locale, price, dims, age } = opts;
  const fr = locale === "fr";
  const faqs: ProductFaq[] = [];

  faqs.push(
    fr
      ? {
          q: `Livrez-vous et installez-vous le ${name} ?`,
          a: `Oui — nous livrons, installons, ancrons et récupérons le ${name} pour vous. La livraison, l'installation et le ramassage sont inclus ; vous n'avez qu'à profiter de la journée.`,
        }
      : {
          q: `Do you deliver and set up the ${name}?`,
          a: `Yes — we deliver, professionally set up, anchor and pick up the ${name} for you. Delivery, setup and pickup are all included, so all you do is enjoy the day.`,
        },
  );

  if (price) {
    faqs.push(
      fr
        ? {
            q: `Combien coûte la location du ${name} ?`,
            a: `La location du ${name} commence à ${price} par jour, livraison, installation et assurance comprises. Demandez un devis gratuit pour votre date et votre lieu.`,
          }
        : {
            q: `How much does it cost to rent the ${name}?`,
            a: `The ${name} rents from ${price} per day with delivery, setup and insurance included. Request a free, no-obligation quote for your date and venue.`,
          },
    );
  }

  if (dims) {
    faqs.push(
      fr
        ? {
            q: `Quel espace faut-il pour le ${name} ?`,
            a: `Prévoyez une surface plane d'environ ${dims}, avec un peu de dégagement autour, plus un accès à l'eau et à l'électricité. Nous confirmons que tout rentre avant la livraison.`,
          }
        : {
            q: `How much space does the ${name} need?`,
            a: `Plan for a flat area of about ${dims}, with a little clearance around it, plus access to water and power. We confirm the fit before delivery.`,
          },
    );
  }

  if (age) {
    faqs.push(
      fr
        ? {
            q: `Le ${name} convient à partir de quel âge ?`,
            a: `Le ${name} est recommandé pour les ${age}. Une supervision adulte est toujours conseillée.`,
          }
        : {
            q: `What ages is the ${name} for?`,
            a: `The ${name} is recommended for ages ${age}. Adult supervision is always recommended.`,
          },
    );
  }

  faqs.push(
    fr
      ? {
          q: `Le ${name} est-il nettoyé et assuré ?`,
          a: `Absolument. Chaque location est nettoyée et désinfectée avant la livraison et entièrement assurée, installée par une équipe formée avec un ancrage adéquat.`,
        }
      : {
          q: `Is the ${name} cleaned and insured?`,
          a: `Absolutely. Every rental is cleaned and sanitized before delivery and fully insured, installed by a trained crew with proper anchoring.`,
        },
  );

  return faqs;
}

/** Buying-intent FAQs for a sale product page. */
export function saleFaqs(opts: Opts): ProductFaq[] {
  const { name, locale, price, kind } = opts;
  const fr = locale === "fr";
  const k = kind ?? (fr ? "gonflable" : "inflatable");
  const faqs: ProductFaq[] = [];

  faqs.push(
    fr
      ? {
          q: `Le ${name} est-il de qualité commerciale ?`,
          a: `Oui. Le ${name} est un ${k} de qualité commerciale, en vinyle PVC robuste avec coutures soudées renforcées — conçu pour des locations à répétition et un usage intensif, pas pour un usage résidentiel.`,
        }
      : {
          q: `Is the ${name} commercial-grade?`,
          a: `Yes. The ${name} is a commercial-grade ${k} made from heavy-duty PVC vinyl with reinforced welded seams — built for back-to-back rentals and heavy use, not residential use.`,
        },
  );

  if (price) {
    faqs.push(
      fr
        ? {
            q: `Combien coûte le ${name} ?`,
            a: `Le ${name} est proposé à ${price}. Livraison partout aux États-Unis disponible — demandez un devis pour le prix livré à votre adresse.`,
          }
        : {
            q: `How much does the ${name} cost?`,
            a: `The ${name} is priced at ${price}. Nationwide delivery is available — request a quote for the delivered price to your address.`,
          },
    );
  }

  faqs.push(
    fr
      ? {
          q: `Livrez-vous le ${name} partout aux États-Unis ?`,
          a: `Oui — nous expédions le ${name} partout aux États-Unis. Demandez un devis et nous confirmerons les délais et le coût de livraison jusqu'à chez vous.`,
        }
      : {
          q: `Do you ship the ${name} nationwide?`,
          a: `Yes — we ship the ${name} anywhere in the United States. Request a quote and we'll confirm delivery timing and cost to your location.`,
        },
  );

  faqs.push(
    fr
      ? {
          q: `Puis-je utiliser le ${name} pour démarrer une entreprise de location ?`,
          a: `Absolument — c'est exactement à cela qu'il sert. Le ${name} est conçu pour un usage locatif commercial et se rentabilise souvent en 10 à 20 réservations. Voyez notre guide pour lancer une entreprise de location de glissades d'eau.`,
        }
      : {
          q: `Can I use the ${name} to start a rental business?`,
          a: `Absolutely — that's exactly what it's built for. The ${name} is designed for commercial rental use and often pays for itself within 10–20 bookings. See our guide on how to start a water slide rental business.`,
        },
  );

  return faqs;
}
