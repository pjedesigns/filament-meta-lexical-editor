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
});
