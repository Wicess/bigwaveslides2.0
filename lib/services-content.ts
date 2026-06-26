// lib/services-content.ts
// Canonical, bilingual content for the single Services page. Authoring it here
// (rather than thin DB summaries) lets us give each service a real write-up.
// `image` points at R2; swap these for bespoke generated art when ready.

type LT = { en: string; fr: string };
const l = (en: string, fr: string): LT => ({ en, fr });

export type ServiceCtaKind = "quote" | "shop" | "rent";

export type ServiceItem = {
  slug: string;
  icon:
    | "party"
    | "building"
    | "school"
    | "shop"
    | "build"
    | "truck"
    | "wrench"
    | "shield";
  image: string;
  title: LT;
  tagline: LT;
  /** Paragraphs separated by a blank line. */
  body: LT;
  highlights: LT[];
  cta: { kind: ServiceCtaKind; label: LT };
};

export type ServiceGroup = { key: string; label: LT; items: ServiceItem[] };

const R2 = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev";

export const SERVICES_HERO_IMAGE = `${R2}/blog/1782479234273-ipwk85-overview-dream-space-water-park-chongqing-china-photo01-2048x1277.jpg`;

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    key: "celebrate",
    label: l("Rent & celebrate", "Louer et célébrer"),
    items: [
      {
        slug: "event-rentals",
        icon: "party",
        image: `${R2}/blog/1782479217393-gvr19v-aquaforms-12-island-waterpark-at-showboat-atlantic-city-usa-photo12.jpg`,
        title: l("Backyard & Party Rentals", "Locations pour fêtes et jardins"),
        tagline: l(
          "Birthdays, pool days, and backyard blowouts — delivered, set up, and ready to splash.",
          "Anniversaires, journées piscine et fêtes de jardin — livrés, installés et prêts à éclabousser.",
        ),
        body: l(
          "Our most popular service. We bring premium, freshly-sanitized water slides right to your yard for birthdays, pool parties, graduations, and family get-togethers. You pick the slide; we handle delivery, professional setup, and takedown.\n\nEvery rental is fully insured and installed by a trained crew — so the only thing left for you to do is invite the guests and grab a towel.",
          "Notre service le plus populaire. Nous apportons des toboggans premium, fraîchement désinfectés, directement chez vous pour les anniversaires, fêtes à la piscine, remises de diplômes et réunions de famille. Vous choisissez le toboggan; nous nous occupons de la livraison, de l'installation professionnelle et du démontage.\n\nChaque location est entièrement assurée et installée par une équipe formée — il ne vous reste plus qu'à inviter vos convives et prendre une serviette.",
        ),
        highlights: [
          l("Delivery, pro setup & takedown", "Livraison, installation et démontage"),
          l("Cleaned & sanitized units", "Unités nettoyées et désinfectées"),
          l("Wet or dry options", "Options mouillées ou sèches"),
          l("Fully insured", "Entièrement assuré"),
        ],
        cta: { kind: "rent", label: l("Browse rentals", "Voir nos locations") },
      },
      {
        slug: "corporate-community-events",
        icon: "building",
        image: `${R2}/blog/1782484391964-6c8hz5-overview-epic-waters-indoor-waterpark-grand-prairie-usa-photo06-1536x1024.jpg`,
        title: l("Corporate & Community Events", "Événements d'entreprise et communautaires"),
        tagline: l(
          "Company picnics, festivals, and municipal celebrations people actually remember.",
          "Pique-niques d'entreprise, festivals et fêtes municipales dont on se souvient vraiment.",
        ),
        body: l(
          "Turn an ordinary event into the highlight of the year. We supply high-capacity slides and multiple units for company family days, employee-appreciation events, fundraisers, and town festivals — sized to your crowd so lines stay short.\n\nWe coordinate the logistics end to end: placement, power and water, on-site attendants, and the insurance and documentation that venues and municipalities require.",
          "Transformez un événement ordinaire en moment fort de l'année. Nous fournissons des toboggans à grande capacité et plusieurs unités pour les journées familiales d'entreprise, les événements de reconnaissance, les collectes de fonds et les festivals — dimensionnés à votre foule pour des files courtes.\n\nNous coordonnons toute la logistique : emplacement, eau et électricité, préposés sur place, et l'assurance et la documentation exigées par les lieux et les municipalités.",
        ),
        highlights: [
          l("High-capacity & multi-unit setups", "Installations à grande capacité et multi-unités"),
          l("Crowd-flow planning", "Planification du flux de foule"),
          l("On-site attendants available", "Préposés sur place disponibles"),
          l("Permit & insurance support", "Soutien permis et assurance"),
        ],
        cta: { kind: "quote", label: l("Plan your event", "Planifier votre événement") },
      },
      {
        slug: "school-camp-church",
        icon: "school",
        image: `${R2}/blog/1782484415828-npyn0m-serengeti-springs-098.jpg`,
        title: l("School, Camp & Church Events", "Écoles, camps et événements paroissiaux"),
        tagline: l(
          "Safe, insured, age-appropriate fun for field days, camps, and congregations.",
          "Du plaisir sûr, assuré et adapté à l'âge pour journées sportives, camps et communautés.",
        ),
        body: l(
          "Field days, end-of-year parties, summer camps, and church gatherings call for attractions that are exciting and reassuringly safe. We match slides to age groups and supervise rotations so every child has a blast within clear guidelines.\n\nWe're fully insured and happy to provide certificates and safety documentation for your school district, camp, or organization.",
          "Les journées sportives, fêtes de fin d'année, camps d'été et rassemblements paroissiaux exigent des attractions à la fois excitantes et rassurantes. Nous adaptons les toboggans aux groupes d'âge et supervisons les rotations pour que chaque enfant s'amuse dans un cadre clair.\n\nNous sommes entièrement assurés et fournissons volontiers certificats et documents de sécurité pour votre commission scolaire, camp ou organisation.",
        ),
        highlights: [
          l("Age-grouped slide selection", "Sélection par groupe d'âge"),
          l("Trained on-site supervision", "Supervision formée sur place"),
          l("Insurance certificates on request", "Certificats d'assurance sur demande"),
          l("Flexible scheduling", "Horaires flexibles"),
        ],
        cta: { kind: "quote", label: l("Request a quote", "Demander un devis") },
      },
    ],
  },
  {
    key: "build",
    label: l("Buy & build", "Acheter et construire"),
    items: [
      {
        slug: "water-slide-sales",
        icon: "shop",
        image: `${R2}/blog/1782479224040-b01ofi-aquaplay-1050-studio-city-water-park-macau-china-photo01-2048x1365.jpg`,
        title: l("Water Slide Sales", "Vente de toboggans"),
        tagline: l(
          "Own commercial-grade slides built to take years of summers.",
          "Possédez des toboggans de qualité commerciale conçus pour des années d'été.",
        ),
        body: l(
          "Use a slide often? Buying can be the smarter call. We sell commercial-grade inflatable water slides and combos — the same durable, certified units we trust in our own rental fleet — to HOAs, camps, schools, churches, and operators.\n\nTell us how you'll use it and we'll recommend the right model, then handle ordering, delivery, and first-time setup so you start on solid footing.",
          "Vous utilisez un toboggan souvent ? L'achat peut être plus judicieux. Nous vendons des toboggans et combos gonflables de qualité commerciale — les mêmes unités durables et certifiées que celles de notre flotte de location — aux associations, camps, écoles, églises et exploitants.\n\nDites-nous comment vous l'utiliserez et nous recommanderons le bon modèle, puis nous gérons la commande, la livraison et la première installation pour bien démarrer.",
        ),
        highlights: [
          l("Commercial-grade, certified units", "Unités certifiées de qualité commerciale"),
          l("Guidance on the right model", "Conseils sur le bon modèle"),
          l("Delivery & first setup", "Livraison et première installation"),
          l("Warranty-backed", "Garantie incluse"),
        ],
        cta: { kind: "shop", label: l("Shop water slides", "Magasiner les toboggans") },
      },
      {
        slug: "custom-builds",
        icon: "build",
        image: `${R2}/blog/1782484404870-axgpl1-aquasplash-water-world-at-shanghai-lsnow-indoor-skiing-theme-resort-shanghai-china-photo28-1-2048x1534.jpg`,
        title: l(
          "Custom Water Slide & Waterpark Construction",
          "Construction sur mesure de toboggans et de parcs aquatiques",
        ),
        tagline: l(
          "From a signature backyard centerpiece to full-scale waterpark attractions — we design and build it.",
          "D'une pièce maîtresse de jardin à des attractions de parc aquatique à grande échelle — nous concevons et construisons.",
        ),
        body: l(
          "Beyond rentals, Big Wave Slides takes on contract builds: custom water slides and permanent aquatic attractions for resorts, campgrounds, municipalities, hotels, and large private estates. If you can picture it, our team can engineer it.\n\nWe manage the whole project — concept and design, engineering, manufacturing, permitting, installation, and commissioning — and stand behind it with ongoing maintenance. Every build is engineered to code and safety-certified.",
          "Au-delà de la location, Big Wave Slides réalise des projets sous contrat : toboggans sur mesure et attractions aquatiques permanentes pour complexes, campings, municipalités, hôtels et grandes propriétés privées. Si vous pouvez l'imaginer, notre équipe peut le concevoir.\n\nNous gérons tout le projet — concept et design, ingénierie, fabrication, permis, installation et mise en service — et l'appuyons d'un entretien continu. Chaque réalisation est conçue selon les normes et certifiée sécuritaire.",
        ),
        highlights: [
          l("Concept, design & engineering", "Concept, design et ingénierie"),
          l("Permitting & code compliance", "Permis et conformité aux normes"),
          l("Manufacturing & installation", "Fabrication et installation"),
          l("Commissioning & maintenance", "Mise en service et entretien"),
        ],
        cta: { kind: "quote", label: l("Start your project", "Lancer votre projet") },
      },
    ],
  },
  {
    key: "support",
    label: l("Setup, safety & care", "Installation, sécurité et entretien"),
    items: [
      {
        slug: "delivery-installation",
        icon: "truck",
        image: `${R2}/blog/1782479230571-0sr49p-aquatube-pool-sider-aquaplay-tower-bavarian-blast-at-bavarian-inn-frankenmuth-usa-photo49.jpg`,
        title: l("Delivery, Installation & Anchoring", "Livraison, installation et ancrage"),
        tagline: l(
          "Professional, by-the-book setup — every anchor, every time.",
          "Une installation professionnelle et rigoureuse — chaque ancrage, à chaque fois.",
        ),
        body: l(
          "Whether it's a one-day rental or a permanent installation, correct setup is what keeps everyone safe. Our trained crews handle transport, leveling, secure anchoring or ballasting, water and power hookup, and a full pre-use safety check.\n\nWe set up on grass, pavement, and indoor venues — and we never cut corners on anchoring, the single biggest factor in inflatable safety.",
          "Qu'il s'agisse d'une location d'un jour ou d'une installation permanente, une mise en place correcte est ce qui assure la sécurité de tous. Nos équipes formées gèrent le transport, la mise à niveau, l'ancrage ou le lestage sécurisé, le raccordement en eau et électricité, et une vérification de sécurité complète avant usage.\n\nNous installons sur gazon, pavé et lieux intérieurs — sans jamais négliger l'ancrage, le facteur de sécurité le plus important des gonflables.",
        ),
        highlights: [
          l("Transport & precise placement", "Transport et placement précis"),
          l("Engineered anchoring / ballast", "Ancrage ou lestage calculé"),
          l("Water & power hookup", "Raccordement eau et électricité"),
          l("Pre-use safety inspection", "Inspection de sécurité avant usage"),
        ],
        cta: { kind: "quote", label: l("Request a quote", "Demander un devis") },
      },
      {
        slug: "maintenance-inspection",
        icon: "wrench",
        image: `${R2}/blog/1782484417138-3mz3g3-spinning-rapids-ride-wanda-ghuanghou-ghuanghou-china.jpg`,
        title: l("Maintenance, Inspection & Repair", "Entretien, inspection et réparation"),
        tagline: l(
          "Keep your investment safe, clean, and ready season after season.",
          "Gardez votre investissement sûr, propre et prêt, saison après saison.",
        ),
        body: l(
          "Own a slide or a permanent attraction? Keep it performing and compliant with our maintenance programs: deep cleaning and sanitizing, seam and blower checks, anchor-point inspection, and prompt repairs.\n\nWe offer one-off tune-ups and recurring seasonal plans, with documented inspections you can keep on file.",
          "Vous possédez un toboggan ou une attraction permanente ? Gardez-le performant et conforme grâce à nos programmes d'entretien : nettoyage et désinfection en profondeur, vérification des coutures et souffleurs, inspection des points d'ancrage et réparations rapides.\n\nNous proposons des mises au point ponctuelles et des forfaits saisonniers récurrents, avec des inspections documentées que vous pouvez conserver.",
        ),
        highlights: [
          l("Deep clean & sanitize", "Nettoyage et désinfection en profondeur"),
          l("Seam, blower & anchor checks", "Vérif. coutures, souffleurs et ancrages"),
          l("Fast repairs", "Réparations rapides"),
          l("Documented inspection reports", "Rapports d'inspection documentés"),
        ],
        cta: { kind: "quote", label: l("Request a quote", "Demander un devis") },
      },
      {
        slug: "event-staffing",
        icon: "shield",
        image: `${R2}/blog/1782484385557-8bhjem-turnstiles-island-h2o-live-kissimmee-usa-1.jpg`,
        title: l("Event Staffing & On-Site Safety", "Personnel d'événement et sécurité sur place"),
        tagline: l(
          "Trained attendants so you can enjoy the day instead of lifeguarding it.",
          "Des préposés formés pour profiter de la journée au lieu de la surveiller.",
        ),
        body: l(
          "Big crowds need eyes on the water. Our trained attendants manage the line, enforce rider rules, group riders by age and size, and keep the whole experience flowing safely — so hosts and staff can focus on the event.\n\nIdeal for festivals, corporate days, schools, and any event where you'd rather not run the attraction yourself.",
          "Les grandes foules exigent une surveillance constante. Nos préposés formés gèrent la file, font respecter les règles, regroupent les participants par âge et taille, et maintiennent une expérience fluide et sécuritaire — pour que les hôtes et le personnel se concentrent sur l'événement.\n\nIdéal pour les festivals, journées d'entreprise, écoles et tout événement où vous préférez ne pas opérer l'attraction vous-même.",
        ),
        highlights: [
          l("Trained, friendly attendants", "Préposés formés et accueillants"),
          l("Rider rules & age grouping", "Règles et regroupement par âge"),
          l("Line & rotation management", "Gestion des files et rotations"),
          l("Weather-watch & safety calls", "Veille météo et décisions de sécurité"),
        ],
        cta: { kind: "quote", label: l("Request a quote", "Demander un devis") },
      },
    ],
  },
];

export const ALL_SERVICES: ServiceItem[] = SERVICE_GROUPS.flatMap((g) => g.items);
