/**
 * Plugin to reset text formatting when pressing Enter to create a new paragraph.
 * This ensures new paragraphs start with default formatting instead of inheriting
 * color, font-family, bold, italic, etc. from the previous line.
 */

import {
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    COMMAND_PRIORITY_LOW,
    INSERT_PARAGRAPH_COMMAND,
    KEY_ENTER_COMMAND,
    type LexicalEditor,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';

const COMMAND_PRIORITY_EDITOR = 4;

export function registerResetFormatOnNewParagraph(editor: LexicalEditor): () => void {
    return mergeRegister(
        // Handle the INSERT_PARAGRAPH_COMMAND which fires when Enter creates a new paragraph
        editor.registerCommand(
            INSERT_PARAGRAPH_COMMAND,
            () => {
                // Let the default behavior run first (return false)
                // Then schedule a microtask to clear formatting on the new selection
                queueMicrotask(() => {
                    editor.update(() => {
                        const selection = $getSelection();
                        if (!$isRangeSelection(selection)) {
                            return;
                        }

                        // Only reset if we're at the start of a new empty paragraph
                        const anchorNode = selection.anchor.getNode();

                        // Check if we're in a text node that just inherited formatting
                        if ($isTextNode(anchorNode)) {
                            const text = anchorNode.getTextContent();
                            // Only reset if the text node is empty (just created)
                            if (text === '') {
                                // Clear inline styles (color, background-color, font-family, font-size)
                                if (anchorNode.getStyle() !== '') {
                                    anchorNode.setStyle('');
                                }
                                // Clear format flags (bold, italic, underline, etc.)
                                if (anchorNode.getFormat() !== 0) {
                                    anchorNode.setFormat(0);
                                }
                            }
                        }
                    });
                });

                // Return false to allow the default INSERT_PARAGRAPH behavior to proceed
                return false;
            },
            COMMAND_PRIORITY_LOW,
        ),
    );
}
