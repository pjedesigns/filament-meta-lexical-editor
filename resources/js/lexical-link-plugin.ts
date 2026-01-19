import {
    $getNearestNodeFromDOMNode,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    getNearestEditorFromDOMNode,
    isDOMNode,
    isHTMLAnchorElement,
    LexicalEditor,
} from 'lexical';

import { $isLinkNode, $toggleLink, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { getSelectedNode } from './utils';
import { $findMatchingParent } from '@lexical/utils';

const SUPPORTED_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'sms:', 'tel:']);

const urlRegExp = new RegExp(
    /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/,
);

// Internal URL pattern - allows paths starting with /
const INTERNAL_URL_REGEX = /^\/[a-zA-Z0-9\-_\/\.]*$/;

export interface LinkAttributes {
    url: string;
    target?: '_blank' | '_self';
    rel?: string;
}

export function isInternalUrl(url: string): boolean {
    return INTERNAL_URL_REGEX.test(url);
}

export function sanitizeUrl(url: string, allowInternal: boolean = true): string {
    // Allow internal URLs starting with /
    if (allowInternal && isInternalUrl(url)) {
        return url;
    }

    try {
        const parsedUrl = new URL(url);

        if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
            return 'about:blank';
        }

        return url;
    } catch {
        // If it's not a valid absolute URL, treat as unsafe for links
        return 'about:blank';
    }
}

export function validateUrl(url: string): boolean {
    // Allow internal URLs
    if (isInternalUrl(url)) {
        return true;
    }
    // TODO: fix UI for link insertion; it should never default to invalid URL like https://
    return url === 'https://' || urlRegExp.test(url);
}

export function registerLink(editor: LexicalEditor) {
    editor.registerCommand<LinkAttributes | string | null>(
        TOGGLE_LINK_COMMAND,
        (payload) => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection)) {
                return false;
            }

            const rootDom = editor.getElementByKey($getRoot().getKey());
            if (!rootDom) {
                return false;
            }

            const node = getSelectedNode(selection);
            const parent = node.getParent();

            // Handle payload as string (legacy) or LinkAttributes object
            let url: string | null = null;
            let target: '_blank' | '_self' = '_blank';
            let rel: string = 'noopener noreferrer';

            if (payload === null) {
                url = null;
            } else if (typeof payload === 'string') {
                url = sanitizeUrl(payload);
                // Auto-detect if internal URL and set appropriate defaults
                if (isInternalUrl(payload)) {
                    target = '_self';
                    rel = '';
                }
            } else if (typeof payload === 'object') {
                url = sanitizeUrl(payload.url);
                target = payload.target ?? (isInternalUrl(payload.url) ? '_self' : '_blank');
                rel = payload.rel ?? (target === '_blank' ? 'noopener noreferrer' : '');
            }

            // If we are already in a link -> toggle/remove/update it
            if ($isLinkNode(parent) || $isLinkNode(node)) {
                $toggleLink(url, {
                    rel: rel || undefined,
                    target: target,
                });

                if (url === null) {
                    rootDom.dispatchEvent(new CustomEvent('close-link-editor-dialog'));
                }

                return true;
            }

            // Otherwise create a link with placeholder URL and let UI edit it
            const defaultUrl = 'https://';

            $toggleLink(defaultUrl, {
                rel: 'noopener noreferrer',
                target: '_blank',
            });

            editor.read(() => {
                const sel = $getSelection();

                if (!$isRangeSelection(sel)) {
                    return;
                }

                const selectedNode = getSelectedNode(sel);

                // Prefer the nearest LinkNode, otherwise fall back to selected node element
                const linkNode = $findMatchingParent(selectedNode, $isLinkNode);
                const elementKey = (linkNode ?? selectedNode).getKey();
                const elementDOM = editor.getElementByKey(elementKey);

                if (elementDOM) {
                    rootDom.dispatchEvent(
                        new CustomEvent('link-created', {
                            detail: {
                                url: defaultUrl,
                                target: elementDOM,
                            },
                        }),
                    );
                }
            });

            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    return editor.registerRootListener((rootElement, prevRootElement) => {
        if (prevRootElement) {
            prevRootElement.removeEventListener('click', onClick);
            prevRootElement.removeEventListener('mouseup', onMouseUp);
        }

        if (rootElement) {
            rootElement.addEventListener('click', onClick);
            rootElement.addEventListener('mouseup', onMouseUp);
        }
    });
}

const onClick = (event: MouseEvent) => {
    const target = event.target;

    if (!isDOMNode(target)) {
        return;
    }

    const nearestEditor = getNearestEditorFromDOMNode(target);

    if (nearestEditor === null) {
        return;
    }

    let url: string | null = null;
    let urlTarget: string | null = null;

    nearestEditor.update(() => {
        const clickedNode = $getNearestNodeFromDOMNode(target);

        if (clickedNode === null) {
            return;
        }

        const maybeLinkNode = $findMatchingParent(clickedNode, $isLinkNode);

        if ($isLinkNode(maybeLinkNode)) {
            url = maybeLinkNode.getURL();
            urlTarget = maybeLinkNode.getTarget();
            return;
        }

        const a = findMatchingDOM(target, isHTMLAnchorElement);
        if (a) {
            url = a.href;
            urlTarget = a.target;
        }
    });

    if (!url) {
        return;
    }

    // Allow user to select link text without following URL
    const selection = nearestEditor.getEditorState().read($getSelection);
    if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        event.preventDefault();
        return;
    }

    nearestEditor.read(() => {
        const rootDom = nearestEditor.getElementByKey($getRoot().getKey());
        if (!rootDom) return;

        rootDom.dispatchEvent(
            new CustomEvent('link-clicked', {
                detail: {
                    url,
                    target,
                    urlTarget,
                    isInternal: isInternalUrl(url || ''),
                },
            }),
        );
    });
};

const onMouseUp = (event: MouseEvent) => {
    if (event.button === 1) {
        onClick(event);
    }
};

function findMatchingDOM<T extends Node>(
    startNode: Node,
    predicate: (node: Node) => node is T,
): T | null {
    let node: Node | null = startNode;

    while (node) {
        if (predicate(node)) {
            return node;
        }
        node = node.parentNode;
    }

    return null;
}
