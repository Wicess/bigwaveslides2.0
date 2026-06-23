/** Static legal + FAQ copy, locale-keyed (kept out of i18n message files due to length). */

export type Section = { heading: string; body: string };
export type Faq = { q: string; a: string };

type Locale = "en" | "fr";

export const PRIVACY: Record<Locale, { title: string; intro: string; sections: Section[] }> = {
  en: {
    title: "Privacy Policy",
    intro: "This policy explains what information Big Wave Slides collects, how we use it, and your choices. We never take payment online — requests are handled by our team.",
    sections: [
      { heading: "Information we collect", body: "When you submit a request, quote, booking, review, or contact form, we collect your name, email, phone, event details, and any message you provide. We also collect basic analytics (pages viewed, device type) to improve the site." },
      { heading: "How we use it", body: "We use your information to respond to requests, prepare quotes, coordinate deliveries and events, send transactional emails, and improve our services. With your consent we may send occasional offers; you can opt out anytime." },
      { heading: "Sharing", body: "We do not sell your data. We share information only with service providers that help us operate (email delivery, hosting, analytics) and when required by law." },
      { heading: "Cookies & analytics", body: "We use essential cookies for cart and session functionality, and optional analytics (Google Analytics, Microsoft Clarity) to understand usage. You can control cookies in your browser settings." },
      { heading: "Data retention & security", body: "We keep request and order records for as long as needed to serve you and meet legal obligations. We use reasonable safeguards, including encrypted connections and hashed passwords." },
      { heading: "Your rights", body: "You may request access to, correction of, or deletion of your personal data by contacting us. If you have an account, you can update your details in your profile." },
      { heading: "Contact", body: "Questions about this policy? Reach us through the contact page and we'll be happy to help." },
    ],
  },
  fr: {
    title: "Politique de confidentialité",
    intro: "Cette politique explique quelles informations Big Wave Slides recueille, comment nous les utilisons et vos choix. Aucun paiement n'est pris en ligne — les demandes sont traitées par notre équipe.",
    sections: [
      { heading: "Informations que nous recueillons", body: "Lorsque vous soumettez une demande, un devis, une réservation, un avis ou un formulaire de contact, nous recueillons vos nom, courriel, téléphone, détails de l'événement et tout message fourni. Nous recueillons aussi des analyses de base (pages vues, type d'appareil)." },
      { heading: "Utilisation", body: "Nous utilisons vos informations pour répondre aux demandes, préparer des devis, coordonner les livraisons et événements, envoyer des courriels transactionnels et améliorer nos services. Avec votre consentement, nous pouvons envoyer des offres occasionnelles ; vous pouvez vous désabonner à tout moment." },
      { heading: "Partage", body: "Nous ne vendons pas vos données. Nous les partageons uniquement avec des prestataires qui nous aident à fonctionner (envoi de courriels, hébergement, analyses) et lorsque la loi l'exige." },
      { heading: "Témoins et analyses", body: "Nous utilisons des témoins essentiels pour le panier et la session, et des analyses optionnelles (Google Analytics, Microsoft Clarity). Vous pouvez contrôler les témoins dans votre navigateur." },
      { heading: "Conservation et sécurité", body: "Nous conservons les dossiers aussi longtemps que nécessaire pour vous servir et respecter nos obligations légales. Nous utilisons des protections raisonnables, dont des connexions chiffrées et des mots de passe hachés." },
      { heading: "Vos droits", body: "Vous pouvez demander l'accès, la correction ou la suppression de vos données personnelles en nous contactant. Si vous avez un compte, vous pouvez mettre à jour vos informations dans votre profil." },
      { heading: "Contact", body: "Des questions sur cette politique ? Contactez-nous via la page de contact." },
    ],
  },
};

export const TERMS: Record<Locale, { title: string; intro: string; sections: Section[] }> = {
  en: {
    title: "Terms of Service",
    intro: "These terms govern your use of the Big Wave Slides website and our request-based ordering, rental, and event services.",
    sections: [
      { heading: "Request-based model", body: "Orders, rentals, and bookings placed on this site are requests, not confirmed purchases. No payment is taken online. Our team confirms availability and emails a quote with payment details; a booking is only confirmed once we accept it." },
      { heading: "Pricing & quotes", body: "Prices and instant quotes shown are estimates. Final pricing — including delivery, setup, and applicable fees — is confirmed in your written quote." },
      { heading: "Rentals & safety", body: "Renters must provide a safe, level setup area and supervise use at all times, following the safety guidelines we provide. The renter is responsible for damage beyond normal wear, loss, or theft while equipment is in their care." },
      { heading: "Cancellations & weather", body: "Bookings may be rescheduled for safety due to severe weather at our discretion. Cancellation terms are confirmed in your quote or rental agreement." },
      { heading: "Accounts", body: "You are responsible for keeping your account credentials secure and for activity under your account." },
      { heading: "Intellectual property", body: "All site content, branding, and imagery are owned by Big Wave Slides or its licensors and may not be reused without permission." },
      { heading: "Limitation of liability", body: "To the extent permitted by law, Big Wave Slides is not liable for indirect or consequential damages arising from use of the site or services." },
      { heading: "Changes", body: "We may update these terms from time to time. Continued use of the site means you accept the current terms." },
    ],
  },
  fr: {
    title: "Conditions d'utilisation",
    intro: "Ces conditions régissent votre utilisation du site Big Wave Slides et de nos services de commande, location et événements sur demande.",
    sections: [
      { heading: "Modèle sur demande", body: "Les commandes, locations et réservations passées sur ce site sont des demandes, et non des achats confirmés. Aucun paiement n'est pris en ligne. Notre équipe confirme la disponibilité et envoie un devis avec les modalités de paiement ; une réservation n'est confirmée qu'après notre acceptation." },
      { heading: "Prix et devis", body: "Les prix et devis instantanés affichés sont des estimations. Le prix final — incluant livraison, installation et frais applicables — est confirmé dans votre devis écrit." },
      { heading: "Locations et sécurité", body: "Les locataires doivent fournir une aire d'installation sûre et plane et superviser l'utilisation en tout temps, selon les consignes fournies. Le locataire est responsable des dommages au-delà de l'usure normale, de la perte ou du vol." },
      { heading: "Annulations et météo", body: "Les réservations peuvent être reportées pour des raisons de sécurité en cas d'intempéries, à notre discrétion. Les conditions d'annulation sont confirmées dans votre devis ou contrat." },
      { heading: "Comptes", body: "Vous êtes responsable de la sécurité de vos identifiants et des activités effectuées sous votre compte." },
      { heading: "Propriété intellectuelle", body: "Tout le contenu, l'image de marque et les visuels du site appartiennent à Big Wave Slides ou à ses concédants et ne peuvent être réutilisés sans autorisation." },
      { heading: "Limitation de responsabilité", body: "Dans la mesure permise par la loi, Big Wave Slides n'est pas responsable des dommages indirects ou consécutifs découlant de l'utilisation du site ou des services." },
      { heading: "Modifications", body: "Nous pouvons mettre à jour ces conditions. L'utilisation continue du site vaut acceptation des conditions en vigueur." },
    ],
  },
};

export const FAQS: Record<Locale, { title: string; intro: string; items: Faq[] }> = {
  en: {
    title: "Frequently asked questions",
    intro: "Everything you need to know about renting, buying, and booking with Big Wave Slides.",
    items: [
      { q: "Do I pay online?", a: "No. Everything on the site is request-based — we'll email you a personalized quote and payment details to confirm. No card is charged online." },
      { q: "How do I check if my date is available?", a: "Open any rental and use the availability calendar. Pick your dates for an instant quote; we confirm the final hold once you submit a booking request." },
      { q: "Do you deliver and set up?", a: "Yes. Delivery, setup, safety checks, and pickup are available. Delivery fees depend on your location and are confirmed in your quote." },
      { q: "Is everything insured and cleaned?", a: "Every unit is inspected, sanitized, and fully insured before each event." },
      { q: "How far in advance should I book?", a: "Earlier is better, especially in summer. Submit a request anytime — we'll let you know availability and suggest alternatives if needed." },
      { q: "Can I rent for schools, churches, or corporate events?", a: "Absolutely. We serve families, schools, churches, hotels, municipalities, and corporate events of all sizes." },
      { q: "What surfaces can slides be set up on?", a: "Grass, concrete, asphalt, artificial turf, or indoors. Let us know your surface in the booking request so we can plan the safest setup." },
      { q: "Do you sell slides too?", a: "Yes — browse the shop for commercial-grade slides to purchase, with the same request-based, no-online-payment process." },
    ],
  },
  fr: {
    title: "Foire aux questions",
    intro: "Tout ce qu'il faut savoir pour louer, acheter et réserver avec Big Wave Slides.",
    items: [
      { q: "Dois-je payer en ligne ?", a: "Non. Tout sur le site se fait sur demande — nous vous enverrons un devis personnalisé et les modalités de paiement. Aucune carte n'est débitée en ligne." },
      { q: "Comment vérifier la disponibilité de ma date ?", a: "Ouvrez une location et utilisez le calendrier de disponibilité. Choisissez vos dates pour un devis instantané ; nous confirmons la réservation une fois la demande envoyée." },
      { q: "Assurez-vous la livraison et l'installation ?", a: "Oui. Livraison, installation, vérifications de sécurité et reprise sont disponibles. Les frais dépendent de votre localisation et sont confirmés dans le devis." },
      { q: "Tout est-il assuré et nettoyé ?", a: "Chaque unité est inspectée, désinfectée et entièrement assurée avant chaque événement." },
      { q: "Combien de temps à l'avance réserver ?", a: "Le plus tôt est le mieux, surtout l'été. Envoyez une demande à tout moment — nous vous indiquerons la disponibilité et des alternatives au besoin." },
      { q: "Puis-je louer pour des écoles, églises ou événements corporatifs ?", a: "Absolument. Nous servons familles, écoles, églises, hôtels, municipalités et entreprises de toutes tailles." },
      { q: "Sur quelles surfaces installer les toboggans ?", a: "Gazon, béton, asphalte, gazon artificiel ou intérieur. Indiquez votre surface dans la demande pour planifier l'installation la plus sûre." },
      { q: "Vendez-vous aussi des toboggans ?", a: "Oui — parcourez la boutique pour des toboggans de qualité commerciale, avec le même processus sur demande, sans paiement en ligne." },
    ],
  },
};

export function pickLocale(locale: string): Locale {
  return locale === "fr" ? "fr" : "en";
}
