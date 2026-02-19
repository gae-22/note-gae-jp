import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CodeBlockComponent } from '../components/CodeBlockComponent';
import { common, createLowlight } from 'lowlight';

// Create a lowlight instance with common languages
const lowlight = createLowlight(common);

// Create a proxy to handle "language:filename" format
const lowlightProxy = new Proxy(lowlight, {
    get(target, prop, receiver) {
        // Intercept 'highlight' to strip filename
        if (prop === 'highlight') {
            return (language: string, value: string, options?: any) => {
                const lang = language.split(':')[0]; // "ts:index.ts" -> "ts"
                // Check if language exists to avoid error, fallback to plaintext if not found
                if (!target.listLanguages().includes(lang)) {
                    // Fallback or let simple highlight handle it (usually throws or returns plaintext)
                    // lowlight.highlight throws if lang is unknown.
                    // We should check alias too? listLanguages includes aliases? No.
                    // But highlight() works with aliases.
                    // Safe bet: try/catch or let it bubble if we are sure.
                    // Tiptap checks listLanguages before calling highlight usually.
                }
                try {
                    return target.highlight(lang, value, options);
                } catch (e) {
                    // Fallback
                    return target.highlightAuto(value, options);
                }
            };
        }
        // Intercept 'listLanguages' to allow our validation hack
        // Tiptap checks: !lowlight.listLanguages().includes(language) -> don't highlight
        // We need to return an array that returns true for "ts:filename" if "ts" is supported.
        if (prop === 'listLanguages') {
            return () => {
                const languages = target.listLanguages();
                return new Proxy(languages, {
                    get(arrTarget, arrProp) {
                        if (arrProp === 'includes') {
                            return (searchElement: string) => {
                                const lang = searchElement.split(':')[0];
                                return arrTarget.includes(lang);
                            };
                        }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        return Reflect.get(arrTarget, arrProp as any);
                    },
                });
            };
        }
        return Reflect.get(target, prop, receiver);
    },
});

export const CustomCodeBlock = CodeBlockLowlight.extend({
    addNodeView() {
        return ReactNodeViewRenderer(CodeBlockComponent);
    },
}).configure({
    lowlight: lowlightProxy,
});
