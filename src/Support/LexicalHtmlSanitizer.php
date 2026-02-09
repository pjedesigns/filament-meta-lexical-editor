<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Support;

use DOMDocument;
use DOMElement;

class LexicalHtmlSanitizer
{
    /** @var array<string, true> */
    protected static array $blockedTags = [
        'script' => true,
        'object' => true,
        'embed' => true,
        'link' => true,
        'meta' => true,
        'style' => true,
        'base' => true,
        'form' => true,
        'input' => true,
        'button' => true,
        'textarea' => true,
        'select' => true,
        'option' => true,
    ];

    /** @var array<string, true> Allowed iframe src domains */
    protected static array $allowedIframeDomains = [
        'youtube.com' => true,
        'www.youtube.com' => true,
        'youtube-nocookie.com' => true,
        'www.youtube-nocookie.com' => true,
        'player.vimeo.com' => true,
        'platform.twitter.com' => true,
    ];

    /** @var array<string, true> */
    protected static array $allowedLinkProtocols = [
        'http:' => true,
        'https:' => true,
        'mailto:' => true,
        'tel:' => true,
        'sms:' => true,
    ];

    /** @var array<string, true> */
    protected static array $allowedStyleProps = [
        'color' => true,
        'background-color' => true,
        'background' => true,
        'font-size' => true,
        'font-family' => true,
        'text-align' => true,
        'font-weight' => true,
        'font-style' => true,
        'text-decoration' => true,
        // Table-specific styles
        'width' => true,
        'max-width' => true,
        'min-width' => true,
        'table-layout' => true,
        'margin-left' => true,
        'margin-right' => true,
        'margin-top' => true,
        'margin-bottom' => true,
        'margin' => true,
        // CSS custom properties for table styling
        '--table-border-style' => true,
        '--table-cell-padding' => true,
        '--table-layout' => true,
        // Layout plugin styles
        'display' => true,
        'grid-template-columns' => true,
        'gap' => true,
        'padding' => true,
        'padding-top' => true,
        'padding-bottom' => true,
        'padding-left' => true,
        'padding-right' => true,
        'border' => true,
        'border-top' => true,
        'border-radius' => true,
        'min-height' => true,
        'height' => true,
        // YouTube/Tweet plugin styles
        'justify-content' => true,
        'align-items' => true,
        'flex-direction' => true,
        'position' => true,
        'top' => true,
        'left' => true,
        'right' => true,
        'bottom' => true,
        'overflow' => true,
        'aspect-ratio' => true,
        // Collapsible plugin styles
        'cursor' => true,
        'user-select' => true,
        'list-style' => true,
        'transition' => true,
        'transform' => true,
    ];

    public static function sanitize(string $html): string
    {
        $html = trim($html);
        if ($html === '') {
            return '';
        }

        $doc = new DOMDocument;

        // Wrap content in a temporary container to preserve multiple root elements
        // LIBXML_HTML_NOIMPLIED only works correctly with a single root element
        $wrapperId = '__sanitizer_wrapper__';
        libxml_use_internal_errors(true);
        $doc->loadHTML(
            '<?xml encoding="utf-8"?><div id="'.$wrapperId.'">'.$html.'</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );
        libxml_clear_errors();

        // 1) Remove blocked tags (and their contents)
        foreach (array_keys(self::$blockedTags) as $tag) {
            // getElementsByTagName is live; iterate backwards
            $nodes = $doc->getElementsByTagName($tag);
            for ($i = $nodes->length - 1; $i >= 0; $i--) {
                $node = $nodes->item($i);
                if ($node?->parentNode) {
                    $node->parentNode->removeChild($node);
                }
            }
        }

        // 2) Walk all elements: strip on* attrs, sanitize href/src/style
        $all = $doc->getElementsByTagName('*');
        for ($i = $all->length - 1; $i >= 0; $i--) {
            $el = $all->item($i);
            if (! $el instanceof DOMElement) {
                continue;
            }

            self::stripEventHandlers($el);
            self::sanitizeStyle($el);

            $tag = strtolower($el->tagName);

            if ($tag === 'a') {
                self::sanitizeAnchor($el);
            } elseif ($tag === 'img') {
                self::sanitizeImage($el);
            } elseif ($tag === 'iframe') {
                self::sanitizeIframe($el);
            }
        }

        // Extract the inner HTML from the wrapper div
        $wrapper = $doc->getElementById($wrapperId);
        if ($wrapper) {
            $output = '';
            foreach ($wrapper->childNodes as $child) {
                $output .= $doc->saveHTML($child);
            }
        } else {
            $output = $doc->saveHTML() ?: '';
        }

        // Strip the XML encoding declaration that was added for proper UTF-8 handling
        $output = preg_replace('/^<\?xml[^?]*\?>\s*/i', '', $output) ?? $output;

        return $output;
    }

    protected static function stripEventHandlers(DOMElement $el): void
    {
        if (! $el->hasAttributes()) {
            return;
        }

        $toRemove = [];
        foreach ($el->attributes as $attr) {
            $name = strtolower($attr->name);
            if (str_starts_with($name, 'on')) {
                $toRemove[] = $attr->name;
            }
        }

        foreach ($toRemove as $name) {
            $el->removeAttribute($name);
        }
    }

    protected static function sanitizeAnchor(DOMElement $a): void
    {
        $href = trim($a->getAttribute('href'));
        if ($href === '') {
            return;
        }

        // allow relative
        if (str_starts_with($href, '/')) {
            return;
        }

        // block javascript:, data:, file:, etc
        $proto = parse_url($href, PHP_URL_SCHEME);
        if (! $proto) {
            // e.g. "example.com" - treat as invalid and neutralize
            $a->removeAttribute('href');

            return;
        }

        $proto = strtolower($proto).':';
        if (! isset(self::$allowedLinkProtocols[$proto])) {
            $a->removeAttribute('href');
        }
    }

    /** @var array<string, true> Allowed image alignment values */
    protected static array $allowedAlignments = [
        'left' => true,
        'center' => true,
        'right' => true,
        'full' => true,
    ];

    protected static function sanitizeImage(DOMElement $img): void
    {
        $src = trim($img->getAttribute('src'));

        $isRelative = str_starts_with($src, '/');
        $isHttp = preg_match('#^https?://#i', $src) === 1;

        // block data:, file:, javascript:, blob:, etc
        if (! $isRelative && ! $isHttp) {
            $img->parentNode?->removeChild($img);

            return;
        }

        // width/height must be numeric if present
        foreach (['width', 'height'] as $attr) {
            $v = $img->getAttribute($attr);
            if ($v !== '' && ! ctype_digit($v)) {
                $img->removeAttribute($attr);
            }
        }

        // Validate loading attribute (allow only lazy or eager)
        $loading = $img->getAttribute('loading');
        if ($loading !== '' && $loading !== 'lazy' && $loading !== 'eager') {
            $img->removeAttribute('loading');
        }

        // Validate data-alignment attribute
        $alignment = $img->getAttribute('data-alignment');
        if ($alignment !== '' && ! isset(self::$allowedAlignments[$alignment])) {
            $img->removeAttribute('data-alignment');
        }

        // Validate class attribute tokens (allow safe Tailwind-style class names)
        $classAttr = trim($img->getAttribute('class'));
        if ($classAttr !== '') {
            $classes = preg_split('/\s+/', $classAttr);
            $safeClasses = array_filter($classes, function (string $cls): bool {
                // Allow alphanumeric, hyphens, underscores, colons, dots, slashes, brackets, percentages
                // Covers: rounded-lg, sm:w-1/2, hover:scale-105, w-[200px], max-w-full, etc.
                return (bool) preg_match('/^[a-zA-Z0-9\-_:.\[\]\/!%]+$/', $cls);
            });

            if (count($safeClasses) > 0) {
                $img->setAttribute('class', implode(' ', $safeClasses));
            } else {
                $img->removeAttribute('class');
            }
        }
    }

    protected static function sanitizeIframe(DOMElement $iframe): void
    {
        $src = trim($iframe->getAttribute('src'));

        // Must be HTTPS
        if (! preg_match('#^https://#i', $src)) {
            $iframe->parentNode?->removeChild($iframe);

            return;
        }

        // Extract domain from src
        $host = parse_url($src, PHP_URL_HOST);
        if (! $host || ! isset(self::$allowedIframeDomains[$host])) {
            $iframe->parentNode?->removeChild($iframe);

            return;
        }

        // Remove potentially dangerous attributes
        $dangerousAttrs = ['srcdoc', 'sandbox'];
        foreach ($dangerousAttrs as $attr) {
            if ($iframe->hasAttribute($attr)) {
                $iframe->removeAttribute($attr);
            }
        }

        // width/height validation (allow numeric or percentage)
        foreach (['width', 'height'] as $attr) {
            $v = $iframe->getAttribute($attr);
            if ($v !== '' && ! preg_match('/^\d+%?$/', $v)) {
                $iframe->removeAttribute($attr);
            }
        }
    }

    protected static function sanitizeStyle(DOMElement $el): void
    {
        $style = trim($el->getAttribute('style'));
        if ($style === '') {
            return;
        }

        $parts = array_filter(array_map('trim', explode(';', $style)));
        $kept = [];

        foreach ($parts as $part) {
            [$prop, $val] = array_map('trim', array_pad(explode(':', $part, 2), 2, ''));
            if ($prop === '' || $val === '') {
                continue;
            }

            $propLower = strtolower($prop);
            if (! isset(self::$allowedStyleProps[$propLower])) {
                continue;
            }

            // basic hard blocks inside style values
            $valLower = strtolower($val);
            if (str_contains($valLower, 'expression(') || str_contains($valLower, 'url(')) {
                continue;
            }

            $kept[] = $propLower.': '.$val;
        }

        if (count($kept) === 0) {
            $el->removeAttribute('style');
        } else {
            $el->setAttribute('style', implode('; ', $kept));
        }
    }
}
