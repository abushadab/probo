// Copyright (c) 2026 Probo Inc <hello@probo.com>.
// Use of this source code is governed by the MIT license
// that can be found in the LICENSE file.

import { Extension } from "@tiptap/core";
import { type EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const placeholderKey = new PluginKey("placeholder");

const defaultPlaceholder = "Write or type / for commands\u2026";

function computeDecorations(
  state: EditorState,
  placeholder: string,
): DecorationSet {
  const { selection } = state;
  if (!selection.empty) return DecorationSet.empty;

  const $pos = selection.$from;
  const node = $pos.parent;

  if (node.type.name !== "paragraph") return DecorationSet.empty;
  if (node.content.size !== 0) return DecorationSet.empty;

  if ($pos.depth >= 2) {
    const parentName = $pos.node($pos.depth - 1).type.name;
    if (
      parentName === "listItem"
      || parentName === "tableCell"
      || parentName === "tableHeader"
    ) {
      return DecorationSet.empty;
    }
  }

  const pos = $pos.before($pos.depth);

  return DecorationSet.create(state.doc, [
    Decoration.node(pos, pos + node.nodeSize, {
      "class": "is-empty-focused",
      "data-placeholder": placeholder,
    }),
  ]);
}

export const PlaceholderExtension = Extension.create({
  name: "placeholder",

  addOptions() {
    return {
      placeholder: defaultPlaceholder,
    };
  },

  addProseMirrorPlugins() {
    const placeholder = this.options.placeholder;

    return [
      new Plugin({
        key: placeholderKey,

        state: {
          init(_config, state) {
            return computeDecorations(state, placeholder);
          },
          apply(tr, value, _oldState, newState) {
            if (
              !tr.docChanged
              && !tr.selectionSet
              && !tr.getMeta(placeholderKey)
            ) {
              return value;
            }
            return computeDecorations(newState, placeholder);
          },
        },

        props: {
          decorations(state) {
            return placeholderKey.getState(state) as DecorationSet;
          },
        },
      }),
    ];
  },
});
