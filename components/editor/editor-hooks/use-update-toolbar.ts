"use client";

import { useEffect } from "react";
import { $getSelection } from "lexical";
import type { BaseSelection } from "lexical";

import { useToolbarContext } from "@/components/editor/context/toolbar-context";

/**
 * Registers a handler that runs on editor updates with the current selection.
 * Used by toolbar plugins (e.g. CodeLanguageToolbarPlugin) to sync their state.
 */
export function useUpdateToolbarHandler(
  handler: (selection: BaseSelection | null) => void
): void {
  const { activeEditor } = useToolbarContext();

  useEffect(() => {
    return activeEditor.registerUpdateListener(() => {
      activeEditor.getEditorState().read(() => {
        handler($getSelection());
      });
    });
  }, [activeEditor, handler]);
}
