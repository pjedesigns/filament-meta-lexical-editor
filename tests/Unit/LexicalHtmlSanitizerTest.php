<?php

use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalHtmlSanitizer;

describe('LexicalHtmlSanitizer', function () {
    describe('XSS Prevention', function () {
        it('removes script tags', function () {
            $html = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<script');
            expect($result)->not->toContain('alert');
            expect($result)->toContain('Hello');
            expect($result)->toContain('World');
        });

        it('removes iframe tags', function () {
            $html = '<p>Content</p><iframe src="https://evil.com"></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<iframe');
            expect($result)->not->toContain('evil.com');
        });

        it('removes object and embed tags', function () {
            $html = '<object data="malware.swf"></object><embed src="malware.swf">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<object');
            expect($result)->not->toContain('<embed');
        });

        it('removes onclick and other event handlers', function () {
            $html = '<p onclick="alert(1)">Click me</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('onclick');
            expect($result)->toContain('Click me');
        });

        it('removes onerror event handlers', function () {
            $html = '<img src="x" onerror="alert(1)">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('onerror');
        });

        it('removes onload event handlers', function () {
            $html = '<body onload="malicious()"><p>Content</p></body>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('onload');
        });

        it('removes javascript: URLs from links', function () {
            $html = '<a href="javascript:alert(1)">Click</a>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('javascript:');
            expect($result)->toContain('Click');
        });

        it('removes data: URLs from images', function () {
            $html = '<img src="data:image/svg+xml,<svg onload=alert(1)>">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('data:');
        });

        it('removes style tags', function () {
            $html = '<style>body { display: none; }</style><p>Content</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<style');
            expect($result)->toContain('Content');
        });

        it('removes form elements', function () {
            $html = '<form action="/steal"><input name="password"><button>Submit</button></form>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<form');
            expect($result)->not->toContain('<input');
            expect($result)->not->toContain('<button');
        });

        it('blocks expression() in styles', function () {
            $html = '<p style="color: expression(alert(1))">Text</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('expression');
        });

        it('blocks url() in styles', function () {
            $html = '<p style="background: url(javascript:alert(1))">Text</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('url(');
        });
    });

    describe('Allowed Content', function () {
        it('preserves basic paragraph content', function () {
            $html = '<p>Hello World</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<p>');
            expect($result)->toContain('Hello World');
        });

        it('preserves headings', function () {
            $html = '<h1>Title</h1><h2>Subtitle</h2>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<h1>');
            expect($result)->toContain('<h2>');
        });

        it('preserves lists', function () {
            $html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<ul>');
            expect($result)->toContain('<li>');
        });

        it('preserves text formatting', function () {
            $html = '<p><strong>Bold</strong> and <em>Italic</em></p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<strong>');
            expect($result)->toContain('<em>');
        });

        it('preserves valid http links', function () {
            $html = '<a href="https://example.com">Link</a>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('href="https://example.com"');
        });

        it('preserves mailto links', function () {
            $html = '<a href="mailto:test@example.com">Email</a>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('href="mailto:test@example.com"');
        });

        it('preserves tel links', function () {
            $html = '<a href="tel:+1234567890">Call</a>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('href="tel:+1234567890"');
        });

        it('preserves relative links', function () {
            $html = '<a href="/about">About</a>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('href="/about"');
        });

        it('preserves valid image sources', function () {
            $html = '<img src="https://example.com/image.jpg" alt="Test">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('src="https://example.com/image.jpg"');
        });

        it('preserves relative image sources', function () {
            $html = '<img src="/uploads/image.jpg" alt="Test">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('src="/uploads/image.jpg"');
        });

        it('preserves numeric width and height on images', function () {
            $html = '<img src="/image.jpg" width="100" height="200">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('width="100"');
            expect($result)->toContain('height="200"');
        });

        it('preserves YouTube iframes', function () {
            $html = '<iframe src="https://www.youtube.com/embed/abc123" width="560" height="315"></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<iframe');
            expect($result)->toContain('youtube.com');
        });

        it('preserves YouTube no-cookie iframes', function () {
            $html = '<iframe src="https://www.youtube-nocookie.com/embed/abc123"></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<iframe');
            expect($result)->toContain('youtube-nocookie.com');
        });

        it('preserves Vimeo iframes', function () {
            $html = '<iframe src="https://player.vimeo.com/video/123456"></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<iframe');
            expect($result)->toContain('vimeo.com');
        });

        it('preserves Twitter platform iframes', function () {
            $html = '<iframe src="https://platform.twitter.com/embed/index.html"></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<iframe');
            expect($result)->toContain('platform.twitter.com');
        });

        it('removes iframes from non-allowed domains', function () {
            $html = '<iframe src="https://malicious-site.com/embed"></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<iframe');
            expect($result)->not->toContain('malicious-site.com');
        });

        it('removes HTTP iframes (requires HTTPS)', function () {
            $html = '<iframe src="http://www.youtube.com/embed/abc123"></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<iframe');
        });
    });

    describe('Style Sanitization', function () {
        it('allows safe color styles', function () {
            $html = '<p style="color: red">Red text</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('color: red');
        });

        it('allows background-color styles', function () {
            $html = '<p style="background-color: yellow">Highlighted</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('background-color: yellow');
        });

        it('allows font-size styles', function () {
            $html = '<p style="font-size: 16px">Sized text</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('font-size: 16px');
        });

        it('allows font-family styles', function () {
            $html = '<p style="font-family: Arial">Arial text</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('font-family: Arial');
        });

        it('allows text-align styles', function () {
            $html = '<p style="text-align: center">Centered</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('text-align: center');
        });

        it('removes disallowed style properties', function () {
            // Use styles that are truly not allowed (visibility, z-index, opacity)
            $html = '<p style="visibility: hidden; z-index: 9999">Styled</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('visibility');
            expect($result)->not->toContain('z-index');
        });

        it('removes style attribute when all properties are invalid', function () {
            // Use a style property that is truly not allowed
            $html = '<p style="opacity: 0.5">Hidden</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('style=');
        });
    });

    describe('Edge Cases', function () {
        it('handles empty string', function () {
            $result = LexicalHtmlSanitizer::sanitize('');

            expect($result)->toBe('');
        });

        it('handles whitespace only', function () {
            $result = LexicalHtmlSanitizer::sanitize('   ');

            expect($result)->toBe('');
        });

        it('handles malformed HTML gracefully', function () {
            $html = '<p>Unclosed paragraph<div>Mixed content';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toBeString();
        });

        it('removes non-numeric width/height from images', function () {
            $html = '<img src="/image.jpg" width="100%" height="auto">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('width="100%"');
            expect($result)->not->toContain('height="auto"');
        });

        it('removes href from links without valid protocol', function () {
            $html = '<a href="example.com">No protocol</a>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('href=');
        });
    });
});
