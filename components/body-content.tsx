"use client";

import DOMPurifyImport from "isomorphic-dompurify";
import { cn } from "@/lib/utils";
import { looksLikeHtml } from "@/lib/sanitize";

// ESM/Next interop: default export may be wrapped (e.g. { default: DOMPurify })
const DOMPurify =
  typeof DOMPurifyImport?.sanitize === "function"
    ? DOMPurifyImport
    : (DOMPurifyImport as unknown as { default?: typeof DOMPurifyImport })?.default;

interface BodyContentProps {
  body: string;
  className?: string;
}

/**
 * Renders body content as sanitized HTML if it looks like HTML,
 * otherwise renders as plain text with preserved whitespace.
 * Provides backward compatibility with legacy plain-text content.
 */
export function BodyContent({ body, className }: BodyContentProps) {
  if (!body) {
    return null;
  }

  // If it looks like HTML, sanitize and render as HTML (isomorphic-dompurify works in SSR + client)
  if (looksLikeHtml(body) && typeof DOMPurify?.sanitize === "function") {
    const sanitizedHtml = DOMPurify.sanitize(body, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "strike",
        "del",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "blockquote",
        "code",
        "pre",
        "a",
        "span",
        "div",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class"],
    });

    return (
      <div
        className={cn(
          "prose prose-sm max-w-none text-foreground",
          // Style nested elements
          "[&_p]:mb-2 [&_p:last-child]:mb-0",
          "[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4",
          "[&_li]:mb-1",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground [&_blockquote]:pl-4 [&_blockquote]:italic",
          "[&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm",
          "[&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto",
          "[&_a]:text-primary [&_a]:underline",
          "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2",
          "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2",
          "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1",
          className
        )}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  // Otherwise, render as plain text with whitespace preserved
  return (
    <div className={cn("whitespace-pre-wrap", className)}>
      {body}
    </div>
  );
}
