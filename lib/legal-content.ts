/** Static legal + FAQ copy (kept out of i18n message files due to length).
 *  English only — the site serves the United States and has no other locale. */

export type Section = { heading: string; body: string };
export type Faq = { q: string; a: string };

export const PRIVACY: { title: string; intro: string; sections: Section[] } = {
  title: "Privacy Policy",
  intro:
    "This policy explains what information Big Wave Slides collects, how we use it, and your choices. We never take payment online — requests are handled by our team.",
  sections: [
    {
      heading: "Information we collect",
      body: "When you submit a request, quote, booking, review, or contact form, we collect your name, email, phone, event details, and any message you provide. We also collect basic analytics (pages viewed, device type) to improve the site.",
    },
    {
      heading: "How we use it",
      body: "We use your information to respond to requests, prepare quotes, coordinate deliveries and events, send transactional emails, and improve our services. With your consent we may send occasional offers; you can opt out anytime.",
    },
    {
      heading: "Sharing",
      body: "We do not sell your data. We share information only with service providers that help us operate (email delivery, hosting, analytics) and when required by law.",
    },
    {
      heading: "Cookies & analytics",
      body: "We use essential cookies for cart and session functionality, and optional analytics (Google Analytics, Microsoft Clarity) to understand usage. You can control cookies in your browser settings.",
    },
    {
      heading: "Data retention & security",
      body: "We keep request and order records for as long as needed to serve you and meet legal obligations. We use reasonable safeguards, including encrypted connections and hashed passwords.",
    },
    {
      heading: "Your rights",
      body: "You may request access to, correction of, or deletion of your personal data by contacting us. If you have an account, you can update your details in your profile.",
    },
    {
      heading: "Contact",
      body: "Questions about this policy? Reach us through the contact page and we'll be happy to help.",
    },
  ],
};

export const TERMS: { title: string; intro: string; sections: Section[] } = {
  title: "Terms of Service",
  intro:
    "These terms govern your use of the Big Wave Slides website and our request-based ordering, rental, and event services.",
  sections: [
    {
      heading: "Request-based model",
      body: "Orders, rentals, and bookings placed on this site are requests, not confirmed purchases. No payment is taken online. Our team confirms availability and emails a quote with payment details; a booking is only confirmed once we accept it.",
    },
    {
      heading: "Pricing & quotes",
      body: "Prices and instant quotes shown are estimates. Final pricing — including delivery, setup, and applicable fees — is confirmed in your written quote.",
    },
    {
      heading: "Rentals & safety",
      body: "Renters must provide a safe, level setup area and supervise use at all times, following the safety guidelines we provide. The renter is responsible for damage beyond normal wear, loss, or theft while equipment is in their care.",
    },
    {
      heading: "Cancellations & weather",
      body: "Bookings may be rescheduled for safety due to severe weather at our discretion. Cancellation terms are confirmed in your quote or rental agreement.",
    },
    {
      heading: "Accounts",
      body: "You are responsible for keeping your account credentials secure and for activity under your account.",
    },
    {
      heading: "Intellectual property",
      body: "All site content, branding, and imagery are owned by Big Wave Slides or its licensors and may not be reused without permission.",
    },
    {
      heading: "Limitation of liability",
      body: "To the extent permitted by law, Big Wave Slides is not liable for indirect or consequential damages arising from use of the site or services.",
    },
    {
      heading: "Changes",
      body: "We may update these terms from time to time. Continued use of the site means you accept the current terms.",
    },
  ],
};

export const FAQS: { title: string; intro: string; items: Faq[] } = {
  title: "Frequently asked questions",
  intro:
    "Everything you need to know about renting, buying, and booking with Big Wave Slides.",
  items: [
    {
      q: "Do I pay online?",
      a: "No. Everything on the site is request-based — we'll email you a personalized quote and payment details to confirm. No card is charged online.",
    },
    {
      q: "How do I check if my date is available?",
      a: "Open any rental and use the availability calendar. Pick your dates for an instant quote; we confirm the final hold once you submit a booking request.",
    },
    {
      q: "Do you deliver and set up?",
      a: "Yes. Delivery, setup, safety checks, and pickup are available. Delivery fees depend on your location and are confirmed in your quote.",
    },
    {
      q: "Is everything insured and cleaned?",
      a: "Every unit is inspected, sanitized, and fully insured before each event.",
    },
    {
      q: "How far in advance should I book?",
      a: "Earlier is better, especially in summer. Submit a request anytime — we'll let you know availability and suggest alternatives if needed.",
    },
    {
      q: "Can I rent for schools, churches, or corporate events?",
      a: "Absolutely. We serve families, schools, churches, hotels, municipalities, and corporate events of all sizes.",
    },
    {
      q: "What surfaces can slides be set up on?",
      a: "Grass, concrete, asphalt, artificial turf, or indoors. Let us know your surface in the booking request so we can plan the safest setup.",
    },
    {
      q: "Do you sell slides too?",
      a: "Yes — browse the shop for commercial-grade slides to purchase, with the same request-based, no-online-payment process.",
    },
  ],
};
