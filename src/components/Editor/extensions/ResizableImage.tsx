import React, { useState, useRef, useEffect } from 'react';
import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const ResizableImageComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const { src, alt, width = '100%', alignment = 'center' } = node.attrs;
  const [isHovered, setIsHovered] = useState(false);
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

  return (
    <NodeViewWrapper
      className="resizable-image-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: getAlignmentFlex(),
        margin: '16px 0',
        position: 'relative',
        width: '100%',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isResizing) setIsHovered(false);
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: activeWidth,
          maxWidth: '100%',
          transition: isResizing ? 'none' : 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          outline: (selected || isHovered || isResizing)
            ? '2px solid var(--accent)'
            : '2px solid transparent',
          borderRadius: '8px',
          boxShadow: (selected || isResizing)
            ? '0 0 0 4px rgba(212, 155, 41, 0.2)'
            : 'none',
        }}
      >
        <img
          src={src}
          alt={alt || ''}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            borderRadius: '8px',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />

        {/* Floating Quick Action Toolbar on hover, select, or resize */}
        {(isHovered || selected || isResizing) && (
          <div
            className="image-actions-pill no-drag"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'rgba(28, 28, 30, 0.92)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
              zIndex: 40,
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {/* Presets */}
            <button
              type="button"
              onClick={() => setPresetWidth('25%')}
              style={{
                background: activeWidth === '25%' ? 'var(--accent)' : 'transparent',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
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
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
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
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
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
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
              }}
              title="Full Width (100%)"
            >
              100%
            </button>

            <span style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

            {/* Alignment buttons */}
            <button
              type="button"
              onClick={() => setAlign('left')}
              style={{
                background: alignment === 'left' ? 'rgba(255,255,255,0.25)' : 'transparent',
                color: '#fff',
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
                background: alignment === 'center' ? 'rgba(255,255,255,0.25)' : 'transparent',
                color: '#fff',
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
                background: alignment === 'right' ? 'rgba(255,255,255,0.25)' : 'transparent',
                color: '#fff',
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

            <span style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

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

        {/* Drag handle in bottom right corner */}
        {(isHovered || selected || isResizing) && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              right: '-6px',
              bottom: '-6px',
              width: '18px',
              height: '18px',
              backgroundColor: 'var(--accent)',
              borderRadius: '50%',
              border: '2px solid #ffffff',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
              cursor: 'se-resize',
              zIndex: 45,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Drag to resize"
          />
        )}
      </div>
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
});
