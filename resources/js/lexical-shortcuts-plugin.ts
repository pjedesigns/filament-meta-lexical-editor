/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { HeadingTagType } from '@lexical/rich-text';
import {
    COMMAND_PRIORITY_NORMAL,
    FORMAT_ELEMENT_COMMAND,
    FORMAT_TEXT_COMMAND,
    INDENT_CONTENT_COMMAND,
    KEY_MODIFIER_COMMAND,
    LexicalEditor,
    OUTDENT_CONTENT_COMMAND,
} from 'lexical';

import {
    clearFormatting,
    formatBulletList,
    formatCheckList,
    formatCode,
    formatHeading,
    formatNumberedList,
    formatParagraph,
    formatQuote,
    updateFontSize,
    UpdateFontSizeType,
} from './utils';

import {
    isCapitalize,
    isCenterAlign,
    isClearFormatting,
    isDecreaseFontSize,
    isEndAlign,
    isFormatBulletList,
    isFormatCheckList,
    isFormatCode,
    isFormatHeading,
    isFormatNumberedList,
    isFormatParagraph,
    isFormatQuote,
    isIncreaseFontSize,
    isIndent,
    isInsertCodeBlock,
    isInsertLink,
    isJustifyAlign,
    isLeftAlign,
    isLowercase,
    isOutdent,
    isRightAlign,
    isStartAlign,
    isStrikeThrough,
    isSubscript,
    isSuperscript,
    isUppercase,
} from './shortcuts';

export function registerShortcuts(editor: LexicalEditor) {
    const keyboardShortcutsHandler = (event: KeyboardEvent): boolean => {
        if (isFormatParagraph(event)) {
            event.preventDefault();
            formatParagraph(editor);
            return true;
        }

        if (isFormatHeading(event)) {
            event.preventDefault();
            const { code } = event;
            const headingSize = `h${code[code.length - 1]}` as HeadingTagType;
            formatHeading(editor, '', headingSize);
            return true;
        }

        if (isFormatBulletList(event)) {
            event.preventDefault();
            formatBulletList(editor, '');
            return true;
        }

        if (isFormatNumberedList(event)) {
            event.preventDefault();
            formatNumberedList(editor, '');
            return true;
        }

        if (isFormatCheckList(event)) {
            event.preventDefault();
            formatCheckList(editor, '');
            return true;
        }

        if (isFormatCode(event)) {
            event.preventDefault();
            formatCode(editor, '');
            return true;
        }

        if (isFormatQuote(event)) {
            event.preventDefault();
            formatQuote(editor, '');
            return true;
        }

        if (isStrikeThrough(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
            return true;
        }

        if (isLowercase(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'lowercase');
            return true;
        }

        if (isUppercase(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'uppercase');
            return true;
        }

        if (isCapitalize(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'capitalize');
            return true;
        }

        if (isIndent(event)) {
            event.preventDefault();
            editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
            return true;
        }

        if (isOutdent(event)) {
            event.preventDefault();
            editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
            return true;
        }

        if (isCenterAlign(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
            return true;
        }

        if (isLeftAlign(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
            return true;
        }

        if (isRightAlign(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
            return true;
        }

        if (isJustifyAlign(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
            return true;
        }

        if (isStartAlign(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'start');
            return true;
        }

        if (isEndAlign(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'end');
            return true;
        }

        if (isSubscript(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
            return true;
        }

        if (isSuperscript(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
            return true;
        }

        if (isInsertCodeBlock(event)) {
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
            return true;
        }

        if (isIncreaseFontSize(event)) {
            event.preventDefault();

            const editorShell = (event.target as HTMLElement | null)?.closest('.editor-shell');
            const fontSizeElement = editorShell?.querySelector<HTMLInputElement>('[x-ref="fontSize"]');

            if (fontSizeElement) {
                updateFontSize(editor, UpdateFontSizeType.increment, fontSizeElement);
            }

            return true;
        }

        if (isDecreaseFontSize(event)) {
            event.preventDefault();

            const editorShell = (event.target as HTMLElement | null)?.closest('.editor-shell');
            const fontSizeElement = editorShell?.querySelector<HTMLInputElement>('[x-ref="fontSize"]');

            if (fontSizeElement) {
                updateFontSize(editor, UpdateFontSizeType.decrement, fontSizeElement);
            }

            return true;
        }

        if (isClearFormatting(event)) {
            event.preventDefault();
            clearFormatting(editor);
            return true;
        }

        if (isInsertLink(event)) {
            event.preventDefault();
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            return true;
        }

        return false;
    };

    return editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        keyboardShortcutsHandler,
        COMMAND_PRIORITY_NORMAL,
    );
}
