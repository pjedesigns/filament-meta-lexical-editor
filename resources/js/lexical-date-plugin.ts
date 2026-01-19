/**
 * Date Plugin for Lexical
 * Inserts formatted dates that can be updated
 */

import {
    $applyNodeReplacement,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_EDITOR,
    createCommand,
    DecoratorNode,
    DOMConversionMap,
    DOMExportOutput,
    EditorConfig,
    LexicalCommand,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from 'lexical';

import { mergeRegister } from '@lexical/utils';

export type DateFormat = 'short' | 'medium' | 'long' | 'full' | 'relative' | 'iso';

export interface InsertDatePayload {
    date: string; // ISO date string
    format?: DateFormat;
    locale?: string;
}

export interface UpdateDatePayload {
    nodeKey: NodeKey;
    date?: string;
    format?: DateFormat;
}

export const INSERT_DATE_COMMAND: LexicalCommand<InsertDatePayload> =
    createCommand('INSERT_DATE_COMMAND');

export const UPDATE_DATE_COMMAND: LexicalCommand<UpdateDatePayload> =
    createCommand('UPDATE_DATE_COMMAND');

export type SerializedDateNode = Spread<
    {
        date: string;
        format: DateFormat;
        locale: string;
    },
    SerializedLexicalNode
>;

function formatDate(dateString: string, format: DateFormat, locale: string = 'en-US'): string {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString; // Return original string if invalid date
    }

    switch (format) {
        case 'short':
            return date.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
            });
        case 'medium':
            return date.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        case 'long':
            return date.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        case 'full':
            return date.toLocaleDateString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        case 'relative':
            return getRelativeTime(date, locale);
        case 'iso':
            return date.toISOString().split('T')[0];
        default:
            return date.toLocaleDateString(locale);
    }
}

function getRelativeTime(date: Date, locale: string = 'en-US'): string {
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffInDays) < 1) {
        return rtf.format(0, 'day'); // Today
    } else if (Math.abs(diffInDays) < 7) {
        return rtf.format(diffInDays, 'day');
    } else if (Math.abs(diffInDays) < 30) {
        return rtf.format(Math.round(diffInDays / 7), 'week');
    } else if (Math.abs(diffInDays) < 365) {
        return rtf.format(Math.round(diffInDays / 30), 'month');
    } else {
        return rtf.format(Math.round(diffInDays / 365), 'year');
    }
}

export class DateNode extends DecoratorNode<null> {
    __date: string;
    __format: DateFormat;
    __locale: string;

    static getType(): string {
        return 'date';
    }

    static clone(node: DateNode): DateNode {
        return new DateNode(node.__date, node.__format, node.__locale, node.__key);
    }

    constructor(
        date: string = new Date().toISOString(),
        format: DateFormat = 'medium',
        locale: string = 'en-US',
        key?: NodeKey
    ) {
        super(key);
        this.__date = date;
        this.__format = format;
        this.__locale = locale;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        span.className = 'lexical-date';
        span.textContent = formatDate(this.__date, this.__format, this.__locale);
        span.setAttribute('data-date', this.__date);
        span.setAttribute('data-format', this.__format);
        span.setAttribute('data-locale', this.__locale);
        span.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            background: #f3f4f6;
            border-radius: 4px;
            font-size: 0.9em;
            color: #374151;
            cursor: default;
        `;

        // Add calendar icon
        const icon = document.createElement('span');
        icon.className = 'lexical-date-icon';
        icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>`;
        icon.style.cssText = 'display: flex; opacity: 0.6;';

        span.insertBefore(icon, span.firstChild);

        return span;
    }

    updateDOM(prevNode: DateNode, dom: HTMLElement): boolean {
        if (
            prevNode.__date !== this.__date ||
            prevNode.__format !== this.__format ||
            prevNode.__locale !== this.__locale
        ) {
            // Update the text content (preserve the icon)
            const icon = dom.querySelector('.lexical-date-icon');
            const textContent = formatDate(this.__date, this.__format, this.__locale);
            dom.textContent = '';
            if (icon) {
                dom.appendChild(icon);
            }
            dom.appendChild(document.createTextNode(textContent));
            dom.setAttribute('data-date', this.__date);
            dom.setAttribute('data-format', this.__format);
            dom.setAttribute('data-locale', this.__locale);
        }
        return false;
    }

    static importJSON(serializedNode: SerializedDateNode): DateNode {
        return $createDateNode(
            serializedNode.date,
            serializedNode.format,
            serializedNode.locale
        );
    }

    exportJSON(): SerializedDateNode {
        return {
            date: this.__date,
            format: this.__format,
            locale: this.__locale,
            type: 'date',
            version: 1,
        };
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('time');
        element.className = 'lexical-date';
        element.setAttribute('datetime', this.__date);
        element.setAttribute('data-format', this.__format);
        element.setAttribute('data-locale', this.__locale);
        element.textContent = formatDate(this.__date, this.__format, this.__locale);
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            time: (domNode: HTMLElement) => {
                if (domNode.classList.contains('lexical-date')) {
                    const datetime = domNode.getAttribute('datetime') || new Date().toISOString();
                    const format = (domNode.getAttribute('data-format') || 'medium') as DateFormat;
                    const locale = domNode.getAttribute('data-locale') || 'en-US';
                    return {
                        conversion: () => ({
                            node: $createDateNode(datetime, format, locale),
                        }),
                        priority: 1,
                    };
                }
                return null;
            },
            span: (domNode: HTMLElement) => {
                if (domNode.classList.contains('lexical-date')) {
                    const datetime = domNode.getAttribute('data-date') || new Date().toISOString();
                    const format = (domNode.getAttribute('data-format') || 'medium') as DateFormat;
                    const locale = domNode.getAttribute('data-locale') || 'en-US';
                    return {
                        conversion: () => ({
                            node: $createDateNode(datetime, format, locale),
                        }),
                        priority: 1,
                    };
                }
                return null;
            },
        };
    }

    getDate(): string {
        return this.__date;
    }

    getFormat(): DateFormat {
        return this.__format;
    }

    getLocale(): string {
        return this.__locale;
    }

    setDate(date: string): void {
        const self = this.getWritable();
        self.__date = date;
    }

    setFormat(format: DateFormat): void {
        const self = this.getWritable();
        self.__format = format;
    }

    setLocale(locale: string): void {
        const self = this.getWritable();
        self.__locale = locale;
    }

    getFormattedDate(): string {
        return formatDate(this.__date, this.__format, this.__locale);
    }

    decorate(): null {
        return null;
    }

    isInline(): boolean {
        return true;
    }
}

export function $createDateNode(
    date: string = new Date().toISOString(),
    format: DateFormat = 'medium',
    locale: string = 'en-US'
): DateNode {
    return $applyNodeReplacement(new DateNode(date, format, locale));
}

export function $isDateNode(node: LexicalNode | null | undefined): node is DateNode {
    return node instanceof DateNode;
}

export function registerDatePlugin(editor: LexicalEditor): () => void {
    const removeInsertDateCommand = editor.registerCommand(
        INSERT_DATE_COMMAND,
        (payload: InsertDatePayload) => {
            const { date, format = 'medium', locale = 'en-US' } = payload;

            editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) {
                    return;
                }

                const dateNode = $createDateNode(date, format, locale);
                selection.insertNodes([dateNode]);
            });

            return true;
        },
        COMMAND_PRIORITY_EDITOR,
    );

    const removeUpdateDateCommand = editor.registerCommand(
        UPDATE_DATE_COMMAND,
        (payload: UpdateDatePayload) => {
            const { nodeKey, date, format } = payload;

            editor.update(() => {
                const node = editor.getEditorState()._nodeMap.get(nodeKey);
                if ($isDateNode(node)) {
                    if (date !== undefined) {
                        node.setDate(date);
                    }
                    if (format !== undefined) {
                        node.setFormat(format);
                    }
                }
            });

            return true;
        },
        COMMAND_PRIORITY_EDITOR,
    );

    return mergeRegister(
        removeInsertDateCommand,
        removeUpdateDateCommand,
    );
}

export { formatDate, getRelativeTime };
