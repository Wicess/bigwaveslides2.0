/**
 * Per-product FAQs built from the unit's own attributes. Rendered on the page
 * AND emitted as FAQPage JSON-LD so each product is eligible for FAQ rich
 * results — and answers the exact questions shoppers search before booking or
 * buying. Rental context = booking questions; sale context = buying questions.
 */
import { BRAND_NAME } from "@/lib/brand";

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

/** Extra facts a sale page has on hand (all from the product row). */
export type SaleFaqOpts = Opts & {
  /** Formatted daily rental rate when the same unit is also rented. */
  dailyRate?: string;
  /** Sale price ÷ daily rate, in whole days (for the rent-vs-buy answer). */
  daysOfRental?: number;
  space?: string | null;
  power?: string | null;
  capacity?: number | null;
  /** Formatted flat transportation fee, when the owner has it switched on. */
  transport?: string;
};

/**
 * Buying-intent FAQs for a sale product page — answer-first and built only
 * from this unit's own row, so 52 shop pages never repeat one sentence and no
 * answer states anything the catalog can't back (the old set claimed "PVC
 * vinyl with welded seams", nationwide shipping terms and a "pays for itself
 * in 10–20 bookings" figure that no field supports).
 */
export function saleFaqs(opts: SaleFaqOpts): ProductFaq[] {
  const { name, price, kind, dailyRate, daysOfRental, space, power, dims } =
    opts;
  const k = kind ?? "inflatable";
  const faqs: ProductFaq[] = [];

  if (price) {
    faqs.push({
      q: `How much does it cost to buy the ${name}?`,
      a: `The ${name} sells for ${price} from ${BRAND_NAME}.${opts.transport ? ` The order adds one flat ${opts.transport} transportation fee.` : ""} You place the order online and the team confirms availability and delivery before any payment.`,
    });
  }

  if (dailyRate) {
    faqs.push({
      q: `Can I rent the ${name} instead of buying it?`,
      a: `Yes. ${BRAND_NAME} also rents the ${name} at ${dailyRate} per day, delivered, set up and collected.${daysOfRental ? ` At that rate the purchase price equals about ${daysOfRental} rental days — before your own transport, storage and insurance costs if you buy it to rent out.` : ""}`,
    });
  }

  const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  const spec = [
    dims ? `measures ${dims}` : "",
    space ? `needs a ${space}` : "",
    power ? `runs on ${lower(power)}` : "",
    opts.capacity ? `takes ${opts.capacity} riders at a time` : "",
    opts.age ? `is rated for ages ${opts.age}` : "",
  ].filter(Boolean);
  if (spec.length) {
    faqs.push({
      q: `What space and power does the ${name} need?`,
      a: `The ${name} ${spec.length > 1 ? `${spec.slice(0, -1).join(", ")} and ${spec[spec.length - 1]}` : spec[0]}.`,
    });
  }

  faqs.push({
    q: `Where does ${BRAND_NAME} deliver the ${name}?`,
    a: `Anywhere in the United States, and only there — ${BRAND_NAME} does not ship outside the U.S. The ${name} is a commercial-grade ${k} from the same catalog ${BRAND_NAME} rents from.`,
  });

  return faqs;
}
