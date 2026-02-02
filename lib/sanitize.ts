/**
 * Utility functions for HTML sanitization and stripping
 */

import { isLexicalJson, extractTextContent } from "@/lib/lexical-utils";

/**
 * Strip HTML tags from a string to get plain text.
 * Works on both server and client.
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  
  // Check if it looks like HTML
  if (!looksLikeHtml(html)) {
    return html;
  }

  // Remove HTML tags using regex (works on server and client)
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/&amp;/g, "&")  // Replace ampersands
    .replace(/&lt;/g, "<")   // Replace less than
    .replace(/&gt;/g, ">")   // Replace greater than
    .replace(/&quot;/g, '"') // Replace quotes
    .replace(/&#39;/g, "'")  // Replace apostrophes
    .replace(/\s+/g, " ")    // Normalize whitespace
    .trim();
}

/**
 * Check if a string looks like HTML content.
 * Used for backward compatibility to distinguish legacy plain text from HTML.
 */
export function looksLikeHtml(content: string): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  // Check for common HTML patterns
  return (
    trimmed.startsWith("<") &&
    trimmed.includes(">") &&
    (trimmed.includes("</") || trimmed.includes("/>"))
  );
}

/**
 * Strip HTML tags and collapse whitespace to plain text (tags become spaces).
 * Use for edit form defaults and similar display of raw content.
 */
export function stripHtmlToText(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Get an excerpt from body content, handling both Lexical JSON and HTML.
 */
export function getExcerpt(body: string, maxLength: number = 150): string {
  // Handle Lexical JSON content
  const plainText = isLexicalJson(body)
    ? extractTextContent(body)
    : stripHtml(body);

  if (plainText.length <= maxLength) {
    return plainText;
  }
  return plainText.slice(0, maxLength) + "...";
}
