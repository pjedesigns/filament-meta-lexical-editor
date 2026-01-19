/**
 * Collapsible Section Plugin for Lexical
 * Creates expandable/collapsible content sections (accordion-style)
 */

import {
    $applyNodeReplacement,
    $createParagraphNode,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_EDITOR,
    createCommand,
    DecoratorNode,
    ElementNode,
    DOMConversionMap,
    DOMExportOutput,
    EditorConfig,
    LexicalCommand,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedElementNode,
    SerializedLexicalNode,
    Spread,
} from 'lexical';

import { mergeRegister } from '@lexical/utils';

export interface InsertCollapsiblePayload {
    title?: string;
    isOpen?: boolean;
}

export const INSERT_COLLAPSIBLE_COMMAND: LexicalCommand<InsertCollapsiblePayload> =
    createCommand('INSERT_COLLAPSIBLE_COMMAND');

export const TOGGLE_COLLAPSIBLE_COMMAND: LexicalCommand<NodeKey> =
    createCommand('TOGGLE_COLLAPSIBLE_COMMAND');

export type SerializedCollapsibleContainerNode = Spread<
    {
        isOpen: boolean;
    },
    SerializedElementNode
>;

export type SerializedCollapsibleTitleNode = Spread<
    {
        title: string;
    },
    SerializedLexicalNode
>;

export type SerializedCollapsibleContentNode = SerializedElementNode;

export class CollapsibleContainerNode extends ElementNode {
    __isOpen: boolean;

    static getType(): string {
        return 'collapsible-container';
    }

    static clone(node: CollapsibleContainerNode): CollapsibleContainerNode {
        return new CollapsibleContainerNode(node.__isOpen, node.__key);
    }

    constructor(isOpen: boolean = true, key?: NodeKey) {
        super(key);
        this.__isOpen = isOpen;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = document.createElement('details');
        dom.className = 'lexical-collapsible-container';
        dom.open = this.__isOpen;
        dom.style.cssText = `
            margin: 16px 0;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        `;

        // Handle toggle events
        dom.addEventListener('toggle', () => {
            // The DOM state is the source of truth for open/closed
        });

        return dom;
    }

    updateDOM(prevNode: CollapsibleContainerNode, dom: HTMLDetailsElement): boolean {
        if (prevNode.__isOpen !== this.__isOpen) {
            dom.open = this.__isOpen;
        }
        return false;
    }

    static importJSON(serializedNode: SerializedCollapsibleContainerNode): CollapsibleContainerNode {
        return $createCollapsibleContainerNode(serializedNode.isOpen);
    }

    exportJSON(): SerializedCollapsibleContainerNode {
        return {
            ...super.exportJSON(),
            isOpen: this.__isOpen,
            type: 'collapsible-container',
            version: 1,
        };
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('details');
        element.className = 'lexical-collapsible-container';
        element.open = this.__isOpen;
        element.style.cssText = `
            margin: 16px 0;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        `;
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            details: (domNode: HTMLElement) => {
                if (domNode.classList.contains('lexical-collapsible-container')) {
                    return {
                        conversion: () => ({
                            node: $createCollapsibleContainerNode((domNode as HTMLDetailsElement).open),
                        }),
                        priority: 1,
                    };
                }
                return null;
            },
        };
    }

    getIsOpen(): boolean {
        return this.__isOpen;
    }

    setIsOpen(isOpen: boolean): void {
        const self = this.getWritable();
        self.__isOpen = isOpen;
    }

    toggleOpen(): void {
        this.setIsOpen(!this.__isOpen);
    }

    isShadowRoot(): boolean {
        return false;
    }
}

export class CollapsibleTitleNode extends DecoratorNode<null> {
    __title: string;

    static getType(): string {
        return 'collapsible-title';
    }

    static clone(node: CollapsibleTitleNode): CollapsibleTitleNode {
        return new CollapsibleTitleNode(node.__title, node.__key);
    }

    constructor(title: string = 'Click to expand', key?: NodeKey) {
        super(key);
        this.__title = title;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = document.createElement('summary');
        dom.className = 'lexical-collapsible-title';
        dom.textContent = this.__title;
        dom.style.cssText = `
            padding: 12px 16px;
            background: #f9fafb;
            cursor: pointer;
            font-weight: 600;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 8px;
            list-style: none;
        `;

        // Add custom arrow indicator
        const arrow = document.createElement('span');
        arrow.className = 'lexical-collapsible-arrow';
        arrow.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        `;
        arrow.style.cssText = `
            transition: transform 0.2s ease;
            display: flex;
        `;
        dom.insertBefore(arrow, dom.firstChild);

        // Rotate arrow when open
        const parent = dom.closest('details');
        if (parent) {
            const updateArrow = () => {
                arrow.style.transform = (parent as HTMLDetailsElement).open ? 'rotate(90deg)' : 'rotate(0deg)';
            };
            parent.addEventListener('toggle', updateArrow);
            updateArrow();
        }

        return dom;
    }

    updateDOM(prevNode: CollapsibleTitleNode, dom: HTMLElement): boolean {
        if (prevNode.__title !== this.__title) {
            // Update text content but preserve the arrow
            const arrow = dom.querySelector('.lexical-collapsible-arrow');
            dom.textContent = this.__title;
            if (arrow) {
                dom.insertBefore(arrow, dom.firstChild);
            }
        }
        return false;
    }

    static importJSON(serializedNode: SerializedCollapsibleTitleNode): CollapsibleTitleNode {
        return $createCollapsibleTitleNode(serializedNode.title);
    }

    exportJSON(): SerializedCollapsibleTitleNode {
        return {
            title: this.__title,
            type: 'collapsible-title',
            version: 1,
        };
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('summary');
        element.className = 'lexical-collapsible-title';
        element.textContent = this.__title;
        element.style.cssText = `
            padding: 12px 16px;
            background: #f9fafb;
            cursor: pointer;
            font-weight: 600;
        `;
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            summary: (domNode: HTMLElement) => {
                if (domNode.classList.contains('lexical-collapsible-title')) {
                    return {
                        conversion: () => ({
                            node: $createCollapsibleTitleNode(domNode.textContent || 'Click to expand'),
                        }),
                        priority: 1,
                    };
                }
                return null;
            },
        };
    }

    getTitle(): string {
        return this.__title;
    }

    setTitle(title: string): void {
        const self = this.getWritable();
        self.__title = title;
    }

    decorate(): null {
        return null;
    }

    isInline(): boolean {
        return false;
    }
}

export class CollapsibleContentNode extends ElementNode {
    static getType(): string {
        return 'collapsible-content';
    }

    static clone(node: CollapsibleContentNode): CollapsibleContentNode {
        return new CollapsibleContentNode(node.__key);
    }

    createDOM(): HTMLElement {
        const dom = document.createElement('div');
        dom.className = 'lexical-collapsible-content';
        dom.style.cssText = `
            padding: 16px;
            border-top: 1px solid #e5e7eb;
        `;
        return dom;
    }

    updateDOM(): boolean {
        return false;
    }

    static importJSON(serializedNode: SerializedCollapsibleContentNode): CollapsibleContentNode {
        return $createCollapsibleContentNode();
    }

    exportJSON(): SerializedCollapsibleContentNode {
        return {
            ...super.exportJSON(),
            type: 'collapsible-content',
            version: 1,
        };
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('div');
        element.className = 'lexical-collapsible-content';
        element.style.cssText = `padding: 16px;`;
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            div: (domNode: HTMLElement) => {
                if (domNode.classList.contains('lexical-collapsible-content')) {
                    return {
                        conversion: () => ({
                            node: $createCollapsibleContentNode(),
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

export function $createCollapsibleContainerNode(isOpen: boolean = true): CollapsibleContainerNode {
    return $applyNodeReplacement(new CollapsibleContainerNode(isOpen));
}

export function $createCollapsibleTitleNode(title: string = 'Click to expand'): CollapsibleTitleNode {
    return $applyNodeReplacement(new CollapsibleTitleNode(title));
}

export function $createCollapsibleContentNode(): CollapsibleContentNode {
    return $applyNodeReplacement(new CollapsibleContentNode());
}

export function $isCollapsibleContainerNode(node: LexicalNode | null | undefined): node is CollapsibleContainerNode {
    return node instanceof CollapsibleContainerNode;
}

export function $isCollapsibleTitleNode(node: LexicalNode | null | undefined): node is CollapsibleTitleNode {
    return node instanceof CollapsibleTitleNode;
}

export function $isCollapsibleContentNode(node: LexicalNode | null | undefined): node is CollapsibleContentNode {
    return node instanceof CollapsibleContentNode;
}

export function registerCollapsiblePlugin(editor: LexicalEditor): () => void {
    const removeInsertCollapsibleCommand = editor.registerCommand(
        INSERT_COLLAPSIBLE_COMMAND,
        (payload: InsertCollapsiblePayload) => {
            const { title = 'Click to expand', isOpen = true } = payload;

            editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) {
                    return;
                }

                const container = $createCollapsibleContainerNode(isOpen);
                const titleNode = $createCollapsibleTitleNode(title);
                const contentNode = $createCollapsibleContentNode();
                const paragraph = $createParagraphNode();

                contentNode.append(paragraph);
                container.append(titleNode);
                container.append(contentNode);

                selection.insertNodes([container]);

                // Focus the content area
                paragraph.select();
            });

            return true;
        },
        COMMAND_PRIORITY_EDITOR,
    );

    const removeToggleCollapsibleCommand = editor.registerCommand(
        TOGGLE_COLLAPSIBLE_COMMAND,
        (nodeKey: NodeKey) => {
            editor.update(() => {
                const node = editor.getEditorState()._nodeMap.get(nodeKey);
                if ($isCollapsibleContainerNode(node)) {
                    node.toggleOpen();
                }
            });
            return true;
        },
        COMMAND_PRIORITY_EDITOR,
    );

    return mergeRegister(
        removeInsertCollapsibleCommand,
        removeToggleCollapsibleCommand,
    );
}
