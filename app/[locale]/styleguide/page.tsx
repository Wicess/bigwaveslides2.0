import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Container } from "@/components/ui/container";
import { Section, SectionHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Marquee } from "@/components/ui/marquee";
import { Reveal } from "@/components/motion/reveal";
import { KineticText } from "@/components/motion/kinetic-text";
import { WaveScene } from "@/components/three/wave-scene";
import { ToastDemo } from "@/components/styleguide/toast-demo";

export const metadata: Metadata = {
  title: "Style Guide",
  robots: { index: false, follow: false },
};

const COLORS = [
  { name: "Primary", hex: "#0099FF" },
  { name: "Secondary", hex: "#00D4FF" },
  { name: "Accent", hex: "#003366" },
  { name: "Ink", hex: "#111111" },
  { name: "Muted", hex: "#F4F7FA" },
  { name: "Border", hex: "#E3E9F0" },
];

const PRIMARY_SCALE = [50, 100, 300, 500, 700, 900];

const BUTTON_VARIANTS = [
  "primary",
  "gradient",
  "secondary",
  "outline",
  "ghost",
  "glass",
] as const;

type Props = { params: Promise<{ locale: string }> };

export default async function StyleguidePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <main className="pb-24">
      {/* Hero */}
      <Section
        spacing="default"
        className="border-border relative overflow-hidden border-b"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(0,212,255,0.16), transparent 70%)",
          }}
        />
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge variant="primary">Phase 3 · Design System</Badge>
            <KineticText
              as="h1"
              text="The Splash Republic design language"
              className="mt-4 block text-4xl leading-[1.05] font-bold sm:text-5xl lg:text-6xl"
            />
            <p className="text-muted-foreground mt-5 max-w-prose text-lg">
              Tokens, components, and the motion engine that power every page.
              Built for buttery 60fps and full reduced-motion support.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="gradient" size="lg">
                Primary action
              </Button>
              <Button variant="glass" size="lg">
                Secondary
              </Button>
            </div>
          </div>
          <WaveScene className="aspect-square w-full rounded-[var(--radius-xl)]" />
        </Container>
      </Section>

      {/* Colors */}
      <Section spacing="compact">
        <Container>
          <SectionHeader
            eyebrow="Foundation"
            title="Color"
            description="Brand palette and the primary tint scale."
          />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {COLORS.map((c) => (
              <div
                key={c.name}
                className="border-border overflow-hidden rounded-[var(--radius)] border"
              >
                <div className="h-20" style={{ background: c.hex }} />
                <div className="p-3">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="text-muted-foreground text-xs">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-border mt-4 flex overflow-hidden rounded-[var(--radius)] border">
            {PRIMARY_SCALE.map((step) => (
              <div
                key={step}
                className="h-14 flex-1"
                style={{ background: `var(--color-primary-${step})` }}
                title={`primary-${step}`}
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* Typography */}
      <Section spacing="compact" className="bg-muted/50">
        <Container>
          <SectionHeader
            eyebrow="Foundation"
            title="Typography"
            description="Sora for display, Inter for body."
          />
          <div className="mt-8 space-y-4">
            <p className="font-display text-6xl leading-none font-bold">
              Display 6xl
            </p>
            <p className="font-display text-4xl font-bold">Heading 4xl</p>
            <p className="text-2xl font-semibold">Subheading 2xl</p>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Body large — premium water slides to buy, rent, and install for
              unforgettable events.
            </p>
            <p className="text-gradient text-3xl font-bold">Gradient text</p>
          </div>
        </Container>
      </Section>

      {/* Buttons */}
      <Section spacing="compact">
        <Container>
          <SectionHeader eyebrow="Components" title="Buttons" />
          <div className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              {BUTTON_VARIANTS.map((v) => (
                <Button key={v} variant={v}>
                  {v}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Badges + Cards */}
      <Section spacing="compact" className="bg-muted/50">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader eyebrow="Components" title="Badges" />
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">In stock</Badge>
              <Badge variant="muted">Muted</Badge>
            </div>
          </div>
          <div>
            <SectionHeader eyebrow="Components" title="Cards" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Solid card</CardTitle>
                  <CardDescription>Default surface.</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Used for most content blocks.
                </CardContent>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Glass card</CardTitle>
                  <CardDescription>Glassmorphism surface.</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Best over imagery or gradients.
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="glass">
                    Action
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      {/* Forms */}
      <Section spacing="compact">
        <Container>
          <SectionHeader eyebrow="Components" title="Form fields" />
          <div className="mt-8 grid max-w-3xl gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sg-name">Name</Label>
              <Input id="sg-name" placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sg-event">Event type</Label>
              <Select id="sg-event" defaultValue="">
                <option value="" disabled>
                  Select…
                </option>
                <option>Birthday party</option>
                <option>Pool party</option>
                <option>School event</option>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sg-msg">Message</Label>
              <Textarea id="sg-msg" placeholder="Tell us about your event…" />
            </div>
          </div>
        </Container>
      </Section>

      {/* Overlays + disclosure */}
      <Section spacing="compact" className="bg-muted/50">
        <Container className="grid gap-10 lg:grid-cols-3">
          <div>
            <SectionHeader eyebrow="Components" title="Dialog" />
            <div className="mt-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Open dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request a quote</DialogTitle>
                    <DialogDescription>
                      Tell us your date and we&apos;ll get back to you fast.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-3">
                    <DialogClose asChild>
                      <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button>Submit</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div>
            <SectionHeader eyebrow="Components" title="Tabs" />
            <div className="mt-6">
              <Tabs defaultValue="rent">
                <TabsList>
                  <TabsTrigger value="rent">Rent</TabsTrigger>
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="install">Install</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="rent"
                  className="text-muted-foreground text-sm"
                >
                  Daily rentals with delivery & setup.
                </TabsContent>
                <TabsContent
                  value="buy"
                  className="text-muted-foreground text-sm"
                >
                  Own a premium commercial slide.
                </TabsContent>
                <TabsContent
                  value="install"
                  className="text-muted-foreground text-sm"
                >
                  Professional installation services.
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div>
            <SectionHeader eyebrow="Components" title="Accordion" />
            <div className="mt-6">
              <Accordion type="single" collapsible>
                <AccordionItem value="a">
                  <AccordionTrigger>
                    Do you deliver and set up?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes — delivery, setup, and pickup are included options.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="b">
                  <AccordionTrigger>What surfaces are okay?</AccordionTrigger>
                  <AccordionContent>
                    Grass, concrete, and turf. We&apos;ll advise on the best
                    fit.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </Container>
      </Section>

      {/* Toasts */}
      <Section spacing="compact">
        <Container>
          <SectionHeader eyebrow="Components" title="Toasts" />
          <div className="mt-6">
            <ToastDemo />
          </div>
        </Container>
      </Section>

      {/* Marquee */}
      <Section spacing="compact" className="bg-accent text-white">
        <Container>
          <SectionHeader
            eyebrow="Components"
            title="Marquee"
            className="[&_span]:text-secondary [&_h2]:text-white"
          />
        </Container>
        <div className="mt-8">
          <Marquee durationSeconds={26}>
            {[
              "Birthday",
              "Pool Party",
              "Schools",
              "Churches",
              "Hotels",
              "Festivals",
              "Corporate",
            ].map((t) => (
              <span
                key={t}
                className="text-2xl font-bold tracking-tight text-white/80 uppercase"
              >
                {t} •
              </span>
            ))}
          </Marquee>
        </div>
      </Section>

      {/* Motion */}
      <Section spacing="compact">
        <Container>
          <SectionHeader
            eyebrow="Motion engine"
            title="Scroll reveal & kinetic text"
            description="Scroll the page — each block reveals once in view. GSAP + Lenis + Framer Motion, all reduced-motion safe."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Reveal key={i} delay={i * 0.1}>
                <Card className="p-6">
                  <p className="text-gradient text-5xl font-bold">0{i + 1}</p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Staggered reveal block {i + 1}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
          <KineticText
            as="p"
            text="Ride the Splash Republic — world class, every pixel."
            className="mt-10 block text-3xl font-bold sm:text-4xl"
          />
        </Container>
      </Section>
    </main>
  );
}
