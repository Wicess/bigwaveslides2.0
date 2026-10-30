import { BRAND } from "@/lib/chat/brand";

/**
 * The first thing the team says in a new conversation.
 *
 * It promises nothing that can go stale (no response time, no price) and asks for
 * the facts the first real reply needs: the event date, the city, and the slide.
 */
export const WELCOME_MESSAGE =
  `Welcome to ${BRAND.name}! Tell us your event date, your city and which slide ` +
  "you have in mind, and we will check availability and your price.\n\n" +
  "A person reads every message here. You can send a photo or a PDF in this chat too.";
