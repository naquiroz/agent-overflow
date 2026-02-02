/**
 * Server-safe utility functions for Lexical JSON validation and text extraction.
 * These functions only parse JSON and don't require DOM or React.
 */

/**
 * Checks if a string looks like a Lexical JSON state (starts with {"root":)
 */
export function isLexicalJson(content: string): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  return trimmed.startsWith('{"root":');
}

/**
 * Checks if a Lexical JSON state represents an empty editor
 * (only has an empty paragraph or no text content)
 */
export function isEmptyEditorState(jsonString: string): boolean {
  try {
    const state = JSON.parse(jsonString);
    const root = state?.root;
    if (!root?.children || root.children.length === 0) return true;
    
    // Check if the only child is an empty paragraph
    if (root.children.length === 1) {
      const child = root.children[0];
      if (child.type === "paragraph") {
        // Empty if no children or only empty text
        if (!child.children || child.children.length === 0) return true;
        // Check if all children are empty text nodes
        const hasContent = child.children.some((c: { text?: string }) => c.text && c.text.trim().length > 0);
        return !hasContent;
      }
    }
    
    return false;
  } catch {
    return true; // Invalid JSON is considered empty
  }
}

/**
 * Converts a Lexical SerializedEditorState JSON to basic HTML.
 * This is a simplified server-safe conversion that handles common node types.
 * For full fidelity, use the client-side LexicalJsonRenderer component.
 * 
 * @param jsonString - The JSON string containing the serialized editor state
 * @returns The HTML representation of the editor content
 */
export function serializeToHtml(jsonString: string): string {
  if (!jsonString || !isLexicalJson(jsonString)) {
    return "";
  }

  try {
    const state = JSON.parse(jsonString);
    return renderNodeToHtml(state.root);
  } catch (error) {
    console.error("Failed to serialize Lexical JSON to HTML:", error);
    return "";
  }
}

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
}

/**
 * Recursively renders a Lexical node to HTML string.
 * Handles common node types: root, paragraph, text, heading, quote, list, code, link, hr.
 */
function renderNodeToHtml(node: LexicalJsonNode): string {
  if (!node) return "";

  const { type, children, text, format, tag, listType, language, url } = node;

  // Text node
  if (type === "text" && typeof text === "string") {
    let html = escapeHtml(text);
    // Handle text formatting (format is a bitmask)
    const formatNum = typeof format === "number" ? format : 0;
    if (formatNum & 1) html = `<strong>${html}</strong>`; // bold
    if (formatNum & 2) html = `<em>${html}</em>`; // italic
    if (formatNum & 8) html = `<u>${html}</u>`; // underline
    if (formatNum & 4) html = `<s>${html}</s>`; // strikethrough
    if (formatNum & 16) html = `<code>${html}</code>`; // code
    return html;
  }

  // Linebreak
  if (type === "linebreak") {
    return "<br>";
  }

  // Horizontal rule
  if (type === "horizontalrule") {
    return "<hr>";
  }

  // Code highlight (within code blocks)
  if (type === "code-highlight" && typeof text === "string") {
    return escapeHtml(text);
  }

  // Render children recursively
  const childrenHtml = children?.map(renderNodeToHtml).join("") ?? "";

  switch (type) {
    case "root":
      return childrenHtml;
    case "paragraph":
      return `<p>${childrenHtml || "<br>"}</p>`;
    case "heading":
      const headingTag = tag || "h1";
      return `<${headingTag}>${childrenHtml}</${headingTag}>`;
    case "quote":
      return `<blockquote>${childrenHtml}</blockquote>`;
    case "list":
      const listTag = listType === "number" ? "ol" : "ul";
      return `<${listTag}>${childrenHtml}</${listTag}>`;
    case "listitem":
      return `<li>${childrenHtml}</li>`;
    case "code":
      const langAttr = language ? ` data-language="${escapeHtml(language)}"` : "";
      return `<pre class="EditorTheme__code"${langAttr}><code>${childrenHtml}</code></pre>`;
    case "link":
      const href = url ? ` href="${escapeHtml(url)}"` : "";
      return `<a${href} target="_blank" rel="noopener noreferrer">${childrenHtml}</a>`;
    default:
      // For unknown types, just return children
      return childrenHtml;
  }
}

/**
 * Escapes HTML special characters to prevent XSS.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Extracts plain text content from a Lexical JSON state.
 * Useful for validation and length checking.
 * 
 * @param jsonString - The JSON string containing the serialized editor state
 * @returns The plain text content
 */
export function extractTextContent(jsonString: string): string {
  if (!jsonString || !isLexicalJson(jsonString)) {
    return "";
  }

  try {
    const state = JSON.parse(jsonString);
    return extractTextFromNode(state.root);
  } catch {
    return "";
  }
}

/**
 * Recursively extracts text from a Lexical node and its children.
 */
function extractTextFromNode(node: {
  text?: string;
  children?: Array<{ text?: string; children?: unknown[] }>;
}): string {
  if (!node) return "";
  
  // If node has text property, return it
  if (typeof node.text === "string") {
    return node.text;
  }
  
  // Recursively extract from children
  if (Array.isArray(node.children)) {
    return node.children.map((child) => extractTextFromNode(child as typeof node)).join("");
  }
  
  return "";
}
