import React, { useState, useRef, useEffect } from 'react';
import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Trash2, AlignLeft, AlignCenter, AlignRight, Plus } from 'lucide-react';

const ResizableImageComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
  getPos,
}) => {
  const { src, alt, width = '100%', alignment = 'center' } = node.attrs;
  const [isResizing, setIsResizing] = useState(false);
  const [activeWidth, setActiveWidth] = useState<string>(width);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    setActiveWidth(width);
  }, [width]);

  const setPresetWidth = (newWidth: string) => {
    setActiveWidth(newWidth);
    updateAttributes({ width: newWidth });
  };

  const setAlign = (newAlign: 'left' | 'center' | 'right') => {
    updateAttributes({ alignment: newAlign });
  };

  // Insert a new paragraph below the image so user can immediately type
  const handleInsertBelow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editor && typeof getPos === 'function') {
      const pos = getPos();
      const afterPos = pos + node.nodeSize;
      editor
        .chain()
        .insertContentAt(afterPos, { type: 'paragraph' })
        .focus(afterPos + 1)
        .run();
    }
  };

  // Mouse Drag to Resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    const currentElem = containerRef.current;
    if (currentElem) {
      startWidthRef.current = currentElem.getBoundingClientRect().width;
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const parentElem = containerRef.current?.parentElement;
      const parentWidth = parentElem?.getBoundingClientRect().width || 800;
      const deltaX = moveEvent.clientX - startXRef.current;
      const newPixelWidth = Math.max(120, Math.min(parentWidth, startWidthRef.current + deltaX));
      const newPercent = Math.min(100, Math.max(15, Math.round((newPixelWidth / parentWidth) * 100)));
      setActiveWidth(`${newPercent}%`);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setIsResizing(false);
      const parentElem = containerRef.current?.parentElement;
      const parentWidth = parentElem?.getBoundingClientRect().width || 800;
      const deltaX = upEvent.clientX - startXRef.current;
      const newPixelWidth = Math.max(120, Math.min(parentWidth, startWidthRef.current + deltaX));
      const newPercent = Math.min(100, Math.max(15, Math.round((newPixelWidth / parentWidth) * 100)));
      const finalWidth = `${newPercent}%`;
      setActiveWidth(finalWidth);
      updateAttributes({ width: finalWidth });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const getAlignmentFlex = () => {
    if (alignment === 'left') return 'flex-start';
    if (alignment === 'right') return 'flex-end';
    return 'center';
  };

  const isControlsVisible = selected || isResizing;

  return (
    <NodeViewWrapper
      className="resizable-image-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: getAlignmentFlex(),
        margin: '20px 0',
        position: 'relative',
        width: '100%',
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: activeWidth,
          maxWidth: '100%',
          transition: isResizing ? 'none' : 'width 0.15s ease',
          outline: isControlsVisible ? '2px solid var(--accent)' : '2px solid transparent',
          borderRadius: '8px',
        }}
      >
        {/* Floating Quick Action Toolbar - Sits OUTSIDE above the image so it NEVER covers diagrams */}
        {isControlsVisible && (
          <div
            className="image-actions-pill no-drag"
            style={{
              position: 'absolute',
              top: '-42px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--bg-window)',
              borderRadius: '8px',
              padding: '3px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
              zIndex: 50,
              color: 'var(--text-primary)',
              fontSize: '11px',
              fontWeight: 500,
              border: '1px solid var(--border-color)',
              whiteSpace: 'nowrap',
            }}
          >
            {/* Presets */}
            <button
              type="button"
              onClick={() => setPresetWidth('25%')}
              style={{
                background: activeWidth === '25%' ? 'var(--accent)' : 'transparent',
                color: activeWidth === '25%' ? '#ffffff' : 'var(--text-primary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
              title="Small (25%)"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => setPresetWidth('50%')}
              style={{
                background: activeWidth === '50%' ? 'var(--accent)' : 'transparent',
                color: activeWidth === '50%' ? '#ffffff' : 'var(--text-primary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
              title="Medium (50%)"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setPresetWidth('75%')}
              style={{
                background: activeWidth === '75%' ? 'var(--accent)' : 'transparent',
                color: activeWidth === '75%' ? '#ffffff' : 'var(--text-primary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
              title="Large (75%)"
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => setPresetWidth('100%')}
              style={{
                background: activeWidth === '100%' ? 'var(--accent)' : 'transparent',
                color: activeWidth === '100%' ? '#ffffff' : 'var(--text-primary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
              }}
              title="Full Width (100%)"
            >
              100%
            </button>

            <span style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-color)' }} />

            {/* Alignment buttons */}
            <button
              type="button"
              onClick={() => setAlign('left')}
              style={{
                background: alignment === 'left' ? 'rgba(212, 155, 41, 0.2)' : 'transparent',
                color: alignment === 'left' ? 'var(--accent)' : 'var(--text-secondary)',
                padding: '3px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Align Left"
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => setAlign('center')}
              style={{
                background: alignment === 'center' ? 'rgba(212, 155, 41, 0.2)' : 'transparent',
                color: alignment === 'center' ? 'var(--accent)' : 'var(--text-secondary)',
                padding: '3px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Align Center"
            >
              <AlignCenter size={13} />
            </button>
            <button
              type="button"
              onClick={() => setAlign('right')}
              style={{
                background: alignment === 'right' ? 'rgba(212, 155, 41, 0.2)' : 'transparent',
                color: alignment === 'right' ? 'var(--accent)' : 'var(--text-secondary)',
                padding: '3px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Align Right"
            >
              <AlignRight size={13} />
            </button>

            <span style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-color)' }} />

            {/* Delete button */}
            <button
              type="button"
              onClick={() => deleteNode()}
              style={{
                background: 'transparent',
                color: '#ef4444',
                padding: '3px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Delete Image"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        <img
          src={src}
          alt={alt || ''}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            borderRadius: '8px',
            userSelect: 'none',
          }}
        />

        {/* Drag handle in bottom right corner (only when selected) */}
        {isControlsVisible && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              right: '-6px',
              bottom: '-6px',
              width: '14px',
              height: '14px',
              backgroundColor: 'var(--accent)',
              borderRadius: '50%',
              border: '2px solid #ffffff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.35)',
              cursor: 'se-resize',
              zIndex: 45,
            }}
            title="Drag to resize"
          />
        )}
      </div>

      {/* Helpful "Write below" helper button when image is selected */}
      {isControlsVisible && (
        <button
          type="button"
          onClick={handleInsertBelow}
          style={{
            marginTop: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: 500,
            borderRadius: '6px',
            border: '1px dashed var(--border-color)',
            backgroundColor: 'var(--bg-window)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Start writing below this image (or press Enter)"
        >
          <Plus size={12} color="var(--accent)" />
          <span>Write below this image (or press Enter)</span>
        </button>
      )}
    </NodeViewWrapper>
  );
};

export const ResizableImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('data-width') || element.style.width || '100%',
        renderHTML: (attributes) => ({
          'data-width': attributes.width,
          style: `width: ${attributes.width}; max-width: 100%; height: auto; display: block; border-radius: 8px;`,
        }),
      },
      alignment: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-alignment') || 'center',
        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment,
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        // If image node is selected, press Enter to insert paragraph right after it
        if ('node' in selection && (selection as any).node?.type.name === 'image') {
          const afterPos = selection.$to.after();
          return editor
            .chain()
            .insertContentAt(afterPos, { type: 'paragraph' })
            .focus(afterPos + 1)
            .run();
        }
        return false;
      },
      ArrowDown: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        if ('node' in selection && (selection as any).node?.type.name === 'image') {
          const afterPos = selection.$to.after();
          if (afterPos <= state.doc.content.size) {
            return editor.commands.focus(afterPos + 1);
          }
        }
        return false;
      },
    };
  },
});
