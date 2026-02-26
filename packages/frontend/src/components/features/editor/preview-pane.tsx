import { useState, useEffect, useRef } from 'react';
import { renderMarkdown } from '@/lib/markdown';

interface PreviewPaneProps {
  content: string;
}

export function PreviewPane({ content }: PreviewPaneProps) {
  const [html, setHtml] = useState('');
  const renderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Debounce rendering for performance
    if (renderTimer.current) clearTimeout(renderTimer.current);
    renderTimer.current = setTimeout(async () => {
      const rendered = await renderMarkdown(content);
      setHtml(rendered);
    }, 150);

    return () => {
      if (renderTimer.current) clearTimeout(renderTimer.current);
    };
  }, [content]);

  return (
    <div className="bg-void-900 h-full overflow-auto p-6">
      <div className="prose-void max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
