import "server-only";

/**
 * The chat's error reporter. Splash Republic logs server failures to the Vercel
 * function log, so this keeps the same call shape the chat code was written against
 * and writes one structured line. It never throws: reporting a failure must not
 * become a second one.
 */
export interface ReportMeta {
  readonly source: string;
  readonly severity?: "FATAL" | "ERROR" | "WARN";
  readonly routePath?: string;
  readonly context?: Record<string, unknown>;
  readonly push?: boolean;
}

export async function reportError(
  thrown: unknown,
  meta: ReportMeta,
): Promise<void> {
  try {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown));
    console.error(
      `[chat:${meta.severity ?? "ERROR"}] ${meta.source}${meta.routePath ? ` ${meta.routePath}` : ""}: ${error.message}`,
      meta.context ?? {},
    );
  } catch {
    /* never throws */
  }
}
