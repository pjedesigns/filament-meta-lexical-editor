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

    describe('SMS and Additional Link Protocols', function () {
        it('preserves sms links', function () {
            $html = '<a href="sms:+1234567890">Text</a>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('href="sms:+1234567890"');
        });

        it('preserves http links', function () {
            $html = '<a href="http://example.com">Link</a>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('href="http://example.com"');
        });

        it('removes ftp links', function () {
            $html = '<a href="ftp://files.example.com/file.txt">FTP</a>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('href=');
        });

        it('removes file: protocol links', function () {
            $html = '<a href="file:///etc/passwd">File</a>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('href=');
        });

        it('preserves empty href links', function () {
            $html = '<a href="">Empty</a>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<a');
            expect($result)->toContain('Empty');
        });
    });

    describe('Image Attribute Validation', function () {
        it('preserves lazy loading attribute', function () {
            $html = '<img src="/image.jpg" loading="lazy">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('loading="lazy"');
        });

        it('preserves eager loading attribute', function () {
            $html = '<img src="/image.jpg" loading="eager">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('loading="eager"');
        });

        it('removes invalid loading attribute', function () {
            $html = '<img src="/image.jpg" loading="invalid">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('loading=');
        });

        it('preserves valid data-alignment attributes', function () {
            foreach (['left', 'center', 'right', 'full'] as $alignment) {
                $html = '<img src="/image.jpg" data-alignment="'.$alignment.'">';
                $result = LexicalHtmlSanitizer::sanitize($html);

                expect($result)->toContain('data-alignment="'.$alignment.'"');
            }
        });

        it('removes invalid data-alignment attribute', function () {
            $html = '<img src="/image.jpg" data-alignment="invalid">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('data-alignment=');
        });

        it('preserves safe class tokens on images', function () {
            $html = '<img src="/image.jpg" class="rounded-lg max-w-full">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('rounded-lg');
            expect($result)->toContain('max-w-full');
        });

        it('removes unsafe class tokens from images', function () {
            $html = '<img src="/image.jpg" class="safe-class {malicious} normal">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('{malicious}');
        });

        it('removes class attribute when all tokens are unsafe', function () {
            $html = '<img src="/image.jpg" class="{bad} <worse>">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('class=');
        });

        it('removes images with data: src', function () {
            $html = '<img src="data:image/png;base64,abc123">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<img');
        });

        it('removes images with javascript: src', function () {
            $html = '<img src="javascript:alert(1)">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<img');
        });

        it('removes images with blob: src', function () {
            $html = '<img src="blob:http://evil.com/uuid">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<img');
        });
    });

    describe('Iframe Attribute Sanitization', function () {
        it('removes srcdoc from allowed iframes', function () {
            $html = '<iframe src="https://www.youtube.com/embed/abc" srcdoc="<script>alert(1)</script>"></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<iframe');
            expect($result)->not->toContain('srcdoc');
        });

        it('removes sandbox from allowed iframes', function () {
            $html = '<iframe src="https://www.youtube.com/embed/abc" sandbox="allow-scripts"></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<iframe');
            expect($result)->not->toContain('sandbox');
        });

        it('preserves numeric width on iframes', function () {
            $html = '<iframe src="https://www.youtube.com/embed/abc" width="560" height="315"></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('width="560"');
            expect($result)->toContain('height="315"');
        });

        it('preserves percentage width on iframes', function () {
            $html = '<iframe src="https://www.youtube.com/embed/abc" width="100%" height="315"></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('width="100%"');
        });

        it('removes invalid width on iframes', function () {
            $html = '<iframe src="https://www.youtube.com/embed/abc" width="auto"></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('width=');
        });

        it('removes iframes without src', function () {
            $html = '<iframe></iframe>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<iframe');
        });
    });

    describe('Blocked Tags Completeness', function () {
        it('removes meta tags', function () {
            $html = '<meta http-equiv="refresh" content="0;url=http://evil.com"><p>Content</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<meta');
        });

        it('removes base tags', function () {
            $html = '<base href="http://evil.com"><p>Content</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<base');
        });

        it('removes link tags', function () {
            $html = '<link rel="stylesheet" href="http://evil.com/style.css"><p>Content</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<link');
        });

        it('removes textarea elements', function () {
            $html = '<textarea>Hidden content</textarea><p>Visible</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<textarea');
        });

        it('removes select elements', function () {
            $html = '<select><option>A</option></select><p>Content</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<select');
            expect($result)->not->toContain('<option');
        });
    });

    describe('Style Sanitization Edge Cases', function () {
        it('preserves multiple valid style properties', function () {
            $html = '<p style="color: red; font-size: 16px; text-align: center">Styled</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('color: red');
            expect($result)->toContain('font-size: 16px');
            expect($result)->toContain('text-align: center');
        });

        it('filters out only invalid properties from mixed styles', function () {
            $html = '<p style="color: red; opacity: 0.5; font-size: 14px">Mixed</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('color: red');
            expect($result)->toContain('font-size: 14px');
            expect($result)->not->toContain('opacity');
        });

        it('allows table-specific style properties', function () {
            $html = '<table style="width: 100%; table-layout: fixed"><tr><td>Cell</td></tr></table>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('width: 100%');
            expect($result)->toContain('table-layout: fixed');
        });

        it('allows CSS custom properties for table styling', function () {
            $html = '<table style="--table-border-style: solid; --table-cell-padding: 8px"><tr><td>Cell</td></tr></table>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('--table-border-style: solid');
            expect($result)->toContain('--table-cell-padding: 8px');
        });

        it('allows layout plugin styles', function () {
            $html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">Layout</div>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('display: grid');
            expect($result)->toContain('grid-template-columns: 1fr 1fr');
            expect($result)->toContain('gap: 16px');
        });

        it('allows position and overflow styles', function () {
            $html = '<div style="position: relative; overflow: hidden; aspect-ratio: 16/9">Video</div>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('position: relative');
            expect($result)->toContain('overflow: hidden');
            expect($result)->toContain('aspect-ratio: 16/9');
        });

        it('handles style with empty value gracefully', function () {
            $html = '<p style="">Content</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            // Empty style is harmless, DOMDocument may preserve the attribute
            expect($result)->toContain('Content');
        });

        it('handles style with only semicolons', function () {
            $html = '<p style=";;;;">Content</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            // Semicolons-only style has no valid properties, attribute is removed
            expect($result)->not->toContain('style=');
        });
    });

    describe('Event Handler Removal', function () {
        it('removes onmouseover event handlers', function () {
            $html = '<p onmouseover="alert(1)">Hover me</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('onmouseover');
        });

        it('removes onfocus event handlers', function () {
            $html = '<div onfocus="alert(1)">Focus</div>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('onfocus');
        });

        it('removes onsubmit event handlers', function () {
            $html = '<div onsubmit="steal()">Content</div>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('onsubmit');
        });

        it('removes multiple event handlers from same element', function () {
            $html = '<p onclick="a()" onmouseover="b()" onmouseout="c()">Text</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('onclick');
            expect($result)->not->toContain('onmouseover');
            expect($result)->not->toContain('onmouseout');
            expect($result)->toContain('Text');
        });
    });

    describe('Allowed HTML Elements', function () {
        it('preserves blockquote elements', function () {
            $html = '<blockquote>Quote text</blockquote>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<blockquote>');
            expect($result)->toContain('Quote text');
        });

        it('preserves code elements', function () {
            $html = '<code>console.log("test")</code>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<code>');
        });

        it('preserves pre elements', function () {
            $html = '<pre>Preformatted text</pre>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<pre>');
        });

        it('preserves table elements', function () {
            $html = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<table>');
            expect($result)->toContain('<th>');
            expect($result)->toContain('<td>');
        });

        it('preserves ordered lists', function () {
            $html = '<ol><li>First</li><li>Second</li></ol>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<ol>');
            expect($result)->toContain('<li>');
        });

        it('preserves span elements', function () {
            $html = '<span class="highlight">Text</span>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<span');
            expect($result)->toContain('Text');
        });

        it('preserves div elements', function () {
            $html = '<div class="container">Content</div>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<div');
            expect($result)->toContain('Content');
        });

        it('preserves br elements', function () {
            $html = '<p>Line one<br>Line two</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<br>');
        });

        it('preserves hr elements', function () {
            $html = '<p>Above</p><hr><p>Below</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<hr>');
        });

        it('preserves sub and sup elements', function () {
            $html = '<p>H<sub>2</sub>O and x<sup>2</sup></p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('<sub>');
            expect($result)->toContain('<sup>');
        });
    });

    describe('Complex XSS Vectors', function () {
        it('handles case-insensitive javascript: in href', function () {
            $html = '<a href="JaVaScRiPt:alert(1)">Click</a>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('javascript');
            expect($result)->not->toContain('JaVaScRiPt');
        });

        it('handles nested script tags', function () {
            $html = '<div><p><script>alert(1)</script></p></div>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('<script');
            expect($result)->not->toContain('alert');
        });

        it('handles data URI in image with XSS payload', function () {
            $html = '<img src="data:text/html,<script>alert(1)</script>">';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->not->toContain('data:');
            expect($result)->not->toContain('<script');
        });

        it('preserves content around removed blocked elements', function () {
            $html = '<p>Before</p><script>evil()</script><p>After</p>';
            $result = LexicalHtmlSanitizer::sanitize($html);

            expect($result)->toContain('Before');
            expect($result)->toContain('After');
            expect($result)->not->toContain('evil');
        });
    });
});
