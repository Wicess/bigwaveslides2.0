// lib/use-cases.ts
// Data-driven, high-intent use-case landing pages (the conversion counterpart
// to the programmatic location pages). Each entry renders a unique, non-thin
// page at /water-slides-for/[slug] with its own copy, benefits, and FAQs.

export type UseCaseFaq = { q: string; a: string };
export type UseCaseBenefit = { title: string; body: string };

/**
 * Marks a use case as tied to a specific point in the calendar.
 *
 * October — not July — is the busiest month in this industry: fall festivals,
 * trunk-or-treats, school carnivals and harvest fairs, all booked three to four
 * weeks ahead. That lead time is the strongest call to action the business has,
 * so seasonal pages state the booking deadline outright instead of the generic
 * "summer weekends book fast" line the warm-weather pages use.
 *
 * It also keeps these pages from becoming the thing they'd otherwise be — the
 * summer copy with "fall" swapped in. The planning notes below are what actually
 * differs about running an inflatable in October, and they're specific enough
 * per event type that no two of these pages read the same.
 */
export type UseCaseSeason = {
  /** Ribbon label above the hero, e.g. "October event". */
  label: string;
  /** The booking-deadline sentence. */
  deadline: string;
  /** Catalog heading — these events are usually run dry, not wet. */
  catalogHeading: string;
  /** What's genuinely different about planning THIS event. */
  planning: string[];
};

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
  /** Present only on calendar-bound pages. See UseCaseSeason. */
  season?: UseCaseSeason;
};

const R2 = "https://pub-8ccc6e8df3434a6cb7ee23e5dd2ab541.r2.dev";

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

  // ───────────────────────── Fall season (Sept–Nov) ─────────────────────────
  // October is the single busiest month for inflatable rentals, and those
  // bookings are placed three to four weeks out — so this cluster has to be
  // live and indexed by the start of September to catch any of it. Every page
  // here leads with the dry-slide angle, because a wet slide run dry is the
  // same unit in cooler weather and that's what these events actually book.

  {
    slug: "fall-festivals",
    name: "Fall Festivals",
    phrase: "fall festival",
    heroTitle: "Fall Festival Inflatable Rentals",
    heroDescription:
      "Slides, combos and bounce houses for community fall festivals — delivered, set up, and run dry for cool-weather crowds. Book three to four weeks out; October weekends fill first.",
    intro:
      "A fall festival lives or dies on how long families stay, and an inflatable is the single easiest way to hold a crowd on site for an extra hour. Big Wave Slides delivers commercial-grade slides, combo units and bounce houses to community festivals across the country, sets them up and anchors them, and collects them when the last pumpkin's gone. Every wet slide in our fleet runs perfectly dry in autumn weather — same unit, no hose, no cold kids — so you get the same headline attraction the summer events had. Most festivals book six to seven pieces; tell us your footprint and expected headcount and we'll size the mix for you.",
    keywords: [
      "fall festival inflatable rentals",
      "fall festival rentals",
      "inflatable rentals for fall festival",
      "community fall festival bounce house",
      "fall carnival inflatable rental",
    ],
    benefits: [
      {
        title: "Run dry, not cold",
        body: "Our slides operate wet or dry. In autumn we set them up dry, so you keep the big-slide draw without anyone getting soaked in 55°F weather.",
      },
      {
        title: "Sized for a crowd, not a backyard",
        body: "Festival attendance is lumpy. Dual-lane slides and multi-play combos move two to four times the riders per hour of a single-lane unit, which is what keeps a queue from becoming the story.",
      },
      {
        title: "One vendor, one invoice",
        body: "Book the whole inflatable mix through us instead of coordinating three suppliers on the same morning. One delivery window, one certificate of insurance, one contact.",
      },
    ],
    faqs: [
      {
        q: "When should we book for an October fall festival?",
        a: "Three to four weeks out at minimum. October is the busiest month of the year for inflatable rentals, and the last two weekends before Halloween are the first dates to go. If your festival is in October, book in early September.",
      },
      {
        q: "Is it too cold in the fall for a water slide?",
        a: "Not if you run it dry — which is what nearly every autumn booking does. The unit is identical; we just skip the water hookup. Dry setup also means no wet ground, no towels, and a much shorter changeover at the end of the day.",
      },
      {
        q: "How many inflatables does a typical fall festival need?",
        a: "Most festivals run six to seven attractions in total. A common mix is one large slide as the anchor, one or two bounce houses or combos for younger kids, and an obstacle course or interactive unit for the older ones. We'll recommend a mix from your expected headcount.",
      },
      {
        q: "Can you set up on grass, gravel or a parking lot?",
        a: "All three. Grass is anchored with stakes; hard surfaces are ballasted with sandbags or water barrels, which we bring. Tell us the surface when you book so the crew arrives with the right anchoring.",
      },
      {
        q: "What happens if it rains on our festival date?",
        a: "Tell us as early as you can. We'd rather move your date than have you run an event in weather that isn't safe for inflatables — high wind is the real limit, not light rain. We'll go through the specifics when we confirm your booking.",
      },
    ],
    hero: `${R2}/blog/1782484415828-npyn0m-serengeti-springs-098.jpg`,
    season: {
      label: "October event",
      deadline:
        "October dates book out through September. For an October festival, request your quote by early September.",
      catalogHeading: "Popular units for fall festivals — all available dry",
      planning: [
        "Confirm your surface — grass takes stakes, asphalt takes ballast, and the crew needs to know which before it loads.",
        "Budget 20–30 ft of clear length per slide plus clearance on all sides, and keep the footprint away from overhead lines and tree limbs.",
        "Every inflatable needs a power source within about 100 ft; generators are fine but tell us the amperage.",
        "Autumn dark comes early — if your festival runs past 6pm, plan lighting over the inflatable area.",
        "Ask for the certificate of insurance early if your venue, parish or city requires one; it often takes longer to route than the booking itself.",
      ],
    },
  },

  {
    slug: "trunk-or-treat",
    name: "Trunk-or-Treat Events",
    phrase: "trunk-or-treat",
    heroTitle: "Trunk-or-Treat Inflatable Rentals",
    heroDescription:
      "Bounce houses and dry slides for church and school trunk-or-treats — anchored for asphalt, set up before dusk, and gone before you lock the lot.",
    intro:
      "Trunk-or-treat is a parking-lot event, and that changes almost everything about how an inflatable gets installed. Big Wave Slides sets up on hard surfaces with ballast rather than stakes, works around the car line rather than through it, and schedules delivery so the unit is inflated and safety-checked before the first family arrives — not while they're queuing. The events are short, usually two to three hours around dusk, so we build the setup and strike window around your actual run time instead of a standard all-day rental.",
    keywords: [
      "trunk or treat inflatable rentals",
      "trunk or treat bounce house rental",
      "church trunk or treat rentals",
      "trunk or treat attractions",
      "halloween church event rentals",
    ],
    benefits: [
      {
        title: "Anchored for asphalt",
        body: "You can't stake a parking lot. We arrive with sandbags and water ballast rated for the unit, so nothing is improvised on the day.",
      },
      {
        title: "Set up around the car line",
        body: "Trunk-or-treat layouts are built around parked vehicles. We'll place the inflatable so it doesn't break your traffic flow or block the fire lane.",
      },
      {
        title: "Built for a short evening window",
        body: "Most trunk-or-treats run two to three hours. We deliver and inflate ahead of your start and strike straight after, so the lot is clear the same night.",
      },
    ],
    faqs: [
      {
        q: "Can you set up an inflatable on a parking lot?",
        a: "Yes, and it's most of what we do in October. Hard surfaces are anchored with sandbags or water barrels instead of stakes — we bring them. We'll also lay protection under the unit so the vinyl isn't dragged across the asphalt.",
      },
      {
        q: "Our trunk-or-treat is only two hours. Do we pay for a full day?",
        a: "Tell us your run time when you request a quote. Short evening events are the norm for trunk-or-treat and we'll price the window you actually need rather than a default full-day rate.",
      },
      {
        q: "It gets dark during our event — is that a problem?",
        a: "Only if the inflatable area is unlit. The unit itself is fine after dark, but riders and the attendant need to see the entry, steps and landing. Plan a light on the inflatable, or tell us and we'll advise on placement near your existing lot lighting.",
      },
      {
        q: "Do you carry insurance for a church event?",
        a: "Yes, we're fully insured and can provide a certificate of insurance naming your church or school. Request it when you book — routing it through a parish office or district can take longer than the booking itself.",
      },
      {
        q: "Can kids use it in costume?",
        a: "Capes, masks and long trailing costumes are the usual hazards on any inflatable. We recommend a costume-off rule at the steps, with a bin for masks and accessories. Shoes off as always.",
      },
    ],
    hero: `${R2}/blog/1782484390938-cu27zd-overview-domaine-les-landes-de-gascogne-center-parcs-beauziac-france-photo01-768x575.jpg`,
    season: {
      label: "Late October",
      deadline:
        "The last two weekends before Halloween are the busiest dates of our year. Book by the last week of September.",
      catalogHeading: "Units that work on a parking lot, set up dry",
      planning: [
        "Measure the pad, not the lot — you need the unit's footprint plus clearance on every side, clear of the fire lane.",
        "Hard surface means ballast, not stakes. Confirm asphalt vs. grass when you book.",
        "Give us a delivery window that lands before your first family, not at your start time.",
        "Light the inflatable area if your event runs past dusk, which in late October means before 7pm.",
        "Set a costume rule at the steps: no masks, capes or long trailing fabric on the unit.",
      ],
    },
  },

  {
    slug: "school-carnivals",
    name: "School Carnivals",
    phrase: "school carnival",
    heroTitle: "School Carnival & Fall Field Day Rentals",
    heroDescription:
      "Inflatables for PTA carnivals, fall field days and school fundraisers — insured for districts, invoiced on a PO, and sized to move a whole grade level.",
    intro:
      "School events are a throughput problem before they're an entertainment problem: you have a fixed number of minutes and a fixed number of students, and the schedule only works if the line keeps moving. Big Wave Slides supplies dual-lane slides, obstacle courses and multi-play combos chosen for riders-per-hour rather than height, and we handle the paperwork side that PTAs and district offices actually get stuck on — certificates of insurance naming the district, W-9s, and invoicing against a purchase order rather than a card at the door.",
    keywords: [
      "school carnival inflatable rentals",
      "fall field day rentals",
      "school fundraiser bounce house rental",
      "PTA carnival rentals",
      "school event inflatable rental",
    ],
    benefits: [
      {
        title: "Chosen for throughput",
        body: "A dual-lane slide clears a class in half the time of a single lane. We size the mix from your student count and your rotation length, so no group spends its slot in a queue.",
      },
      {
        title: "District paperwork handled",
        body: "Certificate of insurance naming the district, W-9, and invoicing against a PO. We've done the routing before and won't hold up your approval.",
      },
      {
        title: "Set up before first bell",
        body: "We schedule installation ahead of the school day so nothing is being inflated while students are arriving, and strike after dismissal.",
      },
    ],
    faqs: [
      {
        q: "Can you invoice our school or PTA on a purchase order?",
        a: "Yes. We invoice schools and districts on a PO and can supply a W-9 up front. No online payment is required at any point — every booking is a request, quoted and invoiced.",
      },
      {
        q: "Can you provide a certificate of insurance naming our district?",
        a: "Yes, and you should ask for it as soon as you book. Districts commonly require the COI before they'll approve the event, and their own routing usually takes longer than ours.",
      },
      {
        q: "How many students can one inflatable handle in an hour?",
        a: "It depends on the unit and your supervision ratio, but a dual-lane slide moves roughly twice what a single lane does, and an obstacle course runs continuously rather than one-at-a-time. Give us your headcount and rotation length and we'll tell you how many units the schedule needs.",
      },
      {
        q: "Do you set up on a school field or a blacktop?",
        a: "Either. Fields are staked; blacktop and courts are ballasted with sandbags we bring. Let us know which when you book, and flag any sprinkler heads or irrigation lines on a field.",
      },
      {
        q: "Who supervises the inflatable during the event?",
        a: "We set up, anchor and safety-check the unit and brief your staff on safe operation. Supervision during the event is by your staff or volunteers, as with any station — we'll tell you the recommended ratio for the unit you book.",
      },
    ],
    hero: `${R2}/blog/1782484391964-6c8hz5-overview-epic-waters-indoor-waterpark-grand-prairie-usa-photo06-1536x1024.jpg`,
    season: {
      label: "Fall term",
      deadline:
        "Fall carnival dates cluster in October and compete with every festival in your area. Book three to four weeks ahead, and start the COI paperwork the same week.",
      catalogHeading: "High-throughput units for school events",
      planning: [
        "Start the certificate of insurance request immediately — district approval, not availability, is what usually delays school bookings.",
        "Work out riders-per-hour from your student count and rotation length before choosing units.",
        "Flag sprinkler heads and irrigation lines if we're staking into a field.",
        "Book the delivery window before the school day starts, not at the event time.",
        "Confirm whether payment runs through a PO — we invoice rather than take payment at the door.",
      ],
    },
  },

  {
    slug: "halloween-parties",
    name: "Halloween Parties",
    phrase: "Halloween party",
    heroTitle: "Halloween Inflatable Rentals",
    heroDescription:
      "Dry slides, bounce houses and combos for Halloween parties and neighbourhood events — delivered and set up for evening run times, in costume-safe layouts.",
    intro:
      "Halloween bookings are the tightest of the year: everyone wants the same Friday and Saturday, and there are only two of them. Big Wave Slides delivers commercial-grade inflatables for home, HOA and neighbourhood Halloween parties, set up dry for evening weather and laid out with the specific hazards of the night in mind — costumes, low light, and a crowd that arrives all at once rather than trickling in. If you're holding a party on the weekend before Halloween, the practical deadline to book is late September.",
    keywords: [
      "halloween inflatable rentals",
      "halloween bounce house rental",
      "halloween party rentals",
      "spooky inflatable rental",
      "halloween slide rental",
    ],
    benefits: [
      {
        title: "Set up dry for October nights",
        body: "Same slides, no water. A dry setup means no wet ground underfoot after dark and nothing for costumes to soak up.",
      },
      {
        title: "Laid out for low light",
        body: "We'll place the unit so the steps and landing sit inside your existing lighting, which is the part people forget until it's dark.",
      },
      {
        title: "Booked around the two big nights",
        body: "The weekends either side of the 31st are the busiest dates we run. Get your date in early and we'll hold the unit you actually want.",
      },
    ],
    faqs: [
      {
        q: "When do Halloween rentals sell out?",
        a: "The weekend before Halloween is typically gone by the end of September, and Halloween night itself goes first. If your date is fixed, request the quote as early as you can — it costs nothing to hold it.",
      },
      {
        q: "Is it warm enough for an inflatable at the end of October?",
        a: "For a dry setup, yes — in most of the country an October evening is comfortable for a dry slide or bounce house. Wet setups are a Sun Belt option at that point in the year; everywhere else we'd recommend running dry.",
      },
      {
        q: "Are costumes safe on an inflatable?",
        a: "With one rule: nothing that trails or covers the eyes. Masks, capes, long skirts and anything with a tail should come off at the steps. Shoes off as always, and socks on if the surface is cold.",
      },
      {
        q: "Can you deliver in the evening?",
        a: "We deliver and inflate ahead of your start time, then strike after. Tell us your run time and we'll build the window around it rather than a default full-day rental.",
      },
      {
        q: "Do you have Halloween-themed units?",
        a: "Our fleet is themed to water and adventure rather than Halloween specifically, and for most parties the slide is the attraction regardless. Tell us the look you're after and we'll tell you honestly what's a fit — and what isn't.",
      },
    ],
    hero: `${R2}/blog/1782484385557-8bhjem-turnstiles-island-h2o-live-kissimmee-usa-1.jpg`,
    season: {
      label: "31 October",
      deadline:
        "Halloween night and the weekend before it are the first dates to sell out. Late September is the practical deadline.",
      catalogHeading: "Dry-setup units for Halloween night",
      planning: [
        "Lock the date first — the unit can be swapped later, the Saturday before Halloween cannot.",
        "Plan for dark by 6:30pm and light the steps and landing, not just the party.",
        "Set a costume rule at the entry: no masks, capes or trailing fabric on the unit.",
        "Run dry unless you're in the Sun Belt; October evenings elsewhere are too cool for a wet setup.",
        "Have a wind plan — it's the one condition that closes an inflatable, and late October is gustier than August.",
      ],
    },
  },

  {
    slug: "harvest-festivals",
    name: "Harvest Festivals",
    phrase: "harvest festival",
    heroTitle: "Harvest Festival & Pumpkin Patch Rentals",
    heroDescription:
      "Multi-day inflatable rentals for pumpkin patches, corn mazes and harvest weekends — priced by the weekend, installed on uneven farm ground.",
    intro:
      "Pumpkin patches and harvest festivals don't run for an afternoon; they run for weekends on end, on ground that was a field six weeks ago. That makes them a different rental from a backyard party in almost every respect — the pricing is by the weekend or the season rather than the day, the anchoring has to account for soft and uneven ground, and the unit has to keep working through a month of daily use. Big Wave Slides handles multi-day and multi-weekend placements, and we'll be straight with you about which units hold up to that kind of run and which don't.",
    keywords: [
      "harvest festival rentals",
      "pumpkin patch inflatable rentals",
      "corn maze attraction rentals",
      "multi day inflatable rental",
      "fall attraction rental for farms",
    ],
    benefits: [
      {
        title: "Priced by the weekend, not the day",
        body: "Multi-day and multi-weekend placements are quoted as a run, not as repeated single-day rentals. For a season-long patch that's a materially different number.",
      },
      {
        title: "Anchored for field ground",
        body: "Soft, uneven and freshly-mown ground needs longer stakes and a levelled pad. We survey the placement before install rather than discovering it on the morning.",
      },
      {
        title: "Built to run all season",
        body: "A unit that sees daily use for six weeks isn't the same spec as one that does a two-hour birthday. We'll steer you to commercial-grade units that will still look right in week five.",
      },
    ],
    faqs: [
      {
        q: "Can we rent an inflatable for the whole pumpkin patch season?",
        a: "Yes — multi-weekend and season-long placements are quoted as a run rather than as day rentals, which is usually far better value. Tell us your open dates and we'll price the whole period.",
      },
      {
        q: "Can you set up on a field or uneven ground?",
        a: "In most cases, with preparation. We need a reasonably level pad clear of stubble, rocks and ruts, and soft ground takes longer stakes. Send photos of the intended spot with your enquiry and we'll tell you what it needs before the crew arrives.",
      },
      {
        q: "Who maintains the unit over a long placement?",
        a: "We'll agree that up front. For long runs we schedule check-ins, and your team handles daily inflation, deflation in high wind, and keeping the surface clear. It's all set out in the booking.",
      },
      {
        q: "What happens in high wind on a farm site?",
        a: "Open farm ground is windier than a suburban yard, and wind is the condition that closes an inflatable — not rain. Long placements need a named person on site who can deflate the unit when it picks up. We'll cover the threshold when you book.",
      },
      {
        q: "Is there power at the placement?",
        a: "That's the question to answer before anything else. Every unit needs a blower running continuously within about 100 ft. Generators are fine — tell us the amperage available and we'll confirm it's enough.",
      },
    ],
    hero: `${R2}/blog/1782479224040-b01ofi-aquaplay-1050-studio-city-water-park-macau-china-photo01-2048x1365.jpg`,
    season: {
      label: "September–November",
      deadline:
        "Season-long placements are planned in August and early September, well before the patch opens. Enquire as early as you can.",
      catalogHeading: "Units suited to multi-weekend placements",
      planning: [
        "Confirm continuous power at the placement — a blower runs the entire time the unit is up.",
        "Send photos of the intended ground; stubble, ruts and slope all change the install.",
        "Name the person on site who can deflate the unit when wind picks up.",
        "Quote the whole run at once — weekend and season pricing is not the day rate multiplied out.",
        "Agree the check-in schedule up front for anything longer than a single weekend.",
      ],
    },
  },

  {
    slug: "corporate-fall-family-day",
    name: "Corporate Fall Family Days",
    phrase: "corporate fall family day",
    heroTitle: "Corporate Fall Family Day Rentals",
    heroDescription:
      "Inflatables for employee appreciation days and company family events — invoiced to the business, insured for your venue, and staffed around a workday schedule.",
    intro:
      "A company family day has a guest list that runs from toddlers to grandparents, a venue that usually belongs to someone else, and a finance process that needs an invoice rather than a card. Big Wave Slides handles all three. We supply a mix that gives the under-tens somewhere to burn an afternoon and gives the older kids something worth queueing for, we deal directly with venue and facilities teams on insurance and access, and we invoice the business on standard terms with no online payment at any stage.",
    keywords: [
      "corporate family day rentals",
      "employee appreciation event rentals",
      "company picnic inflatable rentals",
      "corporate event bounce house rental",
      "business family day attractions",
    ],
    benefits: [
      {
        title: "Invoiced to the business",
        body: "Quote, PO if you use them, invoice on terms. Nothing is paid online and nobody has to expense a card payment on the day.",
      },
      {
        title: "Venue and facilities handled",
        body: "Most corporate events are on a leased or third-party site. We deal with the venue directly on certificates of insurance, access times and load-in.",
      },
      {
        title: "A mix that covers every age",
        body: "Family day guest lists are wide. We'll build a mix so the four-year-olds and the twelve-year-olds both have somewhere to go, rather than one unit that half the guests are too old for.",
      },
    ],
    faqs: [
      {
        q: "Can you invoice our company rather than take payment online?",
        a: "That's how every booking works here — nothing is paid on the site. You get a quote, we confirm the booking, and we invoice. We'll work to a PO if your finance team uses them.",
      },
      {
        q: "Our venue needs a certificate of insurance. Can you provide one?",
        a: "Yes, naming the venue and your company as required. Request it as soon as the date is set; venue and facilities teams often take longer to approve it than the booking takes to make.",
      },
      {
        q: "Can you work around a venue's load-in window?",
        a: "Yes. Corporate sites usually have fixed access times and a loading route rather than a driveway. Send us the venue contact and we'll agree the window with them directly.",
      },
      {
        q: "Do you have anything for adults, not just children?",
        a: "The larger dual-lane slides carry adult riders, and they're consistently the most-used unit at family days for exactly that reason. Tell us the expected adult split and we'll factor it into the mix.",
      },
      {
        q: "How far ahead should a corporate family day book?",
        a: "Further than you'd think, because the approval chain is longer than the booking. Four to six weeks is comfortable; in October, make it six — you're competing with every school and church event in the area for the same weekends.",
      },
    ],
    hero: `${R2}/blog/1782484390079-qtmebe-blaster-battle-yas-waterworld-abu-dhabi-uae-photo21-768x512.jpg`,
    season: {
      label: "Autumn schedule",
      deadline:
        "October weekends are contested by every school and church event in your area. Allow six weeks, most of which is approvals rather than availability.",
      catalogHeading: "Units that work for a mixed-age guest list",
      planning: [
        "Start the certificate of insurance with the venue the week you set the date.",
        "Confirm the load-in window and route — corporate sites rarely allow a straight drive-up.",
        "Give us the adult/child split so the mix isn't sized for one and wasted on the other.",
        "Confirm whether finance needs a PO before the invoice is raised.",
        "Check power at the placement; conference and event venues often meter outdoor outlets separately.",
      ],
    },
  },
];

export function getUseCaseBySlug(slug: string): UseCase | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}
