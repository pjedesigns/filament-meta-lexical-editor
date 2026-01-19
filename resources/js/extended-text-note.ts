import {
    $applyNodeReplacement,
    $isTextNode,
    DOMConversion,
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    NodeKey,
    TextNode,
    SerializedTextNode,
    LexicalNode,
    LexicalEditor,
} from 'lexical';

export class ExtendedTextNode extends TextNode {
    constructor(text: string, key?: NodeKey) {
        super(text, key);
    }

    static getType(): string {
        return 'extended-text';
    }

    static clone(node: ExtendedTextNode): ExtendedTextNode {
        const clone = new ExtendedTextNode(node.__text, node.__key);
        clone.__format = node.__format;
        clone.__style = node.__style;
        clone.__mode = node.__mode;
        clone.__detail = node.__detail;
        return clone;
    }

    static importDOM(): DOMConversionMap | null {
        const importers = TextNode.importDOM();
        return {
            ...importers,
            code: () => ({
                conversion: patchStyleConversion(importers?.code),
                priority: 1
            }),
            em: () => ({
                conversion: patchStyleConversion(importers?.em),
                priority: 1
            }),
            span: () => ({
                conversion: patchStyleConversion(importers?.span),
                priority: 1
            }),
            strong: () => ({
                conversion: patchStyleConversion(importers?.strong),
                priority: 1
            }),
            sub: () => ({
                conversion: patchStyleConversion(importers?.sub),
                priority: 1
            }),
            sup: () => ({
                conversion: patchStyleConversion(importers?.sup),
                priority: 1
            }),
        };
    }

    static importJSON(serializedNode: SerializedTextNode): TextNode {
        const node = $createExtendedTextNode(serializedNode.text);
        node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }

    isSimpleText() {
        return this.__type === 'extended-text' && this.__mode === 0;
    }

    exportJSON(): SerializedTextNode {
        return {
            ...super.exportJSON(),
            type: 'extended-text',
        };
    }

    exportDOM(editor: LexicalEditor): DOMExportOutput {
        const { element } = super.exportDOM(editor);
        if (element !== null && element instanceof HTMLElement) {
            // Apply inline styles from the node's __style property
            const style = this.getStyle();
            if (style) {
                element.setAttribute('style', style);
            }

            // Apply format-based styling (bold, italic, etc.)
            const format = this.getFormat();
            if (format !== 0) {
                // The parent class handles creating the appropriate element (strong, em, etc.)
                // but we need to ensure styles are preserved on wrapped elements
                if (style && !element.getAttribute('style')) {
                    element.setAttribute('style', style);
                }
            }
        }
        return { element };
    }
}

export function $createExtendedTextNode(text: string = ''): ExtendedTextNode {
    return $applyNodeReplacement(new ExtendedTextNode(text));
}

export function $isExtendedTextNode(node: LexicalNode | null | undefined): node is ExtendedTextNode {
    return node instanceof ExtendedTextNode;
}

// Lexical format flags (from lexical source)
const IS_BOLD = 1;
const IS_ITALIC = 1 << 1;
const IS_STRIKETHROUGH = 1 << 2;
const IS_UNDERLINE = 1 << 3;
const IS_CODE = 1 << 4;
const IS_SUBSCRIPT = 1 << 5;
const IS_SUPERSCRIPT = 1 << 6;

// Map of Lexical CSS classes to format flags
const FORMAT_CLASS_MAP: Record<string, number> = {
    'lexical__textBold': IS_BOLD,
    'lexical__textItalic': IS_ITALIC,
    'lexical__textStrikethrough': IS_STRIKETHROUGH,
    'lexical__textUnderline': IS_UNDERLINE,
    'lexical__textCode': IS_CODE,
    'lexical__textSubscript': IS_SUBSCRIPT,
    'lexical__textSuperscript': IS_SUPERSCRIPT,
};

function patchStyleConversion(
    originalDOMConverter?: (node: HTMLElement) => DOMConversion | null
): (node: HTMLElement) => DOMConversionOutput | null {
    return (node) => {
        const original = originalDOMConverter?.(node);
        if (!original) {
            return null;
        }
        const originalOutput = original.conversion(node);

        if (!originalOutput) {
            return originalOutput;
        }

        const backgroundColor = node.style.backgroundColor;
        const color = node.style.color;
        const fontFamily = node.style.fontFamily;
        const fontWeight = node.style.fontWeight;
        const fontSize = node.style.fontSize;
        const textDecoration = node.style.textDecoration;

        // Detect format from Lexical CSS classes
        let formatFromClass = 0;
        if (node.classList) {
            for (const className of Array.from(node.classList)) {
                if (FORMAT_CLASS_MAP[className]) {
                    formatFromClass |= FORMAT_CLASS_MAP[className];
                }
            }
        }

        return {
            ...originalOutput,
            forChild: (lexicalNode, parent) => {
                const originalForChild = originalOutput?.forChild ?? ((x) => x);
                const result = originalForChild(lexicalNode, parent);
                if ($isTextNode(result)) {
                    // Apply styles
                    const style = [
                        backgroundColor ? `background-color: ${backgroundColor}` : null,
                        color ? `color: ${color}` : null,
                        fontFamily ? `font-family: ${fontFamily}` : null,
                        fontWeight ? `font-weight: ${fontWeight}` : null,
                        fontSize ? `font-size: ${fontSize}` : null,
                        textDecoration ? `text-decoration: ${textDecoration}` : null,
                    ]
                        .filter((value) => value != null)
                        .join('; ');
                    if (style.length) {
                        result.setStyle(style);
                    }

                    // Apply format from Lexical CSS classes
                    if (formatFromClass !== 0) {
                        const currentFormat = result.getFormat();
                        result.setFormat(currentFormat | formatFromClass);
                    }
                }
                return result;
            }
        };
    };
}
