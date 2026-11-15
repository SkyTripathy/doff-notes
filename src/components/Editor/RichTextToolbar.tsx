import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  CheckSquare,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Minus,
  Code,
  ChevronDown,
  Check,
  Video,
} from 'lucide-react';
import { extractYouTubeVideoId, extractDomain } from './extensions/LinkCard';

interface RichTextToolbarProps {
  editor: Editor | null;
}

const STYLE_OPTIONS = [
  { value: 'title', label: 'Title', fontStyle: { fontSize: '15px', fontWeight: 700 } },
  { value: 'heading', label: 'Heading', fontStyle: { fontSize: '14px', fontWeight: 600 } },
  { value: 'subheading', label: 'Subheading', fontStyle: { fontSize: '13px', fontWeight: 600 } },
  { value: 'body', label: 'Body', fontStyle: { fontSize: '13px', fontWeight: 400 } },
  { value: 'code', label: 'Monospaced', fontStyle: { fontSize: '12px', fontFamily: 'monospace' } },
];

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ editor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);

  // Close style dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsStyleMenuOpen(false);
      }
    };
    if (isStyleMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStyleMenuOpen]);

  if (!editor) return null;

  const getCurrentHeadingStyle = (): string => {
    if (editor.isActive('heading', { level: 1 })) return 'title';
    if (editor.isActive('heading', { level: 2 })) return 'heading';
    if (editor.isActive('heading', { level: 3 })) return 'subheading';
    if (editor.isActive('codeBlock')) return 'code';
    return 'body';
  };

  const handleSelectStyle = (val: string) => {
    setIsStyleMenuOpen(false);
    if (val === 'title') {
      editor.chain().focus().setHeading({ level: 1 }).run();
    } else if (val === 'heading') {
      editor.chain().focus().setHeading({ level: 2 }).run();
    } else if (val === 'subheading') {
      editor.chain().focus().setHeading({ level: 3 }).run();
    } else if (val === 'code') {
      editor.chain().focus().toggleCodeBlock().run();
    } else {
      editor.chain().focus().setParagraph().run();
    }
  };

  const currentStyleValue = getCurrentHeadingStyle();
  const currentStyleObj = STYLE_OPTIONS.find((s) => s.value === currentStyleValue) || STYLE_OPTIONS[3];

  const handleInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          (editor.chain().focus() as any)
            .setImage({ src: reader.result, width: '100%', alignment: 'center' })
            .run();
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleInsertLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleInsertVideoCard = () => {
    const url = window.prompt('Enter YouTube or Web Link for Rich Preview Card:');
    if (!url || !url.trim()) return;

    const trimmed = url.trim();
    const ytId = extractYouTubeVideoId(trimmed);
    const domain = extractDomain(trimmed);

    (editor.chain().focus() as any)
      .insertContent({
        type: 'linkCard',
        attrs: {
          url: trimmed,
          videoId: ytId,
          title: ytId ? 'YouTube Video' : trimmed,
          domain: domain,
        },
      })
      .run();
  };

  return (
    <div className="rich-toolbar">
      {/* Custom Apple-style Paragraph / Heading Style Dropdown (Always crystal-clear text) */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-window)',
            color: 'var(--text-primary)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            minWidth: '82px',
            justifyContent: 'space-between',
          }}
          title="Text Style"
        >
          <span>{currentStyleObj.label}</span>
          <ChevronDown size={12} color="var(--text-secondary)" />
        </button>

        {isStyleMenuOpen && (
          <div className="apple-style-menu">
            {STYLE_OPTIONS.map((opt) => {
              const active = opt.value === currentStyleValue;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`apple-style-option ${active ? 'active' : ''}`}
                  onClick={() => handleSelectStyle(opt.value)}
                >
                  <span style={opt.fontStyle}>{opt.label}</span>
                  {active && <Check size={14} color="var(--accent)" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="toolbar-divider" />

      {/* Bold, Italic, Underline, Strikethrough, Highlight */}
      <button
        className={`icon-btn ${editor.isActive('bold') ? 'active' : ''}`}
        style={{ width: '28px', height: '28px' }}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <Bold size={14} />
      </button>
      <button
        className={`icon-btn ${editor.isActive('italic') ? 'active' : ''}`}
        style={{ width: '28px', height: '28px' }}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <Italic size={14} />
      </button>
      <button
        className={`icon-btn ${editor.isActive('underline') ? 'active' : ''}`}
        style={{ width: '28px', height: '28px' }}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon size={14} />
      </button>
      <button
        className={`icon-btn ${editor.isActive('strike') ? 'active' : ''}`}
        style={{ width: '28px', height: '28px' }}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </button>
      <button
        className={`icon-btn ${editor.isActive('highlight') ? 'active' : ''}`}
        style={{ width: '28px', height: '28px' }}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        title="Highlight"
      >
        <Highlighter size={14} />
      </button>

      <div className="toolbar-divider" />

      {/* Checklist, Bullet List, Numbered List */}
      <button
        className={`icon-btn ${editor.isActive('taskList') ? 'active' : ''}`}
        style={{ width: '28px', height: '28px' }}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Checklist"
      >
        <CheckSquare size={14} />
      </button>
      <button
        className={`icon-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
        style={{ width: '28px', height: '28px' }}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List size={14} />
      </button>
      <button
        className={`icon-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
        style={{ width: '28px', height: '28px' }}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <ListOrdered size={14} />
      </button>

      <div className="toolbar-divider" />

      {/* Table */}
      <button
        className={`icon-btn ${editor.isActive('table') ? 'active' : ''}`}
        style={{ width: '28px', height: '28px' }}
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        title="Insert Table"
      >
        <TableIcon size={14} />
      </button>

      {/* Standard Link */}
      <button
        className={`icon-btn ${editor.isActive('link') ? 'active' : ''}`}
        style={{ width: '28px', height: '28px' }}
        onClick={handleInsertLink}
        title="Insert Link"
      >
        <LinkIcon size={14} />
      </button>

      {/* Video / Rich Link Card (YouTube Thumbnails & Bookmark Cards) */}
      <button
        className="icon-btn"
        style={{ width: '28px', height: '28px' }}
        onClick={handleInsertVideoCard}
        title="Insert YouTube / Link Preview Card"
      >
        <Video size={14} />
      </button>

      {/* Image attachment (Resizable) */}
      <button
        className="icon-btn"
        style={{ width: '28px', height: '28px' }}
        onClick={() => fileInputRef.current?.click()}
        title="Insert Image (Resizable)"
      >
        <ImageIcon size={14} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleInsertImage}
      />

      {/* Code inline */}
      <button
        className={`icon-btn ${editor.isActive('code') ? 'active' : ''}`}
        style={{ width: '28px', height: '28px' }}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline Code"
      >
        <Code size={14} />
      </button>

      {/* Horizontal divider line */}
      <button
        className="icon-btn"
        style={{ width: '28px', height: '28px' }}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Line"
      >
        <Minus size={14} />
      </button>
    </div>
  );
};
