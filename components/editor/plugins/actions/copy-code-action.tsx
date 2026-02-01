"use client";

import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isCodeNode } from "@lexical/code";
import { $getNodeByKey, $getSelection, $isRangeSelection } from "lexical";
import { CheckIcon, CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Copy-code action for the editor actions bar.
 * Visible and enabled only when the selection is inside a code block.
 */
export function CopyCodeAction() {
  const [editor] = useLexicalComposerContext();
  const [isInCodeBlock, setIsInCodeBlock] = useState(false);
  const [codeBlockKey, setCodeBlockKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setIsInCodeBlock(false);
          setCodeBlockKey(null);
          return;
        }
        const anchorNode = selection.anchor.getNode();
        const topLevel = anchorNode.getTopLevelElementOrThrow();
        if ($isCodeNode(topLevel)) {
          setIsInCodeBlock(true);
          setCodeBlockKey(topLevel.getKey());
        } else {
          setIsInCodeBlock(false);
          setCodeBlockKey(null);
        }
      });
    });
  }, [editor]);

  const handleCopy = useCallback(() => {
    if (codeBlockKey == null) return;
    editor.getEditorState().read(() => {
      const node = $getNodeByKey(codeBlockKey);
      if (!$isCodeNode(node)) return;
      const text = node.getTextContent();
      navigator.clipboard.writeText(text).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        },
        (err) => console.error("Copy failed:", err)
      );
    });
  }, [editor, codeBlockKey]);

  if (!isInCodeBlock) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="gap-1.5 px-2"
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? (
            <CheckIcon className="h-4 w-4 text-green-600" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
          <span className="text-xs">{copied ? "Copied" : "Copy code"}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy code block</TooltipContent>
    </Tooltip>
  );
}
