// lib/qa.ts
// The AEO "question–answer" knowledge base. Each answer is self-contained,
// answer-first, and ~40–60 words with concrete numbers — the format ChatGPT,
// Perplexity and Google AI Overviews lift straight into their answers. Kept
// deliberately deeper and more specific than the short /faq set (no overlap in
// wording). All facts are real: pricing, delivery fees, and requirements match
// the business; no invented policies (e.g. no deposit claims).

export type QAItem = { q: string; a: string };
export type QACategory = { title: string; slug: string; items: QAItem[] };

export const QA_CATEGORIES: QACategory[] = [
  {
    title: "Cost & payment",
    slug: "cost",
    items: [
      {
        q: "How much does it cost to rent a water slide?",
        a: "Water slide rentals start at $199 per day. Most backyard water slides and bounce-and-slide combos run about $250–$550 per day, with the exact price confirmed in a free quote. Every rental includes delivery, professional setup, sanitizing, full insurance, and pickup — no hidden fees.",
      },
      {
        q: "What is included in the water slide rental price?",
        a: "Every Splash Republic rental includes delivery, professional setup and anchoring, sanitizing before drop-off, full insurance, and end-of-event pickup. You only provide the space, a water hookup, and power. There is nothing to haul, install, or clean up yourself.",
      },
      {
        q: "How much are delivery fees for a water slide rental?",
        a: "Delivery starts with a $49 base fee, and the first 15 miles from our service area are included. Beyond that it is $2.50 per mile, plus a $29 pickup fee. Your exact delivery cost is calculated for your address and shown in your free quote.",
      },
      {
        q: "Do I pay online to book a water slide?",
        a: "No. Splash Republic is quote-based with no online checkout. You request a free quote, we confirm your date, delivery window, and exact price, and payment is arranged directly with our team. No card is charged on the website.",
      },
      {
        q: "Is it cheaper to rent or buy an inflatable water slide?",
        a: "For one-off events, renting is far cheaper — from $199 per day, all-inclusive, versus thousands to buy. Buying a commercial unit makes sense only if you host very often or run a rental business. Splash Republic offers both: rentals nationwide and commercial inflatables for sale.",
      },
    ],
  },
  {
    title: "Booking & availability",
    slug: "booking",
    items: [
      {
        q: "How far in advance should I book a water slide rental?",
        a: "Book 2–4 weeks ahead for peak summer weekends, holidays, and end-of-school dates, which fill up first. Off-peak and weekday events often book with just a few days' notice. Submit a quote request anytime and we will confirm availability for your date.",
      },
      {
        q: "How does booking a water slide rental work?",
        a: "It is three steps: choose your slide, date, and city and request a free quote; we confirm availability, the delivery window, and your exact price; then you approve and pay offline. There is no online checkout — our team confirms every detail with you directly.",
      },
      {
        q: "What areas do you deliver water slides to?",
        a: "Splash Republic delivers, sets up, and picks up in all 50 U.S. states. Whether it is a backyard, park, school, church, or community venue, we bring the equipment to you and handle installation and pickup nationwide.",
      },
      {
        q: "Can you deliver a water slide to a park or public venue?",
        a: "Yes. We regularly set up at parks, schools, churches, campgrounds, and community venues. Some public sites require a permit or proof of insurance — we can provide an insurance certificate, and we will help you plan a safe, approved setup.",
      },
    ],
  },
  {
    title: "Space, setup & requirements",
    slug: "setup",
    items: [
      {
        q: "How much space do I need for a water slide?",
        a: "Most residential water slides need a flat area roughly 20 feet wide by 30–40 feet long, plus a few feet of clearance on all sides and overhead. Exact dimensions vary by slide, are listed with each unit, and are confirmed in your quote.",
      },
      {
        q: "What surface can a water slide be set up on?",
        a: "Grass is ideal, but we also set up on dirt, artificial turf, concrete, or asphalt. On hard surfaces we anchor with sandbags instead of stakes. Tell us your surface when booking so our crew plans the safest, most secure setup.",
      },
      {
        q: "Do I need water and electricity for a water slide rental?",
        a: "Yes. You need a standard garden-hose spigot for water and a grounded power outlet within about 100 feet to run the blower, which stays on continuously. No outlet nearby? We can supply a generator — just let us know when booking.",
      },
      {
        q: "Who sets up and takes down the water slide?",
        a: "Our trained crew handles everything — delivery, setup, anchoring, and a safety check before use — then returns to take it down and pick it up. You do not lift, install, or clean anything at any point.",
      },
      {
        q: "How long does it take to set up a water slide?",
        a: "Setup typically takes 30–60 minutes depending on the slide's size, and teardown is similar. We schedule delivery so your slide is inflated, anchored, and safety-checked before your event's start time.",
      },
    ],
  },
  {
    title: "Safety, cleaning & insurance",
    slug: "safety",
    items: [
      {
        q: "Are inflatable water slides safe?",
        a: "Yes, when properly anchored and supervised. Every Splash Republic unit is commercial-grade, sanitized, fully insured, and installed by a trained crew with a safety check. For safe use, an adult should supervise riders and follow the posted rider limits.",
      },
      {
        q: "Do you clean and sanitize the water slides?",
        a: "Yes. Every water slide is thoroughly cleaned and sanitized before each delivery, so it arrives fresh for your event. Sanitizing is included in the rental price at no extra cost.",
      },
      {
        q: "Are your water slide rentals insured?",
        a: "Yes — every rental is fully insured. For schools, churches, HOAs, and public venues that require it, we can provide a certificate of insurance. Just ask when you request your quote.",
      },
      {
        q: "Is there a weight or age limit for water slides?",
        a: "Limits vary by unit — each slide has its own maximum rider count, height, and weight guidelines. We confirm the specifics for the slide you choose so it is a good fit for your guests before your event.",
      },
    ],
  },
  {
    title: "Weather & season",
    slug: "weather",
    items: [
      {
        q: "What happens if it rains on my event day?",
        a: "Light rain is usually fine, but for safety inflatables must be shut down in high winds (around 15–25 mph) or thunderstorms. If severe weather threatens your date, contact us early and we will work with you on timing or rescheduling.",
      },
      {
        q: "Can water slides be used without water?",
        a: "Yes — many of our slides run wet or dry, so a cooler day does not cancel the fun. Let us know when you book and we will recommend a unit that works great either way.",
      },
      {
        q: "When is water slide rental season?",
        a: "It depends on your region. In the South and West the season runs roughly March through October; in the Northeast and Midwest it is about late May through early September. Peak summer weekends book first, so reserve early.",
      },
    ],
  },
  {
    title: "Equipment & events",
    slug: "events",
    items: [
      {
        q: "What kinds of events are water slides good for?",
        a: "Water slides are a hit at birthday parties, backyard and pool parties, school and church events, corporate and community days, family reunions, summer camps, and festivals. We serve events of every size, from a single backyard to a large community gathering.",
      },
      {
        q: "Do you rent bounce houses and combo units too?",
        a: "Yes. Along with water slides we rent bounce houses and combo units (a bounce house plus a slide), all commercial-grade and delivered set up. We also sell commercial inflatables for buyers who host often or run a rental business.",
      },
      {
        q: "Can I rent a water slide for a school, church, or community event?",
        a: "Absolutely. We regularly serve schools, churches, HOAs, camps, municipalities, and corporate events, and can provide insurance certificates when a venue requires one. Tell us your event type and headcount and we will recommend the right setup.",
      },
    ],
  },
];

/** Every Q&A flattened — used for FAQPage schema and quick lookups. */
export function allQA(): QAItem[] {
  return QA_CATEGORIES.flatMap((c) => c.items);
}
