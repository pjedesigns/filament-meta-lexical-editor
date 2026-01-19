/**
 * Layout Plugin for Lexical
 * Provides column-based layouts (2-column, 3-column, etc.)
 */

import {
    $applyNodeReplacement,
    $createParagraphNode,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_EDITOR,
    createCommand,
    ElementNode,
    DOMConversionMap,
    DOMExportOutput,
    EditorConfig,
    LexicalCommand,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedElementNode,
    Spread,
} from 'lexical';

import { mergeRegister } from '@lexical/utils';

export type LayoutColumnCount = 2 | 3 | 4;

export interface InsertLayoutPayload {
    columns: LayoutColumnCount;
}

export const INSERT_LAYOUT_COMMAND: LexicalCommand<InsertLayoutPayload> =
    createCommand('INSERT_LAYOUT_COMMAND');

export type SerializedLayoutContainerNode = Spread<
    {
        columns: LayoutColumnCount;
    },
    SerializedElementNode
>;

export type SerializedLayoutItemNode = SerializedElementNode;

export class LayoutContainerNode extends ElementNode {
    __columns: LayoutColumnCount;

    static getType(): string {
        return 'layout-container';
    }

    static clone(node: LayoutContainerNode): LayoutContainerNode {
        return new LayoutContainerNode(node.__columns, node.__key);
    }

    constructor(columns: LayoutColumnCount = 2, key?: NodeKey) {
        super(key);
        this.__columns = columns;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = document.createElement('div');
        dom.className = `lexical-layout-container lexical-layout-${this.__columns}-col`;
        dom.setAttribute('data-columns', String(this.__columns));
        return dom;
    }

    updateDOM(prevNode: LayoutContainerNode, dom: HTMLElement): boolean {
        if (prevNode.__columns !== this.__columns) {
            dom.className = `lexical-layout-container lexical-layout-${this.__columns}-col`;
            dom.setAttribute('data-columns', String(this.__columns));
        }
        return false;
    }

    static importJSON(serializedNode: SerializedLayoutContainerNode): LayoutContainerNode {
        return $createLayoutContainerNode(serializedNode.columns);
    }

    exportJSON(): SerializedLayoutContainerNode {
        return {
            ...super.exportJSON(),
            columns: this.__columns,
            type: 'layout-container',
            version: 1,
        };
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('div');
        element.className = `lexical-layout-container lexical-layout-${this.__columns}-col`;
        element.setAttribute('data-columns', String(this.__columns));
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            div: (domNode: HTMLElement) => {
                if (domNode.classList.contains('lexical-layout-container')) {
                    const columns = parseInt(domNode.getAttribute('data-columns') || '2', 10) as LayoutColumnCount;
                    return {
                        conversion: () => ({
                            node: $createLayoutContainerNode(columns),
                        }),
                        priority: 1,
                    };
                }
                return null;
            },
        };
    }

    getColumns(): LayoutColumnCount {
        return this.__columns;
    }

    setColumns(columns: LayoutColumnCount): void {
        const self = this.getWritable();
        self.__columns = columns;
    }

    isShadowRoot(): boolean {
        return false;
    }
}

export class LayoutItemNode extends ElementNode {
    static getType(): string {
        return 'layout-item';
    }

    static clone(node: LayoutItemNode): LayoutItemNode {
        return new LayoutItemNode(node.__key);
    }

    createDOM(): HTMLElement {
        const dom = document.createElement('div');
        dom.className = 'lexical-layout-item';
        return dom;
    }

    updateDOM(): boolean {
        return false;
    }

    static importJSON(): LayoutItemNode {
        return $createLayoutItemNode();
    }

    exportJSON(): SerializedLayoutItemNode {
        return {
            ...super.exportJSON(),
            type: 'layout-item',
            version: 1,
        };
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('div');
        element.className = 'lexical-layout-item';
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            div: (domNode: HTMLElement) => {
                if (domNode.classList.contains('lexical-layout-item')) {
                    return {
                        conversion: () => ({
                            node: $createLayoutItemNode(),
                        }),
                        priority: 1,
                    };
                }
                return null;
            },
        };
    }

    isShadowRoot(): boolean {
        return false;
    }
}

export function $createLayoutContainerNode(columns: LayoutColumnCount = 2): LayoutContainerNode {
    return $applyNodeReplacement(new LayoutContainerNode(columns));
}

export function $createLayoutItemNode(): LayoutItemNode {
    return $applyNodeReplacement(new LayoutItemNode());
}

export function $isLayoutContainerNode(node: LexicalNode | null | undefined): node is LayoutContainerNode {
    return node instanceof LayoutContainerNode;
}

export function $isLayoutItemNode(node: LexicalNode | null | undefined): node is LayoutItemNode {
    return node instanceof LayoutItemNode;
}

export function registerLayoutPlugin(editor: LexicalEditor): () => void {
    const removeInsertLayoutCommand = editor.registerCommand(
        INSERT_LAYOUT_COMMAND,
        (payload: InsertLayoutPayload) => {
            const { columns } = payload;

            editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) {
                    return;
                }

                const layoutContainer = $createLayoutContainerNode(columns);

                // Create layout items with paragraph placeholders
                for (let i = 0; i < columns; i++) {
                    const layoutItem = $createLayoutItemNode();
                    const paragraph = $createParagraphNode();
                    layoutItem.append(paragraph);
                    layoutContainer.append(layoutItem);
                }

                selection.insertNodes([layoutContainer]);
            });

            return true;
        },
        COMMAND_PRIORITY_EDITOR,
    );

    return mergeRegister(removeInsertLayoutCommand);
}
