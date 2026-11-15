import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Ensures there is always a writable paragraph at the end of the note document.
 * This guarantees the user can always click below any image, table, video card,
 * or list and immediately start typing.
 */
export const TrailingNode = Extension.create({
  name: 'trailingNode',

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('trailingNode');

    return [
      new Plugin({
        key: pluginKey,
        appendTransaction: (transactions, _oldState, newState) => {
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged && transactions.length > 0) return null;

          const { doc, schema, tr } = newState;
          const lastChild = doc.lastChild;

          // If the document is empty or the last node is not a paragraph, append one
          if (!lastChild || lastChild.type.name !== 'paragraph') {
            const endPos = doc.content.size;
            return tr.insert(endPos, schema.nodes.paragraph.create());
          }

          return null;
        },
      }),
    ];
  },
});
