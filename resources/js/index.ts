import {
    $createHeadingNode,
    $isHeadingNode,
    HeadingNode,
    type HeadingTagType,
    QuoteNode,
    registerRichText,
} from '@lexical/rich-text';

import { HashtagNode } from '@lexical/hashtag';

import {
    $createParagraphNode,
    $getRoot,
    $getSelection,
    $insertNodes,
    $isElementNode,
    $isRangeSelection,
    $isRootOrShadowRoot,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    createEditor,
    FORMAT_ELEMENT_COMMAND,
    FORMAT_TEXT_COMMAND,
    INDENT_CONTENT_COMMAND,
    OUTDENT_CONTENT_COMMAND,
    REDO_COMMAND,
    type ElementFormatType,
    type LexicalEditor,
    TextNode,
    type TextFormatType,
    UNDO_COMMAND,
} from 'lexical';

import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import { $isCodeNode, CODE_LANGUAGE_MAP, CodeNode } from '@lexical/code';

import {
    $getSelectionStyleValueForProperty,
    $isParentElementRTL,
    $patchStyleText,
    $setBlocksType,
} from '@lexical/selection';

import { $isLinkNode, AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';

import {
    $isListNode,
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    ListItemNode,
    ListNode,
    registerList,
} from '@lexical/list';

import { createEmptyHistoryState, registerHistory } from '@lexical/history';

// Coloris typing is a bit awkward; treat as any to keep TS happy.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Coloris from '@melloware/coloris';

import { registerLexicalTextEntity } from '@lexical/text';
import * as Hashtag from './lexical-hashtag-plugin';
import {
    INSERT_HORIZONTAL_RULE_COMMAND,
    HorizontalRuleNode,
    registerHorizontalRule,
} from './lexical-horizontal-rule-plugin';

import {
    UpdateFontSizeType,
    clearFormatting,
    formatCode,
    formatQuote,
    getSelectedNode,
    theme,
    updateFontSize,
    updateFontSizeByInputValue,
} from './utils';

import { registerLink, isInternalUrl, type LinkAttributes } from './lexical-link-plugin';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { registerShortcuts } from './lexical-shortcuts-plugin';
import { DEFAULT_FONT_SIZE, INITIAL_TOOLBAR_STATE, blockTypeToBlockName } from './toolbar-context';
export interface InternalLink {
    title: string;
    slug: string;
}

import {
    $isImageNode,
    ImageNode,
    INSERT_IMAGE_COMMAND,
    type ImageAlignment,
    type InsertImagePayload,
    registerInsertImageCommand,
} from './lexical-image-plugin';

import {
    INSERT_TABLE_COMMAND,
    registerTablePlugin,
    TableNode,
    TableCellNode,
    TableRowNode,
    $isTableSelection,
    $isTableNode,
    $isTableCellNode,
    type InsertTablePayload,
} from './lexical-table-plugin';

import { createTableContextMenu } from './table-context-menu';

import { registerDraggableBlockPlugin } from './lexical-draggable-block-plugin';

import {
    LayoutContainerNode,
    LayoutItemNode,
    INSERT_LAYOUT_COMMAND,
    registerLayoutPlugin,
    type InsertLayoutPayload,
} from './lexical-layout-plugin';

import {
    YouTubeNode,
    INSERT_YOUTUBE_COMMAND,
    registerYouTubePlugin,
    type InsertYouTubePayload,
} from './lexical-youtube-plugin';

import {
    TweetNode,
    INSERT_TWEET_COMMAND,
    registerTweetPlugin,
    type InsertTweetPayload,
} from './lexical-tweet-plugin';

import {
    CollapsibleContainerNode,
    CollapsibleTitleNode,
    CollapsibleContentNode,
    INSERT_COLLAPSIBLE_COMMAND,
    registerCollapsiblePlugin,
    type InsertCollapsiblePayload,
} from './lexical-collapsible-plugin';

import {
    DateNode,
    INSERT_DATE_COMMAND,
    registerDatePlugin,
    type InsertDatePayload,
    type DateFormat,
    formatDate,
} from './lexical-date-plugin';

import { $getNodeByKey } from 'lexical';
import { ExtendedTextNode } from './extended-text-note';
import { registerResetFormatOnNewParagraph } from './lexical-reset-format-plugin';

const COMMAND_PRIORITY_LOW = 1;

type RefMap = Record<string, unknown>;

function refEl<T extends HTMLElement>(refs: RefMap, key: string): T | null {
    const el = refs?.[key];
    return el instanceof HTMLElement ? (el as T) : null;
}

type ToolbarState = typeof INITIAL_TOOLBAR_STATE;

type AlpineMagic = {
    $refs: RefMap;
    $nextTick: (cb: () => void) => void;
    $dispatch: (name: string, payload?: any) => void;
};

type LexicalComponent = AlpineMagic & {
    state: string | null;
    basicColors: string[];
    toolbarState: ToolbarState;

    showLinkEditor: boolean;
    linkEditMode: boolean;
    linkEditorAnchor: HTMLElement | null;
    linkEditorUrl: string | null;

    // Link editor enhanced state
    linkType: 'external' | 'internal';
    linkOpenInNewTab: boolean;
    selectedInternalLink: string;
    internalLinks: InternalLink[];
    hasInternalLinks: boolean;
    siteUrl: string;

    editor: LexicalEditor | null;
    uploadUrl: string | null;

    enabledToolbars: string[];

    // Track images for cleanup on save
    originalImages: Set<string>;
    deletedImages: string[];

    init: () => void;

    // link helpers
    updateLink: () => void;
    removeLink: () => void;
    showLinkEditorDialog: (element: HTMLElement, url?: string | null, editable?: boolean) => void;
    closeLinkEditorDialog: () => void;
    onInternalLinkSelected: () => void;
    getInternalLinkUrl: () => string;
    detectLinkType: () => void;

    // image helpers
    activeImageKey: string | null;
    handleImage: () => Promise<boolean>;
    insertImage: (payload: InsertImagePayload) => void;
    openImageEditor: (nodeKey: string) => void;
    deleteImage: (nodeKey?: string) => void;
    updateImage: () => void;
    resetImageEditorForm: () => void;
    closeImageEditorModal: () => void;

    // table helpers
    showTableEditor: boolean;
    tableEditorAnchor: HTMLElement | null;
    tableRows: number;
    tableCols: number;
    tableHasHeaders: boolean;
    tableBorderStyle: 'none' | 'light' | 'medium' | 'heavy';
    tableCellPadding: 'compact' | 'normal' | 'relaxed';
    tableLayout: 'auto' | 'fixed';
    tableWidth: string;
    tableContextMenu: ReturnType<typeof createTableContextMenu> | null;

    showTableEditorDialog: (element: HTMLElement) => void;
    closeTableEditorDialog: () => void;
    insertTable: () => void;

    // Layout editor state
    showLayoutEditor: boolean;
    layoutEditorAnchor: HTMLElement | null;
    layoutColumns: 2 | 3 | 4;

    showLayoutEditorDialog: (element: HTMLElement) => void;
    closeLayoutEditorDialog: () => void;
    insertLayout: () => void;

    // YouTube editor state
    showYouTubeEditor: boolean;
    youTubeEditorAnchor: HTMLElement | null;
    youTubeUrl: string;
    youTubeWidth: string;
    youTubeAlignment: 'left' | 'center' | 'right';

    showYouTubeEditorDialog: (element: HTMLElement) => void;
    closeYouTubeEditorDialog: () => void;
    insertYouTube: () => void;

    // Tweet editor state
    showTweetEditor: boolean;
    tweetEditorAnchor: HTMLElement | null;
    tweetUrl: string;
    tweetWidth: string;
    tweetAlignment: 'left' | 'center' | 'right';

    showTweetEditorDialog: (element: HTMLElement) => void;
    closeTweetEditorDialog: () => void;
    insertTweet: () => void;

    // Collapsible editor state
    showCollapsibleEditor: boolean;
    collapsibleEditorAnchor: HTMLElement | null;
    collapsibleTitle: string;
    collapsibleOpen: boolean;

    showCollapsibleEditorDialog: (element: HTMLElement) => void;
    closeCollapsibleEditorDialog: () => void;
    insertCollapsible: () => void;

    // Date editor state
    showDateEditor: boolean;
    dateEditorAnchor: HTMLElement | null;
    dateValue: string;
    dateFormat: DateFormat;

    showDateEditorDialog: (element: HTMLElement) => void;
    closeDateEditorDialog: () => void;
    insertDate: () => void;
    setDateToday: () => void;
    setDateTomorrow: () => void;
    setDateNextWeek: () => void;
    getDatePreview: () => string;

    // image editor extended state
    imageCssClasses: string;
    imageAlignment: ImageAlignment;
    imageLinkUrl: string;
    imageLinkTarget: string;
    imageLoading: 'lazy' | 'eager';

    // aspect lock (matches Blade)
    imageLockAspect: boolean;
    imageAspectRatio: number | null;
    imageLastChanged: 'width' | 'height' | null;

    toggleImageLockAspect: () => void;
    imageWidthInput: () => void;
    imageHeightInput: () => void;

    // formatting helpers
    formatHeading: (headingSize: HeadingTagType) => void;
    formatAlignment: (elementFormatType: ElementFormatType) => void;
    formatFontFamily: (fontFamily: string) => void;
    formatText: (formatTextType: TextFormatType) => void;
    formatParagraph: () => void;
    formatBulletList: () => void;
    formatNumberedList: () => void;
    formatLineCode: () => void;
    insetLink: () => void;
    insetHR: () => void;

    // toolbar
    getToolbarActions: () => Record<string, any>;
    registerToolbarActions: () => void;
    updateToolbar: () => void;
    updateToolbarState: (toolbar: string, value: any) => void;

    // color picker init
    initColorPickers: () => void;
};

function sanitizeHtmlForImages(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    doc.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src') ?? '';
        // allow only http/https
        if (!/^https?:\/\//i.test(src)) {
            img.remove();
        }
    });

    return doc.body.innerHTML;
}

function isAllowedImgSrc(src: string): boolean {
    if (!src) return false;

    // relative like /storage/x.jpg
    if (src.startsWith('/')) return true;

    // absolute
    return /^https?:\/\//i.test(src);
}

function sanitizeIncomingHtmlDocument(doc: Document): void {
    const imgs = Array.from(doc.querySelectorAll('img'));

    for (const img of imgs) {
        const src = img.getAttribute('src') ?? '';
        if (!isAllowedImgSrc(src)) {
            img.remove();
            continue;
        }

        const w = img.getAttribute('width');
        const h = img.getAttribute('height');

        if (w && !/^\d+$/.test(w)) img.removeAttribute('width');
        if (h && !/^\d+$/.test(h)) img.removeAttribute('height');
    }
}

function sanitizeOutgoingHtml(html: string): string {
    if (!html) return html;

    const doc = new DOMParser().parseFromString(html, 'text/html');
    sanitizeIncomingHtmlDocument(doc);

    return doc.body.innerHTML;
}

function extractImageUrls(html: string): Set<string> {
    const urls = new Set<string>();
    if (!html) return urls;

    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src');
        if (src && isAllowedImgSrc(src)) {
            urls.add(src);
        }
    });

    return urls;
}

export default function lexicalComponent({
                                             basicColors = [
                                                 '#d0021b',
                                                 '#f5a623',
                                                 '#f8e71c',
                                                 '#8b572a',
                                                 '#7ed321',
                                                 '#417505',
                                                 '#bd10e0',
                                                 '#9013fe',
                                                 '#4a90e2',
                                                 '#50e3c2',
                                                 '#b8e986',
                                                 '#000000',
                                                 '#4a4a4a',
                                                 '#9b9b9b',
                                                 '#ffffff',
                                             ],
                                             state,
                                             enabledToolbars = [
                                                 'undo',
                                                 'redo',
                                                 'normal',
                                                 'h1',
                                                 'h2',
                                                 'h3',
                                                 'h4',
                                                 'h5',
                                                 'h6',
                                                 'bullet',
                                                 'numbered',
                                                 'quote',
                                                 'code',
                                                 'fontSize',
                                                 'bold',
                                                 'italic',
                                                 'underline',
                                                 'icode',
                                                 'link',
                                                 'textColor',
                                                 'backgroundColor',
                                                 'lowercase',
                                                 'uppercase',
                                                 'capitalize',
                                                 'strikethrough',
                                                 'subscript',
                                                 'superscript',
                                                 'clear',
                                                 'left',
                                                 'center',
                                                 'right',
                                                 'justify',
                                                 'start',
                                                 'end',
                                                 'indent',
                                                 'outdent',
                                                 'hr',
                                                 'image',
                                             ],
                                             internalLinks = [],
                                             hasInternalLinks = false,
                                             siteUrl = '',
                                         }: {
    basicColors?: string[];
    state: string | null;
    enabledToolbars?: string[];
    internalLinks?: InternalLink[];
    hasInternalLinks?: boolean;
    siteUrl?: string;
}) {
    const ColorisAny = Coloris as any;

    const component: LexicalComponent = {
        // Alpine magic (provided at runtime)
        $refs: {},
        $nextTick: () => undefined,
        $dispatch: () => undefined,

        state: state ?? null,
        basicColors,
        toolbarState: JSON.parse(JSON.stringify(INITIAL_TOOLBAR_STATE)) as ToolbarState,

        showLinkEditor: false,
        linkEditMode: false,
        linkEditorAnchor: null,
        linkEditorUrl: null,

        // Link editor enhanced state
        linkType: 'external',
        linkOpenInNewTab: true,
        selectedInternalLink: '',
        internalLinks,
        hasInternalLinks,
        siteUrl,

        editor: null,
        uploadUrl: null,
        enabledToolbars,

        // image state
        activeImageKey: null,
        imageLockAspect: true,
        imageAspectRatio: null,
        imageLastChanged: null,
        imageCssClasses: '',
        imageAlignment: 'none' as ImageAlignment,
        imageLinkUrl: '',
        imageLinkTarget: '_blank',
        imageLoading: 'lazy' as 'lazy' | 'eager',

        // Track images for cleanup
        originalImages: new Set<string>(),
        deletedImages: [],

        // table state
        showTableEditor: false,
        tableEditorAnchor: null,
        tableRows: 3,
        tableCols: 3,
        tableHasHeaders: true,
        tableBorderStyle: 'light',
        tableCellPadding: 'normal',
        tableLayout: 'auto',
        tableWidth: '100%',
        tableContextMenu: null,

        // Layout state
        showLayoutEditor: false,
        layoutEditorAnchor: null,
        layoutColumns: 2,

        // YouTube state
        showYouTubeEditor: false,
        youTubeEditorAnchor: null,
        youTubeUrl: '',
        youTubeWidth: '100%',
        youTubeAlignment: 'center',

        // Tweet state
        showTweetEditor: false,
        tweetEditorAnchor: null,
        tweetUrl: '',
        tweetWidth: '550px',
        tweetAlignment: 'center',

        // Collapsible state
        showCollapsibleEditor: false,
        collapsibleEditorAnchor: null,
        collapsibleTitle: 'Click to expand',
        collapsibleOpen: true,

        // Date state
        showDateEditor: false,
        dateEditorAnchor: null,
        dateValue: new Date().toISOString().split('T')[0],
        dateFormat: 'medium' as DateFormat,

        init: function () {
            this.uploadUrl =
                (window as any)?.filamentData?.metaLexicalEditor?.uploadUrl ??
                '/filament-meta-lexical-editor/upload-image';

            const editorElement = refEl<HTMLElement>(this.$refs, 'editor');
            if (!editorElement) return;

            const initialConfig = {
                namespace: 'lexical-editor',
                nodes: [
                    ExtendedTextNode,
                    {
                        replace: TextNode,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        with: (node: TextNode) => {
                            const extNode = new ExtendedTextNode(node.__text);
                            extNode.__format = node.__format;
                            extNode.__style = node.__style;
                            extNode.__mode = node.__mode;
                            extNode.__detail = node.__detail;
                            return extNode;
                        },
                        withKlass: ExtendedTextNode,
                    },
                    AutoLinkNode,
                    ListItemNode,
                    CodeNode,
                    HeadingNode,
                    LinkNode,
                    ListNode,
                    QuoteNode,
                    HashtagNode,
                    HorizontalRuleNode,
                    ImageNode,
                    TableNode,
                    TableCellNode,
                    TableRowNode,
                    LayoutContainerNode,
                    LayoutItemNode,
                    YouTubeNode,
                    TweetNode,
                    CollapsibleContainerNode,
                    CollapsibleTitleNode,
                    CollapsibleContentNode,
                    DateNode,
                ],
                onError: console.error,
                theme,
            };

            this.editor = createEditor(initialConfig as any);
            this.editor.setRootElement(editorElement);
            const editor = this.editor;

            // Register plugins
            mergeRegister(
                registerRichText(editor),
                registerList(editor),
                registerHistory(editor, createEmptyHistoryState(), 300),
                registerLink(editor),
                registerShortcuts(editor),
                registerHorizontalRule(editor),
                registerInsertImageCommand(editor),
                registerTablePlugin(editor),
                registerLayoutPlugin(editor),
                registerYouTubePlugin(editor),
                registerTweetPlugin(editor),
                registerCollapsiblePlugin(editor),
                registerDatePlugin(editor),
                registerResetFormatOnNewParagraph(editor),
                ...registerLexicalTextEntity(
                    editor,
                    Hashtag.getHashtagMatch,
                    HashtagNode,
                    Hashtag.$createHashtagNode_,
                ),
            );

            // Initialize table context menu
            this.tableContextMenu = createTableContextMenu(editor);

            // Initialize draggable block plugin for reordering blocks
            const editorWrapper = editorElement.parentElement;
            if (editorWrapper) {
                registerDraggableBlockPlugin(editor, {
                    anchorElem: editorWrapper,
                });
            }

            // Register context menu handler for tables
            editorElement.addEventListener('contextmenu', (event: MouseEvent) => {
                const target = event.target as HTMLElement;
                const tableCell = target.closest('td, th');

                if (tableCell && this.tableContextMenu) {
                    event.preventDefault();

                    // Store reference outside read callback
                    const contextMenu = this.tableContextMenu;
                    const clientX = event.clientX;
                    const clientY = event.clientY;

                    // Determine if merge/unmerge operations are available
                    editor.getEditorState().read(() => {
                        const selection = $getSelection();
                        const canMerge = $isTableSelection(selection) && selection.getNodes().filter($isTableCellNode).length > 1;
                        const canUnmerge = $isRangeSelection(selection) && (() => {
                            const node = selection.anchor.getNode();
                            const cell = node.getParent();
                            if ($isTableCellNode(cell)) {
                                return (cell.getRowSpan() || 1) > 1 || (cell.getColSpan() || 1) > 1;
                            }
                            return false;
                        })();

                        contextMenu.show(clientX, clientY, canMerge, canUnmerge);
                    });
                }
            });

            editor.registerCommand(
                CAN_UNDO_COMMAND,
                (payload) => {
                    this.updateToolbarState('canUndo', payload);
                    this.updateToolbarState('cannotUndo', !payload);
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            );

            editor.registerCommand(
                CAN_REDO_COMMAND,
                (payload) => {
                    this.updateToolbarState('canRedo', payload);
                    this.updateToolbarState('cannotRedo', !payload);
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            );

            // Debounce toolbar updates to prevent performance issues during rapid edits
            let toolbarUpdateTimer: ReturnType<typeof setTimeout> | null = null;

            editor.registerUpdateListener(() => {
                editor.read(() => {
                    const rawHtml = $generateHtmlFromNodes(editor);
                    this.state = sanitizeOutgoingHtml(rawHtml);

                    // Debounce toolbar updates - only update every 50ms max
                    if (toolbarUpdateTimer !== null) {
                        clearTimeout(toolbarUpdateTimer);
                    }
                    toolbarUpdateTimer = setTimeout(() => {
                        toolbarUpdateTimer = null;
                        // Re-read to get fresh selection state
                        editor.read(() => {
                            this.updateToolbar();
                        });
                    }, 50);
                });
            });

            // Hydrate existing HTML -> Lexical nodes
            if (this.state) {
                const safeHtml = sanitizeHtmlForImages(this.state);

                // Track original images for cleanup on save
                this.originalImages = extractImageUrls(this.state);

                editor.update(() => {
                    const dom = new DOMParser().parseFromString(safeHtml, 'text/html');
                    sanitizeIncomingHtmlDocument(dom);

                    const nodes = $generateNodesFromDOM(editor, dom);

                    $getRoot().select();
                    $insertNodes(nodes);
                });
            }

            this.registerToolbarActions();

            // Make Coloris squares show defaults immediately
            this.initColorPickers();
        },

        initColorPickers: function () {
            // Initialize Coloris once globally
            if (!(window as any).__metaLexicalColorisInit) {
                (window as any).__metaLexicalColorisInit = true;
                ColorisAny.init?.();
            }

            // Set default colors on the inputs and their Coloris wrappers
            this.$nextTick(() => {
                const textColorInput = refEl<HTMLInputElement>(this.$refs, 'text_color_input');
                const bgColorInput = refEl<HTMLInputElement>(this.$refs, 'background_color_input');

                // Set default values if not already set
                if (textColorInput && !textColorInput.value) {
                    textColorInput.value = '#000000';
                }
                if (bgColorInput && !bgColorInput.value) {
                    bgColorInput.value = '#ffffff';
                }

                // Update the Coloris wrapper divs to show the colors
                // Coloris wraps inputs in .clr-field which uses style.color for the preview
                setTimeout(() => {
                    if (textColorInput) {
                        const clrField = textColorInput.closest('.clr-field') as HTMLElement;
                        if (clrField) {
                            clrField.style.color = textColorInput.value || '#000000';
                        }
                    }
                    if (bgColorInput) {
                        const clrField = bgColorInput.closest('.clr-field') as HTMLElement;
                        if (clrField) {
                            clrField.style.color = bgColorInput.value || '#ffffff';
                        }
                    }
                }, 50);
            });
        },

        // ---------- LINK ----------
        updateLink: function () {
            if (!this.editor) return;

            let url: string | null = null;

            // Determine the URL based on link type
            if (this.linkType === 'internal' && this.selectedInternalLink) {
                // Use relative path for internal links
                url = '/' + this.selectedInternalLink;
            } else {
                url = this.linkEditorUrl;
            }

            if (!url) return;

            // Create link attributes with target based on checkbox
            const linkPayload: LinkAttributes = {
                url,
                target: this.linkOpenInNewTab ? '_blank' : '_self',
                rel: this.linkOpenInNewTab ? 'noopener noreferrer' : '',
            };

            this.editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkPayload);
            this.linkEditMode = false;
            this.closeLinkEditorDialog();
        },

        removeLink: function () {
            if (!this.editor) return;
            this.editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            this.closeLinkEditorDialog();
        },

        // Helper to close all dialog editors
        closeAllDialogs: function () {
            this.showLinkEditor = false;
            this.linkEditorAnchor = null;
            this.showTableEditor = false;
            this.tableEditorAnchor = null;
            this.showLayoutEditor = false;
            this.layoutEditorAnchor = null;
            this.showYouTubeEditor = false;
            this.youTubeEditorAnchor = null;
            this.showTweetEditor = false;
            this.tweetEditorAnchor = null;
            this.showCollapsibleEditor = false;
            this.collapsibleEditorAnchor = null;
            this.showDateEditor = false;
            this.dateEditorAnchor = null;
        },

        showLinkEditorDialog: function (
            element: HTMLElement,
            url: string | null = null,
            editable: boolean = true,
        ) {
            // Close all other dialogs first (except link editor itself for editing different links)
            this.showTableEditor = false;
            this.tableEditorAnchor = null;
            this.showLayoutEditor = false;
            this.layoutEditorAnchor = null;
            this.showYouTubeEditor = false;
            this.youTubeEditorAnchor = null;
            this.showTweetEditor = false;
            this.tweetEditorAnchor = null;
            this.showCollapsibleEditor = false;
            this.collapsibleEditorAnchor = null;
            this.showDateEditor = false;
            this.dateEditorAnchor = null;

            this.$nextTick(() => {
                this.linkEditorAnchor = element;
                this.linkEditMode = editable;
                this.linkEditorUrl = url;
                this.showLinkEditor = true;

                // Reset link type state when opening dialog
                this.linkType = 'external';
                this.selectedInternalLink = '';
                // Default: external links open in new tab, internal don't
                this.linkOpenInNewTab = true;

                // Detect link type from existing URL
                if (url) {
                    this.detectLinkType();
                }
            });
        },

        closeLinkEditorDialog: function () {
            this.$nextTick(() => {
                this.linkEditorAnchor = null;
                this.linkEditorUrl = null;
                this.showLinkEditor = false;
                this.linkType = 'external';
                this.selectedInternalLink = '';
                this.linkOpenInNewTab = true;
            });
        },

        onInternalLinkSelected: function () {
            // When an internal link is selected, update the URL preview
            // and set open in new tab to false by default for internal links
            if (this.selectedInternalLink) {
                this.linkOpenInNewTab = false;
            }
        },

        getInternalLinkUrl: function (): string {
            if (!this.selectedInternalLink) return '';
            // Remove trailing slash from siteUrl if present, then add the slug
            const baseUrl = this.siteUrl.replace(/\/$/, '');
            return `${baseUrl}/${this.selectedInternalLink}`;
        },

        detectLinkType: function () {
            const url = this.linkEditorUrl;
            if (!url) return;

            // Check if URL matches any internal link slug
            if (isInternalUrl(url)) {
                this.linkType = 'internal';
                // Extract slug from relative URL (remove leading /)
                const slug = url.replace(/^\//, '');
                // Check if this slug exists in our internal links
                const matchingLink = this.internalLinks.find(link => link.slug === slug);
                if (matchingLink) {
                    this.selectedInternalLink = matchingLink.slug;
                }
                this.linkOpenInNewTab = false;
            } else {
                this.linkType = 'external';
                this.linkOpenInNewTab = true;
            }
        },

        // ---------- IMAGE UPLOAD ----------
        handleImage: async function (): Promise<boolean> {
            const input = refEl<HTMLInputElement>(this.$refs, 'image_input');
            const altInput = refEl<HTMLInputElement>(this.$refs, 'image_alt');

            const files = input?.files;
            const alt = altInput?.value ?? '';

            if (!files || !files[0]) return false;

            const form = new FormData();
            form.append('image', files[0]);
            form.append('alt', alt);

            const token =
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

            const res = await fetch(this.uploadUrl ?? '/filament-meta-lexical-editor/upload-image', {
                method: 'POST',
                headers: token ? { 'X-CSRF-TOKEN': token } : {},
                body: form,
                credentials: 'same-origin',
            });

            if (!res.ok) {
                console.error('Image upload failed:', await res.text());
                return false;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data: any = await res.json();

            const payload: InsertImagePayload = {
                altText: data.alt ?? alt ?? '',
                src: data.url,
                ...(data.width ? { width: Number(data.width) } : {}),
                ...(data.height ? { height: Number(data.height) } : {}),
            };

            this.insertImage(payload);

            if (input) input.value = '';
            if (altInput) altInput.value = '';

            return true;
        },

        insertImage: function (payload: InsertImagePayload) {
            if (!this.editor) return;
            this.editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
        },

        // ---------- IMAGE EDITOR ----------
        openImageEditor: function (nodeKey: string) {
            if (!this.editor) return;

            this.editor.read(() => {
                const node = $getNodeByKey(nodeKey);
                if (!$isImageNode(node)) return;

                const modal = refEl<HTMLElement>(this.$refs, 'imageEditorModal');
                const modalId = modal?.getAttribute('modal-id') ?? null;
                if (!modal || !modalId) return;

                const altEl = modal.querySelector("[x-ref='image_editor_alt']") as HTMLInputElement | null;
                const widthEl = modal.querySelector("[x-ref='image_editor_width']") as HTMLInputElement | null;
                const heightEl = modal.querySelector("[x-ref='image_editor_height']") as HTMLInputElement | null;

                if (!altEl || !widthEl || !heightEl) return;

                const w = node.getWidth();
                const h = node.getHeight();

                altEl.value = node.getAltText();
                widthEl.value = w > 0 ? String(w) : '';
                heightEl.value = h > 0 ? String(h) : '';

                this.activeImageKey = nodeKey;

                // seed ratio if we have both
                this.imageAspectRatio = w > 0 && h > 0 ? w / h : null;

                // default lock ON
                this.imageLockAspect = true;
                this.imageLastChanged = null;

                // Populate extended fields
                this.imageCssClasses = node.getCssClasses();
                this.imageAlignment = node.getAlignment();
                this.imageLinkUrl = node.getLinkUrl();
                this.imageLinkTarget = node.getLinkTarget();
                this.imageLoading = node.getLoading();

                this.$dispatch('open-modal', { id: modalId });
            });
        },

        deleteImage: function (nodeKey?: string) {
            if (!this.editor) return;

            const key = nodeKey ?? this.activeImageKey ?? '';
            if (!key) return;

            this.editor.update(() => {
                const node = $getNodeByKey(key);
                if ($isImageNode(node)) {
                    // Track the deleted image URL for cleanup on save
                    const src = node.getSrc();
                    if (src && !this.deletedImages.includes(src)) {
                        this.deletedImages.push(src);
                    }
                    node.remove();
                }
            });

            this.resetImageEditorForm();
            this.activeImageKey = null;
            this.closeImageEditorModal();
        },

        updateImage: function () {
            if (!this.editor) return;

            const key = this.activeImageKey ?? '';
            if (!key) return;

            const modal = refEl<HTMLElement>(this.$refs, 'imageEditorModal');
            if (!modal) return;

            const altEl = modal.querySelector("[x-ref='image_editor_alt']") as HTMLInputElement | null;
            const widthEl = modal.querySelector("[x-ref='image_editor_width']") as HTMLInputElement | null;
            const heightEl = modal.querySelector("[x-ref='image_editor_height']") as HTMLInputElement | null;
            if (!altEl || !widthEl || !heightEl) return;

            const alt = altEl.value ?? '';

            let width = Number(widthEl.value);
            let height = Number(heightEl.value);

            width = Number.isFinite(width) ? width : 0;
            height = Number.isFinite(height) ? height : 0;

            // enforce aspect lock on submit too
            if (this.imageLockAspect && this.imageAspectRatio) {
                if (this.imageLastChanged === 'height' && height > 0) {
                    width = Math.round(height * this.imageAspectRatio);
                    widthEl.value = String(width);
                } else if (width > 0) {
                    height = Math.round(width / this.imageAspectRatio);
                    heightEl.value = String(height);
                }
            }

            this.editor.update(() => {
                const node = $getNodeByKey(key);
                if (!$isImageNode(node)) return;

                node.setAltText(alt);
                node.setWidthAndHeight(width, height);
                node.setCssClasses(this.imageCssClasses);
                node.setAlignment(this.imageAlignment);
                node.setLinkUrl(this.imageLinkUrl);
                node.setLinkTarget(this.imageLinkTarget);
                node.setLoading(this.imageLoading);
            });

            this.resetImageEditorForm();
            this.activeImageKey = null;
            this.closeImageEditorModal();
        },

        resetImageEditorForm: function () {
            const modal = refEl<HTMLElement>(this.$refs, 'imageEditorModal');
            if (!modal) return;

            const altEl = modal.querySelector("[x-ref='image_editor_alt']") as HTMLInputElement | null;
            const widthEl = modal.querySelector("[x-ref='image_editor_width']") as HTMLInputElement | null;
            const heightEl = modal.querySelector("[x-ref='image_editor_height']") as HTMLInputElement | null;

            if (altEl) altEl.value = '';
            if (widthEl) widthEl.value = '';
            if (heightEl) heightEl.value = '';

            this.imageAspectRatio = null;
            this.imageLastChanged = null;
            this.imageLockAspect = true;
            this.imageCssClasses = '';
            this.imageAlignment = 'none' as ImageAlignment;
            this.imageLinkUrl = '';
            this.imageLinkTarget = '_blank';
            this.imageLoading = 'lazy';
        },

        closeImageEditorModal: function () {
            const modal = refEl<HTMLElement>(this.$refs, 'imageEditorModal');
            const modalId = modal?.getAttribute('modal-id') ?? null;
            if (!modalId) return;

            this.$dispatch('close-modal', { id: modalId });
        },

        toggleImageLockAspect: function () {
            // Blade uses x-model, so the boolean is already updated at this point
            if (this.imageLockAspect && !this.imageAspectRatio) {
                const modal = refEl<HTMLElement>(this.$refs, 'imageEditorModal');
                if (!modal) return;

                const widthEl = modal.querySelector("[x-ref='image_editor_width']") as HTMLInputElement | null;
                const heightEl = modal.querySelector("[x-ref='image_editor_height']") as HTMLInputElement | null;
                if (!widthEl || !heightEl) return;

                const w = Number(widthEl.value);
                const h = Number(heightEl.value);

                if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
                    this.imageAspectRatio = w / h;
                }
            }
        },

        imageWidthInput: function () {
            this.imageLastChanged = 'width';
            if (!this.imageLockAspect) return;

            const modal = refEl<HTMLElement>(this.$refs, 'imageEditorModal');
            if (!modal) return;

            const widthEl = modal.querySelector("[x-ref='image_editor_width']") as HTMLInputElement | null;
            const heightEl = modal.querySelector("[x-ref='image_editor_height']") as HTMLInputElement | null;
            if (!widthEl || !heightEl) return;

            const w = Number(widthEl.value);
            if (!Number.isFinite(w) || w <= 0) return;

            // derive ratio if missing but height exists
            const hNow = Number(heightEl.value);
            if (!this.imageAspectRatio && Number.isFinite(hNow) && hNow > 0) {
                this.imageAspectRatio = w / hNow;
            }

            if (!this.imageAspectRatio) return;

            const newH = Math.round(w / this.imageAspectRatio);
            heightEl.value = String(newH);
        },

        imageHeightInput: function () {
            this.imageLastChanged = 'height';
            if (!this.imageLockAspect) return;

            const modal = refEl<HTMLElement>(this.$refs, 'imageEditorModal');
            if (!modal) return;

            const widthEl = modal.querySelector("[x-ref='image_editor_width']") as HTMLInputElement | null;
            const heightEl = modal.querySelector("[x-ref='image_editor_height']") as HTMLInputElement | null;
            if (!widthEl || !heightEl) return;

            const h = Number(heightEl.value);
            if (!Number.isFinite(h) || h <= 0) return;

            // derive ratio if missing but width exists
            const wNow = Number(widthEl.value);
            if (!this.imageAspectRatio && Number.isFinite(wNow) && wNow > 0) {
                this.imageAspectRatio = wNow / h;
            }

            if (!this.imageAspectRatio) return;

            const newW = Math.round(h * this.imageAspectRatio);
            widthEl.value = String(newW);
        },

        // ---------- TABLE ----------
        showTableEditorDialog: function (element: HTMLElement) {
            // Toggle if already open
            if (this.showTableEditor) {
                this.closeTableEditorDialog();
                return;
            }
            // Close all other dialogs first
            this.closeAllDialogs();
            this.$nextTick(() => {
                this.tableEditorAnchor = element;
                this.showTableEditor = true;
                // Reset defaults
                this.tableRows = 3;
                this.tableCols = 3;
                this.tableHasHeaders = true;
                this.tableBorderStyle = 'light';
                this.tableCellPadding = 'normal';
            });
        },

        closeTableEditorDialog: function () {
            this.$nextTick(() => {
                this.tableEditorAnchor = null;
                this.showTableEditor = false;
            });
        },

        insertTable: function () {
            if (!this.editor) {
                return;
            }

            const payload: InsertTablePayload = {
                rows: this.tableRows,
                columns: this.tableCols,
                includeHeaders: this.tableHasHeaders,
                borderStyle: this.tableBorderStyle,
                cellPadding: this.tableCellPadding,
                layout: this.tableLayout,
                width: this.tableWidth,
            };

            this.editor.dispatchCommand(INSERT_TABLE_COMMAND, payload);
            this.closeTableEditorDialog();
        },

        // ---------- LAYOUT ----------
        showLayoutEditorDialog: function (element: HTMLElement) {
            // Toggle if already open
            if (this.showLayoutEditor) {
                this.closeLayoutEditorDialog();
                return;
            }
            // Close all other dialogs first
            this.closeAllDialogs();
            this.$nextTick(() => {
                this.layoutEditorAnchor = element;
                this.showLayoutEditor = true;
                // Reset defaults
                this.layoutColumns = 2;
            });
        },

        closeLayoutEditorDialog: function () {
            this.$nextTick(() => {
                this.layoutEditorAnchor = null;
                this.showLayoutEditor = false;
            });
        },

        insertLayout: function () {
            if (!this.editor) {
                return;
            }

            const payload: InsertLayoutPayload = {
                columns: this.layoutColumns,
            };

            this.editor.dispatchCommand(INSERT_LAYOUT_COMMAND, payload);
            this.closeLayoutEditorDialog();
        },

        // ---------- YOUTUBE ----------
        showYouTubeEditorDialog: function (element: HTMLElement) {
            // Toggle if already open
            if (this.showYouTubeEditor) {
                this.closeYouTubeEditorDialog();
                return;
            }
            // Close all other dialogs first
            this.closeAllDialogs();
            this.$nextTick(() => {
                this.youTubeEditorAnchor = element;
                this.showYouTubeEditor = true;
                // Reset defaults
                this.youTubeUrl = '';
                this.youTubeWidth = '100%';
                this.youTubeAlignment = 'center';
            });
        },

        closeYouTubeEditorDialog: function () {
            this.$nextTick(() => {
                this.youTubeEditorAnchor = null;
                this.showYouTubeEditor = false;
            });
        },

        insertYouTube: function () {
            if (!this.editor || !this.youTubeUrl.trim()) {
                return;
            }

            const payload: InsertYouTubePayload = {
                videoID: this.youTubeUrl.trim(),
                width: this.youTubeWidth,
                alignment: this.youTubeAlignment,
            };

            this.editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, payload);
            this.closeYouTubeEditorDialog();
        },

        // ---------- TWEET ----------
        showTweetEditorDialog: function (element: HTMLElement) {
            // Toggle if already open
            if (this.showTweetEditor) {
                this.closeTweetEditorDialog();
                return;
            }
            // Close all other dialogs first
            this.closeAllDialogs();
            this.$nextTick(() => {
                this.tweetEditorAnchor = element;
                this.showTweetEditor = true;
                // Reset defaults
                this.tweetUrl = '';
                this.tweetWidth = '550px';
                this.tweetAlignment = 'center';
            });
        },

        closeTweetEditorDialog: function () {
            this.$nextTick(() => {
                this.tweetEditorAnchor = null;
                this.showTweetEditor = false;
            });
        },

        insertTweet: function () {
            if (!this.editor || !this.tweetUrl.trim()) {
                return;
            }

            const payload: InsertTweetPayload = {
                tweetID: this.tweetUrl.trim(),
                width: this.tweetWidth,
                alignment: this.tweetAlignment,
            };

            this.editor.dispatchCommand(INSERT_TWEET_COMMAND, payload);
            this.closeTweetEditorDialog();
        },

        // ---------- COLLAPSIBLE ----------
        showCollapsibleEditorDialog: function (element: HTMLElement) {
            // Toggle if already open
            if (this.showCollapsibleEditor) {
                this.closeCollapsibleEditorDialog();
                return;
            }
            // Close all other dialogs first
            this.closeAllDialogs();
            this.$nextTick(() => {
                this.collapsibleEditorAnchor = element;
                this.showCollapsibleEditor = true;
                // Reset defaults
                this.collapsibleTitle = 'Click to expand';
                this.collapsibleOpen = true;
            });
        },

        closeCollapsibleEditorDialog: function () {
            this.$nextTick(() => {
                this.collapsibleEditorAnchor = null;
                this.showCollapsibleEditor = false;
            });
        },

        insertCollapsible: function () {
            if (!this.editor) {
                return;
            }

            const payload: InsertCollapsiblePayload = {
                title: this.collapsibleTitle,
                isOpen: this.collapsibleOpen,
            };

            this.editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, payload);
            this.closeCollapsibleEditorDialog();
        },

        // ---------- DATE ----------
        showDateEditorDialog: function (element: HTMLElement) {
            // Toggle if already open
            if (this.showDateEditor) {
                this.closeDateEditorDialog();
                return;
            }
            // Close all other dialogs first
            this.closeAllDialogs();
            this.$nextTick(() => {
                this.dateEditorAnchor = element;
                this.showDateEditor = true;
                // Reset to today's date
                this.dateValue = new Date().toISOString().split('T')[0];
                this.dateFormat = 'medium';
            });
        },

        closeDateEditorDialog: function () {
            this.$nextTick(() => {
                this.dateEditorAnchor = null;
                this.showDateEditor = false;
            });
        },

        insertDate: function () {
            if (!this.editor || !this.dateValue) {
                return;
            }

            const payload: InsertDatePayload = {
                date: new Date(this.dateValue).toISOString(),
                format: this.dateFormat,
            };

            this.editor.dispatchCommand(INSERT_DATE_COMMAND, payload);
            this.closeDateEditorDialog();
        },

        setDateToday: function () {
            this.dateValue = new Date().toISOString().split('T')[0];
        },

        setDateTomorrow: function () {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            this.dateValue = tomorrow.toISOString().split('T')[0];
        },

        setDateNextWeek: function () {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            this.dateValue = nextWeek.toISOString().split('T')[0];
        },

        getDatePreview: function (): string {
            if (!this.dateValue) return '';
            return formatDate(new Date(this.dateValue).toISOString(), this.dateFormat);
        },

        // ---------- FORMATTING ----------
        formatHeading: function (headingSize: HeadingTagType) {
            if (!this.editor) return;

            this.editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;
                $setBlocksType(selection, () => $createHeadingNode(headingSize));
            });
        },

        formatAlignment: function (elementFormatType: ElementFormatType) {
            if (!this.editor) return;
            this.editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, elementFormatType);
        },

        formatFontFamily: function (fontFamily: string) {
            if (!this.editor) return;

            this.editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                $patchStyleText(selection, {
                    'font-family': fontFamily,
                });
            });
        },

        formatText: function (formatTextType: TextFormatType) {
            if (!this.editor) return;
            this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, formatTextType);
        },

        formatParagraph: function () {
            if (!this.editor) return;

            this.editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createParagraphNode());
                }
            });
        },

        formatBulletList: function () {
            if (!this.editor) return;
            this.editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        },

        formatNumberedList: function () {
            if (!this.editor) return;
            this.editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        },

        formatLineCode: function () {
            if (!this.editor) return;
            this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
        },

        insetLink: function () {
            if (!this.editor) return;
            this.editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        },

        insetHR: function () {
            if (!this.editor) return;
            this.editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
        },

        // ---------- TOOLBAR ----------
        getToolbarActions: function () {
            return {
                bold: () => this.formatText('bold'),
                strikethrough: () => this.formatText('strikethrough'),
                subscript: () => this.formatText('subscript'),
                lowercase: () => this.formatText('lowercase'),
                uppercase: () => this.formatText('uppercase'),
                capitalize: () => this.formatText('capitalize'),
                superscript: () => this.formatText('superscript'),
                italic: () => this.formatText('italic'),
                underline: () => this.formatText('underline'),

                link: (event: Event) => {
                    event.stopPropagation();
                    this.insetLink();
                },

                h1: () => this.formatHeading('h1'),
                h2: () => this.formatHeading('h2'),
                h3: () => this.formatHeading('h3'),
                h4: () => this.formatHeading('h4'),
                h5: () => this.formatHeading('h5'),
                h6: () => this.formatHeading('h6'),
                normal: () => this.formatParagraph(),

                bullet: () => this.formatBulletList(),
                numbered: () => this.formatNumberedList(),

                quote: () => {
                    if (!this.editor) return;
                    formatQuote(this.editor);
                },

                code: () => {
                    if (!this.editor) return;
                    formatCode(this.editor);
                },

                decrement: () => {
                    if (!this.editor) return;
                    const el = refEl<HTMLInputElement>(this.$refs, 'fontSize');
                    if (!el) return;
                    updateFontSize(this.editor, UpdateFontSizeType.decrement, el);
                },

                increment: () => {
                    if (!this.editor) return;
                    const el = refEl<HTMLInputElement>(this.$refs, 'fontSize');
                    if (!el) return;
                    updateFontSize(this.editor, UpdateFontSizeType.increment, el);
                },

                icode: () => this.formatLineCode(),

                fontSizeChange: () => {
                    if (!this.editor) return;
                    const el = refEl<HTMLInputElement>(this.$refs, 'fontSize');
                    if (!el) return;
                    updateFontSizeByInputValue(this.editor, Number(el.value), el);
                },

                fontSizeKeydown: (event: KeyboardEvent) => {
                    if (!this.editor) return;
                    if (event.key !== 'Enter') return;

                    event.stopPropagation();
                    event.preventDefault();

                    const el = refEl<HTMLInputElement>(this.$refs, 'fontSize');
                    if (!el) return;
                    updateFontSizeByInputValue(this.editor, Number(el.value), el);
                },

                undo: () => this.editor?.dispatchCommand(UNDO_COMMAND, undefined),
                redo: () => this.editor?.dispatchCommand(REDO_COMMAND, undefined),

                left: () => this.formatAlignment('left'),
                right: () => this.formatAlignment('right'),
                center: () => this.formatAlignment('center'),
                justify: () => this.formatAlignment('justify'),
                start: () => this.formatAlignment('start'),
                end: () => this.formatAlignment('end'),

                indent: () => this.editor?.dispatchCommand(INDENT_CONTENT_COMMAND, undefined),
                outdent: () => this.editor?.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined),

                clear: () => {
                    if (!this.editor) return;
                    clearFormatting(this.editor);
                },

                textColor: () => {
                    const input = refEl<HTMLInputElement>(this.$refs, 'text_color_input');
                    input?.click();
                    ColorisAny({
                        swatches: this.basicColors,
                        alpha: false,
                        formatToggle: true,
                    });
                },

                textColorChange: (event: Event) => {
                    if (!this.editor) return;
                    const target = event.target as HTMLInputElement;
                    const color = target.value;

                    this.editor.update(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                            $patchStyleText(selection, { color });
                        }
                    });
                },

                backgroundColor: () => {
                    const input = refEl<HTMLInputElement>(this.$refs, 'background_color_input');
                    input?.click();
                    ColorisAny({
                        swatches: this.basicColors,
                        alpha: false,
                        formatToggle: true,
                    });
                },

                backgroundColorChange: (event: Event) => {
                    if (!this.editor) return;
                    const target = event.target as HTMLInputElement;
                    const color = target.value;

                    this.editor.update(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                            $patchStyleText(selection, { 'background-color': color });
                        }
                    });
                },

                fontFamily: (fontFamily: string) => this.formatFontFamily(fontFamily),

                hr: () => this.insetHR(),

                image: () => {
                    const modal = refEl<HTMLElement>(this.$refs, 'imageModal');
                    const modalId = modal?.getAttribute('modal-id') ?? null;
                    if (modalId) this.$dispatch('open-modal', { id: modalId });
                },

                table: (event?: Event) => {
                    if (event) event.stopPropagation();
                    const btn = refEl<HTMLElement>(this.$refs, 'table');
                    if (btn) this.showTableEditorDialog(btn);
                },

                columns: (event?: Event) => {
                    if (event) event.stopPropagation();
                    const btn = refEl<HTMLElement>(this.$refs, 'columns');
                    if (btn) this.showLayoutEditorDialog(btn);
                },

                youtube: (event?: Event) => {
                    if (event) event.stopPropagation();
                    const btn = refEl<HTMLElement>(this.$refs, 'youtube');
                    if (btn) this.showYouTubeEditorDialog(btn);
                },

                tweet: (event?: Event) => {
                    if (event) event.stopPropagation();
                    const btn = refEl<HTMLElement>(this.$refs, 'tweet');
                    if (btn) this.showTweetEditorDialog(btn);
                },

                collapsible: (event?: Event) => {
                    if (event) event.stopPropagation();
                    const btn = refEl<HTMLElement>(this.$refs, 'collapsible');
                    if (btn) this.showCollapsibleEditorDialog(btn);
                },

                date: (event?: Event) => {
                    if (event) event.stopPropagation();
                    const btn = refEl<HTMLElement>(this.$refs, 'date');
                    if (btn) this.showDateEditorDialog(btn);
                },
            };
        },

        registerToolbarActions: function () {
            const actions = this.getToolbarActions();

            this.enabledToolbars.forEach((toolbar) => {
                if (toolbar === 'backgroundColor') {
                    const btn = refEl<HTMLElement>(this.$refs, 'background_color');
                    const input = refEl<HTMLInputElement>(this.$refs, 'background_color_input');
                    btn?.addEventListener('click', () => actions.backgroundColor());
                    input?.addEventListener('change', (event) => actions.backgroundColorChange(event));
                } else if (toolbar === 'textColor') {
                    const btn = refEl<HTMLElement>(this.$refs, 'text_color');
                    const input = refEl<HTMLInputElement>(this.$refs, 'text_color_input');
                    btn?.addEventListener('click', () => actions.textColor());
                    input?.addEventListener('change', (event) => actions.textColorChange(event));
                } else if (toolbar === 'link') {
                    const btn = refEl<HTMLElement>(this.$refs, 'link');
                    btn?.addEventListener('click', (event) => actions.link(event));
                } else if (toolbar === 'fontSize') {
                    refEl<HTMLElement>(this.$refs, 'decrement')?.addEventListener('click', () =>
                        actions.decrement(),
                    );
                    refEl<HTMLElement>(this.$refs, 'increment')?.addEventListener('click', () =>
                        actions.increment(),
                    );

                    const input = refEl<HTMLInputElement>(this.$refs, 'fontSize');
                    input?.addEventListener('change', () => actions.fontSizeChange());
                    input?.addEventListener('keydown', (event) => actions.fontSizeKeydown(event));
                } else if (toolbar === 'fontFamily') {
                    const select = refEl<HTMLSelectElement>(this.$refs, 'fontFamily');
                    select?.addEventListener('change', (event: Event) => {
                        const target = event.target as HTMLSelectElement;
                        actions.fontFamily(target.value);
                    });
                } else if (toolbar === 'image') {
                    const el = refEl<HTMLElement>(this.$refs, 'image');
                    el?.addEventListener('click', () => actions.image());
                } else if (toolbar === 'table') {
                    const el = refEl<HTMLElement>(this.$refs, 'table');
                    el?.addEventListener('click', (event) => actions.table(event));
                } else if (toolbar === 'columns') {
                    const el = refEl<HTMLElement>(this.$refs, 'columns');
                    el?.addEventListener('click', (event) => actions.columns(event));
                } else if (toolbar === 'youtube') {
                    const el = refEl<HTMLElement>(this.$refs, 'youtube');
                    el?.addEventListener('click', (event) => actions.youtube(event));
                } else if (toolbar === 'tweet') {
                    const el = refEl<HTMLElement>(this.$refs, 'tweet');
                    el?.addEventListener('click', (event) => actions.tweet(event));
                } else if (toolbar === 'collapsible') {
                    const el = refEl<HTMLElement>(this.$refs, 'collapsible');
                    el?.addEventListener('click', (event) => actions.collapsible(event));
                } else if (toolbar === 'date') {
                    const el = refEl<HTMLElement>(this.$refs, 'date');
                    el?.addEventListener('click', (event) => actions.date(event));
                } else if (toolbar === 'divider') {
                    // ignore
                } else {
                    const el = refEl<HTMLElement>(this.$refs, toolbar);
                    const action = (actions as any)[toolbar];
                    if (!el || typeof action !== 'function') return;

                    el.addEventListener('click', () => action());
                }
            });
        },

        updateToolbar: function () {
            if (!this.editor) return;

            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
                const anchorNode = selection.anchor.getNode();

                let element =
                    anchorNode.getKey() === 'root'
                        ? anchorNode
                        : $findMatchingParent(anchorNode, (e) => {
                            const parent = e.getParent();
                            return parent !== null && $isRootOrShadowRoot(parent);
                        });

                if (element === null) {
                    element = anchorNode.getTopLevelElementOrThrow();
                }

                const elementKey = element.getKey();
                const elementDOM = this.editor.getElementByKey(elementKey);

                this.updateToolbarState('isRTL', $isParentElementRTL(selection));

                // link state
                const node = getSelectedNode(selection);
                const parent = node.getParent();
                const isLink = $isLinkNode(parent) || $isLinkNode(node);
                this.updateToolbarState('isLink', isLink);

                if (elementDOM !== null) {
                    if ($isListNode(element)) {
                        const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
                        const type = parentList ? parentList.getListType() : element.getListType();
                        this.updateToolbarState('blockType', type);
                    } else {
                        const type = $isHeadingNode(element) ? element.getTag() : element.getType();
                        if (type in blockTypeToBlockName) {
                            this.updateToolbarState(
                                'blockType',
                                type as keyof typeof blockTypeToBlockName,
                            );
                        }
                        if ($isCodeNode(element)) {
                            const language = element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP;
                            this.updateToolbarState(
                                'codeLanguage',
                                language ? CODE_LANGUAGE_MAP[language] || language : '',
                            );
                            return;
                        }
                    }
                }

                // styles (range selections only)
                this.updateToolbarState(
                    'fontColor',
                    $getSelectionStyleValueForProperty(selection, 'color', '#000'),
                );
                this.updateToolbarState(
                    'bgColor',
                    $getSelectionStyleValueForProperty(selection, 'background-color', '#fff'),
                );
                this.updateToolbarState(
                    'fontFamily',
                    $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
                );

                let matchingParent: any;
                if ($isLinkNode(parent)) {
                    matchingParent = $findMatchingParent(
                        node,
                        (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
                    );
                }

                this.updateToolbarState(
                    'elementFormat',
                    $isElementNode(matchingParent)
                        ? matchingParent.getFormatType()
                        : $isElementNode(node)
                            ? node.getFormatType()
                            : parent?.getFormatType() || 'left',
                );
            }

            if ($isRangeSelection(selection) || $isTableSelection(selection)) {
                this.updateToolbarState('isBold', selection.hasFormat('bold'));
                this.updateToolbarState('isItalic', selection.hasFormat('italic'));
                this.updateToolbarState('isUnderline', selection.hasFormat('underline'));
                this.updateToolbarState('isStrikethrough', selection.hasFormat('strikethrough'));
                this.updateToolbarState('isSubscript', selection.hasFormat('subscript'));
                this.updateToolbarState('isSuperscript', selection.hasFormat('superscript'));
                this.updateToolbarState('isCode', selection.hasFormat('code'));
                this.updateToolbarState(
                    'fontSize',
                    $getSelectionStyleValueForProperty(selection as any, 'font-size', '15px'),
                );
                this.updateToolbarState('isLowercase', selection.hasFormat('lowercase'));
                this.updateToolbarState('isUppercase', selection.hasFormat('uppercase'));
                this.updateToolbarState('isCapitalize', selection.hasFormat('capitalize'));
            }
        },

        updateToolbarState: function (toolbar: string, value: any) {
            (this.toolbarState as any)[toolbar] = value;

            if (toolbar === 'fontColor') {
                const input = refEl<HTMLInputElement>(this.$refs, 'text_color_input');
                if (input) {
                    const newValue = value ?? '#000000';
                    input.value = newValue;
                    // Coloris wraps input in a .clr-field div that shows the color via its style.color
                    // The input becomes a child of the .clr-field wrapper
                    const clrField = input.closest('.clr-field') as HTMLElement;
                    if (clrField) {
                        clrField.style.color = newValue;
                    }
                }
            } else if (toolbar === 'bgColor') {
                const input = refEl<HTMLInputElement>(this.$refs, 'background_color_input');
                if (input) {
                    const newValue = value ?? '#ffffff';
                    input.value = newValue;
                    // Coloris wraps input in a .clr-field div that shows the color via its style.color
                    const clrField = input.closest('.clr-field') as HTMLElement;
                    if (clrField) {
                        clrField.style.color = newValue;
                    }
                }
            } else if (toolbar === 'fontSize') {
                const input = refEl<HTMLInputElement>(this.$refs, 'fontSize');
                if (input) input.value = String(value ?? DEFAULT_FONT_SIZE).replace('px', '');
            } else if (toolbar === 'fontFamily') {
                const select = refEl<HTMLSelectElement>(this.$refs, 'fontFamily');
                if (select) select.value = String(value ?? 'Arial');
            }
        },
    };

    return component;
}
