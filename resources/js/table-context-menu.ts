import { LexicalEditor } from 'lexical';
import {
    DELETE_TABLE_COLUMN_COMMAND,
    DELETE_TABLE_COMMAND,
    DELETE_TABLE_ROW_COMMAND,
    INSERT_TABLE_COLUMN_COMMAND,
    INSERT_TABLE_ROW_COMMAND,
    MERGE_TABLE_CELLS_COMMAND,
    SET_TABLE_CELL_BACKGROUND_COMMAND,
    SET_TABLE_BORDER_STYLE_COMMAND,
    SET_TABLE_LAYOUT_COMMAND,
    SET_TABLE_WIDTH_COMMAND,
    SET_TABLE_ALIGNMENT_COMMAND,
    UNMERGE_TABLE_CELL_COMMAND,
    type TableBorderStyle,
    type TableLayoutMode,
    type TableAlignment,
} from './lexical-table-plugin';

export interface TableContextMenuItem {
    label: string;
    action: () => void;
    icon?: string;
    divider?: boolean;
    disabled?: boolean;
}

export interface TableContextMenuConfig {
    insertRowAbove: string;
    insertRowBelow: string;
    insertColumnLeft: string;
    insertColumnRight: string;
    deleteRow: string;
    deleteColumn: string;
    mergeCells: string;
    unmergeCells: string;
    cellBackground: string;
    deleteTable: string;
    borderStyle: string;
    tableLayout: string;
    tableWidth: string;
    tableAlignment: string;
}

const DEFAULT_CONFIG: TableContextMenuConfig = {
    insertRowAbove: 'Insert row above',
    insertRowBelow: 'Insert row below',
    insertColumnLeft: 'Insert column left',
    insertColumnRight: 'Insert column right',
    deleteRow: 'Delete row',
    deleteColumn: 'Delete column',
    mergeCells: 'Merge cells',
    unmergeCells: 'Unmerge cell',
    cellBackground: 'Cell background color',
    deleteTable: 'Delete table',
    borderStyle: 'Border style',
    tableLayout: 'Table layout',
    tableWidth: 'Table width',
    tableAlignment: 'Table alignment',
};

export function createTableContextMenu(
    editor: LexicalEditor,
    config: Partial<TableContextMenuConfig> = {},
): {
    show: (x: number, y: number, canMerge: boolean, canUnmerge: boolean) => void;
    hide: () => void;
    destroy: () => void;
} {
    const labels = { ...DEFAULT_CONFIG, ...config };

    let menuElement: HTMLElement | null = null;
    let colorPickerElement: HTMLElement | null = null;

    function createMenuElement(): HTMLElement {
        const menu = document.createElement('div');
        menu.className = 'lexical-table-context-menu';
        menu.style.cssText = `
            position: fixed;
            z-index: 10000;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
            padding: 4px 0;
            min-width: 180px;
            display: none;
        `;

        // Dark mode support
        if (document.documentElement.classList.contains('dark')) {
            menu.style.background = '#1f2937';
            menu.style.borderColor = '#374151';
            menu.style.color = '#f3f4f6';
        }

        document.body.appendChild(menu);
        return menu;
    }

    function createMenuItem(
        label: string,
        onClick: () => void,
        disabled: boolean = false,
    ): HTMLElement {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'lexical-table-context-menu-item';
        item.textContent = label;
        item.disabled = disabled;
        item.style.cssText = `
            display: block;
            width: 100%;
            padding: 8px 12px;
            text-align: left;
            background: none;
            border: none;
            cursor: ${disabled ? 'not-allowed' : 'pointer'};
            font-size: 14px;
            color: ${disabled ? '#9ca3af' : 'inherit'};
            opacity: ${disabled ? '0.5' : '1'};
        `;

        if (!disabled) {
            item.addEventListener('mouseenter', () => {
                item.style.background = document.documentElement.classList.contains('dark')
                    ? '#374151'
                    : '#f3f4f6';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'none';
            });
            item.addEventListener('click', () => {
                onClick();
                hide();
            });
        }

        return item;
    }

    function createDivider(): HTMLElement {
        const divider = document.createElement('div');
        divider.style.cssText = `
            height: 1px;
            background: ${document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'};
            margin: 4px 0;
        `;
        return divider;
    }

    function createColorPicker(): HTMLElement {
        const picker = document.createElement('div');
        picker.className = 'lexical-table-color-picker';
        picker.style.cssText = `
            position: fixed;
            z-index: 10001;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            padding: 8px;
            display: none;
        `;

        if (document.documentElement.classList.contains('dark')) {
            picker.style.background = '#1f2937';
            picker.style.borderColor = '#374151';
        }

        const colors = [
            '#ffffff',
            '#f3f4f6',
            '#e5e7eb',
            '#d1d5db',
            '#fef2f2',
            '#fef3c7',
            '#d1fae5',
            '#dbeafe',
            '#ede9fe',
            '#fce7f3',
            '#fee2e2',
            '#fde68a',
            '#6ee7b7',
            '#93c5fd',
            '#c4b5fd',
            '#f9a8d4',
        ];

        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
        `;

        colors.forEach((color) => {
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.style.cssText = `
                width: 24px;
                height: 24px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                background: ${color};
                cursor: pointer;
            `;
            swatch.addEventListener('click', () => {
                editor.dispatchCommand(SET_TABLE_CELL_BACKGROUND_COMMAND, color);
                hideColorPicker();
                hide();
            });
            grid.appendChild(swatch);
        });

        // Clear color option
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.textContent = 'Clear';
        clearBtn.style.cssText = `
            width: 100%;
            margin-top: 8px;
            padding: 4px 8px;
            font-size: 12px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            background: none;
            cursor: pointer;
        `;
        clearBtn.addEventListener('click', () => {
            editor.dispatchCommand(SET_TABLE_CELL_BACKGROUND_COMMAND, '');
            hideColorPicker();
            hide();
        });

        picker.appendChild(grid);
        picker.appendChild(clearBtn);
        document.body.appendChild(picker);

        return picker;
    }

    function showColorPicker(x: number, y: number) {
        if (!colorPickerElement) {
            colorPickerElement = createColorPicker();
        }
        colorPickerElement.style.left = `${x}px`;
        colorPickerElement.style.top = `${y}px`;
        colorPickerElement.style.display = 'block';
    }

    function hideColorPicker() {
        if (colorPickerElement) {
            colorPickerElement.style.display = 'none';
        }
    }

    let submenuElement: HTMLElement | null = null;

    function createSubmenu(
        items: { label: string; value: string }[],
        onSelect: (value: string) => void,
    ): HTMLElement {
        const submenu = document.createElement('div');
        submenu.className = 'lexical-table-submenu';
        submenu.style.cssText = `
            position: fixed;
            z-index: 10001;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            padding: 4px 0;
            min-width: 140px;
            display: none;
        `;

        if (document.documentElement.classList.contains('dark')) {
            submenu.style.background = '#1f2937';
            submenu.style.borderColor = '#374151';
            submenu.style.color = '#f3f4f6';
        }

        items.forEach(({ label, value }) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.textContent = label;
            item.style.cssText = `
                display: block;
                width: 100%;
                padding: 8px 12px;
                text-align: left;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 14px;
                color: inherit;
            `;
            item.addEventListener('mouseenter', () => {
                item.style.background = document.documentElement.classList.contains('dark')
                    ? '#374151'
                    : '#f3f4f6';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = 'none';
            });
            item.addEventListener('click', () => {
                onSelect(value);
                hideSubmenu();
                hide();
            });
            submenu.appendChild(item);
        });

        document.body.appendChild(submenu);
        return submenu;
    }

    function showSubmenu(
        parentItem: HTMLElement,
        items: { label: string; value: string }[],
        onSelect: (value: string) => void,
    ) {
        hideSubmenu();
        submenuElement = createSubmenu(items, onSelect);
        const rect = parentItem.getBoundingClientRect();
        submenuElement.style.left = `${rect.right + 4}px`;
        submenuElement.style.top = `${rect.top}px`;
        submenuElement.style.display = 'block';

        // Adjust if off-screen
        requestAnimationFrame(() => {
            if (!submenuElement) return;
            const subRect = submenuElement.getBoundingClientRect();
            if (subRect.right > window.innerWidth) {
                submenuElement.style.left = `${rect.left - subRect.width - 4}px`;
            }
            if (subRect.bottom > window.innerHeight) {
                submenuElement.style.top = `${window.innerHeight - subRect.height - 10}px`;
            }
        });
    }

    function hideSubmenu() {
        if (submenuElement) {
            submenuElement.remove();
            submenuElement = null;
        }
    }

    function show(x: number, y: number, canMerge: boolean, canUnmerge: boolean) {
        if (!menuElement) {
            menuElement = createMenuElement();
        }

        // Clear previous items
        menuElement.innerHTML = '';

        // Row operations
        menuElement.appendChild(
            createMenuItem(labels.insertRowAbove, () => {
                editor.dispatchCommand(INSERT_TABLE_ROW_COMMAND, { insertAfter: false });
            }),
        );
        menuElement.appendChild(
            createMenuItem(labels.insertRowBelow, () => {
                editor.dispatchCommand(INSERT_TABLE_ROW_COMMAND, { insertAfter: true });
            }),
        );

        menuElement.appendChild(createDivider());

        // Column operations
        menuElement.appendChild(
            createMenuItem(labels.insertColumnLeft, () => {
                editor.dispatchCommand(INSERT_TABLE_COLUMN_COMMAND, { insertAfter: false });
            }),
        );
        menuElement.appendChild(
            createMenuItem(labels.insertColumnRight, () => {
                editor.dispatchCommand(INSERT_TABLE_COLUMN_COMMAND, { insertAfter: true });
            }),
        );

        menuElement.appendChild(createDivider());

        // Delete operations
        menuElement.appendChild(
            createMenuItem(labels.deleteRow, () => {
                editor.dispatchCommand(DELETE_TABLE_ROW_COMMAND, undefined);
            }),
        );
        menuElement.appendChild(
            createMenuItem(labels.deleteColumn, () => {
                editor.dispatchCommand(DELETE_TABLE_COLUMN_COMMAND, undefined);
            }),
        );

        menuElement.appendChild(createDivider());

        // Merge/Unmerge
        menuElement.appendChild(
            createMenuItem(
                labels.mergeCells,
                () => {
                    editor.dispatchCommand(MERGE_TABLE_CELLS_COMMAND, undefined);
                },
                !canMerge,
            ),
        );
        menuElement.appendChild(
            createMenuItem(
                labels.unmergeCells,
                () => {
                    editor.dispatchCommand(UNMERGE_TABLE_CELL_COMMAND, undefined);
                },
                !canUnmerge,
            ),
        );

        menuElement.appendChild(createDivider());

        // Cell background
        const bgItem = createMenuItem(labels.cellBackground, () => {
            const rect = bgItem.getBoundingClientRect();
            showColorPicker(rect.right + 4, rect.top);
        });
        menuElement.appendChild(bgItem);

        menuElement.appendChild(createDivider());

        // Border style submenu
        const borderItem = createMenuItem(`${labels.borderStyle} →`, () => {});
        borderItem.addEventListener('mouseenter', () => {
            showSubmenu(
                borderItem,
                [
                    { label: 'None', value: 'none' },
                    { label: 'Light', value: 'light' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'Heavy', value: 'heavy' },
                ],
                (value) => {
                    editor.dispatchCommand(SET_TABLE_BORDER_STYLE_COMMAND, value as TableBorderStyle);
                },
            );
        });
        menuElement.appendChild(borderItem);

        // Table layout submenu
        const layoutItem = createMenuItem(`${labels.tableLayout} →`, () => {});
        layoutItem.addEventListener('mouseenter', () => {
            showSubmenu(
                layoutItem,
                [
                    { label: 'Auto (responsive)', value: 'auto' },
                    { label: 'Fixed', value: 'fixed' },
                ],
                (value) => {
                    editor.dispatchCommand(SET_TABLE_LAYOUT_COMMAND, value as TableLayoutMode);
                },
            );
        });
        menuElement.appendChild(layoutItem);

        // Table width submenu
        const widthItem = createMenuItem(`${labels.tableWidth} →`, () => {});
        widthItem.addEventListener('mouseenter', () => {
            showSubmenu(
                widthItem,
                [
                    { label: 'Full width (100%)', value: '100%' },
                    { label: '75%', value: '75%' },
                    { label: '50%', value: '50%' },
                    { label: '600px', value: '600px' },
                    { label: '400px', value: '400px' },
                    { label: 'Auto', value: 'auto' },
                ],
                (value) => {
                    editor.dispatchCommand(SET_TABLE_WIDTH_COMMAND, value);
                },
            );
        });
        menuElement.appendChild(widthItem);

        // Table alignment submenu (only useful when width is not 100%)
        const alignItem = createMenuItem(`${labels.tableAlignment} →`, () => {});
        alignItem.addEventListener('mouseenter', () => {
            showSubmenu(
                alignItem,
                [
                    { label: 'Left', value: 'left' },
                    { label: 'Center', value: 'center' },
                    { label: 'Right', value: 'right' },
                ],
                (value) => {
                    editor.dispatchCommand(SET_TABLE_ALIGNMENT_COMMAND, value as TableAlignment);
                },
            );
        });
        menuElement.appendChild(alignItem);

        menuElement.appendChild(createDivider());

        // Delete table
        const deleteTableItem = createMenuItem(labels.deleteTable, () => {
            editor.dispatchCommand(DELETE_TABLE_COMMAND, undefined);
        });
        deleteTableItem.style.color = '#ef4444';
        menuElement.appendChild(deleteTableItem);

        // Position menu
        menuElement.style.left = `${x}px`;
        menuElement.style.top = `${y}px`;
        menuElement.style.display = 'block';

        // Adjust if off-screen
        const menuRect = menuElement.getBoundingClientRect();

        if (menuRect.right > window.innerWidth) {
            menuElement.style.left = `${Math.max(10, window.innerWidth - menuRect.width - 10)}px`;
        }
        if (menuRect.bottom > window.innerHeight) {
            menuElement.style.top = `${Math.max(10, window.innerHeight - menuRect.height - 10)}px`;
        }
        if (menuRect.top < 0) {
            menuElement.style.top = '10px';
        }
        if (menuRect.left < 0) {
            menuElement.style.left = '10px';
        }

        // Double-check adjustment in next frame
        requestAnimationFrame(() => {
            if (!menuElement) return;
            const rect = menuElement.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menuElement.style.left = `${Math.max(10, window.innerWidth - rect.width - 10)}px`;
            }
            if (rect.bottom > window.innerHeight) {
                menuElement.style.top = `${Math.max(10, window.innerHeight - rect.height - 10)}px`;
            }
        });

        // Close on outside click - defer registration to avoid the current event triggering it
        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
            document.addEventListener('contextmenu', handleOutsideClick);
        }, 0);
    }

    function hide() {
        if (menuElement) {
            menuElement.style.display = 'none';
        }
        hideColorPicker();
        hideSubmenu();
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('contextmenu', handleOutsideClick);
    }

    function handleOutsideClick(event: Event) {
        const target = event.target as HTMLElement;
        if (
            menuElement &&
            !menuElement.contains(target) &&
            (!colorPickerElement || !colorPickerElement.contains(target)) &&
            (!submenuElement || !submenuElement.contains(target))
        ) {
            hide();
        }
    }

    function destroy() {
        hide();
        if (menuElement) {
            menuElement.remove();
            menuElement = null;
        }
        if (colorPickerElement) {
            colorPickerElement.remove();
            colorPickerElement = null;
        }
    }

    return { show, hide, destroy };
}
