// lib/use-cases.ts
// Data-driven, high-intent use-case landing pages (the conversion counterpart
// to the programmatic location pages). Each entry renders a unique, non-thin
// page at /water-slides-for/[slug] with its own copy, benefits, and FAQs.

export type UseCaseFaq = { q: string; a: string };
export type UseCaseBenefit = { title: string; body: string };

export type UseCase = {
  slug: string;
  /** Plural label, e.g. "Birthday Parties". */
  name: string;
  /** Singular lower-case phrase for inline sentences, e.g. "birthday party". */
  phrase: string;
  heroTitle: string;
  heroDescription: string;
  intro: string;
  keywords: string[];
  benefits: UseCaseBenefit[];
  faqs: UseCaseFaq[];
  hero: string;
};

const R2 = "https://pub-ca1791fe88d8410aaf549be7c465c708.r2.dev";

export const USE_CASES: UseCase[] = [
  {
    slug: "birthday-parties",
    name: "Birthday Parties",
    phrase: "birthday party",
    heroTitle: "Water Slide Rentals for Birthday Parties",
    heroDescription:
      "Turn a backyard birthday into the party everyone talks about. We deliver, set up, and pick up a freshly sanitized water slide so you can just enjoy the day.",
    intro:
      "A birthday water slide is the easiest way to keep a yard full of kids happy for hours. Big Wave Slides delivers commercial-grade inflatable slides right to your home, anchors them safely, and picks them up when the cake's gone — no pumps to haul, no setup stress, no cleanup. You host; we handle the rest.",
    keywords: [
      "water slide rental for birthday party",
      "birthday party water slide rental",
      "kids water slide rental",
      "backyard water slide rental",
    ],
    benefits: [
      {
        title: "Hours of hands-free fun",
        body: "A slide keeps every age group busy, so you can focus on guests instead of entertaining a crowd of kids.",
      },
      {
        title: "Delivered & set up for you",
        body: "We arrive early, install and anchor the slide safely, and return to pick it up — you never touch a blower.",
      },
      {
        title: "Sanitized for little ones",
        body: "Every slide is cleaned and sanitized before delivery, so it's safe for the youngest sliders.",
      },
    ],
    faqs: [
      {
        q: "What size water slide is best for a birthday party?",
        a: "It depends on ages and yard space. For younger kids a single-lane slide is perfect; for mixed ages a dual-lane racer keeps the line moving. Tell us your guests' ages and we'll recommend the right fit in your free quote.",
      },
      {
        q: "How much space do I need in my backyard?",
        a: "Most backyard slides need a flat area roughly 25–40 ft long with clearance on all sides, plus access to water and a power outlet. We'll confirm the exact footprint when you book — see our space guide for details.",
      },
      {
        q: "Do you set it up at my house?",
        a: "Yes. Delivery, professional setup, safe anchoring, and pickup are all included. You just point us to the yard.",
      },
      {
        q: "How far ahead should I book a birthday slide?",
        a: "Summer weekends fill fast. We recommend booking 2–4 weeks out, but we'll always try to accommodate last-minute parties.",
      },
    ],
    hero: `${R2}/blog/1782479217393-gvr19v-aquaforms-12-island-waterpark-at-showboat-atlantic-city-usa-photo12.jpg`,
  },
  {
    slug: "pool-parties",
    name: "Pool Parties",
    phrase: "pool party",
    heroTitle: "Water Slide Rentals for Pool Parties",
    heroDescription:
      "Add a thrill to poolside fun with a commercial water slide. Delivered, anchored, and sanitized — the perfect upgrade for summer pool parties.",
    intro:
      "A pool is great; a pool plus a towering water slide is unforgettable. Big Wave Slides brings the waterpark feel to your pool party with commercial-grade inflatable slides that splash into their own pool or run alongside yours. We deliver, install, and pick up — you just add sunshine and guests.",
    keywords: [
      "water slide rental for pool party",
      "pool party water slide rental",
      "inflatable water slide pool party",
      "summer pool party rental",
    ],
    benefits: [
      {
        title: "A waterpark in your yard",
        body: "Slides with their own splash pool mean the fun isn't limited to a single swimming pool — great for bigger groups.",
      },
      {
        title: "Safe, supervised splashing",
        body: "Our slides are anchored and inspected on setup, with a dedicated splash zone that keeps the action organized.",
      },
      {
        title: "Beat the summer heat",
        body: "Nothing cools a crowd down faster on a hot day — and it photographs beautifully for your socials.",
      },
    ],
    faqs: [
      {
        q: "Does the water slide go into my swimming pool?",
        a: "Most of our slides come with their own built-in splash pool, so they don't need your swimming pool at all. That's usually safer and works for yards of any layout. We'll match the right slide to your space.",
      },
      {
        q: "Can you set up near an existing pool?",
        a: "Yes, as long as there's a flat, clear area with proper clearance from the pool edge. We assess placement on arrival to keep everyone safe.",
      },
      {
        q: "Is it safe for both kids and adults?",
        a: "We carry slides suited to different ages and weights. Tell us your crowd and we'll recommend a slide everyone can enjoy safely.",
      },
      {
        q: "What's included in a pool party rental?",
        a: "Delivery, setup, safe anchoring, sanitizing, and pickup are all included. You'll get a clear, no-surprise quote up front.",
      },
    ],
    hero: `${R2}/blog/1782484390079-qtmebe-blaster-battle-yas-waterworld-abu-dhabi-uae-photo21-768x512.jpg`,
  },
  {
    slug: "school-events",
    name: "School Events & Field Days",
    phrase: "school event",
    heroTitle: "Water Slide Rentals for School Events & Field Days",
    heroDescription:
      "Make field day, end-of-year, or a fundraiser unforgettable. Insured, high-throughput water slides delivered and set up on your school grounds.",
    intro:
      "Field days, end-of-year celebrations, and school fundraisers run best when kids have something they can't wait to line up for. Big Wave Slides delivers insured, high-capacity water slides to schools, sets them up safely on your grounds, and provides the certificate of insurance many districts require. We handle logistics so your staff can focus on the students.",
    keywords: [
      "water slide rental for school event",
      "school field day water slide rental",
      "school fundraiser water slide",
      "field day rental",
    ],
    benefits: [
      {
        title: "Built for big groups",
        body: "Dual-lane and high-throughput slides move a lot of students per hour, so lines stay short and energy stays high.",
      },
      {
        title: "Fully insured for campus",
        body: "We provide a certificate of insurance and follow strict setup and anchoring procedures — exactly what districts ask for.",
      },
      {
        title: "We handle the logistics",
        body: "Early delivery, professional setup, and prompt pickup mean zero disruption to your school day.",
      },
    ],
    faqs: [
      {
        q: "Can you provide a certificate of insurance for our school?",
        a: "Yes. Every rental is fully insured and we can supply a certificate of insurance (COI) naming your school or district. Just ask when you book and tell us how it should be addressed.",
      },
      {
        q: "How many students can use the slide?",
        a: "Throughput depends on the slide. We'll recommend dual-lane or commercial units sized to your headcount so students aren't stuck waiting in long lines.",
      },
      {
        q: "Do you set up on grass or pavement?",
        a: "Both. We anchor with stakes on grass or weighted ballast on hard surfaces. Tell us your surface and we'll bring the right anchoring.",
      },
      {
        q: "Will it disrupt the school schedule?",
        a: "No — we deliver and set up before your event window and pick up after, working around your bell schedule.",
      },
    ],
    hero: `${R2}/blog/1782484415828-npyn0m-serengeti-springs-098.jpg`,
  },
  {
    slug: "church-events",
    name: "Church & Community Events",
    phrase: "church event",
    heroTitle: "Water Slide Rentals for Church & Community Events",
    heroDescription:
      "Draw a crowd to your festival, VBS, or community day with an insured water slide. Delivered, set up, and supervised-ready by our team.",
    intro:
      "Church festivals, Vacation Bible School, and community outreach days thrive on a great reason to show up. A water slide is exactly that. Big Wave Slides delivers insured, family-friendly slides to your event, sets them up safely, and briefs your volunteers — helping you welcome more families and keep them all afternoon.",
    keywords: [
      "water slide rental for church event",
      "church festival water slide rental",
      "VBS water slide rental",
      "community event water slide",
    ],
    benefits: [
      {
        title: "A magnet for families",
        body: "A water slide turns a flyer into a must-attend event and keeps families on-site longer.",
      },
      {
        title: "Volunteer-friendly",
        body: "We brief your volunteers on safe operation so supervision is simple and stress-free.",
      },
      {
        title: "Insured & community-ready",
        body: "Full insurance, sanitized slides, and proper anchoring make your event safe for all ages.",
      },
    ],
    faqs: [
      {
        q: "Do you carry insurance for public church events?",
        a: "Yes — every rental is fully insured, and we can provide a certificate of insurance for your church or venue on request.",
      },
      {
        q: "Can volunteers run the slide?",
        a: "Absolutely. We set up and anchor everything, then brief your volunteers on safe operation and supervision before we leave.",
      },
      {
        q: "Do we need a permit for a community event?",
        a: "Some municipalities require permits for inflatable amusement devices at public events. We recommend checking locally well ahead; we'll provide any documentation you need from our side.",
      },
      {
        q: "How big a slide can you bring for a festival?",
        a: "From single-lane slides to tall commercial towers — we'll size the attraction to your expected crowd and available space.",
      },
    ],
    hero: `${R2}/blog/1782484391964-6c8hz5-overview-epic-waters-indoor-waterpark-grand-prairie-usa-photo06-1536x1024.jpg`,
  },
  {
    slug: "corporate-events",
    name: "Corporate & Company Events",
    phrase: "corporate event",
    heroTitle: "Water Slide Rentals for Corporate Events",
    heroDescription:
      "Company picnics, team days, and grand openings made memorable. Premium, insured water slides delivered and set up for your corporate event.",
    intro:
      "A company picnic or team-building day is far more memorable with a water slide as the centerpiece. Big Wave Slides delivers polished, commercial-grade attractions to corporate events, handles full setup and insurance, and keeps everything running smoothly so your team can relax and connect.",
    keywords: [
      "water slide rental for corporate event",
      "company picnic water slide rental",
      "corporate event inflatable rental",
      "team building water slide",
    ],
    benefits: [
      {
        title: "A standout centerpiece",
        body: "A commercial water slide gives your event a wow factor that employees and families remember.",
      },
      {
        title: "Turnkey & insured",
        body: "Delivery, setup, insurance, and pickup are all handled — your event team doesn't lift a finger.",
      },
      {
        title: "Scales to your headcount",
        body: "From small team days to large company festivals, we size and staff the attraction to your crowd.",
      },
    ],
    faqs: [
      {
        q: "Can you provide proof of insurance for our venue?",
        a: "Yes. We're fully insured and can supply a certificate of insurance naming your company or venue. Let us know the requirements when you book.",
      },
      {
        q: "Do you handle large company events?",
        a: "We do — from intimate team days to large corporate festivals. We'll recommend the right number and size of slides for your expected attendance.",
      },
      {
        q: "Can you set up at a park or rented venue?",
        a: "Yes. We regularly set up at parks, event spaces, and company grounds. We just need a flat area, clearance, and access to water and power.",
      },
      {
        q: "How do we get a quote for a corporate event?",
        a: "Send us your date, location, and rough headcount and we'll put together a free, detailed quote with everything included.",
      },
    ],
    hero: `${R2}/blog/1782479224040-b01ofi-aquaplay-1050-studio-city-water-park-macau-china-photo01-2048x1365.jpg`,
  },
  {
    slug: "graduation-parties",
    name: "Graduation Parties",
    phrase: "graduation party",
    heroTitle: "Water Slide Rentals for Graduation Parties",
    heroDescription:
      "Celebrate the big day with a water slide everyone remembers. Delivered, set up, and sanitized for your graduation party.",
    intro:
      "Graduation season lands right when the weather turns perfect for a water slide. Big Wave Slides helps you throw a celebration the grad and their friends will be talking about — we deliver a commercial-grade slide, set it up safely, and pick it up after, so you can celebrate instead of working the party.",
    keywords: [
      "water slide rental for graduation party",
      "graduation party water slide rental",
      "grad party inflatable rental",
      "summer graduation party rental",
    ],
    benefits: [
      {
        title: "Crowd-pleaser for all ages",
        body: "From younger siblings to the graduating class, a water slide keeps a mixed-age guest list entertained.",
      },
      {
        title: "Stress-free hosting",
        body: "We deliver, set up, and pick up — you focus on the celebration, not the logistics.",
      },
      {
        title: "Books fast in grad season",
        body: "Late spring weekends are popular; reserve early and we'll lock in your date.",
      },
    ],
    faqs: [
      {
        q: "When should I book for graduation season?",
        a: "Graduation weekends in late spring and early summer are in high demand. Book as early as you can — ideally 3–6 weeks out — to secure your date.",
      },
      {
        q: "Is a water slide appropriate for older teens and adults?",
        a: "Definitely. We carry larger commercial slides rated for teens and adults — tell us your crowd and we'll recommend the right one.",
      },
      {
        q: "Can you set up at a backyard or a rented venue?",
        a: "Both work. We just need a flat, clear area with access to water and power. We'll confirm placement on arrival.",
      },
      {
        q: "What's included in the rental?",
        a: "Delivery, professional setup, safe anchoring, sanitizing, and pickup — all in one transparent quote.",
      },
    ],
    hero: `${R2}/blog/1782484385557-8bhjem-turnstiles-island-h2o-live-kissimmee-usa-1.jpg`,
  },
  {
    slug: "hoa-neighborhood-events",
    name: "HOA & Neighborhood Events",
    phrase: "neighborhood event",
    heroTitle: "Water Slide Rentals for HOA & Neighborhood Events",
    heroDescription:
      "Bring the block together with a water slide at your HOA pool day or neighborhood block party. Insured, delivered, and set up for the whole community.",
    intro:
      "Neighborhood block parties and HOA summer events are at their best when there's something for every family. Big Wave Slides delivers insured water slides to your common area or cul-de-sac, sets them up safely, and provides documentation your HOA or community board may need — making it easy to put on an event the whole neighborhood remembers.",
    keywords: [
      "water slide rental for HOA event",
      "neighborhood block party water slide rental",
      "HOA pool day water slide",
      "community water slide rental",
    ],
    benefits: [
      {
        title: "Brings the community together",
        body: "A water slide turns a routine pool day into the neighborhood's favorite event of the summer.",
      },
      {
        title: "Insured & board-friendly",
        body: "Full insurance and a certificate on request make approval easy for your HOA or community board.",
      },
      {
        title: "Fits common areas",
        body: "We set up on common lawns, cul-de-sacs, or near community pools — wherever there's safe, level space.",
      },
    ],
    faqs: [
      {
        q: "Can you provide insurance documents for our HOA?",
        a: "Yes — we're fully insured and can supply a certificate of insurance naming your HOA or community association on request.",
      },
      {
        q: "Where can the slide be set up in our neighborhood?",
        a: "Common lawns, cul-de-sacs, clubhouse grounds, or near a community pool all work, as long as the area is flat with proper clearance and access to water and power.",
      },
      {
        q: "How many slides do we need for a block party?",
        a: "It depends on attendance. For larger neighborhoods, two smaller slides in separate zones often beat one big one for spreading out the crowd. We'll advise based on your numbers.",
      },
      {
        q: "Who supervises the slide?",
        a: "We set up and anchor everything and brief your volunteers on safe operation. Assigning a few adults per slide keeps things organized and safe.",
      },
    ],
    hero: `${R2}/blog/1782484390938-cu27zd-overview-domaine-les-landes-de-gascogne-center-parcs-beauziac-france-photo01-768x575.jpg`,
  },
  {
    slug: "summer-camps-daycares",
    name: "Summer Camps & Daycares",
    phrase: "summer camp",
    heroTitle: "Water Slide Rentals for Summer Camps & Daycares",
    heroDescription:
      "Give campers a day they'll beg to repeat. Insured, age-appropriate water slides delivered and set up at your camp or daycare.",
    intro:
      "A water slide day is the highlight of any camp or daycare summer. Big Wave Slides delivers insured, age-appropriate slides to camps and childcare centers, sets them up safely, and provides the insurance documentation your program needs — so staff can keep the focus on happy, safe kids.",
    keywords: [
      "water slide rental for summer camp",
      "daycare water slide rental",
      "summer camp inflatable rental",
      "kids camp water slide",
    ],
    benefits: [
      {
        title: "Age-appropriate slides",
        body: "We match the slide to your campers' ages so it's safe and just the right amount of thrill.",
      },
      {
        title: "Insured for childcare programs",
        body: "Full insurance and a certificate on request meet the requirements most camps and daycares have.",
      },
      {
        title: "Easy, recurring fun",
        body: "Plan a weekly water day all summer — we'll work out a delivery schedule that fits your calendar.",
      },
    ],
    faqs: [
      {
        q: "Are your slides safe for young children?",
        a: "Yes — we carry slides suited to younger ages and sanitize every unit before delivery. Tell us your campers' ages and we'll recommend the safest fit.",
      },
      {
        q: "Can you provide insurance for our camp or daycare?",
        a: "We're fully insured and can supply a certificate of insurance naming your program on request. Let us know when you book.",
      },
      {
        q: "Can we book a recurring water day?",
        a: "Absolutely. Many camps schedule a weekly slide day — we'll set up a recurring delivery schedule and offer simple repeat booking.",
      },
      {
        q: "What supervision is required?",
        a: "We set up and anchor the slide and brief your staff on safe operation. We recommend assigning staff to supervise at all times, as you would any water activity.",
      },
    ],
    hero: `${R2}/blog/1782479230571-0sr49p-aquatube-pool-sider-aquaplay-tower-bavarian-blast-at-bavarian-inn-frankenmuth-usa-photo49.jpg`,
  },
];

export function getUseCaseBySlug(slug: string): UseCase | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}
