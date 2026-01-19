/**
 * Tweet/X Embed Plugin for Lexical
 * Embeds tweets from Twitter/X in the editor with width and alignment options
 */

import {
    $applyNodeReplacement,
    $getNodeByKey,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_EDITOR,
    COMMAND_PRIORITY_LOW,
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

export type TweetAlignment = 'left' | 'center' | 'right';

export interface InsertTweetPayload {
    tweetID: string;
    width?: string;
    alignment?: TweetAlignment;
}

export interface UpdateTweetPayload {
    nodeKey: NodeKey;
    width?: string;
    alignment?: TweetAlignment;
}

export const INSERT_TWEET_COMMAND: LexicalCommand<InsertTweetPayload> =
    createCommand('INSERT_TWEET_COMMAND');

export const UPDATE_TWEET_COMMAND: LexicalCommand<UpdateTweetPayload> =
    createCommand('UPDATE_TWEET_COMMAND');

export type SerializedTweetNode = Spread<
    {
        tweetID: string;
        width: string;
        alignment: TweetAlignment;
    },
    SerializedLexicalNode
>;

function extractTweetID(url: string): string | null {
    // Handle various Twitter/X URL formats
    const patterns = [
        /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
        /^(\d{10,})$/, // Direct tweet ID (at least 10 digits)
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

// Function to load Twitter widget script
function loadTwitterScript(): Promise<void> {
    return new Promise((resolve) => {
        if ((window as any).twttr) {
            resolve();
            return;
        }

        const existingScript = document.getElementById('twitter-wjs');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve());
            return;
        }

        const script = document.createElement('script');
        script.id = 'twitter-wjs';
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
    });
}

export class TweetNode extends DecoratorNode<null> {
    __tweetID: string;
    __width: string;
    __alignment: TweetAlignment;

    static getType(): string {
        return 'tweet';
    }

    static clone(node: TweetNode): TweetNode {
        return new TweetNode(node.__tweetID, node.__width, node.__alignment, node.__key);
    }

    constructor(tweetID: string, width: string = '550px', alignment: TweetAlignment = 'center', key?: NodeKey) {
        super(key);
        this.__tweetID = tweetID;
        this.__width = width;
        this.__alignment = alignment;
    }

    private getAlignmentStyle(): string {
        switch (this.__alignment) {
            case 'left':
                return 'justify-content: flex-start;';
            case 'right':
                return 'justify-content: flex-end;';
            case 'center':
            default:
                return 'justify-content: center;';
        }
    }

    private getTwitterAlign(): string {
        return this.__alignment;
    }

    createDOM(config: EditorConfig): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'lexical-tweet-wrapper';
        wrapper.style.cssText = `
            display: flex;
            ${this.getAlignmentStyle()}
            margin: 16px 0;
            min-height: 200px;
        `;
        wrapper.setAttribute('data-tweet-id', this.__tweetID);
        wrapper.setAttribute('data-tweet-width', this.__width);
        wrapper.setAttribute('data-tweet-alignment', this.__alignment);

        const container = document.createElement('div');
        container.className = 'lexical-tweet-container';
        container.style.cssText = `
            width: ${this.__width};
            max-width: 100%;
        `;

        // Create placeholder while loading
        const placeholder = document.createElement('div');
        placeholder.className = 'lexical-tweet-placeholder';
        placeholder.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 200px;
            background: #f7f9fa;
            border: 1px solid #e1e8ed;
            border-radius: 12px;
            color: #657786;
            font-size: 14px;
        `;
        placeholder.innerHTML = `
            <div style="text-align: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="margin: 0 auto 8px;">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <div>Loading tweet...</div>
            </div>
        `;
        container.appendChild(placeholder);

        // Load Twitter widget and render tweet
        const alignment = this.getTwitterAlign();
        const tweetID = this.__tweetID;
        loadTwitterScript().then(() => {
            if ((window as any).twttr && (window as any).twttr.widgets) {
                placeholder.remove();
                (window as any).twttr.widgets.createTweet(tweetID, container, {
                    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
                    align: alignment,
                });
            }
        });

        wrapper.appendChild(container);
        return wrapper;
    }

    updateDOM(prevNode: TweetNode, dom: HTMLElement): boolean {
        if (prevNode.__tweetID !== this.__tweetID) {
            return true; // Re-create DOM for different tweet
        }

        if (prevNode.__width !== this.__width) {
            const container = dom.querySelector('.lexical-tweet-container') as HTMLElement;
            if (container) {
                container.style.width = this.__width;
            }
            dom.setAttribute('data-tweet-width', this.__width);
        }

        if (prevNode.__alignment !== this.__alignment) {
            dom.style.justifyContent = this.__alignment === 'left' ? 'flex-start' :
                this.__alignment === 'right' ? 'flex-end' : 'center';
            dom.setAttribute('data-tweet-alignment', this.__alignment);
        }

        return false;
    }

    static importJSON(serializedNode: SerializedTweetNode): TweetNode {
        return $createTweetNode(
            serializedNode.tweetID,
            serializedNode.width || '550px',
            serializedNode.alignment || 'center'
        );
    }

    exportJSON(): SerializedTweetNode {
        return {
            tweetID: this.__tweetID,
            width: this.__width,
            alignment: this.__alignment,
            type: 'tweet',
            version: 1,
        };
    }

    exportDOM(): DOMExportOutput {
        const wrapper = document.createElement('div');
        wrapper.className = 'lexical-tweet-wrapper';
        wrapper.style.cssText = `
            display: flex;
            ${this.getAlignmentStyle()}
            margin: 16px 0;
        `;
        wrapper.setAttribute('data-tweet-id', this.__tweetID);
        wrapper.setAttribute('data-tweet-width', this.__width);
        wrapper.setAttribute('data-tweet-alignment', this.__alignment);

        const container = document.createElement('div');
        container.className = 'lexical-tweet-container';
        container.style.cssText = `width: ${this.__width}; max-width: 100%;`;

        // Create a blockquote that Twitter's embed script can process
        const blockquote = document.createElement('blockquote');
        blockquote.className = 'twitter-tweet';
        blockquote.setAttribute('data-conversation', 'none');
        blockquote.setAttribute('data-align', this.__alignment);

        const link = document.createElement('a');
        link.href = `https://twitter.com/x/status/${this.__tweetID}`;
        link.textContent = 'View Tweet';

        blockquote.appendChild(link);
        container.appendChild(blockquote);
        wrapper.appendChild(container);

        return { element: wrapper };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            div: (domNode: HTMLElement) => {
                if (domNode.classList.contains('lexical-tweet-wrapper')) {
                    const tweetID = domNode.getAttribute('data-tweet-id');
                    const width = domNode.getAttribute('data-tweet-width') || '550px';
                    const alignment = (domNode.getAttribute('data-tweet-alignment') || 'center') as TweetAlignment;
                    if (tweetID) {
                        return {
                            conversion: () => ({
                                node: $createTweetNode(tweetID, width, alignment),
                            }),
                            priority: 2,
                        };
                    }
                }
                // Legacy support for old container format
                if (domNode.classList.contains('lexical-tweet-container')) {
                    const tweetID = domNode.getAttribute('data-tweet-id');
                    if (tweetID) {
                        return {
                            conversion: () => ({
                                node: $createTweetNode(tweetID),
                            }),
                            priority: 1,
                        };
                    }
                }
                return null;
            },
            blockquote: (domNode: HTMLElement) => {
                if (domNode.classList.contains('twitter-tweet')) {
                    const link = domNode.querySelector('a[href*="twitter.com"], a[href*="x.com"]');
                    if (link) {
                        const href = link.getAttribute('href') || '';
                        const tweetID = extractTweetID(href);
                        if (tweetID) {
                            return {
                                conversion: () => ({
                                    node: $createTweetNode(tweetID),
                                }),
                                priority: 1,
                            };
                        }
                    }
                }
                return null;
            },
        };
    }

    getTweetID(): string {
        return this.__tweetID;
    }

    getWidth(): string {
        return this.__width;
    }

    getAlignment(): TweetAlignment {
        return this.__alignment;
    }

    setWidth(width: string): void {
        const self = this.getWritable();
        self.__width = width;
    }

    setAlignment(alignment: TweetAlignment): void {
        const self = this.getWritable();
        self.__alignment = alignment;
    }

    decorate(): null {
        return null;
    }

    isInline(): boolean {
        return false;
    }

    canInsertTextBefore(): boolean {
        return false;
    }

    canInsertTextAfter(): boolean {
        return false;
    }
}

export function $createTweetNode(
    tweetID: string,
    width: string = '550px',
    alignment: TweetAlignment = 'center'
): TweetNode {
    return $applyNodeReplacement(new TweetNode(tweetID, width, alignment));
}

export function $isTweetNode(node: LexicalNode | null | undefined): node is TweetNode {
    return node instanceof TweetNode;
}

export function registerTweetPlugin(editor: LexicalEditor): () => void {
    const removeInsertTweetCommand = editor.registerCommand(
        INSERT_TWEET_COMMAND,
        (payload: InsertTweetPayload) => {
            const { tweetID, width = '550px', alignment = 'center' } = payload;

            // Extract tweet ID if a full URL was provided
            const extractedID = extractTweetID(tweetID) || tweetID;

            editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) {
                    return;
                }

                const tweetNode = $createTweetNode(extractedID, width, alignment);
                selection.insertNodes([tweetNode]);
            });

            return true;
        },
        COMMAND_PRIORITY_EDITOR,
    );

    const removeUpdateTweetCommand = editor.registerCommand(
        UPDATE_TWEET_COMMAND,
        (payload: UpdateTweetPayload) => {
            const { nodeKey, width, alignment } = payload;

            editor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if ($isTweetNode(node)) {
                    if (width !== undefined) {
                        node.setWidth(width);
                    }
                    if (alignment !== undefined) {
                        node.setAlignment(alignment);
                    }
                }
            });

            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    return mergeRegister(
        removeInsertTweetCommand,
        removeUpdateTweetCommand,
    );
}

export { extractTweetID };
