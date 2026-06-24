"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/forms/contact-form";
import { EASE_OUT } from "@/components/motion/variants";

type ContactInfo = {
  email?: string;
  phone?: string;
  address?: string;
  whatsappDigits?: string;
};

const leftStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const leftItem: Variants = {
  hidden: { opacity: 0, x: -28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.75, ease: EASE_OUT } },
};

export function ContactExperience({ info }: { info: ContactInfo }) {
  const t = useTranslations("Contact");
  const reduce = useReducedMotion();

  const tel = info.phone ? `tel:${info.phone.replace(/[^+\d]/g, "")}` : undefined;

  const rows = [
    info.phone
      ? {
          key: "phone",
          icon: Phone,
          label: t("phoneLabel"),
          value: info.phone,
          href: tel,
        }
      : null,
    info.email
      ? {
          key: "email",
          icon: Mail,
          label: t("emailLabel"),
          value: info.email,
          href: `mailto:${info.email}`,
        }
      : null,
    info.address
      ? {
          key: "address",
          icon: MapPin,
          label: t("addressLabel"),
          value: info.address,
          href: undefined,
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    icon: typeof Phone;
    label: string;
    value: string;
    href?: string;
  }[];

  return (
    <section className="relative flex min-h-[calc(100dvh-6rem)] items-center overflow-hidden bg-background py-10 sm:py-12">
      {/* Ambient background motif */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_10%,var(--color-primary-50),transparent_60%)]" />
        {!reduce ? (
          <>
            <motion.div
              className="absolute -left-24 top-24 size-80 rounded-full bg-primary/10 blur-3xl"
              animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -right-24 bottom-0 size-96 rounded-full bg-secondary/10 blur-3xl"
              animate={{ x: [0, -40, 0], y: [0, -24, 0] }}
              transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        ) : null}
      </div>

      <Container className="relative">
        {/* Breadcrumb */}
        <motion.nav
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="mb-6 flex items-center gap-1 text-xs font-medium text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition-colors hover:text-primary">
            {t("crumbHome")}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">{t("crumb")}</span>
        </motion.nav>

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left — info */}
          <motion.div variants={leftStagger} initial="hidden" animate="show">
            <motion.span
              variants={leftItem}
              className="inline-flex items-center rounded-full border border-primary/20 bg-primary-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary"
            >
              {t("infoEyebrow")}
            </motion.span>

            <motion.h1
              variants={leftItem}
              className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl"
            >
              {t("infoHeading")}
            </motion.h1>

            <motion.p
              variants={leftItem}
              className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base"
            >
              {t("infoLead")}
            </motion.p>

            <motion.ul variants={leftStagger} className="mt-8 space-y-4">
              {rows.map((row) => {
                const Icon = row.icon;
                const body = (
                  <>
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-primary shadow-[var(--shadow-soft)] ring-1 ring-border transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:text-primary-600">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="block truncate font-semibold text-foreground">
                        {row.value}
                      </span>
                    </span>
                  </>
                );
                return (
                  <motion.li key={row.key} variants={leftItem}>
                    {row.href ? (
                      <a
                        href={row.href}
                        className="group flex items-center gap-4 transition-colors"
                      >
                        {body}
                      </a>
                    ) : (
                      <div className="group flex items-center gap-4">{body}</div>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>

            <motion.div variants={leftItem} className="mt-8 flex flex-wrap gap-3">
              {info.whatsappDigits ? (
                <a
                  href={`https://wa.me/${info.whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <MessageCircle className="size-4" />
                  {t("whatsappCta")}
                </a>
              ) : null}
              {tel ? (
                <a
                  href={tel}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary active:scale-[0.98]"
                >
                  <Phone className="size-4" />
                  {t("callCta")}
                </a>
              ) : null}
            </motion.div>
          </motion.div>

          {/* Right — form card */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 32, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.1 }}
            className="relative rounded-[var(--radius-xl)] border border-border bg-background/80 p-6 shadow-[0_24px_60px_-24px_rgba(0,51,102,0.28)] backdrop-blur-sm sm:p-8"
          >
            <div
              aria-hidden
              className="absolute inset-x-0 -top-px mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            />
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {t("sendTitle")}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("sendIntro")}</p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
