import React, { useRef } from 'react';
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
} from 'lucide-react';

interface RichTextToolbarProps {
  editor: Editor | null;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ editor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const getCurrentHeadingStyle = (): string => {
    if (editor.isActive('heading', { level: 1 })) return 'title';
    if (editor.isActive('heading', { level: 2 })) return 'heading';
    if (editor.isActive('heading', { level: 3 })) return 'subheading';
    if (editor.isActive('codeBlock')) return 'code';
    return 'body';
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
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

  const handleInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          editor.chain().focus().setImage({ src: reader.result }).run();
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

  return (
    <div className="rich-toolbar">
      {/* Paragraph / Heading Style Select */}
      <select
        value={getCurrentHeadingStyle()}
        onChange={handleStyleChange}
        style={{
          border: '1px solid var(--border-color)',
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          borderRadius: '6px',
          padding: '2px 8px',
          fontSize: '12px',
          fontWeight: 500,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        <option value="title">Title</option>
        <option value="heading">Heading</option>
        <option value="subheading">Subheading</option>
        <option value="body">Body</option>
        <option value="code">Monospaced</option>
      </select>

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

      {/* Link */}
      <button
        className={`icon-btn ${editor.isActive('link') ? 'active' : ''}`}
        style={{ width: '28px', height: '28px' }}
        onClick={handleInsertLink}
        title="Insert Link"
      >
        <LinkIcon size={14} />
      </button>

      {/* Image attachment */}
      <button
        className="icon-btn"
        style={{ width: '28px', height: '28px' }}
        onClick={() => fileInputRef.current?.click()}
        title="Insert Photo / Image"
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
