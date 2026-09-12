import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Element } from "hast";
import { Link } from "@/i18n/navigation";
import { optimizedSrc } from "@/lib/image-loader";
import { slugify } from "@/lib/toc";
import { cn } from "@/lib/utils";

/** Flatten a heading's React children down to its plain-text string. */
function toText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  if (React.isValidElement(node)) {
    return toText((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

/**
 * The lone <img> of an image-only paragraph, or null.
 *
 * Markdown wraps a standalone image in a <p>, and a <figure> is not allowed
 * inside one — React would warn and the browser would split the paragraph.
 * Detecting the case at the paragraph lets it render as a figure instead.
 */
function soleImage(node: Element | undefined): Element | null {
  const kids = (node?.children ?? []).filter(
    (c) => !(c.type === "text" && !c.value.trim()),
  );
  const only = kids.length === 1 ? kids[0] : null;
  return only?.type === "element" && only.tagName === "img" ? only : null;
}

/**
 * A body image, written in the post as `![alt](url#1376x768 "caption")`.
 *
 * The `#WxH` fragment carries the file's intrinsic size so the browser can
 * reserve the box before the image arrives; without it every figure is a
 * layout shift. It is stripped before the URL is used. Square and portrait
 * images are held narrower than the column, or one photo fills a whole screen.
 */
function ArticleFigure({ image }: { image: Element }) {
  const raw = String(image.properties.src ?? "");
  const alt = String(image.properties.alt ?? "");
  const caption = image.properties.title
    ? String(image.properties.title)
    : null;
  const size = raw.match(/#(\d+)x(\d+)$/);
  const url = size ? raw.slice(0, size.index) : raw;
  const width = size ? Number(size[1]) : undefined;
  const height = size ? Number(size[2]) : undefined;
  const narrow = width && height ? width / height < 1.2 : false;

  return (
    <figure className={cn("my-10", narrow && "mx-auto max-w-lg")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizedSrc(url, narrow ? 1024 : 1400)}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className="border-border h-auto w-full rounded-2xl border"
      />
      {caption ? (
        <figcaption className="text-muted-foreground mt-3 text-center text-sm leading-relaxed">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

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
            <h2
              id={slugify(toText(children))}
              className="font-display text-foreground mt-12 mb-4 scroll-mt-28 text-2xl font-bold tracking-tight first:mt-0 sm:text-[1.7rem]"
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              id={slugify(toText(children))}
              className="font-display text-foreground mt-8 mb-3 scroll-mt-28 text-xl font-semibold"
            >
              {children}
            </h3>
          ),
          p: ({ node, children }) => {
            const image = soleImage(node);
            if (image) return <ArticleFigure image={image} />;
            return (
              <p className="text-foreground/80 my-5 text-[1.075rem] leading-[1.85]">
                {children}
              </p>
            );
          },
          ul: ({ children }) => (
            <ul className="marker:text-primary my-6 list-disc space-y-2.5 pl-6">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="marker:text-primary my-6 list-decimal space-y-2.5 pl-6 marker:font-semibold">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground/80 pl-1.5 text-[1.05rem] leading-relaxed">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-primary/15 bg-primary-50/70 text-primary-900 [&>p]:text-primary-900 my-8 rounded-2xl border p-5 text-lg leading-relaxed font-medium sm:p-6 [&>p]:my-0">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => {
            const url = href ?? "#";
            if (url.startsWith("/")) {
              return (
                <Link
                  href={url}
                  className="text-primary decoration-primary/30 hover:decoration-primary font-semibold underline underline-offset-2 transition-colors"
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
                className="text-primary decoration-primary/30 hover:decoration-primary font-semibold underline underline-offset-2"
              >
                {children}
              </a>
            );
          },
          strong: ({ children }) => (
            <strong className="text-foreground font-semibold">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="border-border my-10" />,
          h1: ({ children }) => (
            <h2 className="font-display text-foreground mt-12 mb-4 text-2xl font-bold tracking-tight first:mt-0 sm:text-[1.7rem]">
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
