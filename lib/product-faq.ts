/**
 * Per-product FAQs built from the unit's own attributes. Rendered on the page
 * AND emitted as FAQPage JSON-LD so each product is eligible for FAQ rich
 * results — and answers the exact questions shoppers search before booking or
 * buying. Rental context = booking questions; sale context = buying questions.
 */
export type ProductFaq = { q: string; a: string };

type Opts = {
  name: string;
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
  const { name, price, dims, age } = opts;
  const faqs: ProductFaq[] = [];

  faqs.push({
    q: `Do you deliver and set up the ${name}?`,
    a: `Yes — we deliver, professionally set up, anchor and pick up the ${name} for you. Delivery, setup and pickup are all included, so all you do is enjoy the day.`,
  });

  if (price) {
    faqs.push({
      q: `How much does it cost to rent the ${name}?`,
      a: `The ${name} rents from ${price} per day with delivery, setup and insurance included. Request a free, no-obligation quote for your date and venue.`,
    });
  }

  if (dims) {
    faqs.push({
      q: `How much space does the ${name} need?`,
      a: `Plan for a flat area of about ${dims}, with a little clearance around it, plus access to water and power. We confirm the fit before delivery.`,
    });
  }

  if (age) {
    faqs.push({
      q: `What ages is the ${name} for?`,
      a: `The ${name} is recommended for ages ${age}. Adult supervision is always recommended.`,
    });
  }

  faqs.push({
    q: `Is the ${name} cleaned and insured?`,
    a: `Absolutely. Every rental is cleaned and sanitized before delivery and fully insured, installed by a trained crew with proper anchoring.`,
  });

  return faqs;
}

/** Buying-intent FAQs for a sale product page. */
export function saleFaqs(opts: Opts): ProductFaq[] {
  const { name, price, kind } = opts;
  const k = kind ?? "inflatable";
  const faqs: ProductFaq[] = [];

  faqs.push({
    q: `Is the ${name} commercial-grade?`,
    a: `Yes. The ${name} is a commercial-grade ${k} made from heavy-duty PVC vinyl with reinforced welded seams — built for back-to-back rentals and heavy use, not residential use.`,
  });

  if (price) {
    faqs.push({
      q: `How much does the ${name} cost?`,
      a: `The ${name} is priced at ${price}. Nationwide delivery is available — request a quote for the delivered price to your address.`,
    });
  }

  faqs.push({
    q: `Do you ship the ${name} nationwide?`,
    a: `Yes — we ship the ${name} anywhere in the United States. Request a quote and we'll confirm delivery timing and cost to your location.`,
  });

  faqs.push({
    q: `Can I use the ${name} to start a rental business?`,
    a: `Absolutely — that's exactly what it's built for. The ${name} is designed for commercial rental use and often pays for itself within 10–20 bookings. See our guide on how to start a water slide rental business.`,
  });

  return faqs;
}
