import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";

/**
 * ArticleContent — renders a blog post's Markdown body as a polished,
 * magazine-style article. Each element is mapped to its own Tailwind styling so
 * headings, lists, links, and the highlighted "key takeaway" blockquote all
 * look intentional (rather than the old flat run of plain paragraphs).
 *
 * Internal links (starting with "/") use the locale-aware <Link> so they keep
 * the user's language; external links open in a new tab.
 */
export function ArticleContent({ content }: { content: string }) {
  return (
    <div className="text-pretty">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="mt-12 mb-4 scroll-mt-28 font-display text-2xl font-bold tracking-tight text-foreground first:mt-0 sm:text-[1.7rem]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 mb-3 scroll-mt-28 font-display text-xl font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-5 text-[1.075rem] leading-[1.85] text-foreground/80">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-6 list-disc space-y-2.5 pl-6 marker:text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-6 list-decimal space-y-2.5 pl-6 marker:font-semibold marker:text-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1.5 text-[1.05rem] leading-relaxed text-foreground/80">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-8 rounded-2xl border border-primary/15 bg-primary-50/70 p-5 text-lg font-medium leading-relaxed text-primary-900 sm:p-6 [&>p]:my-0 [&>p]:text-primary-900">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => {
            const url = href ?? "#";
            if (url.startsWith("/")) {
              return (
                <Link
                  href={url}
                  className="font-semibold text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
                >
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
              >
                {children}
              </a>
            );
          },
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="my-10 border-border" />,
          h1: ({ children }) => (
            <h2 className="mt-12 mb-4 font-display text-2xl font-bold tracking-tight text-foreground first:mt-0 sm:text-[1.7rem]">
              {children}
            </h2>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
