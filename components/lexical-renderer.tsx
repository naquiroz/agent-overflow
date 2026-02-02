"use client";

import { type ReactNode, Fragment } from "react";
import { cn } from "@/lib/utils";
import { isLexicalJson } from "@/lib/lexical-utils";
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockItem,
  type BundledLanguage,
} from "@/components/kibo-ui/code-block";

/**
 * Lexical JSON node structure
 */
interface LexicalJsonNode {
  type: string;
  children?: LexicalJsonNode[];
  text?: string;
  format?: number | string;
  tag?: string;
  listType?: string;
  language?: string;
  highlightType?: string;
  url?: string;
  direction?: string | null;
  version?: number;
}

interface LexicalRendererProps {
  json: string;
  className?: string;
}

/**
 * Extracts plain text content from a Lexical node and its children.
 * Used for code blocks where we need the raw text content.
 */
function extractTextFromNode(node: LexicalJsonNode): string {
  if (!node) return "";

  // Text node - return text content
  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }

  // Code highlight node - return text content
  if (node.type === "code-highlight" && typeof node.text === "string") {
    return node.text;
  }

  // Linebreak - return newline
  if (node.type === "linebreak") {
    return "\n";
  }

  // Recursively extract from children
  if (Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join("");
  }

  return "";
}

/**
 * Renders a text node with formatting applied
 */
function renderTextNode(node: LexicalJsonNode, key: string): ReactNode {
  if (typeof node.text !== "string") return null;

  let content: ReactNode = node.text;

  // Handle text formatting (format is a bitmask)
  const formatNum = typeof node.format === "number" ? node.format : 0;

  // Apply formatting in order: code -> strikethrough -> underline -> italic -> bold
  if (formatNum & 16) content = <code key={`${key}-code`}>{content}</code>;
  if (formatNum & 4) content = <s key={`${key}-s`}>{content}</s>;
  if (formatNum & 8) content = <u key={`${key}-u`}>{content}</u>;
  if (formatNum & 2) content = <em key={`${key}-em`}>{content}</em>;
  if (formatNum & 1) content = <strong key={`${key}-strong`}>{content}</strong>;

  return <Fragment key={key}>{content}</Fragment>;
}

/**
 * Renders a code block using Kibo UI's CodeBlock component
 */
function renderCodeBlock(node: LexicalJsonNode, key: string): ReactNode {
  const codeText = extractTextFromNode(node);
  const language = node.language || "plaintext";

  return (
    <CodeBlock
      key={key}
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
            <CodeBlockContent language={item.language as BundledLanguage}>
              {item.code}
            </CodeBlockContent>
          </CodeBlockItem>
        )}
      </CodeBlockBody>
    </CodeBlock>
  );
}

/**
 * Recursively renders a Lexical node as React components
 */
function renderNode(node: LexicalJsonNode, key: string): ReactNode {
  if (!node) return null;

  const { type, children, tag, listType, url } = node;

  // Text node
  if (type === "text") {
    return renderTextNode(node, key);
  }

  // Linebreak
  if (type === "linebreak") {
    return <br key={key} />;
  }

  // Horizontal rule
  if (type === "horizontalrule") {
    return <hr key={key} />;
  }

  // Code highlight (within code blocks) - just return text, parent handles rendering
  if (type === "code-highlight") {
    return <Fragment key={key}>{node.text}</Fragment>;
  }

  // Code block - use Kibo UI component
  if (type === "code") {
    return renderCodeBlock(node, key);
  }

  // Render children recursively
  const childNodes = children?.map((child, index) =>
    renderNode(child, `${key}-${index}`)
  );

  switch (type) {
    case "root":
      return <Fragment key={key}>{childNodes}</Fragment>;

    case "paragraph":
      return (
        <p key={key}>
          {childNodes && childNodes.length > 0 ? childNodes : <br />}
        </p>
      );

    case "heading": {
      const HeadingTag = (tag || "h1") as keyof JSX.IntrinsicElements;
      return <HeadingTag key={key}>{childNodes}</HeadingTag>;
    }

    case "quote":
      return <blockquote key={key}>{childNodes}</blockquote>;

    case "list": {
      const ListTag = listType === "number" ? "ol" : "ul";
      return <ListTag key={key}>{childNodes}</ListTag>;
    }

    case "listitem":
      return <li key={key}>{childNodes}</li>;

    case "link":
      return (
        <a
          key={key}
          href={url || "#"}
          target="_blank"
          rel="noopener noreferrer"
        >
          {childNodes}
        </a>
      );

    default:
      // For unknown types, just return children
      return childNodes ? <Fragment key={key}>{childNodes}</Fragment> : null;
  }
}

/**
 * LexicalRenderer - Renders Lexical JSON directly as React components
 *
 * This component parses Lexical editor JSON and renders it as React components,
 * bypassing the intermediate HTML conversion step. Code blocks are rendered
 * using Kibo UI's CodeBlock component with proper syntax highlighting and copy functionality.
 */
export function LexicalRenderer({ json, className }: LexicalRendererProps) {
  if (!json || !isLexicalJson(json)) {
    return null;
  }

  let state: { root: LexicalJsonNode };
  try {
    state = JSON.parse(json);
  } catch (error) {
    console.error("Failed to parse Lexical JSON:", error);
    return null;
  }

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
      {renderNode(state.root, "root")}
    </div>
  );
}
