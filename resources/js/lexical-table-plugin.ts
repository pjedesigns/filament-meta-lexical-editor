import {
    $createParagraphNode,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_EDITOR,
    COMMAND_PRIORITY_LOW,
    createCommand,
    KEY_ESCAPE_COMMAND,
    LexicalCommand,
    LexicalEditor,
} from 'lexical';

import {
    $createTableCellNode,
    $createTableNode,
    $createTableRowNode,
    $deleteTableColumn__EXPERIMENTAL,
    $deleteTableRow__EXPERIMENTAL,
    $getNodeTriplet,
    $getTableCellNodeFromLexicalNode,
    $getTableColumnIndexFromTableCellNode,
    $getTableNodeFromLexicalNodeOrThrow,
    $getTableRowIndexFromTableCellNode,
    $insertTableColumn__EXPERIMENTAL,
    $insertTableRow__EXPERIMENTAL,
    $isTableCellNode,
    $isTableNode,
    $isTableRowNode,
    $isTableSelection,
    $unmergeCell,
    getTableObserverFromTableElement,
    HTMLTableElementWithWithTableSelectionState,
    TableCellHeaderStates,
    TableCellNode,
    TableNode,
    TableObserver,
    TableRowNode,
    TableSelection,
    registerTablePlugin as registerLexicalTablePlugin,
    registerTableSelectionObserver,
} from '@lexical/table';

import { $findMatchingParent, mergeRegister } from '@lexical/utils';

export interface InsertTablePayload {
    rows: number;
    columns: number;
    includeHeaders?: boolean;
    borderStyle?: 'none' | 'light' | 'medium' | 'heavy';
    cellPadding?: 'compact' | 'normal' | 'relaxed';
    layout?: 'auto' | 'fixed';
    width?: string;
}

export const INSERT_TABLE_COMMAND: LexicalCommand<InsertTablePayload> =
    createCommand('INSERT_TABLE_COMMAND');

export const INSERT_TABLE_ROW_COMMAND: LexicalCommand<{ insertAfter: boolean }> =
    createCommand('INSERT_TABLE_ROW_COMMAND');

export const INSERT_TABLE_COLUMN_COMMAND: LexicalCommand<{ insertAfter: boolean }> =
    createCommand('INSERT_TABLE_COLUMN_COMMAND');

export const DELETE_TABLE_ROW_COMMAND: LexicalCommand<void> =
    createCommand('DELETE_TABLE_ROW_COMMAND');

export const DELETE_TABLE_COLUMN_COMMAND: LexicalCommand<void> =
    createCommand('DELETE_TABLE_COLUMN_COMMAND');

export const DELETE_TABLE_COMMAND: LexicalCommand<void> =
    createCommand('DELETE_TABLE_COMMAND');

export const MERGE_TABLE_CELLS_COMMAND: LexicalCommand<void> =
    createCommand('MERGE_TABLE_CELLS_COMMAND');

export const UNMERGE_TABLE_CELL_COMMAND: LexicalCommand<void> =
    createCommand('UNMERGE_TABLE_CELL_COMMAND');

export const SET_TABLE_CELL_BACKGROUND_COMMAND: LexicalCommand<string> =
    createCommand('SET_TABLE_CELL_BACKGROUND_COMMAND');

export type TableBorderStyle = 'none' | 'light' | 'medium' | 'heavy';
export type TableLayoutMode = 'auto' | 'fixed';
export type TableAlignment = 'left' | 'center' | 'right';

export const SET_TABLE_BORDER_STYLE_COMMAND: LexicalCommand<TableBorderStyle> =
    createCommand('SET_TABLE_BORDER_STYLE_COMMAND');

export const SET_TABLE_LAYOUT_COMMAND: LexicalCommand<TableLayoutMode> =
    createCommand('SET_TABLE_LAYOUT_COMMAND');

export const SET_TABLE_WIDTH_COMMAND: LexicalCommand<string> =
    createCommand('SET_TABLE_WIDTH_COMMAND');

export const SET_TABLE_ALIGNMENT_COMMAND: LexicalCommand<TableAlignment> =
    createCommand('SET_TABLE_ALIGNMENT_COMMAND');

function $createTableNodeWithDimensions(
    rowCount: number,
    columnCount: number,
    includeHeaders: boolean = true,
): TableNode {
    const tableNode = $createTableNode();

    for (let i = 0; i < rowCount; i++) {
        const tableRowNode = $createTableRowNode();

        for (let j = 0; j < columnCount; j++) {
            const headerState =
                includeHeaders && i === 0
                    ? TableCellHeaderStates.ROW
                    : TableCellHeaderStates.NO_STATUS;

            const tableCellNode = $createTableCellNode(headerState);
            const paragraphNode = $createParagraphNode();
            tableCellNode.append(paragraphNode);
            tableRowNode.append(tableCellNode);
        }

        tableNode.append(tableRowNode);
    }

    return tableNode;
}

export function registerTablePlugin(editor: LexicalEditor): () => void {
    // Register the official Lexical table plugin first (handles selection, mutations, HTML export)
    const removeOfficialTablePlugin = registerLexicalTablePlugin(editor);

    // Register table selection observer (enables clicking/selecting table cells)
    // hasTabHandler = true allows Tab key to navigate between cells
    const removeTableSelectionObserver = registerTableSelectionObserver(editor, true);

    const removeInsertTableCommand = editor.registerCommand(
        INSERT_TABLE_COMMAND,
        (payload: InsertTablePayload) => {
            const { rows, columns, includeHeaders = true, borderStyle, cellPadding, layout, width } = payload;

            editor.update(() => {
                const selection = $getSelection();

                if (!$isRangeSelection(selection)) {
                    return;
                }

                const tableNode = $createTableNodeWithDimensions(
                    Number(rows),
                    Number(columns),
                    includeHeaders,
                );

                // Build style string with all table options
                const styles: string[] = [];

                if (borderStyle) {
                    styles.push(`--table-border-style: ${borderStyle}`);
                }
                if (cellPadding) {
                    styles.push(`--table-cell-padding: ${cellPadding}`);
                }
                if (layout) {
                    styles.push(`table-layout: ${layout}`);
                    styles.push(`--table-layout: ${layout}`);
                }
                if (width && width !== '100%') {
                    styles.push(`width: ${width}`);
                    styles.push(`max-width: ${width}`);
                }

                if (styles.length > 0) {
                    tableNode.setStyle(styles.join('; '));
                }

                selection.insertNodes([tableNode]);

                // Focus the first cell
                const firstCell = tableNode.getFirstDescendant();
                if (firstCell) {
                    firstCell.selectEnd();
                }
            });

            return true;
        },
        COMMAND_PRIORITY_EDITOR,
    );

    const removeInsertRowCommand = editor.registerCommand(
        INSERT_TABLE_ROW_COMMAND,
        (payload: { insertAfter: boolean }) => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
                return false;
            }

            $insertTableRow__EXPERIMENTAL(payload.insertAfter);
            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    const removeInsertColumnCommand = editor.registerCommand(
        INSERT_TABLE_COLUMN_COMMAND,
        (payload: { insertAfter: boolean }) => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
                return false;
            }

            $insertTableColumn__EXPERIMENTAL(payload.insertAfter);
            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    const removeDeleteRowCommand = editor.registerCommand(
        DELETE_TABLE_ROW_COMMAND,
        () => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
                return false;
            }

            $deleteTableRow__EXPERIMENTAL();
            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    const removeDeleteColumnCommand = editor.registerCommand(
        DELETE_TABLE_COLUMN_COMMAND,
        () => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
                return false;
            }

            $deleteTableColumn__EXPERIMENTAL();
            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    const removeDeleteTableCommand = editor.registerCommand(
        DELETE_TABLE_COMMAND,
        () => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
                return false;
            }

            const tableNode = $findMatchingParent(
                selection.anchor.getNode(),
                (node) => $isTableNode(node),
            );

            if ($isTableNode(tableNode)) {
                tableNode.remove();
                return true;
            }

            return false;
        },
        COMMAND_PRIORITY_LOW,
    );

    const removeMergeCellsCommand = editor.registerCommand(
        MERGE_TABLE_CELLS_COMMAND,
        () => {
            const selection = $getSelection();

            if (!$isTableSelection(selection)) {
                return false;
            }

            const nodes = selection.getNodes();
            const cells = nodes.filter((node): node is TableCellNode => $isTableCellNode(node));

            if (cells.length < 2) {
                return false;
            }

            // Get the table and merge cells
            const tableNode = $findMatchingParent(cells[0], (node) => $isTableNode(node));
            if (!$isTableNode(tableNode)) {
                return false;
            }

            // Calculate merge dimensions
            let minRow = Infinity;
            let maxRow = -1;
            let minCol = Infinity;
            let maxCol = -1;

            for (const cell of cells) {
                const rowIndex = $getTableRowIndexFromTableCellNode(cell);
                const colIndex = $getTableColumnIndexFromTableCellNode(cell);

                minRow = Math.min(minRow, rowIndex);
                maxRow = Math.max(maxRow, rowIndex + (cell.getRowSpan() || 1) - 1);
                minCol = Math.min(minCol, colIndex);
                maxCol = Math.max(maxCol, colIndex + (cell.getColSpan() || 1) - 1);
            }

            const rowSpan = maxRow - minRow + 1;
            const colSpan = maxCol - minCol + 1;

            // Get the top-left cell
            const rows = tableNode.getChildren() as TableRowNode[];
            const targetCell = (rows[minRow]?.getChildren() as TableCellNode[])?.[minCol];

            if (!targetCell) {
                return false;
            }

            // Merge content from other cells into target
            for (const cell of cells) {
                if (cell !== targetCell) {
                    const children = cell.getChildren();
                    for (const child of children) {
                        targetCell.append(child);
                    }
                    cell.remove();
                }
            }

            // Set span on target cell
            targetCell.setRowSpan(rowSpan);
            targetCell.setColSpan(colSpan);

            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    const removeUnmergeCellCommand = editor.registerCommand(
        UNMERGE_TABLE_CELL_COMMAND,
        () => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection)) {
                return false;
            }

            const cell = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
            if (!cell) {
                return false;
            }

            $unmergeCell();
            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    const removeSetBackgroundCommand = editor.registerCommand(
        SET_TABLE_CELL_BACKGROUND_COMMAND,
        (color: string) => {
            const selection = $getSelection();

            if ($isTableSelection(selection)) {
                const nodes = selection.getNodes();
                const cells = nodes.filter((node): node is TableCellNode => $isTableCellNode(node));

                for (const cell of cells) {
                    cell.setBackgroundColor(color);
                }
                return true;
            }

            if ($isRangeSelection(selection)) {
                const cell = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
                if (cell) {
                    cell.setBackgroundColor(color);
                    return true;
                }
            }

            return false;
        },
        COMMAND_PRIORITY_LOW,
    );

    // Handle Escape key to exit table and move to next line
    const removeEscapeHandler = editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return false;
            }

            const cell = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
            if (!cell) {
                return false;
            }

            const tableNode = $findMatchingParent(cell, (node) => $isTableNode(node));
            if (!$isTableNode(tableNode)) {
                return false;
            }

            // Create a new paragraph after the table and move selection there
            const paragraphNode = $createParagraphNode();
            tableNode.insertAfter(paragraphNode);
            paragraphNode.select();

            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    // Set table border style
    const removeSetBorderStyleCommand = editor.registerCommand(
        SET_TABLE_BORDER_STYLE_COMMAND,
        (borderStyle: TableBorderStyle) => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
                return false;
            }

            const anchorNode = $isTableSelection(selection)
                ? selection.anchor.getNode()
                : selection.anchor.getNode();

            const tableNode = $findMatchingParent(anchorNode, (node) => $isTableNode(node));
            if (!$isTableNode(tableNode)) {
                return false;
            }

            // Update the data attribute via style (will be handled by CSS)
            const currentStyle = tableNode.getStyle() || '';
            const newStyle = currentStyle
                .replace(/--table-border-style:\s*[^;]+;?/g, '')
                .trim();
            tableNode.setStyle(`${newStyle}; --table-border-style: ${borderStyle}`.replace(/^;\s*/, ''));

            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    // Set table layout mode (auto/fixed)
    const removeSetLayoutCommand = editor.registerCommand(
        SET_TABLE_LAYOUT_COMMAND,
        (layout: TableLayoutMode) => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
                return false;
            }

            const anchorNode = $isTableSelection(selection)
                ? selection.anchor.getNode()
                : selection.anchor.getNode();

            const tableNode = $findMatchingParent(anchorNode, (node) => $isTableNode(node));
            if (!$isTableNode(tableNode)) {
                return false;
            }

            const currentStyle = tableNode.getStyle() || '';
            const newStyle = currentStyle
                .replace(/--table-layout:\s*[^;]+;?/g, '')
                .replace(/table-layout:\s*[^;]+;?/g, '')
                .trim();
            tableNode.setStyle(`${newStyle}; table-layout: ${layout}; --table-layout: ${layout}`.replace(/^;\s*/, ''));

            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    // Set table width
    const removeSetWidthCommand = editor.registerCommand(
        SET_TABLE_WIDTH_COMMAND,
        (width: string) => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
                return false;
            }

            const anchorNode = $isTableSelection(selection)
                ? selection.anchor.getNode()
                : selection.anchor.getNode();

            const tableNode = $findMatchingParent(anchorNode, (node) => $isTableNode(node));
            if (!$isTableNode(tableNode)) {
                return false;
            }

            const currentStyle = tableNode.getStyle() || '';
            const newStyle = currentStyle
                .replace(/width:\s*[^;]+;?/g, '')
                .replace(/max-width:\s*[^;]+;?/g, '')
                .trim();

            if (width === 'auto' || width === '100%') {
                tableNode.setStyle(`${newStyle}; width: 100%; max-width: 100%`.replace(/^;\s*/, ''));
            } else {
                tableNode.setStyle(`${newStyle}; width: ${width}; max-width: ${width}`.replace(/^;\s*/, ''));
            }

            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    // Set table alignment (left, center, right)
    const removeSetAlignmentCommand = editor.registerCommand(
        SET_TABLE_ALIGNMENT_COMMAND,
        (alignment: 'left' | 'center' | 'right') => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
                return false;
            }

            const anchorNode = $isTableSelection(selection)
                ? selection.anchor.getNode()
                : selection.anchor.getNode();

            const tableNode = $findMatchingParent(anchorNode, (node) => $isTableNode(node));
            if (!$isTableNode(tableNode)) {
                return false;
            }

            const currentStyle = tableNode.getStyle() || '';
            const newStyle = currentStyle
                .replace(/margin-left:\s*[^;]+;?/g, '')
                .replace(/margin-right:\s*[^;]+;?/g, '')
                .trim();

            let alignmentStyle = '';
            switch (alignment) {
                case 'left':
                    alignmentStyle = 'margin-left: 0; margin-right: auto';
                    break;
                case 'center':
                    alignmentStyle = 'margin-left: auto; margin-right: auto';
                    break;
                case 'right':
                    alignmentStyle = 'margin-left: auto; margin-right: 0';
                    break;
            }

            tableNode.setStyle(`${newStyle}; ${alignmentStyle}`.replace(/^;\s*/, ''));

            return true;
        },
        COMMAND_PRIORITY_LOW,
    );

    return mergeRegister(
        removeOfficialTablePlugin,
        removeTableSelectionObserver,
        removeInsertTableCommand,
        removeInsertRowCommand,
        removeInsertColumnCommand,
        removeDeleteRowCommand,
        removeDeleteColumnCommand,
        removeDeleteTableCommand,
        removeMergeCellsCommand,
        removeUnmergeCellCommand,
        removeSetBackgroundCommand,
        removeEscapeHandler,
        removeSetBorderStyleCommand,
        removeSetLayoutCommand,
        removeSetWidthCommand,
        removeSetAlignmentCommand,
    );
}

export {
    TableNode,
    TableCellNode,
    TableRowNode,
    $isTableNode,
    $isTableCellNode,
    $isTableRowNode,
    $isTableSelection,
};
