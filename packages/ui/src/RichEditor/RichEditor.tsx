// Copyright (c) 2026 Probo Inc <hello@probo.com>.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { Blockquote } from "@tiptap/extension-blockquote";
import { Bold } from "@tiptap/extension-bold";
import { Code } from "@tiptap/extension-code";
import { Document } from "@tiptap/extension-document";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Heading } from "@tiptap/extension-heading";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Italic } from "@tiptap/extension-italic";
import { BulletList, ListItem, ListKeymap, OrderedList } from "@tiptap/extension-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Strike } from "@tiptap/extension-strike";
import { TableKit } from "@tiptap/extension-table";
import { Text } from "@tiptap/extension-text";
import { Underline } from "@tiptap/extension-underline";
import { Dropcursor, UndoRedo } from "@tiptap/extensions";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import { type ComponentProps, useCallback, useEffect, useMemo } from "react";

import { BlockMenu } from "./BlockMenu/BlockMenu";
import { BubbleMenu } from "./BubbleMenu";
import { CodeBlockExtension } from "./CodeBlockExtension";
import { parseRichEditorContent, serializeRichEditorContent } from "./content";
import { LinkExtension } from "./LinkExtension";
import { MarkdownPasteExtension } from "./MarkdownPasteExtension";
import { OptionsMenu } from "./OptionsMenu/OptionsMenu";
import { PlaceholderExtension } from "./PlaceholderExtension";
import { SlashCommandExtension } from "./SlashCommandExtension";
import { TableCellMenu } from "./TableCellMenu/TableCellMenu";
import { TableColumnMenu } from "./TableColumnMenu/TableColumnMenu";
import { TableRowMenu } from "./TableRowMenu/TableRowMenu";
import { TableSelectionOverlay } from "./TableSelectionOverlay";
import { richEditor } from "./variants";

export { isRichEditorContentEmpty, richEditorContentTextLength } from "./content";

const extensions = [
  Document,
  Paragraph,
  Text,
  Heading,
  Bold,
  Italic,
  Strike,
  Underline,
  Code,
  CodeBlockExtension,
  LinkExtension,
  SlashCommandExtension,
  PlaceholderExtension,
  Blockquote,
  BulletList,
  OrderedList,
  ListItem,
  ListKeymap,
  HorizontalRule,
  HardBreak,
  Dropcursor.configure({
    color: "#0081f1",
    width: 2,
  }),
  UndoRedo,
  TableKit.configure({
    table: { resizable: true },
  }),
  MarkdownPasteExtension,
];

type RichEditorProps = ComponentProps<"div"> & {
  content: string;
  disabled?: boolean;
  variant?: "document" | "compact";
  placeholder?: string;
  onChangeContent?: (content: string) => void;
};

export function RichEditor(props: RichEditorProps) {
  const {
    className,
    content,
    disabled = false,
    variant = "document",
    placeholder,
    onChangeContent,
    ...divProps
  } = props;

  const { root, content: contentSlot } = richEditor({ variant });

  const editorExtensions = useMemo(() => {
    if (!placeholder) {
      return extensions;
    }

    return extensions.map(extension =>
      extension.name === "placeholder"
        ? PlaceholderExtension.configure({ placeholder })
        : extension,
    );
  }, [placeholder]);

  const handleUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      if (editor.isDestroyed) {
        return;
      }

      onChangeContent?.(serializeRichEditorContent(editor));
    },
    [onChangeContent],
  );

  const ariaLabel = typeof divProps["aria-label"] === "string"
    ? divProps["aria-label"]
    : undefined;

  const parsedContent = useMemo(() => parseRichEditorContent(content), [content]);

  const editor = useEditor({
    editorProps: {
      attributes: {
        class: contentSlot(),
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      },
    },
    editable: !disabled,
    extensions: editorExtensions,
    content: parsedContent,
    onUpdate: handleUpdate,
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    editor.setEditable(!disabled, false);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    if (serializeRichEditorContent(editor) === content) {
      return;
    }

    if (editor.isFocused && !disabled) {
      return;
    }

    editor.commands.setContent(parsedContent, { emitUpdate: false });
  }, [editor, content, disabled, parsedContent]);

  if (!editor) return null;

  return (
    <div
      {...divProps}
      className={root({ className })}
      data-variant={variant}
    >
      {!disabled
        && (
          <>
            <BubbleMenu editor={editor} />
            <BlockMenu editor={editor} />
            <OptionsMenu editor={editor} />
            <TableSelectionOverlay editor={editor} />
            <TableCellMenu editor={editor} />
            <TableColumnMenu editor={editor} />
            <TableRowMenu editor={editor} />
          </>
        )}

      <EditorContent className={contentSlot()} editor={editor} />
    </div>
  );
}
