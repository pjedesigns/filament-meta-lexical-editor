/**
 * Draggable Block Plugin for Lexical
 * Allows users to drag and reorder block-level nodes (paragraphs, headings, lists, tables, images, etc.)
 *
 * Based on Lexical's DraggableBlockPlugin_EXPERIMENTAL
 * Ported to vanilla TypeScript for non-React usage
 */

import {
    $createParagraphNode,
    $getNodeByKey,
    $getRoot,
    COMMAND_PRIORITY_HIGH,
    COMMAND_PRIORITY_LOW,
    DRAGOVER_COMMAND,
    DROP_COMMAND,
    LexicalEditor,
    LexicalNode,
} from 'lexical';

import { $isListItemNode, $isListNode } from '@lexical/list';
import { mergeRegister } from '@lexical/utils';

const SPACE = 4;
const TARGET_LINE_HALF_HEIGHT = 2;
const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'lexical-draggable-block-menu';
const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block';
const TEXT_BOX_HORIZONTAL_PADDING = 28;

const Downward = 1;
const Upward = -1;
const Indeterminate = 0;

type Direction = typeof Downward | typeof Upward | typeof Indeterminate;

let prevIndex = Infinity;

function getCurrentIndex(keysLength: number): number {
    if (keysLength === 0) {
        return Infinity;
    }
    if (prevIndex >= 0 && prevIndex < keysLength) {
        return prevIndex;
    }
    return Math.floor(keysLength / 2);
}

function getTopLevelNodeKeys(editor: LexicalEditor): string[] {
    return editor.getEditorState().read(() => $getRoot().getChildrenKeys());
}

function getCollapsedMargins(elem: HTMLElement): {
    marginTop: number;
    marginBottom: number;
} {
    const getMargin = (
        element: Element | null,
        margin: 'marginTop' | 'marginBottom',
    ): number =>
        element ? parseFloat(window.getComputedStyle(element)[margin]) : 0;

    const { marginTop, marginBottom } = window.getComputedStyle(elem);
    const prevElemSiblingMarginBottom = getMargin(
        elem.previousElementSibling,
        'marginBottom',
    );
    const nextElemSiblingMarginTop = getMargin(
        elem.nextElementSibling,
        'marginTop',
    );
    const collapsedTopMargin = Math.max(
        parseFloat(marginTop),
        prevElemSiblingMarginBottom,
    );
    const collapsedBottomMargin = Math.max(
        parseFloat(marginBottom),
        nextElemSiblingMarginTop,
    );

    return { marginBottom: collapsedBottomMargin, marginTop: collapsedTopMargin };
}

function getBlockElement(
    anchorElem: HTMLElement,
    editor: LexicalEditor,
    event: MouseEvent,
    useEdgeAsDefault = false,
): HTMLElement | null {
    const anchorElementRect = anchorElem.getBoundingClientRect();
    const topLevelNodeKeys = getTopLevelNodeKeys(editor);

    let blockElem: HTMLElement | null = null;

    editor.getEditorState().read(() => {
        if (useEdgeAsDefault) {
            const [firstNodeKey, lastNodeKey] = [
                topLevelNodeKeys[0],
                topLevelNodeKeys[topLevelNodeKeys.length - 1],
            ];

            const [firstNode, lastNode] = [
                editor.getElementByKey(firstNodeKey),
                editor.getElementByKey(lastNodeKey),
            ];

            if (firstNode && lastNode) {
                const [firstNodeRect, lastNodeRect] = [
                    firstNode.getBoundingClientRect(),
                    lastNode.getBoundingClientRect(),
                ];

                if (event.clientY < firstNodeRect.top) {
                    blockElem = firstNode;
                } else if (event.clientY > lastNodeRect.bottom) {
                    blockElem = lastNode;
                }

                if (blockElem) {
                    return;
                }
            }
        }

        let index = getCurrentIndex(topLevelNodeKeys.length);
        let direction: Direction = Indeterminate;

        while (index >= 0 && index < topLevelNodeKeys.length) {
            const key = topLevelNodeKeys[index];
            const elem = editor.getElementByKey(key);
            if (elem === null) {
                break;
            }
            const point = new DOMPoint(event.clientX, event.clientY);
            const domRect = elem.getBoundingClientRect();
            const { marginTop, marginBottom } = getCollapsedMargins(elem);

            const rect = new DOMRect(
                anchorElementRect.x,
                domRect.top - marginTop,
                anchorElementRect.width,
                domRect.height + marginTop + marginBottom,
            );

            const {
                top: lineTop,
                bottom: lineBottom,
                left: lineLeft,
                right: lineRight,
            } = rect;

            const isOnTopSide = point.y < lineTop;
            const isOnBottomSide = point.y > lineBottom;
            const isOnLeftSide = point.x < lineLeft;
            const isOnRightSide = point.x > lineRight;

            if (isOnTopSide) {
                direction = Upward;
            } else if (isOnBottomSide) {
                direction = Downward;
            } else if (
                !isOnLeftSide &&
                !isOnRightSide
            ) {
                blockElem = elem;
                prevIndex = index;
                break;
            }

            index += direction;
        }
    });

    return blockElem;
}

function isOnMenu(element: HTMLElement): boolean {
    return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

function setMenuPosition(
    targetElem: HTMLElement | null,
    floatingElem: HTMLElement,
    anchorElem: HTMLElement,
): void {
    if (!targetElem) {
        floatingElem.style.opacity = '0';
        floatingElem.style.transform = 'translate(-10000px, -10000px)';
        return;
    }

    const targetRect = targetElem.getBoundingClientRect();
    const targetStyle = window.getComputedStyle(targetElem);
    const floatingElemRect = floatingElem.getBoundingClientRect();
    const anchorElementRect = anchorElem.getBoundingClientRect();

    const top =
        targetRect.top +
        (parseInt(targetStyle.lineHeight, 10) - floatingElemRect.height) / 2 -
        anchorElementRect.top;

    const left = SPACE;

    floatingElem.style.opacity = '1';
    floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}

function setDragImage(
    dataTransfer: DataTransfer,
    draggableBlockElem: HTMLElement,
): void {
    const { transform } = draggableBlockElem.style;

    // Remove dragImage borders
    draggableBlockElem.style.transform = 'translateZ(0)';
    dataTransfer.setDragImage(draggableBlockElem, 0, 0);

    setTimeout(() => {
        draggableBlockElem.style.transform = transform;
    });
}

function setTargetLine(
    targetLineElem: HTMLElement,
    targetBlockElem: HTMLElement,
    mouseY: number,
    anchorElem: HTMLElement,
): void {
    const { top: targetBlockTop, height: targetBlockHeight } =
        targetBlockElem.getBoundingClientRect();
    const { top: anchorTop, width: anchorWidth } =
        anchorElem.getBoundingClientRect();

    const { marginTop, marginBottom } = getCollapsedMargins(targetBlockElem);
    let lineTop = targetBlockTop;

    if (mouseY >= targetBlockTop + targetBlockHeight / 2) {
        // below target
        lineTop += targetBlockHeight + marginBottom / 2;
    } else {
        // above target
        lineTop -= marginTop / 2;
    }

    const top = lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT;
    const left = TEXT_BOX_HORIZONTAL_PADDING - SPACE;

    targetLineElem.style.transform = `translate(${left}px, ${top}px)`;
    targetLineElem.style.width = `${
        anchorWidth - (TEXT_BOX_HORIZONTAL_PADDING - SPACE) * 2
    }px`;
    targetLineElem.style.opacity = '1';
}

function hideTargetLine(targetLineElem: HTMLElement): void {
    targetLineElem.style.opacity = '0';
    targetLineElem.style.transform = 'translate(-10000px, -10000px)';
}

function getNodeKeyFromDOMNode(
    domNode: Node,
    editor: LexicalEditor,
): string | null {
    const prop = '__lexicalKey_' + editor._key;
    return (domNode as any)[prop] || null;
}

export interface DraggableBlockPluginConfig {
    anchorElem?: HTMLElement;
}

export function registerDraggableBlockPlugin(
    editor: LexicalEditor,
    config: DraggableBlockPluginConfig = {},
): () => void {
    const anchorElem = config.anchorElem || editor.getRootElement()?.parentElement;

    if (!anchorElem) {
        return () => {};
    }

    // Create draggable menu element with plus button and drag handle
    const menuRef = document.createElement('div');
    menuRef.className = DRAGGABLE_BLOCK_MENU_CLASSNAME;
    menuRef.innerHTML = `
        <button type="button" class="lexical-draggable-block-add" title="Click to add below">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        </button>
        <div class="lexical-draggable-block-handle" draggable="true" title="Drag to move">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.5"></circle>
                <circle cx="9" cy="12" r="1.5"></circle>
                <circle cx="9" cy="18" r="1.5"></circle>
                <circle cx="15" cy="6" r="1.5"></circle>
                <circle cx="15" cy="12" r="1.5"></circle>
                <circle cx="15" cy="18" r="1.5"></circle>
            </svg>
        </div>
    `;
    menuRef.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        will-change: transform;
        opacity: 0;
        display: flex;
        align-items: center;
        gap: 0;
        z-index: 10;
    `;

    const isDarkMode = () => document.documentElement.classList.contains('dark');

    // Style the add button
    const addButton = menuRef.querySelector('.lexical-draggable-block-add') as HTMLButtonElement;
    if (addButton) {
        addButton.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            padding: 0;
            border: none;
            background: transparent;
            border-radius: 4px;
            cursor: pointer;
            color: ${isDarkMode() ? '#9ca3af' : '#6b7280'};
            transition: all 0.15s ease;
        `;
        addButton.addEventListener('mouseenter', () => {
            addButton.style.background = isDarkMode() ? '#374151' : '#e5e7eb';
            addButton.style.color = isDarkMode() ? '#f3f4f6' : '#111827';
        });
        addButton.addEventListener('mouseleave', () => {
            addButton.style.background = 'transparent';
            addButton.style.color = isDarkMode() ? '#9ca3af' : '#6b7280';
        });
    }

    // Style the drag handle
    const dragHandle = menuRef.querySelector('.lexical-draggable-block-handle') as HTMLDivElement;
    if (dragHandle) {
        dragHandle.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            padding: 0;
            border-radius: 4px;
            cursor: grab;
            color: ${isDarkMode() ? '#9ca3af' : '#6b7280'};
            transition: all 0.15s ease;
        `;
        dragHandle.addEventListener('mouseenter', () => {
            dragHandle.style.background = isDarkMode() ? '#374151' : '#e5e7eb';
            dragHandle.style.color = isDarkMode() ? '#f3f4f6' : '#111827';
        });
        dragHandle.addEventListener('mouseleave', () => {
            dragHandle.style.background = 'transparent';
            dragHandle.style.color = isDarkMode() ? '#9ca3af' : '#6b7280';
        });
    }

    // Create target line element
    const targetLineRef = document.createElement('div');
    targetLineRef.className = 'lexical-draggable-block-target-line';
    targetLineRef.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        will-change: transform;
        pointer-events: none;
        height: 4px;
        background: #3b82f6;
        border-radius: 2px;
        opacity: 0;
        z-index: 10;
    `;

    anchorElem.appendChild(menuRef);
    anchorElem.appendChild(targetLineRef);

    let draggableBlockElem: HTMLElement | null = null;
    let isDragging = false;
    let lastTargetBlock: HTMLElement | null = null;
    let mouseMoveThrottleTimer: number | null = null;

    function onMouseMove(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target || isDragging) {
            return;
        }

        if (isOnMenu(target)) {
            return;
        }

        // Throttle mousemove to prevent performance issues
        if (mouseMoveThrottleTimer !== null) {
            return;
        }

        mouseMoveThrottleTimer = window.setTimeout(() => {
            mouseMoveThrottleTimer = null;
        }, 50); // 50ms throttle (20fps max)

        const editorRoot = editor.getRootElement();
        if (!editorRoot) {
            return;
        }

        const _draggableBlockElem = getBlockElement(anchorElem!, editor, event);
        setMenuPosition(_draggableBlockElem, menuRef, anchorElem!);
        draggableBlockElem = _draggableBlockElem;
    }

    function onMouseLeave(event: MouseEvent): void {
        if (isDragging) {
            return;
        }

        const relatedTarget = event.relatedTarget as HTMLElement | null;
        if (relatedTarget && isOnMenu(relatedTarget)) {
            return;
        }

        setMenuPosition(null, menuRef, anchorElem!);
        draggableBlockElem = null;
    }

    function onDragStart(event: DragEvent): void {
        const dataTransfer = event.dataTransfer;
        if (!dataTransfer || !draggableBlockElem) {
            return;
        }

        isDragging = true;
        setDragImage(dataTransfer, draggableBlockElem);

        let nodeKey: string | null = null;
        editor.update(() => {
            const node = getNearestBlockNode(draggableBlockElem!, editor);
            if (node) {
                nodeKey = node.getKey();
            }
        });

        dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey || '');
    }

    function onDragEnd(): void {
        isDragging = false;
        hideTargetLine(targetLineRef);
        lastTargetBlock = null;
    }

    function getNearestBlockNode(
        element: HTMLElement,
        editor: LexicalEditor,
    ): LexicalNode | null {
        let node: LexicalNode | null = null;
        editor.getEditorState().read(() => {
            const key = getNodeKeyFromDOMNode(element, editor);
            if (key) {
                node = $getNodeByKey(key);
            }
        });
        return node;
    }

    // Handle drag over
    const removeDragoverCommand = editor.registerCommand(
        DRAGOVER_COMMAND,
        (event: DragEvent) => {
            if (!isDragging) {
                return false;
            }

            const [isFileTransfer] = eventFiles(event);
            if (isFileTransfer) {
                return false;
            }

            const { clientY } = event;
            const targetBlockElem = getBlockElement(anchorElem!, editor, event, true);

            if (!targetBlockElem) {
                return false;
            }

            lastTargetBlock = targetBlockElem;
            setTargetLine(targetLineRef, targetBlockElem, clientY, anchorElem!);
            event.preventDefault();
            return true;
        },
        COMMAND_PRIORITY_HIGH,
    );

    // Handle drop
    const removeDropCommand = editor.registerCommand(
        DROP_COMMAND,
        (event: DragEvent) => {
            if (!isDragging) {
                return false;
            }

            const [isFileTransfer] = eventFiles(event);
            if (isFileTransfer) {
                return false;
            }

            const dataTransfer = event.dataTransfer;
            const dragData = dataTransfer?.getData(DRAG_DATA_FORMAT) || '';

            if (!dragData) {
                return false;
            }

            const draggedNodeKey = dragData;
            const targetBlockElem = lastTargetBlock || getBlockElement(anchorElem!, editor, event, true);

            if (!targetBlockElem) {
                return false;
            }

            const { clientY } = event;
            const { top, height } = targetBlockElem.getBoundingClientRect();
            const shouldInsertAfter = clientY >= top + height / 2;

            editor.update(() => {
                const draggedNode = $getNodeByKey(draggedNodeKey);
                if (!draggedNode) {
                    return;
                }

                const targetKey = getNodeKeyFromDOMNode(targetBlockElem, editor);
                if (!targetKey) {
                    return;
                }

                const targetNode = $getNodeByKey(targetKey);
                if (!targetNode) {
                    return;
                }

                // Don't drop on itself
                if (draggedNodeKey === targetKey) {
                    return;
                }

                // Handle list items specially
                if ($isListItemNode(draggedNode)) {
                    const parent = draggedNode.getParent();
                    if ($isListNode(parent) && parent.getChildrenSize() === 1) {
                        // If it's the only item in the list, move the entire list
                        if (shouldInsertAfter) {
                            targetNode.insertAfter(parent);
                        } else {
                            targetNode.insertBefore(parent);
                        }
                        return;
                    }
                }

                // Normal block move
                if (shouldInsertAfter) {
                    targetNode.insertAfter(draggedNode);
                } else {
                    targetNode.insertBefore(draggedNode);
                }
            });

            hideTargetLine(targetLineRef);
            lastTargetBlock = null;
            event.preventDefault();
            return true;
        },
        COMMAND_PRIORITY_HIGH,
    );

    // Add event listeners
    const editorRoot = editor.getRootElement();
    if (editorRoot) {
        editorRoot.addEventListener('mousemove', onMouseMove);
        editorRoot.addEventListener('mouseleave', onMouseLeave);
    }

    // Drag events on the handle only
    if (dragHandle) {
        dragHandle.addEventListener('dragstart', onDragStart);
        dragHandle.addEventListener('dragend', onDragEnd);
    }

    // Plus button click - add a new paragraph after the current block
    if (addButton) {
        addButton.addEventListener('click', () => {
            if (!draggableBlockElem) return;

            editor.update(() => {
                const key = getNodeKeyFromDOMNode(draggableBlockElem!, editor);
                if (!key) return;

                const node = $getNodeByKey(key);
                if (!node) return;

                // Create a new paragraph and insert it after the current block
                const newParagraph = $createParagraphNode();
                node.insertAfter(newParagraph);
                newParagraph.select();
            });
        });
    }

    return mergeRegister(
        removeDragoverCommand,
        removeDropCommand,
        () => {
            // Clean up throttle timer
            if (mouseMoveThrottleTimer !== null) {
                clearTimeout(mouseMoveThrottleTimer);
                mouseMoveThrottleTimer = null;
            }
            if (editorRoot) {
                editorRoot.removeEventListener('mousemove', onMouseMove);
                editorRoot.removeEventListener('mouseleave', onMouseLeave);
            }
            if (dragHandle) {
                dragHandle.removeEventListener('dragstart', onDragStart);
                dragHandle.removeEventListener('dragend', onDragEnd);
            }
            menuRef.remove();
            targetLineRef.remove();
        },
    );
}

function eventFiles(event: DragEvent): [boolean, File[]] {
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) {
        return [false, []];
    }

    const types = dataTransfer.types;
    const hasFiles = types.includes('Files');

    if (!hasFiles) {
        return [false, []];
    }

    const files = Array.from(dataTransfer.files);
    return [true, files];
}
