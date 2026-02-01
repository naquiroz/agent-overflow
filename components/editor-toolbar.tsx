"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import {
  $createCodeNode,
  $isCodeNode,
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  DEFAULT_CODE_LANGUAGE,
} from "@lexical/code";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { $getNearestNodeOfType } from "@lexical/utils";
import { $getNodeByKey } from "lexical";
import { TRANSFORMERS } from "@lexical/markdown";
import { useCallback, useEffect, useState } from "react";
import { MarkdownTogglePlugin } from "@/components/editor/plugins/actions/markdown-toggle-plugin";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  Code as CodeIcon,
  List as ListBulletIcon,
  ListOrdered as ListNumberedIcon,
  Quote as QuoteIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  PilcrowLeft as ParagraphIcon,
  Heading1 as Heading1Icon,
  Heading2 as Heading2Icon,
  Heading3 as Heading3Icon,
  SquareCode as CodeBlockIcon,
} from "lucide-react";

type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "quote"
  | "code"
  | "bullet"
  | "number";

interface ToolbarState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  subscript: boolean;
  superscript: boolean;
  blockType: BlockType;
  canUndo: boolean;
  canRedo: boolean;
  codeLanguage: string;
  codeBlockKey: string | null;
}

const initialToolbarState: ToolbarState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
  subscript: false,
  superscript: false,
  blockType: "paragraph",
  canUndo: true,
  canRedo: true,
  codeLanguage: "",
  codeBlockKey: null,
};

function getToolbarState(editor: ReturnType<typeof useLexicalComposerContext>[0]): ToolbarState {
  const state = { ...initialToolbarState };
  const editorState = editor.getEditorState();
  editorState.read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    state.bold = selection.hasFormat("bold");
    state.italic = selection.hasFormat("italic");
    state.underline = selection.hasFormat("underline");
    state.strikethrough = selection.hasFormat("strikethrough");
    state.code = selection.hasFormat("code");
    state.subscript = selection.hasFormat("subscript");
    state.superscript = selection.hasFormat("superscript");

    const anchorNode = selection.anchor.getNode();
    const element =
      anchorNode.getKey() === "root"
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();
    const elementKey = element.getKey();
    const elementDOM = editor.getElementByKey(elementKey);
    if (elementDOM !== null) {
      const nodeName = elementDOM.nodeName.toLowerCase();
      if (nodeName === "h1") state.blockType = "h1";
      else if (nodeName === "h2") state.blockType = "h2";
      else if (nodeName === "h3") state.blockType = "h3";
      else if (nodeName === "blockquote") state.blockType = "quote";
      else if (nodeName === "code" && $isCodeNode(element)) {
        state.blockType = "code";
        state.codeBlockKey = element.getKey();
        state.codeLanguage = element.getLanguage() || "";
      } else if ($isListNode(element)) {
        const listType = (element as ListNode).getListType?.() ?? "bullet";
        state.blockType = listType === "number" ? "number" : "bullet";
      } else {
        state.blockType = "paragraph";
      }
    }
  });
  return state;
}

const CODE_LANGUAGE_OPTIONS = Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP).map(
  ([value, label]) => ({ value, label })
);

function formatBlock(editor: ReturnType<typeof useLexicalComposerContext>[0], blockType: BlockType) {
  if (blockType === "bullet" || blockType === "number") {
    editor.dispatchCommand(
      blockType === "bullet" ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
      undefined
    );
    return;
  }

  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    if (blockType === "paragraph") {
      const anchorNode = selection.anchor.getNode();
      const listNode = $getNearestNodeOfType(anchorNode, ListNode);
      if (listNode !== null) {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      } else {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    } else if (blockType === "h1" || blockType === "h2" || blockType === "h3") {
      $setBlocksType(selection, () => $createHeadingNode(blockType));
    } else if (blockType === "quote") {
      $setBlocksType(selection, () => $createQuoteNode());
    } else if (blockType === "code") {
      $setBlocksType(selection, () => $createCodeNode());
    }
  });
}

export function EditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [toolbarState, setToolbarState] = useState<ToolbarState>(initialToolbarState);

  const updateToolbar = useCallback(() => {
    setToolbarState(getToolbarState(editor));
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      updateToolbar();
    });
  }, [editor, updateToolbar]);

  const format = (formatType: "bold" | "italic" | "underline" | "strikethrough" | "code" | "subscript" | "superscript") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, formatType);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
        {/* History */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!toolbarState.canUndo}
              onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            >
              <UndoIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!toolbarState.canRedo}
              onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            >
              <RedoIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Block type */}
        <Select
          value={toolbarState.blockType}
          onValueChange={(v) => formatBlock(editor, v as BlockType)}
        >
          <SelectTrigger className="h-8 w-[130px] gap-1">
            {toolbarState.blockType === "paragraph" && <ParagraphIcon className="h-4 w-4" />}
            {toolbarState.blockType === "h1" && <Heading1Icon className="h-4 w-4" />}
            {toolbarState.blockType === "h2" && <Heading2Icon className="h-4 w-4" />}
            {toolbarState.blockType === "h3" && <Heading3Icon className="h-4 w-4" />}
            {toolbarState.blockType === "quote" && <QuoteIcon className="h-4 w-4" />}
            {toolbarState.blockType === "code" && <CodeBlockIcon className="h-4 w-4" />}
            {toolbarState.blockType === "bullet" && <ListBulletIcon className="h-4 w-4" />}
            {toolbarState.blockType === "number" && <ListNumberedIcon className="h-4 w-4" />}
            <SelectValue placeholder="Block" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">Paragraph</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>
            <SelectItem value="quote">Quote</SelectItem>
            <SelectItem value="code">Code block</SelectItem>
            <SelectItem value="bullet">Bullet list</SelectItem>
            <SelectItem value="number">Numbered list</SelectItem>
          </SelectContent>
        </Select>

        {toolbarState.blockType === "code" && (
          <Select
            value={
              toolbarState.codeLanguage &&
              CODE_LANGUAGE_FRIENDLY_NAME_MAP[toolbarState.codeLanguage as keyof typeof CODE_LANGUAGE_FRIENDLY_NAME_MAP]
                ? toolbarState.codeLanguage
                : DEFAULT_CODE_LANGUAGE
            }
            onValueChange={(value) => {
              const key = toolbarState.codeBlockKey;
              if (key == null) return;
              editor.update(() => {
                const node = $getNodeByKey(key);
                if ($isCodeNode(node)) node.setLanguage(value);
              });
            }}
          >
            <SelectTrigger className="h-8 w-[140px] gap-1">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {CODE_LANGUAGE_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Text format */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", toolbarState.bold && "bg-muted")}
              onClick={() => format("bold")}
            >
              <BoldIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", toolbarState.italic && "bg-muted")}
              onClick={() => format("italic")}
            >
              <ItalicIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", toolbarState.underline && "bg-muted")}
              onClick={() => format("underline")}
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Underline</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", toolbarState.strikethrough && "bg-muted")}
              onClick={() => format("strikethrough")}
            >
              <StrikethroughIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Strikethrough</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", toolbarState.code && "bg-muted")}
              onClick={() => format("code")}
            >
              <CodeIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Inline code</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", toolbarState.subscript && "bg-muted")}
              onClick={() => format("subscript")}
            >
              <SubscriptIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Subscript</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", toolbarState.superscript && "bg-muted")}
              onClick={() => format("superscript")}
            >
              <SuperscriptIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Superscript</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Lists (quick toggles) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", toolbarState.blockType === "bullet" && "bg-muted")}
              onClick={() =>
                formatBlock(editor, toolbarState.blockType === "bullet" ? "paragraph" : "bullet")
              }
            >
              <ListBulletIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bullet list</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", toolbarState.blockType === "number" && "bg-muted")}
              onClick={() =>
                formatBlock(editor, toolbarState.blockType === "number" ? "paragraph" : "number")
              }
            >
              <ListNumberedIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Numbered list</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", toolbarState.blockType === "quote" && "bg-muted")}
              onClick={() =>
                formatBlock(editor, toolbarState.blockType === "quote" ? "paragraph" : "quote")
              }
            >
              <QuoteIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Quote</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", toolbarState.blockType === "code" && "bg-muted")}
              onClick={() =>
                formatBlock(editor, toolbarState.blockType === "code" ? "paragraph" : "code")
              }
            >
              <CodeBlockIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Code block</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Markdown toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <MarkdownTogglePlugin
                shouldPreserveNewLinesInMarkdown={false}
                transformers={TRANSFORMERS}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>Toggle Markdown / WYSIWYG</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
