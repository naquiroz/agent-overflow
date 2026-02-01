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
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $getRoot } from "lexical";
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
import { ActionsPlugin } from "@/components/editor/plugins/actions/actions-plugin";
import { CopyCodeAction } from "@/components/editor/plugins/actions/copy-code-action";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorToolbar } from "@/components/editor-toolbar";
import { cn } from "@/lib/utils";

export interface RichTextEditorRef {
  getHtml: () => string;
}

interface RichTextEditorProps {
  placeholder?: string;
  className?: string;
  minHeight?: string;
  initialContent?: SerializedEditorState;
  /** When provided, initializes editor content from HTML (e.g. for edit forms). Ignored if initialContent is set. */
  initialHtml?: string;
}

// Internal component to capture editor ref and provide getHtml
function EditorRefPlugin({
  editorRef,
}: {
  editorRef: React.MutableRefObject<LexicalEditor | null>;
}) {
  const [editor] = useLexicalComposerContext();
  editorRef.current = editor;
  return null;
}

// When initialHtml is set, populate the editor once on mount
function InitialContentFromHtmlPlugin({ initialHtml }: { initialHtml: string }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!initialHtml?.trim()) return;
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialHtml, "text/html").body;
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      for (const node of nodes) {
        root.append(node);
      }
    });
  }, [editor, initialHtml]);
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

const nodes = [
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
  nodes,
  onError: (error: Error) => {
    console.error(error);
  },
};

// Default empty state for the editor
// Use type assertion since Lexical's SerializedEditorState type doesn't include 'children'
// in its base type, but the actual runtime structure requires it
const defaultEditorState = {
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
      initialHtml,
    },
    ref
  ) {
    const lexicalEditorRef = useRef<LexicalEditor | null>(null);
    const [, setEditorState] = useState<SerializedEditorState | null>(null);

    const getHtml = useCallback((): string => {
      const editor = lexicalEditorRef.current;
      if (!editor) return "";

      let html = "";
      editor.getEditorState().read(() => {
        html = $generateHtmlFromNodes(editor, null);
      });
      return html;
    }, []);

    useImperativeHandle(ref, () => ({ getHtml }), [getHtml]);

    const initialState =
      initialContent ?? (initialHtml ? defaultEditorState : defaultEditorState);

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
            editorState: JSON.stringify(initialState),
          }}
        >
          <TooltipProvider>
            {initialHtml && <InitialContentFromHtmlPlugin initialHtml={initialHtml} />}
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

            <ActionsPlugin>
              <div className="clear-both flex items-center justify-between gap-2 overflow-auto border-t bg-muted/20 px-2 py-1.5">
                <div className="flex flex-1 justify-start" />
                <div />
                <div className="flex flex-1 justify-end">
                  <CopyCodeAction />
                </div>
              </div>
            </ActionsPlugin>

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
