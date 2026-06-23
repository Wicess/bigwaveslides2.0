"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getLocalized } from "@/lib/localized";
import { notifyEventRegistration } from "@/lib/notifications";

const schema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal("")),
  partySize: z.coerce.number().int().min(1).max(100).default(1),
  notes: z.string().max(1000).optional().or(z.literal("")),
  website: z.string().optional(), // honeypot
});

export type RegisterResult = { ok: boolean; error?: string };

/** Register for an event (request-based). Respects toggle + remaining capacity. */
export async function registerForEvent(
  input: z.input<typeof schema>,
): Promise<RegisterResult> {
  if (input.website) return { ok: true };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const { eventId, name, email, phone, partySize, notes } = parsed.data;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        slug: true,
        title: true,
        registrationEnabled: true,
        capacity: true,
        status: true,
        _count: { select: { registrations: true } },
      },
    });
    if (!event || !event.registrationEnabled || event.status === "CANCELLED") {
      return { ok: false, error: "Registration is closed for this event." };
    }
    if (
      event.capacity != null &&
      event._count.registrations + partySize > event.capacity
    ) {
      return { ok: false, error: "Sorry — this event is full." };
    }

    await prisma.eventRegistration.create({
      data: { eventId, name, email, phone: phone || null, partySize, notes: notes || null },
    });

    await notifyEventRegistration({
      name,
      email,
      eventTitle: getLocalized(event.title, "en"),
    });
    revalidatePath(`/events/${event.slug}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
