/**
 * The questions Splash Republic is asked most, answered instantly in the chat.
 *
 * Each answer is the site's own published FAQ wording (lib/qa.ts), shortened, so the
 * chat can never say something the FAQ does not: when a price or a policy changes
 * there, change it here too. The transportation fee is read from the same constant
 * the checkout charges, so that one cannot drift. Each links to the page that
 * answers it in full.
 */
import { formatPrice } from "@/lib/format";
import { TRANSPORT_CENTS } from "@/lib/pricing";

export interface CannedReply {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly href: string;
  readonly linkLabel: string;
}

export const CANNED_REPLIES: readonly CannedReply[] = [
  {
    id: "price",
    question: "How much does a rental cost?",
    answer:
      "Water slide rentals start at $155 per day, and most backyard slides and combos run about $230 to $570 per day. Every rental includes delivery, setup, sanitizing, insurance and pickup. Your exact price comes in a free quote.",
    href: "/en/quote",
    linkLabel: "Get a free quote",
  },
  {
    id: "booking",
    question: "How does booking work?",
    answer:
      "Choose your slide, date and city and request a free quote. We confirm availability, the delivery window and your exact price, then you approve and we arrange payment with you directly.",
    href: "/en/faq",
    linkLabel: "Booking questions",
  },
  {
    id: "delivery",
    question: "Do you deliver to my area?",
    answer: `We deliver, set up and pick up in all 50 states. Transportation is one flat ${formatPrice(TRANSPORT_CENTS)} fee per order, not per item and not per mile, and it covers delivery, setup and pickup.`,
    href: "/en/water-slide-rentals",
    linkLabel: "Find your city",
  },
  {
    id: "order-status",
    question: "Where's my booking?",
    answer:
      "Your quotes, invoices and bookings are in your account, with their status and payment details. Your confirmation email also has a link straight to your order.",
    href: "/en/account",
    linkLabel: "My account",
  },
];
