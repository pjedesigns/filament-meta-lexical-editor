/**
 * YouTube Embed Plugin for Lexical
 * Embeds YouTube videos in the editor with width and alignment options
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

export type YouTubeAlignment = 'left' | 'center' | 'right';

export interface InsertYouTubePayload {
    videoID: string;
    width?: string;
    alignment?: YouTubeAlignment;
}

export interface UpdateYouTubePayload {
    nodeKey: NodeKey;
    width?: string;
    alignment?: YouTubeAlignment;
}

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<InsertYouTubePayload> =
    createCommand('INSERT_YOUTUBE_COMMAND');

export const UPDATE_YOUTUBE_COMMAND: LexicalCommand<UpdateYouTubePayload> =
    createCommand('UPDATE_YOUTUBE_COMMAND');

export type SerializedYouTubeNode = Spread<
    {
        videoID: string;
        width: string;
        alignment: YouTubeAlignment;
    },
    SerializedLexicalNode
>;

function extractYouTubeVideoID(url: string): string | null {
    // Handle various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

export class YouTubeNode extends DecoratorNode<null> {
    __videoID: string;
    __width: string;
    __alignment: YouTubeAlignment;

    static getType(): string {
        return 'youtube';
    }

    static clone(node: YouTubeNode): YouTubeNode {
        return new YouTubeNode(node.__videoID, node.__width, node.__alignment, node.__key);
    }

    constructor(videoID: string, width: string = '100%', alignment: YouTubeAlignment = 'center', key?: NodeKey) {
        super(key);
        this.__videoID = videoID;
        this.__width = width;
        this.__alignment = alignment;
    }

    private getAlignmentStyle(): string {
        switch (this.__alignment) {
            case 'left':
                return 'margin-left: 0; margin-right: auto;';
            case 'right':
                return 'margin-left: auto; margin-right: 0;';
            case 'center':
            default:
                return 'margin-left: auto; margin-right: auto;';
        }
    }

    createDOM(config: EditorConfig): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'lexical-youtube-wrapper';
        wrapper.style.cssText = `
            width: ${this.__width};
            ${this.getAlignmentStyle()}
            margin-top: 16px;
            margin-bottom: 16px;
        `;
        wrapper.setAttribute('data-youtube-video-id', this.__videoID);
        wrapper.setAttribute('data-youtube-width', this.__width);
        wrapper.setAttribute('data-youtube-alignment', this.__alignment);
        wrapper.setAttribute('data-alignment', this.__alignment);

        const container = document.createElement('div');
        container.className = 'lexical-youtube-container';
        container.style.cssText = `
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            overflow: hidden;
            border-radius: 8px;
            background: #000;
        `;

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${this.__videoID}`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 0;
            border-radius: 8px;
        `;

        container.appendChild(iframe);
        wrapper.appendChild(container);
        return wrapper;
    }

    updateDOM(prevNode: YouTubeNode, dom: HTMLElement): boolean {
        let needsUpdate = false;

        if (prevNode.__videoID !== this.__videoID) {
            const iframe = dom.querySelector('iframe');
            if (iframe) {
                iframe.src = `https://www.youtube-nocookie.com/embed/${this.__videoID}`;
            }
        }

        if (prevNode.__width !== this.__width) {
            dom.style.width = this.__width;
            dom.setAttribute('data-youtube-width', this.__width);
        }

        if (prevNode.__alignment !== this.__alignment) {
            const alignmentStyle = this.getAlignmentStyle();
            dom.style.marginLeft = this.__alignment === 'left' ? '0' : 'auto';
            dom.style.marginRight = this.__alignment === 'right' ? '0' : 'auto';
            dom.setAttribute('data-youtube-alignment', this.__alignment);
            dom.setAttribute('data-alignment', this.__alignment);
        }

        return false;
    }

    static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
        return $createYouTubeNode(
            serializedNode.videoID,
            serializedNode.width || '100%',
            serializedNode.alignment || 'center'
        );
    }

    exportJSON(): SerializedYouTubeNode {
        return {
            videoID: this.__videoID,
            width: this.__width,
            alignment: this.__alignment,
            type: 'youtube',
            version: 1,
        };
    }

    exportDOM(): DOMExportOutput {
        const wrapper = document.createElement('div');
        wrapper.className = 'lexical-youtube-wrapper';
        wrapper.style.cssText = `
            width: ${this.__width};
            ${this.getAlignmentStyle()}
            margin-top: 16px;
            margin-bottom: 16px;
        `;
        wrapper.setAttribute('data-youtube-video-id', this.__videoID);
        wrapper.setAttribute('data-youtube-width', this.__width);
        wrapper.setAttribute('data-youtube-alignment', this.__alignment);

        const container = document.createElement('div');
        container.className = 'lexical-youtube-container';
        container.style.cssText = `
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            overflow: hidden;
        `;

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${this.__videoID}`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 0;
        `;

        container.appendChild(iframe);
        wrapper.appendChild(container);
        return { element: wrapper };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            div: (domNode: HTMLElement) => {
                if (domNode.classList.contains('lexical-youtube-wrapper')) {
                    const videoID = domNode.getAttribute('data-youtube-video-id');
                    const width = domNode.getAttribute('data-youtube-width') || '100%';
                    const alignment = (domNode.getAttribute('data-youtube-alignment') || 'center') as YouTubeAlignment;
                    if (videoID) {
                        return {
                            conversion: () => ({
                                node: $createYouTubeNode(videoID, width, alignment),
                            }),
                            priority: 2,
                        };
                    }
                }
                // Legacy support for old container format
                if (domNode.classList.contains('lexical-youtube-container')) {
                    const videoID = domNode.getAttribute('data-youtube-video-id');
                    if (videoID) {
                        return {
                            conversion: () => ({
                                node: $createYouTubeNode(videoID),
                            }),
                            priority: 1,
                        };
                    }
                }
                return null;
            },
            iframe: (domNode: HTMLElement) => {
                const src = domNode.getAttribute('src') || '';
                const videoID = extractYouTubeVideoID(src);
                if (videoID) {
                    return {
                        conversion: () => ({
                            node: $createYouTubeNode(videoID),
                        }),
                        priority: 1,
                    };
                }
                return null;
            },
        };
    }

    getVideoID(): string {
        return this.__videoID;
    }

    getWidth(): string {
        return this.__width;
    }

    getAlignment(): YouTubeAlignment {
        return this.__alignment;
    }

    setWidth(width: string): void {
        const self = this.getWritable();
        self.__width = width;
    }

    setAlignment(alignment: YouTubeAlignment): void {
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

export function $createYouTubeNode(
    videoID: string,
    width: string = '100%',
    alignment: YouTubeAlignment = 'center'
): YouTubeNode {
    return $applyNodeReplacement(new YouTubeNode(videoID, width, alignment));
}

export function $isYouTubeNode(node: LexicalNode | null | undefined): node is YouTubeNode {
    return node instanceof YouTubeNode;
}

export function registerYouTubePlugin(editor: LexicalEditor): () => void {
    const removeInsertYouTubeCommand = editor.registerCommand(
        INSERT_YOUTUBE_COMMAND,
        (payload: InsertYouTubePayload) => {
            const { videoID, width = '100%', alignment = 'center' } = payload;

            // Extract video ID if a full URL was provided
            const extractedID = extractYouTubeVideoID(videoID) || videoID;

            editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) {
                    return;
                }

                const youtubeNode = $createYouTubeNode(extractedID, width, alignment);
                selection.insertNodes([youtubeNode]);
            });

            return true;
        },
        COMMAND_PRIORITY_EDITOR,
    );

    const removeUpdateYouTubeCommand = editor.registerCommand(
        UPDATE_YOUTUBE_COMMAND,
        (payload: UpdateYouTubePayload) => {
            const { nodeKey, width, alignment } = payload;

            editor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if ($isYouTubeNode(node)) {
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
        removeInsertYouTubeCommand,
        removeUpdateYouTubeCommand,
    );
}

export { extractYouTubeVideoID };
