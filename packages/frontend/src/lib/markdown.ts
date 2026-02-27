import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Phase 1 (runs BEFORE rehype-highlight):
 * Parses "language-python:main.py" → fixes class to "language-python"
 * and stores the filename in a data attribute for Phase 2.
 */
function rehypeParseFilename() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (
        node.tagName !== 'pre' ||
        !node.children[0] ||
        (node.children[0] as Element).tagName !== 'code'
      ) return;

      const codeEl = node.children[0] as Element;
      const classNames = (codeEl.properties?.className as string[]) ?? [];

      for (let i = 0; i < classNames.length; i++) {
        const cls = classNames[i];
        if (cls.startsWith('language-')) {
          const langPart = cls.slice('language-'.length);
          const colonIdx = langPart.indexOf(':');
          if (colonIdx > 0) {
            const language = langPart.slice(0, colonIdx);
            const filename = langPart.slice(colonIdx + 1);
            // Fix class so highlight.js recognizes the language
            classNames[i] = `language-${language}`;
            // Store filename + language for Phase 2
            codeEl.properties = codeEl.properties || {};
            codeEl.properties.dataFilename = filename;
            codeEl.properties.dataLang = language;
          }
          break;
        }
      }
    });
  };
}

/**
 * Phase 2 (runs AFTER rehype-highlight):
 * Wraps <pre> blocks in a Zenn-style container with header.
 */
function rehypeWrapCodeBlocks() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (
        node.tagName !== 'pre' ||
        !node.children[0] ||
        (node.children[0] as Element).tagName !== 'code'
      ) return;

      const codeEl = node.children[0] as Element;
      const classNames = (codeEl.properties?.className as string[]) ?? [];

      // Get filename from data attribute (set in Phase 1)
      const filename = (codeEl.properties?.dataFilename as string) || '';
      let language = (codeEl.properties?.dataLang as string) || '';

      // If no language from Phase 1, extract from className
      if (!language) {
        for (const cls of classNames) {
          if (cls.startsWith('language-')) {
            language = cls.slice('language-'.length);
            break;
          }
        }
      }

      // Clean up temp data attributes
      if (codeEl.properties?.dataFilename) delete codeEl.properties.dataFilename;
      if (codeEl.properties?.dataLang) delete codeEl.properties.dataLang;

      // Only wrap if we have language or filename
      if (!(language || filename) || !parent || typeof index !== 'number') return;

      const headerChildren: Element[] = [];

      if (filename) {
        headerChildren.push({
          type: 'element',
          tagName: 'span',
          properties: { className: ['code-block-filename'] },
          children: [{ type: 'text', value: filename }],
        });
      }

      if (language) {
        headerChildren.push({
          type: 'element',
          tagName: 'span',
          properties: { className: ['code-block-lang'] },
          children: [{ type: 'text', value: language }],
        });
      }

      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['code-block-container'],
          dataFilename: filename || undefined,
          dataLang: language || undefined,
        },
        children: [
          {
            type: 'element' as const,
            tagName: 'div',
            properties: { className: ['code-block-header'] },
            children: headerChildren,
          } as Element,
          node,
        ],
      };

      parent.children[index] = wrapper;
    });
  };
}

// Custom sanitize schema that allows highlight.js classes and code block wrappers
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code || []),
      ['className', /^language-/, /^hljs/, 'hljs'],
    ],
    span: [
      ...(defaultSchema.attributes?.span || []),
      ['className', /^hljs-/, 'code-block-filename', 'code-block-lang'],
    ],
    div: [
      ...(defaultSchema.attributes?.div || []),
      ['className', 'code-block-container', 'code-block-header', 'code-block-filename', 'code-block-lang'],
      'dataFilename',
      'dataLang',
    ],
  },
  tagNames: [...(defaultSchema.tagNames || []), 'div', 'span'],
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeParseFilename)       // Phase 1: fix "language-py:file" → "language-py" + store filename
  .use(rehypeHighlight, { detect: true })  // Now highlight.js sees the correct language class
  .use(rehypeWrapCodeBlocks)      // Phase 2: wrap with Zenn-style header
  // @ts-expect-error rehype-sanitize types don't accept spread schemas with RegExp patterns
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeStringify);

export async function renderMarkdown(content: string): Promise<string> {
  const result = await processor.process(content);
  return String(result);
}
