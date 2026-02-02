"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { SerializedEditorState, LexicalEditor } from "lexical";
import { HeadingNode, QuoteNode, registerRichText } from "@lexical/rich-text";
import { ListNode, ListItemNode, registerList } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";

import { editorTheme } from "@/components/editor/themes/editor-theme";
import { ContentEditable } from "@/components/editor/editor-ui/content-editable";
import { CodeHighlightPlugin } from "@/components/editor/plugins/code-highlight-plugin";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorToolbar } from "@/components/editor-toolbar";
import { cn } from "@/lib/utils";

export interface RichTextEditorRef {
  /** Returns the editor state as a JSON string (SerializedEditorState) */
  getJson: () => string;
}

interface RichTextEditorProps {
  placeholder?: string;
  className?: string;
  minHeight?: string;
  initialContent?: SerializedEditorState;
  /** When provided, initializes editor content from JSON string (for edit forms). */
  initialJson?: string;
}

// Internal component to capture editor ref
function EditorRefPlugin({
  editorRef,
}: {
  editorRef: React.MutableRefObject<LexicalEditor | null>;
}) {
  const [editor] = useLexicalComposerContext();
  editorRef.current = editor;
  return null;
}

// Register rich text and list behavior so FORMAT_TEXT_COMMAND and list commands work
function RegisterPlugins() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    const unregisterRichText = registerRichText(editor);
    const unregisterList = registerList(editor);
    return () => {
      unregisterRichText();
      unregisterList();
    };
  }, [editor]);
  return null;
}

// Exported for use in headless editor (lib/lexical-utils.ts)
export const editorNodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  CodeNode,
  CodeHighlightNode,
  HorizontalRuleNode,
];

const editorConfig: InitialConfigType = {
  namespace: "RichTextEditor",
  theme: editorTheme,
  nodes: editorNodes,
  onError: (error: Error) => {
    console.error(error);
  },
};

// Default empty state for the editor (exported for reuse)
// Use type assertion since Lexical's SerializedEditorState type doesn't include 'children'
// in its base type, but the actual runtime structure requires it
export const defaultEditorState = {
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
        textFormat: 0,
        textStyle: "",
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
} as unknown as SerializedEditorState;

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor(
    {
      placeholder = "Start typing...",
      className,
      minHeight = "150px",
      initialContent,
      initialJson,
    },
    ref
  ) {
    const lexicalEditorRef = useRef<LexicalEditor | null>(null);
    const [, setEditorState] = useState<SerializedEditorState | null>(null);

    // Returns the editor state as a JSON string
    const getJson = useCallback((): string => {
      const editor = lexicalEditorRef.current;
      if (!editor) return JSON.stringify(defaultEditorState);

      return JSON.stringify(editor.getEditorState().toJSON());
    }, []);

    useImperativeHandle(ref, () => ({ getJson }), [getJson]);

    // Determine initial state: use initialContent, parse initialJson, or use default
    const getInitialState = (): string => {
      if (initialContent) {
        return JSON.stringify(initialContent);
      }
      if (initialJson) {
        // initialJson is already a JSON string, validate it's parseable
        try {
          JSON.parse(initialJson);
          return initialJson;
        } catch {
          console.error("Invalid initialJson provided to RichTextEditor");
          return JSON.stringify(defaultEditorState);
        }
      }
      return JSON.stringify(defaultEditorState);
    };

    return (
      <div
        className={cn(
          "bg-background overflow-hidden rounded-lg border shadow",
          className
        )}
      >
        <LexicalComposer
          initialConfig={{
            ...editorConfig,
            editorState: getInitialState(),
          }}
        >
          <TooltipProvider>
            <RegisterPlugins />
            <EditorToolbar />
            <div className="relative">
              <RichTextPlugin
                contentEditable={
                  <div style={{ minHeight }}>
                    <ContentEditable placeholder={placeholder} />
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <CodeHighlightPlugin />
              <HistoryPlugin />
              <ListPlugin />
              <LinkPlugin />
              <MarkdownShortcutPlugin />
            </div>

            <EditorRefPlugin editorRef={lexicalEditorRef} />

            <OnChangePlugin
              ignoreSelectionChange={true}
              onChange={(editorState) => {
                setEditorState(editorState.toJSON());
              }}
            />
          </TooltipProvider>
        </LexicalComposer>
      </div>
    );
  }
);
