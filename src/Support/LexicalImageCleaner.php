<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Support;

use DOMDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LexicalImageCleaner
{
    /**
     * Extract all image URLs from HTML content.
     */
    public static function extractImageUrls(?string $html): array
    {
        if (empty($html)) {
            return [];
        }

        $urls = [];

        libxml_use_internal_errors(true);
        $doc = new DOMDocument;
        $doc->loadHTML('<html><body>'.$html.'</body></html>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $images = $doc->getElementsByTagName('img');
        foreach ($images as $img) {
            $src = $img->getAttribute('src');
            if ($src) {
                $urls[] = $src;
            }
        }

        return $urls;
    }

    /**
     * Get image URLs that were in the old content but not in the new content.
     */
    public static function getOrphanedImages(?string $oldHtml, ?string $newHtml): array
    {
        $oldImages = self::extractImageUrls($oldHtml);
        $newImages = self::extractImageUrls($newHtml);

        return array_diff($oldImages, $newImages);
    }

    /**
     * Delete orphaned images from storage.
     *
     * @param  array  $imageUrls  Array of image URLs to delete
     */
    public static function deleteImages(array $imageUrls): void
    {
        $disk = LexicalConfig::getDisk();
        $directory = LexicalConfig::getDirectory();

        $storage = Storage::disk($disk);
        $baseUrl = $storage->url('');

        foreach ($imageUrls as $url) {
            // Only delete images that belong to our storage
            $path = self::urlToPath($url, $baseUrl, $directory);

            if ($path && $storage->exists($path)) {
                $storage->delete($path);
            }
        }
    }

    /**
     * Convert a URL to a storage path if it belongs to our disk.
     */
    protected static function urlToPath(string $url, string $baseUrl, string $directory): ?string
    {
        // Handle relative URLs like /assets/lexical/image.jpg
        if (Str::startsWith($url, '/')) {
            // Extract path after the disk's URL prefix
            $diskUrl = parse_url($baseUrl, PHP_URL_PATH) ?? '';
            $diskUrl = rtrim($diskUrl, '/');

            if ($diskUrl && Str::startsWith($url, $diskUrl.'/')) {
                return Str::after($url, $diskUrl.'/');
            }

            // Check if it starts with the directory
            if (Str::startsWith($url, '/'.$directory.'/')) {
                return ltrim($url, '/');
            }

            // Try common patterns
            foreach (['/storage/', '/assets/'] as $prefix) {
                if (Str::startsWith($url, $prefix)) {
                    $path = Str::after($url, $prefix);
                    if (Str::startsWith($path, $directory.'/')) {
                        return $path;
                    }
                }
            }
        }

        // Handle absolute URLs
        if (Str::startsWith($url, ['http://', 'https://'])) {
            $baseUrlParsed = parse_url($baseUrl);
            $urlParsed = parse_url($url);

            // Check if same host
            if (($baseUrlParsed['host'] ?? '') !== ($urlParsed['host'] ?? '')) {
                return null;
            }

            $path = $urlParsed['path'] ?? '';

            return self::urlToPath($path, $baseUrl, $directory);
        }

        return null;
    }

    /**
     * Clean up orphaned images when content is saved.
     */
    public static function cleanupOrphaned(?string $oldHtml, ?string $newHtml): void
    {
        $orphaned = self::getOrphanedImages($oldHtml, $newHtml);

        if (! empty($orphaned)) {
            self::deleteImages($orphaned);
        }
    }
}
