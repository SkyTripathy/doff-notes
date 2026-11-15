import React, { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Play, ExternalLink, Copy, Check, Trash2, Globe, Video } from 'lucide-react';

export function extractYouTubeVideoId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const match = rawUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export function extractDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'link';
  }
}

const LinkCardComponent: React.FC<NodeViewProps> = ({
  node,
  deleteNode,
  selected,
}) => {
  const { url, videoId, title, domain } = node.attrs;
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const cleanDomain = domain || extractDomain(url);
  const cleanTitle = title || url;
  const isYouTube = !!videoId || cleanDomain.includes('youtube.com') || cleanDomain.includes('youtu.be');
  const effectiveVideoId = videoId || extractYouTubeVideoId(url);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <NodeViewWrapper
      className="link-card-node-wrapper"
      style={{
        margin: '18px 0',
        userSelect: 'none',
        display: 'block',
      }}
    >
      <div
        className="apple-link-card-container"
        style={{
          border: selected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-window)',
          boxShadow: 'var(--shadow-sm)',
          maxWidth: '680px',
          transition: 'all 0.15s ease',
        }}
      >
        {/* YouTube Video Card */}
        {isYouTube && effectiveVideoId ? (
          <div>
            {isPlaying ? (
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#000' }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${effectiveVideoId}?autoplay=1`}
                  title={cleanTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </div>
            ) : (
              <div
                onClick={() => setIsPlaying(true)}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '240px',
                  backgroundColor: '#111',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!imageError ? (
                  <img
                    src={`https://img.youtube.com/vi/${effectiveVideoId}/hqdefault.jpg`}
                    alt={cleanTitle}
                    onError={() => setImageError(true)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#a1a1aa',
                    }}
                  >
                    <Video size={36} />
                    <span style={{ fontSize: '13px' }}>YouTube Video</span>
                  </div>
                )}

                {/* Play Button Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.92)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <Play size={24} fill="#ffffff" color="#ffffff" style={{ marginLeft: '3px' }} />
                </div>

                {/* Top Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span>YouTube</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-color)',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={cleanTitle}
                >
                  {cleanTitle}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  youtube.com
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-drag">
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="icon-btn"
                  title="Open in Browser"
                  style={{ width: '28px', height: '28px' }}
                >
                  <ExternalLink size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="icon-btn"
                  title="Copy URL"
                  style={{ width: '28px', height: '28px' }}
                >
                  {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => deleteNode()}
                  className="icon-btn"
                  title="Delete Card"
                  style={{ width: '28px', height: '28px', color: '#ef4444' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* General Web Link Bookmark Card */
          <div
            style={{
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(212, 155, 41, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                flexShrink: 0,
              }}
            >
              <Globe size={20} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cleanTitle}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--accent)',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cleanDomain}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-drag">
              <button
                type="button"
                onClick={handleOpenExternal}
                className="icon-btn"
                title="Open in Browser"
                style={{ width: '28px', height: '28px' }}
              >
                <ExternalLink size={14} />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="icon-btn"
                title="Copy URL"
                style={{ width: '28px', height: '28px' }}
              >
                {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
              </button>
              <button
                type="button"
                onClick={() => deleteNode()}
                className="icon-btn"
                title="Delete Card"
                style={{ width: '28px', height: '28px', color: '#ef4444' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const LinkCard = Node.create({
  name: 'linkCard',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-url') || '',
        renderHTML: (attributes) => ({ 'data-url': attributes.url }),
      },
      videoId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-video-id') || null,
        renderHTML: (attributes) => ({ 'data-video-id': attributes.videoId }),
      },
      title: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-title') || '',
        renderHTML: (attributes) => ({ 'data-title': attributes.title }),
      },
      domain: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-domain') || '',
        renderHTML: (attributes) => ({ 'data-domain': attributes.domain }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-link-card]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-link-card': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkCardComponent);
  },
});
