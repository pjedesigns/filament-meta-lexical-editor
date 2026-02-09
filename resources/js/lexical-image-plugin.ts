import type {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    EditorConfig,
    LexicalCommand,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedEditor,
    SerializedLexicalNode,
    Spread,
} from 'lexical';

import { $applyNodeReplacement, $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand, createEditor, DecoratorNode } from 'lexical';

export type ImageAlignment = 'none' | 'left' | 'center' | 'right' | 'full';

/** Image payload */
export interface ImagePayload {
    altText: string;
    caption?: LexicalEditor;
    height?: number;
    key?: NodeKey;
    maxWidth?: number;
    showCaption?: boolean;
    src: string;
    width?: number;
    captionsEnabled?: boolean;
    cssClasses?: string;
    alignment?: ImageAlignment;
    linkUrl?: string;
    linkTarget?: string;
    loading?: 'lazy' | 'eager';
}

/**
 * Only allow public URLs (no data:, no file:, no javascript:)
 * Keep this aligned with your backend sanitization rules.
 */
export function sanitizeImageSrc(src: string): string {
    if (!src) return '';

    if (src.startsWith('/')) {
        return src;
    }

    try {
        const parsed = new URL(src);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
        return '';
    } catch {
        return '';
    }
}

/** Image node */
export class ImageNode extends DecoratorNode<null> {
    __src: string;
    __altText: string;
    __width: 'inherit' | number;
    __height: 'inherit' | number;
    __maxWidth: number;
    __showCaption: boolean;
    __caption: LexicalEditor;
    // Captions cannot yet be used within editor cells
    __captionsEnabled: boolean;
    __cssClasses: string;
    __alignment: ImageAlignment;
    __linkUrl: string;
    __linkTarget: string;
    __loading: 'lazy' | 'eager';

    static getType(): string {
        return 'image';
    }

    static clone(node: ImageNode): ImageNode {
        return new ImageNode(
            node.__src,
            node.__altText,
            node.__maxWidth,
            node.__width,
            node.__height,
            node.__showCaption,
            node.__caption,
            node.__captionsEnabled,
            node.__cssClasses,
            node.__alignment,
            node.__linkUrl,
            node.__linkTarget,
            node.__loading,
            node.__key,
        );
    }

    static importJSON(serializedNode: SerializedImageNode): ImageNode {
        const {
            altText, height, width, maxWidth, caption, src, showCaption,
            cssClasses, alignment, linkUrl, linkTarget, loading,
        } = serializedNode;

        const node = $createImageNode({
            altText,
            height,
            maxWidth,
            showCaption,
            src,
            width,
            cssClasses,
            alignment,
            linkUrl,
            linkTarget,
            loading,
        });

        const nestedEditor = node.__caption;
        const editorState = nestedEditor.parseEditorState(caption.editorState);

        if (!editorState.isEmpty()) {
            nestedEditor.setEditorState(editorState);
        }

        return node;
    }

    exportDOM(): DOMExportOutput {
        const img = document.createElement('img');

        img.setAttribute('src', this.__src);
        img.setAttribute('alt', this.__altText);

        if (typeof this.__width === 'number' && this.__width > 0) {
            img.setAttribute('width', String(this.__width));
        }

        if (typeof this.__height === 'number' && this.__height > 0) {
            img.setAttribute('height', String(this.__height));
        }

        if (this.__cssClasses) {
            img.setAttribute('class', this.__cssClasses);
        }

        if (this.__alignment && this.__alignment !== 'none') {
            img.setAttribute('data-alignment', this.__alignment);
        }

        img.setAttribute('loading', this.__loading || 'lazy');

        // Wrap in <a> if link is set
        if (this.__linkUrl) {
            const anchor = document.createElement('a');
            anchor.setAttribute('href', this.__linkUrl);
            anchor.setAttribute('target', this.__linkTarget || '_blank');
            if (this.__linkTarget === '_blank') {
                anchor.setAttribute('rel', 'noopener noreferrer');
            }
            anchor.appendChild(img);
            return { element: anchor };
        }

        return { element: img };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            img: () => ({
                conversion: convertImageElement,
                priority: 0,
            }),
        };
    }

    constructor(
        src: string,
        altText: string,
        maxWidth: number,
        width?: 'inherit' | number,
        height?: 'inherit' | number,
        showCaption?: boolean,
        caption?: LexicalEditor,
        captionsEnabled?: boolean,
        cssClasses?: string,
        alignment?: ImageAlignment,
        linkUrl?: string,
        linkTarget?: string,
        loading?: 'lazy' | 'eager',
        key?: NodeKey,
    ) {
        super(key);

        this.__src = sanitizeImageSrc(src);
        this.__altText = altText;
        this.__maxWidth = maxWidth;
        this.__width = width || 'inherit';
        this.__height = height || 'inherit';
        this.__showCaption = showCaption || false;
        this.__caption = caption || createEditor();
        this.__captionsEnabled = captionsEnabled || captionsEnabled === undefined;
        this.__cssClasses = cssClasses || '';
        this.__alignment = alignment || 'none';
        this.__linkUrl = linkUrl || '';
        this.__linkTarget = linkTarget || '_blank';
        this.__loading = loading || 'lazy';
    }

    exportJSON(): SerializedImageNode {
        return {
            altText: this.getAltText(),
            caption: this.__caption.toJSON(),
            height: this.__height === 'inherit' ? 0 : this.__height,
            maxWidth: this.__maxWidth,
            showCaption: this.__showCaption,
            src: this.getSrc(),
            type: 'image',
            version: 1,
            width: this.__width === 'inherit' ? 0 : this.__width,
            cssClasses: this.__cssClasses,
            alignment: this.__alignment,
            linkUrl: this.__linkUrl,
            linkTarget: this.__linkTarget,
            loading: this.__loading,
        };
    }

    setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void {
        const writable = this.getWritable();
        writable.__width = width;
        writable.__height = height;
    }

    setAltText(altText: string): void {
        const writable = this.getWritable();
        writable.__altText = altText;
    }

    setCssClasses(cssClasses: string): void {
        const writable = this.getWritable();
        writable.__cssClasses = cssClasses;
    }

    setAlignment(alignment: ImageAlignment): void {
        const writable = this.getWritable();
        writable.__alignment = alignment;
    }

    setLinkUrl(url: string): void {
        const writable = this.getWritable();
        writable.__linkUrl = url;
    }

    setLinkTarget(target: string): void {
        const writable = this.getWritable();
        writable.__linkTarget = target;
    }

    setLoading(loading: 'lazy' | 'eager'): void {
        const writable = this.getWritable();
        writable.__loading = loading;
    }

    // View
    createDOM(config: EditorConfig): HTMLElement {
        const span = document.createElement('span');

        const theme = config.theme;
        const className = (theme as any).image as string | undefined;
        if (className) {
            span.className = className;
        }

        span.classList.add('relative', 'image-span');

        // Apply alignment position class to wrapper
        if (this.__alignment && this.__alignment !== 'none') {
            span.classList.add(`position-${this.__alignment}`);
        }

        const element = document.createElement('img');

        const safeSrc = sanitizeImageSrc(this.__src);
        if (safeSrc) {
            element.setAttribute('src', safeSrc);
        }

        element.setAttribute('alt', this.__altText);

        element.style.width =
            this.__width === 'inherit' || this.__width === 0 ? '' : `${this.__width}px`;
        element.style.height = 'auto';

        // Apply user CSS classes
        if (this.__cssClasses) {
            this.__cssClasses.split(' ').filter(Boolean).forEach(cls => {
                element.classList.add(cls);
            });
        }

        // Apply loading attribute
        element.setAttribute('loading', this.__loading || 'lazy');

        const isSelectedClassName = 'focused';
        element.onclick = () => {
            element.classList.toggle(isSelectedClassName);
        };

        // harmless as attribute; your Alpine instance can pick it up if desired
        element.setAttribute(
            'x-on:click.outside',
            `$el.classList.remove("${isSelectedClassName}")`,
        );

        span.appendChild(element);

        // Link badge indicator
        if (this.__linkUrl) {
            const linkBadge = document.createElement('span');
            linkBadge.className = 'image-link-badge';
            linkBadge.title = this.__linkUrl;
            const linkIcon = document.createElement('i');
            linkIcon.className = 'link';
            linkIcon.style.width = '14px';
            linkIcon.style.height = '14px';
            linkIcon.style.display = 'block';
            linkBadge.appendChild(linkIcon);
            span.appendChild(linkBadge);
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.style.width = '2rem';
        button.style.height = '2rem';
        button.className = 'image-editor-button bg-gray-200 rounded-full';
        button.style.top = '0';
        button.style.right = '0';
        button.style.position = 'absolute';

        const icon = document.createElement('i');
        icon.className = 'edit';
        icon.style.width = '1.5rem';
        icon.style.height = '1.5rem';
        icon.style.display = 'block';
        icon.style.margin = 'auto';

        button.appendChild(icon);

        // Note: __key is protected on LexicalNode; getKey() is safe.
        button.setAttribute('x-on:click', `openImageEditor('${this.getKey()}')`);

        span.appendChild(button);

        return span;
    }

    updateDOM(_prevNode: this, dom: HTMLElement, _config: EditorConfig): boolean {
        const domElement = dom.querySelector('img') as HTMLImageElement | null;
        if (!domElement) return true;

        domElement.style.width =
            this.__width === 'inherit' || this.__width === 0 ? '' : `${this.__width}px`;
        domElement.style.height = 'auto';

        domElement.setAttribute('alt', this.__altText);

        const safeSrc = sanitizeImageSrc(this.__src);
        if (safeSrc) {
            domElement.setAttribute('src', safeSrc);
        } else {
            domElement.removeAttribute('src');
        }

        // Update alignment on wrapper span
        dom.classList.remove('position-left', 'position-center', 'position-right', 'position-full');
        if (this.__alignment && this.__alignment !== 'none') {
            dom.classList.add(`position-${this.__alignment}`);
        }

        // Update loading
        domElement.setAttribute('loading', this.__loading || 'lazy');

        // CSS classes and link badge changes require full re-render
        if (_prevNode.__cssClasses !== this.__cssClasses || _prevNode.__linkUrl !== this.__linkUrl) {
            return true;
        }

        return false;
    }

    getSrc(): string {
        return this.__src;
    }

    getAltText(): string {
        return this.__altText;
    }

    getWidth(): number {
        return this.__width === 'inherit' ? 0 : this.__width;
    }

    getHeight(): number {
        return this.__height === 'inherit' ? 0 : this.__height;
    }

    getCssClasses(): string {
        return this.__cssClasses;
    }

    getAlignment(): ImageAlignment {
        return this.__alignment;
    }

    getLinkUrl(): string {
        return this.__linkUrl;
    }

    getLinkTarget(): string {
        return this.__linkTarget;
    }

    getLoading(): 'lazy' | 'eager' {
        return this.__loading;
    }

    decorate(): null {
        return null;
    }
}

export type SerializedImageNode = Spread<
    {
        altText: string;
        caption: SerializedEditor;
        height?: number;
        maxWidth: number;
        showCaption: boolean;
        src: string;
        width?: number;
        cssClasses?: string;
        alignment?: ImageAlignment;
        linkUrl?: string;
        linkTarget?: string;
        loading?: 'lazy' | 'eager';
    },
    SerializedLexicalNode
>;

function convertImageElement(domNode: Node): null | DOMConversionOutput {
    const img = domNode as HTMLImageElement;

    const src = img.getAttribute('src') ?? '';

    // block data:, file:, etc
    if (!(src.startsWith('/') || /^https?:\/\//i.test(src))) {
        return null;
    }

    const altText = img.getAttribute('alt') ?? '';
    const width = img.width || 0;
    const height = img.height || 0;

    // Read new attributes
    const cssClasses = img.getAttribute('class') ?? '';
    const alignment = (img.getAttribute('data-alignment') ?? 'none') as ImageAlignment;
    const loading = (img.getAttribute('loading') ?? 'lazy') as 'lazy' | 'eager';

    // Check if parent is an <a> for link extraction
    let linkUrl = '';
    let linkTarget = '_blank';
    const parent = img.parentElement;
    if (parent && parent.tagName.toLowerCase() === 'a') {
        linkUrl = parent.getAttribute('href') ?? '';
        linkTarget = parent.getAttribute('target') ?? '_blank';
    }

    const node = $createImageNode({
        altText, height, src, width,
        cssClasses, alignment, linkUrl, linkTarget, loading,
    });
    return { node };
}

/** Create image node */
export function $createImageNode({
                                     altText,
                                     height,
                                     maxWidth = 500,
                                     captionsEnabled,
                                     src,
                                     width,
                                     showCaption,
                                     caption,
                                     key,
                                     cssClasses,
                                     alignment,
                                     linkUrl,
                                     linkTarget,
                                     loading,
                                 }: ImagePayload): ImageNode {
    return $applyNodeReplacement(
        new ImageNode(
            src,
            altText,
            maxWidth,
            width,
            height,
            showCaption,
            caption,
            captionsEnabled,
            cssClasses,
            alignment,
            linkUrl,
            linkTarget,
            loading,
            key,
        ),
    );
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
    return node instanceof ImageNode;
}

export type InsertImagePayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
    createCommand('INSERT_IMAGE_COMMAND');

export const registerInsertImageCommand = (editor: LexicalEditor) => {
    return editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
            // force sanitization through the node constructor
            const imageNode = $createImageNode({
                ...payload,
                src: sanitizeImageSrc(payload.src),
            });

            // if src is invalid, don't insert anything
            if (!imageNode.getSrc()) {
                return true;
            }

            $insertNodes([imageNode]);
            return true;
        },
        COMMAND_PRIORITY_EDITOR,
    );
};
