// Terms & conditions + setup requirements shared by the PDF documents and the
// public quote/invoice pages, so the legal text can never drift between the
// two surfaces. Plain module (no server-only) — safe for PDFs and pages alike.

export const GOVERNING_STATE = "Ohio";

export type Clause = { t: string; b: string };

export const RENTAL_TERMS: Clause[] = [
  {
    t: "Agreement & validity.",
    b: 'This Rental Invoice & Agreement becomes binding once signed by the Renter and accepted by Big Wave Slides (the "Company"). This document is the final invoice for the rental — no separate invoice will be issued. Equipment is supplied for the stated rental period only and may not be extended without written approval.',
  },
  {
    t: "Fees & refundable deposit.",
    b: "Charges are as itemized (rental, delivery/transport, pickup). Any refundable deposit shown covers damage, excessive cleaning, loss, theft, or late return, and is refunded after inspection less any deductions.",
  },
  {
    t: "Site, setup & supervision.",
    b: "The Renter must provide a safe, level, clear area with a grounded power outlet within 50 ft and clear access; unsuitable or hazardous sites may be refused without refund. Competent adult supervision is required at all times, enforcing all capacity, height, age, and safety rules; no flips, rough play, food, drink, shoes, or use under the influence.",
  },
  {
    t: "Weather.",
    b: "For safety, inflatables must not be used in sustained winds above 20 mph, storms, or lightning, and must be evacuated and unplugged. The Company may reschedule or cancel for severe weather at its discretion.",
  },
  {
    t: "Renter responsibility, damage & spillage.",
    b: "The Renter is responsible for the equipment from delivery to pickup and is liable for damage beyond normal wear, loss, or theft. Cleaning fees apply for excessive soiling or spillage (food, drink, paint, silly string, mud, or bodily fluids). Equipment must not be moved after setup.",
  },
  {
    t: "Assumption of risk & indemnification.",
    b: "Use of water slides and inflatables involves inherent risks of injury. To the fullest extent permitted by law, the Renter assumes these risks and agrees to indemnify and hold harmless the Company, its owners, and staff from any claims, injuries, damages, or losses arising from use during the rental period, except those caused by the Company's gross negligence. The Company carries liability insurance for its equipment.",
  },
  {
    t: "Cancellation, liability & governing law.",
    b: `To cancel or reschedule, contact the Company as early as possible — we will always try to accommodate a date change; the 30% refundable deposit included in the total is refunded in full when a cancellation is signaled at least 7 days before the event. To the maximum extent permitted by law, the Company's total liability shall not exceed the amount paid, and it is not liable for indirect or consequential damages. This Agreement is governed by the laws of the State of ${GOVERNING_STATE}.`,
  },
];

export const orderTerms = (party: string): Clause[] => [
  {
    t: "Agreement & validity.",
    b: `This Invoice becomes a binding order once signed by the ${party} and accepted by Big Wave Slides. This document is the final invoice for the order — no separate invoice will be issued. Applicable taxes and delivery, where relevant, are itemized above.`,
  },
  {
    t: "Payment.",
    b: `No charge is processed automatically. To book a date, the ${party} pays 50% of the total; the remaining 50% is due 48 hours before the event (or the full amount may be paid upfront). 30% of the total acts as a refundable deposit, refunded in full when a cancellation is signaled at least 7 days before the event. For rentals, each rental day is one complete 24-hour period.`,
  },
  {
    t: "Delivery, inspection & warranty.",
    b: `Title and risk of loss pass to the ${party} on delivery or collection; timelines are estimates. The ${party} must inspect goods on receipt and report defects within the stated window. Any manufacturer's warranty accompanies the product; returns follow the Company's standard policy.`,
  },
  {
    t: "Safe use, liability & governing law.",
    b: `Commercial-grade equipment must be installed and operated per the provided guidelines and applicable safety standards. To the maximum extent permitted by law, the Company's liability is limited to the purchase price, and the ${party} assumes responsibility for safe installation, supervision, and use after delivery. Governed by the laws of the State of ${GOVERNING_STATE}.`,
  },
];

/** Pre-acceptance quote terms — acceptance issues the invoice. */
export const quoteTerms = (party: string, validUntil?: string): Clause[] => [
  {
    t: "Quote & validity.",
    b: `This Quote is an offer, not a bill — nothing is owed until you accept it.${
      validUntil ? ` It is valid until ${validUntil};` : " It is"
    } prices are subject to equipment availability at confirmation. Accepting the quote (online, or by signed return) issues your official invoice.`,
  },
  {
    t: "Payment schedule.",
    b: "Once your invoice is issued, you choose either a 50% payment to book your date — with the remaining 50% due 48 hours before the event — or full payment upfront. 30% of your total acts as a refundable deposit: it is refunded in full if you cancel at least 7 days before your event. No charge is ever processed automatically — payment details for your chosen method are provided with the invoice.",
  },
  {
    t: "What's included.",
    b: "The rental price already includes delivery, setup safety, professional workmanship to set up (with proper anchoring), a commercial blower, basic insurance, sanitizing before delivery, and pickup — unless a line above states otherwise. Each rental day is one complete 24-hour period: the number of days on your quote sets the rental length, and one day always means a full 24 hours with the slide.",
  },
  {
    t: "Site & safety.",
    b: `The ${party} provides a safe, level, clear area with a grounded power outlet within 50 ft and clear access. Adult supervision is required at all times. Inflatables must not be used in sustained winds above 20 mph, storms, or lightning.`,
  },
  {
    t: "Cancellation & governing law.",
    b: `To cancel or reschedule after accepting, contact us as early as possible — we will always try to accommodate a date change. The 30% refundable deposit included in your total is refunded in full when you signal a cancellation at least 7 days before the event. Governed by the laws of the State of ${GOVERNING_STATE}.`,
  },
];

export const SETUP_REQUIREMENTS = [
  "A flat, level area of grass or turf, clear of rocks, sticks, and pet waste — sized per the slide's product page, with roughly 20 ft of overhead clearance and no power lines above.",
  "A standard grounded 110–120V outlet within 50 ft of the setup spot (or a generator — we can supply one on request).",
  "A garden hose connection within reach for water slides.",
  "Clear access from the street/driveway to the setup area (approx. 4 ft wide path).",
  "An adult present at delivery for the placement walkthrough and safety briefing.",
];
