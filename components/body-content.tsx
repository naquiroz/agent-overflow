"use client";

import DOMPurifyImport from "isomorphic-dompurify";
import parse, { Element, DOMNode, Text } from "html-react-parser";
import { cn } from "@/lib/utils";
import { isLexicalJson } from "@/lib/lexical-utils";
import { LexicalRenderer } from "@/components/lexical-renderer";
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockItem,
  type BundledLanguage,
} from "@/components/kibo-ui/code-block";

// ESM/Next interop: default export may be wrapped (e.g. { default: DOMPurify })
const DOMPurify =
  typeof DOMPurifyImport?.sanitize === "function"
    ? DOMPurifyImport
    : (DOMPurifyImport as unknown as { default?: typeof DOMPurifyImport })
        ?.default;

interface BodyContentProps {
  body: string;
  className?: string;
}

// Helper to extract text content from DOM nodes (used for HTML fallback)
function extractTextContent(node: DOMNode): string {
  if (node instanceof Text) {
    return node.data;
  }
  if (node instanceof Element) {
    // Handle <br> tags as line breaks
    if (node.name === "br") {
      return "\n";
    }
    if (Array.isArray(node.children)) {
      return node.children
        .map((child) => extractTextContent(child as DOMNode))
        .join("");
    }
  }
  return "";
}

/**
 * HtmlContent - Renders sanitized HTML content with CodeBlock support
 * Used as a fallback for legacy HTML content (non-Lexical JSON)
 */
function HtmlContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  if (!html || typeof DOMPurify?.sanitize !== "function") {
    return null;
  }

  const sanitizedHtml = DOMPurify.sanitize(html, {
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
    ALLOWED_ATTR: ["href", "target", "rel", "class", "data-language"],
  });

  // Parse the sanitized HTML and replace code blocks with CodeBlock component
  const options = {
    replace: (domNode: DOMNode) => {
      if (domNode instanceof Element && domNode.name === "pre") {
        // Check if it's a Lexical editor code block (has EditorTheme__code class)
        const hasEditorThemeClass =
          domNode.attribs?.class?.includes("EditorTheme__code");

        if (hasEditorThemeClass) {
          // Lexical editor code block - extract text directly from pre element
          const codeText = extractTextContent(domNode);
          const language =
            domNode.attribs?.["data-language"] ||
            domNode.attribs?.["data-highlight-language"] ||
            "plaintext";

          return (
            <CodeBlock
              className="my-4"
              data={[
                {
                  code: codeText,
                  language,
                  filename: "",
                },
              ]}
              defaultValue={language}
            >
              <CodeBlockHeader>
                <CodeBlockCopyButton />
              </CodeBlockHeader>
              <CodeBlockBody>
                {(item) => (
                  <CodeBlockItem key={item.language} value={item.language}>
                    <CodeBlockContent
                      language={item.language as BundledLanguage}
                    >
                      {item.code}
                    </CodeBlockContent>
                  </CodeBlockItem>
                )}
              </CodeBlockBody>
            </CodeBlock>
          );
        }

        // Standard HTML code block - look for <code> child
        const codeChild = domNode.children.find(
          (c): c is Element => c instanceof Element && c.name === "code"
        );
        if (codeChild) {
          const codeText = extractTextContent(codeChild);
          // Extract language from class attribute if present (e.g., class="language-javascript")
          const languageClass = codeChild.attribs?.class || "";
          const languageMatch = languageClass.match(/language-(\w+)/);
          const language = languageMatch ? languageMatch[1] : "plaintext";

          return (
            <CodeBlock
              className="my-4"
              data={[
                {
                  code: codeText,
                  language,
                  filename: "",
                },
              ]}
              defaultValue={language}
            >
              <CodeBlockHeader>
                <CodeBlockCopyButton />
              </CodeBlockHeader>
              <CodeBlockBody>
                {(item) => (
                  <CodeBlockItem key={item.language} value={item.language}>
                    <CodeBlockContent
                      language={item.language as BundledLanguage}
                    >
                      {item.code}
                    </CodeBlockContent>
                  </CodeBlockItem>
                )}
              </CodeBlockBody>
            </CodeBlock>
          );
        }
      }
    },
  };

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-foreground",
        "[&_p]:text-xs [&_p]:mb-2 [&_p:last-child]:mb-0",
        "[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4",
        "[&_li]:mb-1",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground [&_blockquote]:pl-4 [&_blockquote]:italic",
        "[&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm",
        "[&_a]:text-primary [&_a]:underline",
        "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2",
        "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2",
        "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1",
        className
      )}
    >
      {parse(sanitizedHtml, options)}
    </div>
  );
}

/**
 * BodyContent - Renders body content by detecting the format and rendering appropriately
 *
 * - Lexical JSON: Renders directly using LexicalRenderer (preferred)
 * - HTML: Sanitizes and renders with CodeBlock support (fallback for legacy content)
 */
export function BodyContent({ body, className }: BodyContentProps) {
  if (!body) {
    return null;
  }

  // Use LexicalRenderer for Lexical JSON content (direct node rendering)
  if (isLexicalJson(body)) {
    return <LexicalRenderer json={body} className={className} />;
  }

  // Fallback for legacy HTML content
  return <HtmlContent html={body} className={className} />;
}
