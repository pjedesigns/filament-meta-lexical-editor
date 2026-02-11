<?php

use Pjedesigns\FilamentMetaLexicalEditor\Support\TailwindHtmlTransformer;

beforeEach(function () {
    TailwindHtmlTransformer::resetDefaults();
});

describe('TailwindHtmlTransformer', function () {
    it('transforms lexical heading classes to tailwind', function () {
        $html = '<h1 class="lexical__h1">Hello World</h1>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('text-4xl');
        expect($result)->toContain('font-bold');
        expect($result)->toContain('mb-4');
        expect($result)->not->toContain('lexical__h1');
    });

    it('transforms lexical text formatting to tailwind', function () {
        $html = '<span class="lexical__textBold">Bold text</span>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('font-bold');
        expect($result)->not->toContain('lexical__textBold');
    });

    it('transforms italic text', function () {
        $html = '<span class="lexical__textItalic">Italic text</span>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('italic');
    });

    it('transforms underline text', function () {
        $html = '<span class="lexical__textUnderline">Underlined text</span>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('underline');
    });

    it('transforms link classes', function () {
        $html = '<a href="/test" class="lexical__link">Link</a>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('text-blue-600');
        expect($result)->toContain('hover:underline');
    });

    it('transforms quote classes', function () {
        $html = '<blockquote class="lexical__quote">Quote text</blockquote>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('border-l-4');
        expect($result)->toContain('pl-4');
        expect($result)->toContain('italic');
    });

    it('transforms code block classes', function () {
        $html = '<code class="lexical__code">code here</code>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('bg-gray-100');
        expect($result)->toContain('font-mono');
    });

    it('transforms table classes', function () {
        $html = '<table class="lexical__table"><tr><td class="lexical__tableCell">Cell</td></tr></table>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('border-collapse');
        expect($result)->toContain('border');
    });

    it('preserves non-lexical classes', function () {
        $html = '<div class="custom-class lexical__h1">Content</div>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('custom-class');
        expect($result)->toContain('text-4xl');
    });

    it('keeps original classes when removeOriginal is false', function () {
        $html = '<h1 class="lexical__h1">Title</h1>';
        $result = TailwindHtmlTransformer::transform($html, [], false);

        expect($result)->toContain('lexical__h1');
        expect($result)->toContain('text-4xl');
    });

    it('accepts custom class mappings', function () {
        $html = '<h1 class="lexical__h1">Title</h1>';
        $customMap = ['lexical__h1' => 'custom-heading'];
        $result = TailwindHtmlTransformer::transform($html, $customMap);

        expect($result)->toContain('custom-heading');
        expect($result)->not->toContain('text-4xl');
    });

    it('handles empty html', function () {
        $result = TailwindHtmlTransformer::transform('');

        expect($result)->toBe('');
    });

    it('handles html without lexical classes', function () {
        $html = '<p class="regular-class">Regular content</p>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('regular-class');
    });

    it('can get default mappings', function () {
        $map = TailwindHtmlTransformer::getDefaultMap();

        expect($map)->toBeArray();
        expect($map)->toHaveKey('lexical__h1');
        expect($map)->toHaveKey('lexical__textBold');
    });

    it('can add custom mapping', function () {
        TailwindHtmlTransformer::addMapping('lexical__custom', 'custom-class');
        $map = TailwindHtmlTransformer::getDefaultMap();

        expect($map)->toHaveKey('lexical__custom');
        expect($map['lexical__custom'])->toBe('custom-class');
    });

    it('can remove mapping', function () {
        TailwindHtmlTransformer::removeMapping('lexical__h1');
        $map = TailwindHtmlTransformer::getDefaultMap();

        expect($map)->not->toHaveKey('lexical__h1');
    });

    it('can set multiple default mappings', function () {
        TailwindHtmlTransformer::setDefaultMap([
            'lexical__h1' => 'custom-h1',
            'lexical__newClass' => 'new-tailwind-class',
        ]);
        $map = TailwindHtmlTransformer::getDefaultMap();

        expect($map['lexical__h1'])->toBe('custom-h1');
        expect($map)->toHaveKey('lexical__newClass');
    });

    it('can reset to defaults', function () {
        TailwindHtmlTransformer::addMapping('lexical__custom', 'custom');
        TailwindHtmlTransformer::resetDefaults();
        $map = TailwindHtmlTransformer::getDefaultMap();

        expect($map)->not->toHaveKey('lexical__custom');
        expect($map)->toHaveKey('lexical__h1');
    });

    it('transforms multiple elements', function () {
        $html = '<h1 class="lexical__h1">Title</h1><p class="lexical__paragraph">Text</p>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('text-4xl');
        expect($result)->toContain('mb-4');
    });

    it('handles nested elements', function () {
        $html = '<p class="lexical__paragraph"><span class="lexical__textBold">Bold</span> normal</p>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('font-bold');
    });

    it('transforms all heading levels', function () {
        $html = '<h2 class="lexical__h2">H2</h2><h3 class="lexical__h3">H3</h3>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('text-3xl');
        expect($result)->toContain('text-2xl');
    });

    it('transforms case formatting classes', function () {
        $html = '<span class="lexical__textUppercase">UPPER</span>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('uppercase');
    });

    it('transforms strikethrough text', function () {
        $html = '<span class="lexical__textStrikethrough">Deleted</span>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('line-through');
        expect($result)->not->toContain('lexical__textStrikethrough');
    });

    it('transforms underline strikethrough combined', function () {
        $html = '<span class="lexical__textUnderlineStrikethrough">Both</span>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('underline');
        expect($result)->toContain('line-through');
    });

    it('transforms subscript text', function () {
        $html = '<span class="lexical__textSubscript">sub</span>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('text-xs');
        expect($result)->toContain('align-sub');
    });

    it('transforms superscript text', function () {
        $html = '<span class="lexical__textSuperscript">sup</span>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('text-xs');
        expect($result)->toContain('align-super');
    });

    it('transforms inline code text', function () {
        $html = '<span class="lexical__textCode">code</span>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('font-mono');
        expect($result)->toContain('bg-gray-100');
        expect($result)->toContain('rounded');
    });

    it('transforms lowercase text', function () {
        $html = '<span class="lexical__textLowercase">lower</span>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('lowercase');
    });

    it('transforms capitalize text', function () {
        $html = '<span class="lexical__textCapitalize">capitalize</span>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('capitalize');
    });

    it('transforms unordered list classes', function () {
        $html = '<ul class="lexical__ul"><li class="lexical__listItem">Item</li></ul>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('list-disc');
        expect($result)->toContain('list-inside');
    });

    it('transforms ordered list classes', function () {
        $html = '<ol class="lexical__ol"><li class="lexical__listItem">Item</li></ol>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('list-decimal');
        expect($result)->toContain('list-inside');
    });

    it('transforms horizontal rule classes', function () {
        $html = '<hr class="lexical__hr">';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('my-6');
        expect($result)->toContain('border-gray-300');
    });

    it('transforms editor image classes', function () {
        $html = '<img class="lexical__editor-image" src="/test.jpg">';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('max-w-full');
        expect($result)->toContain('h-auto');
    });

    it('transforms inline editor image classes', function () {
        $html = '<img class="lexical__inline-editor-image" src="/test.jpg">';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('max-w-full');
        expect($result)->toContain('h-auto');
    });

    it('transforms hashtag classes', function () {
        $html = '<span class="lexical__hashtag">#test</span>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('bg-blue-50');
        expect($result)->toContain('border-b');
    });

    it('transforms indent classes', function () {
        $html = '<p class="lexical__indent">Indented</p>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('pl-10');
    });

    it('transforms table cell header classes', function () {
        $html = '<th class="lexical__tableCellHeader">Header</th>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('font-semibold');
        expect($result)->toContain('bg-gray-100');
        expect($result)->toContain('border');
    });

    it('transforms table row striping classes', function () {
        $html = '<tr class="lexical__tableRowStriping"><td>Cell</td></tr>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('even:bg-gray-50');
    });

    it('transforms ltr direction class', function () {
        $html = '<p class="lexical__ltr">Left to right</p>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('text-left');
    });

    it('transforms rtl direction class', function () {
        $html = '<p class="lexical__rtl">Right to left</p>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('text-right');
    });

    it('transforms h4 heading', function () {
        $html = '<h4 class="lexical__h4">H4</h4>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('text-xl');
        expect($result)->toContain('font-semibold');
    });

    it('transforms h5 heading', function () {
        $html = '<h5 class="lexical__h5">H5</h5>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('text-lg');
        expect($result)->toContain('font-medium');
    });

    it('transforms h6 heading', function () {
        $html = '<h6 class="lexical__h6">H6</h6>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('text-base');
        expect($result)->toContain('font-medium');
    });

    it('removes class attribute when lexical class maps to empty string', function () {
        $html = '<li class="lexical__listItem">Item</li>';
        $result = TailwindHtmlTransformer::transform($html);

        // lexical__listItem maps to empty string, so class should be removed
        expect($result)->not->toContain('class=');
    });

    it('setDefaultMap merges with existing defaults', function () {
        TailwindHtmlTransformer::setDefaultMap([
            'lexical__custom' => 'new-class',
        ]);
        $map = TailwindHtmlTransformer::getDefaultMap();

        // Should still have original mappings
        expect($map)->toHaveKey('lexical__h1');
        expect($map)->toHaveKey('lexical__textBold');
        // Plus the new one
        expect($map)->toHaveKey('lexical__custom');
    });

    it('handles element with only unmapped classes', function () {
        $html = '<div class="my-custom-class another-class">Content</div>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('my-custom-class');
        expect($result)->toContain('another-class');
    });

    it('handles deeply nested transformations', function () {
        $html = '<div class="lexical__ltr"><p class="lexical__paragraph"><span class="lexical__textBold"><span class="lexical__textItalic">Deep</span></span></p></div>';
        $result = TailwindHtmlTransformer::transform($html);

        expect($result)->toContain('text-left');
        expect($result)->toContain('font-bold');
        expect($result)->toContain('italic');
    });

    it('default map has all expected keys', function () {
        $map = TailwindHtmlTransformer::getDefaultMap();

        $expectedKeys = [
            'lexical__h1', 'lexical__h2', 'lexical__h3', 'lexical__h4', 'lexical__h5', 'lexical__h6',
            'lexical__paragraph', 'lexical__textBold', 'lexical__textItalic', 'lexical__textUnderline',
            'lexical__textStrikethrough', 'lexical__textUnderlineStrikethrough',
            'lexical__textSubscript', 'lexical__textSuperscript', 'lexical__textCode',
            'lexical__textLowercase', 'lexical__textUppercase', 'lexical__textCapitalize',
            'lexical__link', 'lexical__ul', 'lexical__ol', 'lexical__listItem',
            'lexical__quote', 'lexical__code', 'lexical__table', 'lexical__tableCell',
            'lexical__tableCellHeader', 'lexical__tableRowStriping',
            'lexical__ltr', 'lexical__rtl', 'lexical__hr',
            'lexical__editor-image', 'lexical__inline-editor-image',
            'lexical__hashtag', 'lexical__indent',
        ];

        foreach ($expectedKeys as $key) {
            expect($map)->toHaveKey($key);
        }
    });
});
