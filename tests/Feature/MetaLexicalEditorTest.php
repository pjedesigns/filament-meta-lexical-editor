<?php

use Pjedesigns\FilamentMetaLexicalEditor\Enums\ToolbarItem;
use Pjedesigns\FilamentMetaLexicalEditor\Infolists\Components\SanitizedHtmlEntry;
use Pjedesigns\FilamentMetaLexicalEditor\MetaLexicalEditor;
use Pjedesigns\FilamentMetaLexicalEditor\Tables\Columns\SanitizedHtmlColumn;

describe('MetaLexicalEditor', function () {
    it('can be instantiated', function () {
        $editor = MetaLexicalEditor::make('content');

        expect($editor)->toBeInstanceOf(MetaLexicalEditor::class);
    });

    it('has default toolbar items', function () {
        $editor = MetaLexicalEditor::make('content');
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toBeArray();
        expect($toolbars)->not->toBeEmpty();
    });

    it('can customize enabled toolbars', function () {
        $customToolbars = [
            ToolbarItem::BOLD,
            ToolbarItem::ITALIC,
            ToolbarItem::UNDERLINE,
        ];

        $editor = MetaLexicalEditor::make('content')
            ->enabledToolbars($customToolbars);

        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toHaveCount(3);
        expect($toolbars)->toContain(ToolbarItem::BOLD);
        expect($toolbars)->toContain(ToolbarItem::ITALIC);
        expect($toolbars)->toContain(ToolbarItem::UNDERLINE);
    });

    it('can set custom sanitizer', function () {
        $editor = MetaLexicalEditor::make('content')
            ->sanitizeHtmlUsing(fn ($html) => strip_tags($html));

        expect($editor)->toBeInstanceOf(MetaLexicalEditor::class);
    });

    it('spans full column by default', function () {
        $editor = MetaLexicalEditor::make('content');

        // In Filament 4, getColumnSpan() returns an array with 'default' key
        $columnSpan = $editor->getColumnSpan();
        expect($columnSpan['default'] ?? $columnSpan)->toBe('full');
    });
});

describe('MetaLexicalEditor Toolbar Configuration', function () {
    it('excludes IMAGE from default toolbar', function () {
        $editor = MetaLexicalEditor::make('content');
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->not->toContain(ToolbarItem::IMAGE);
    });

    it('includes TABLE in default toolbar', function () {
        $editor = MetaLexicalEditor::make('content');
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::TABLE);
    });

    it('can enable images with hasImages method', function () {
        $editor = MetaLexicalEditor::make('content')->hasImages();
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::IMAGE);
    });

    it('can disable images with hasImages(false)', function () {
        $editor = MetaLexicalEditor::make('content')->hasImages(true)->hasImages(false);
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->not->toContain(ToolbarItem::IMAGE);
    });

    it('can enable tables with hasTables method', function () {
        $editor = MetaLexicalEditor::make('content')->hasTables();
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::TABLE);
    });

    it('can disable tables with hasTables(false)', function () {
        $editor = MetaLexicalEditor::make('content')->hasTables(false);
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->not->toContain(ToolbarItem::TABLE);
    });

    it('can enable columns with hasColumns method', function () {
        $editor = MetaLexicalEditor::make('content')->hasColumns();
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::COLUMNS);
    });

    it('can disable columns with hasColumns(false)', function () {
        $editor = MetaLexicalEditor::make('content')->hasColumns(true)->hasColumns(false);
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->not->toContain(ToolbarItem::COLUMNS);
    });

    it('can enable YouTube embeds with hasYouTube method', function () {
        $editor = MetaLexicalEditor::make('content')->hasYouTube();
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::YOUTUBE);
    });

    it('can disable YouTube embeds with hasYouTube(false)', function () {
        $editor = MetaLexicalEditor::make('content')->hasYouTube(true)->hasYouTube(false);
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->not->toContain(ToolbarItem::YOUTUBE);
    });

    it('can enable Twitter embeds with hasTweets method', function () {
        $editor = MetaLexicalEditor::make('content')->hasTweets();
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::TWEET);
    });

    it('can disable Twitter embeds with hasTweets(false)', function () {
        $editor = MetaLexicalEditor::make('content')->hasTweets(true)->hasTweets(false);
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->not->toContain(ToolbarItem::TWEET);
    });

    it('can enable collapsible sections with hasCollapsible method', function () {
        $editor = MetaLexicalEditor::make('content')->hasCollapsible();
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::COLLAPSIBLE);
    });

    it('can disable collapsible sections with hasCollapsible(false)', function () {
        $editor = MetaLexicalEditor::make('content')->hasCollapsible(true)->hasCollapsible(false);
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->not->toContain(ToolbarItem::COLLAPSIBLE);
    });

    it('can enable date picker with hasDate method', function () {
        $editor = MetaLexicalEditor::make('content')->hasDate();
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::DATE);
    });

    it('can disable date picker with hasDate(false)', function () {
        $editor = MetaLexicalEditor::make('content')->hasDate(true)->hasDate(false);
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->not->toContain(ToolbarItem::DATE);
    });

    it('can enable all embeds with hasEmbeds method', function () {
        $editor = MetaLexicalEditor::make('content')->hasEmbeds();
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::YOUTUBE);
        expect($toolbars)->toContain(ToolbarItem::TWEET);
        expect($toolbars)->toContain(ToolbarItem::COLLAPSIBLE);
    });

    it('can configure toolbar using string options', function () {
        $editor = MetaLexicalEditor::make('content')
            ->toolbarOptions(['bold', 'italic', 'link']);

        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toHaveCount(3);
        expect($toolbars)->toContain(ToolbarItem::BOLD);
        expect($toolbars)->toContain(ToolbarItem::ITALIC);
        expect($toolbars)->toContain(ToolbarItem::LINK);
    });

    it('can use minimal preset', function () {
        $editor = MetaLexicalEditor::make('content')->preset('minimal');
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::BOLD);
        expect($toolbars)->toContain(ToolbarItem::ITALIC);
        expect($toolbars)->toContain(ToolbarItem::LINK);
        expect($toolbars)->not->toContain(ToolbarItem::H1);
    });

    it('can use basic preset', function () {
        $editor = MetaLexicalEditor::make('content')->preset('basic');
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::UNDO);
        expect($toolbars)->toContain(ToolbarItem::REDO);
        expect($toolbars)->toContain(ToolbarItem::BULLET);
    });

    it('can use standard preset', function () {
        $editor = MetaLexicalEditor::make('content')->preset('standard');
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::H1);
        expect($toolbars)->toContain(ToolbarItem::H2);
        expect($toolbars)->toContain(ToolbarItem::H3);
    });

    it('can use full preset', function () {
        $editor = MetaLexicalEditor::make('content')->preset('full');
        $toolbars = $editor->getEnabledToolbars();

        expect($toolbars)->toContain(ToolbarItem::IMAGE);
        expect($toolbars)->toContain(ToolbarItem::TABLE);
    });

    it('throws exception for unknown preset', function () {
        $editor = MetaLexicalEditor::make('content');

        expect(fn () => $editor->preset('unknown'))
            ->toThrow(InvalidArgumentException::class);
    });

    it('returns full toolbar configuration', function () {
        $fullToolbar = MetaLexicalEditor::getFullToolbar();

        expect($fullToolbar)->toBeArray();
        expect($fullToolbar)->toContain(ToolbarItem::IMAGE);
        expect($fullToolbar)->toContain(ToolbarItem::TABLE);
    });
});

describe('MetaLexicalEditor Internal Links', function () {
    it('can configure internal links', function () {
        $links = [
            ['title' => 'About Us', 'slug' => 'about-us'],
            ['title' => 'Contact', 'slug' => 'contact'],
        ];

        $editor = MetaLexicalEditor::make('content')
            ->internalLinks($links);

        expect($editor->getInternalLinks())->toBe($links);
        expect($editor->hasInternalLinks())->toBeTrue();
    });

    it('returns empty array when no internal links configured', function () {
        $editor = MetaLexicalEditor::make('content');

        expect($editor->getInternalLinks())->toBe([]);
        expect($editor->hasInternalLinks())->toBeFalse();
    });

    it('can configure site URL for internal links', function () {
        $editor = MetaLexicalEditor::make('content')
            ->internalLinks([['title' => 'Home', 'slug' => '']], 'https://example.com');

        expect($editor->getSiteUrl())->toBe('https://example.com');
    });

    it('uses app URL as default site URL', function () {
        $editor = MetaLexicalEditor::make('content');

        expect($editor->getSiteUrl())->toBe(config('app.url'));
    });
});

describe('ToolbarItem Enum', function () {
    it('has all expected toolbar items', function () {
        $items = ToolbarItem::cases();

        expect($items)->toContain(ToolbarItem::BOLD);
        expect($items)->toContain(ToolbarItem::ITALIC);
        expect($items)->toContain(ToolbarItem::UNDERLINE);
        expect($items)->toContain(ToolbarItem::H1);
        expect($items)->toContain(ToolbarItem::BULLET);
        expect($items)->toContain(ToolbarItem::LINK);
        expect($items)->toContain(ToolbarItem::IMAGE);
        expect($items)->toContain(ToolbarItem::TABLE);
    });

    it('implements HasLabel interface', function () {
        $item = ToolbarItem::BOLD;

        expect($item->getLabel())->toBeString();
    });

    it('returns translation keys for labels', function () {
        $item = ToolbarItem::BOLD;
        $label = $item->getLabel();

        expect($label)->toBeString();
    });

    it('divider has empty label', function () {
        $item = ToolbarItem::DIVIDER;

        expect($item->getLabel())->toBe('');
    });

    it('can be created from string value', function () {
        $item = ToolbarItem::from('bold');

        expect($item)->toBe(ToolbarItem::BOLD);
    });
});

describe('SanitizedHtmlEntry', function () {
    it('can be instantiated', function () {
        $entry = SanitizedHtmlEntry::make('content');

        expect($entry)->toBeInstanceOf(SanitizedHtmlEntry::class);
    });

    it('can set custom sanitizer', function () {
        $entry = SanitizedHtmlEntry::make('content')
            ->sanitizeUsing(fn ($html) => strip_tags($html));

        expect($entry)->toBeInstanceOf(SanitizedHtmlEntry::class);
    });
});

describe('SanitizedHtmlColumn', function () {
    it('can be instantiated', function () {
        $column = SanitizedHtmlColumn::make('content');

        expect($column)->toBeInstanceOf(SanitizedHtmlColumn::class);
    });

    it('can set custom sanitizer', function () {
        $column = SanitizedHtmlColumn::make('content')
            ->sanitizeUsing(fn ($html) => strip_tags($html));

        expect($column)->toBeInstanceOf(SanitizedHtmlColumn::class);
    });
});

describe('Configuration', function () {
    it('has default disk configuration', function () {
        $disk = config('filament-meta-lexical-editor.disk');

        expect($disk)->toBeNull();
    });

    it('has default directory configuration', function () {
        $dir = config('filament-meta-lexical-editor.directory');

        expect($dir)->toBe('lexical');
    });

    it('has font families configuration', function () {
        $fonts = config('filament-meta-lexical-editor.fonts.families');

        expect($fonts)->toBeArray();
        expect($fonts)->toHaveKey('Arial');
    });

    it('has font size limits configuration', function () {
        $minSize = config('filament-meta-lexical-editor.fonts.min_size');
        $maxSize = config('filament-meta-lexical-editor.fonts.max_size');
        $defaultSize = config('filament-meta-lexical-editor.fonts.default_size');

        expect($minSize)->toBe(8);
        expect($maxSize)->toBe(72);
        expect($defaultSize)->toBe(15);
    });

    it('has middleware configuration', function () {
        $middleware = config('filament-meta-lexical-editor.middleware');

        expect($middleware)->toBeArray();
        expect($middleware)->toContain('web');
        expect($middleware)->toContain('auth');
    });

    it('has allowed mimes configuration', function () {
        $mimes = config('filament-meta-lexical-editor.allowed_mimes');

        expect($mimes)->toBeString();
    });
});
