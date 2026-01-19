<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Enums;

use Filament\Support\Contracts\HasLabel;

enum ToolbarItem: string implements HasLabel
{
    case UNDO = 'undo';
    case REDO = 'redo';
    case FONT_FAMILY = 'fontFamily';
    case NORMAL = 'normal';
    case H1 = 'h1';
    case H2 = 'h2';
    case H3 = 'h3';
    case H4 = 'h4';
    case H5 = 'h5';
    case H6 = 'h6';
    case BULLET = 'bullet';
    case NUMBERED = 'numbered';
    case QUOTE = 'quote';
    case CODE = 'code';
    case FONT_SIZE = 'fontSize';
    case BOLD = 'bold';
    case ITALIC = 'italic';
    case UNDERLINE = 'underline';
    case ICODE = 'icode';
    case LINK = 'link';
    case TEXT_COLOR = 'textColor';
    case BACKGROUND_COLOR = 'backgroundColor';
    case LOWERCASE = 'lowercase';
    case UPPERCASE = 'uppercase';
    case CAPITALIZE = 'capitalize';
    case STRIKETHROUGH = 'strikethrough';
    case SUBSCRIPT = 'subscript';
    case SUPERSCRIPT = 'superscript';
    case CLEAR = 'clear';
    case LEFT = 'left';
    case CENTER = 'center';
    case RIGHT = 'right';
    case JUSTIFY = 'justify';
    case START = 'start';
    case END = 'end';
    case INDENT = 'indent';
    case OUTDENT = 'outdent';
    case HR = 'hr';
    case IMAGE = 'image';
    case TABLE = 'table';
    case COLUMNS = 'columns';
    case YOUTUBE = 'youtube';
    case TWEET = 'tweet';
    case COLLAPSIBLE = 'collapsible';
    case DATE = 'date';
    case DIVIDER = 'divider';

    public function getLabel(): string
    {
        return match ($this) {
            self::UNDO => __('filament-meta-lexical-editor::filament-meta-lexical-editor.undo'),
            self::REDO => __('filament-meta-lexical-editor::filament-meta-lexical-editor.redo'),
            self::FONT_FAMILY => __('filament-meta-lexical-editor::filament-meta-lexical-editor.font_family'),
            self::NORMAL => __('filament-meta-lexical-editor::filament-meta-lexical-editor.normal'),
            self::H1 => __('filament-meta-lexical-editor::filament-meta-lexical-editor.heading_1'),
            self::H2 => __('filament-meta-lexical-editor::filament-meta-lexical-editor.heading_2'),
            self::H3 => __('filament-meta-lexical-editor::filament-meta-lexical-editor.heading_3'),
            self::H4 => __('filament-meta-lexical-editor::filament-meta-lexical-editor.heading_4'),
            self::H5 => __('filament-meta-lexical-editor::filament-meta-lexical-editor.heading_5'),
            self::H6 => __('filament-meta-lexical-editor::filament-meta-lexical-editor.heading_6'),
            self::BULLET => __('filament-meta-lexical-editor::filament-meta-lexical-editor.bullet_list'),
            self::NUMBERED => __('filament-meta-lexical-editor::filament-meta-lexical-editor.numbered_list'),
            self::QUOTE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.quote'),
            self::CODE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.code_block'),
            self::FONT_SIZE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.font_size'),
            self::BOLD => __('filament-meta-lexical-editor::filament-meta-lexical-editor.bold'),
            self::ITALIC => __('filament-meta-lexical-editor::filament-meta-lexical-editor.italic'),
            self::UNDERLINE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.underline'),
            self::ICODE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.insert_code_block'),
            self::LINK => __('filament-meta-lexical-editor::filament-meta-lexical-editor.insert_link'),
            self::TEXT_COLOR => __('filament-meta-lexical-editor::filament-meta-lexical-editor.formatting_text_color'),
            self::BACKGROUND_COLOR => __('filament-meta-lexical-editor::filament-meta-lexical-editor.formatting_background_color'),
            self::LOWERCASE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.lowercase'),
            self::UPPERCASE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.uppercase'),
            self::CAPITALIZE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.capitalize'),
            self::STRIKETHROUGH => __('filament-meta-lexical-editor::filament-meta-lexical-editor.strikethrough'),
            self::SUBSCRIPT => __('filament-meta-lexical-editor::filament-meta-lexical-editor.subscript'),
            self::SUPERSCRIPT => __('filament-meta-lexical-editor::filament-meta-lexical-editor.superscript'),
            self::CLEAR => __('filament-meta-lexical-editor::filament-meta-lexical-editor.clear_text_formatting'),
            self::LEFT => __('filament-meta-lexical-editor::filament-meta-lexical-editor.left_align'),
            self::CENTER => __('filament-meta-lexical-editor::filament-meta-lexical-editor.center_align'),
            self::RIGHT => __('filament-meta-lexical-editor::filament-meta-lexical-editor.right_align'),
            self::JUSTIFY => __('filament-meta-lexical-editor::filament-meta-lexical-editor.justify_align'),
            self::START => __('filament-meta-lexical-editor::filament-meta-lexical-editor.start_align'),
            self::END => __('filament-meta-lexical-editor::filament-meta-lexical-editor.end_align'),
            self::INDENT => __('filament-meta-lexical-editor::filament-meta-lexical-editor.indent'),
            self::OUTDENT => __('filament-meta-lexical-editor::filament-meta-lexical-editor.outdent'),
            self::HR => __('filament-meta-lexical-editor::filament-meta-lexical-editor.hr'),
            self::IMAGE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.image'),
            self::TABLE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.table'),
            self::COLUMNS => __('filament-meta-lexical-editor::filament-meta-lexical-editor.columns'),
            self::YOUTUBE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.youtube'),
            self::TWEET => __('filament-meta-lexical-editor::filament-meta-lexical-editor.tweet'),
            self::COLLAPSIBLE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.collapsible'),
            self::DATE => __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.date'),
            self::DIVIDER => '',
        };
    }
}
