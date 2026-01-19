<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Support;

use Illuminate\Support\Facades\Session;

class LexicalSessionImageTracker
{
    protected const SESSION_KEY = 'lexical_uploaded_images';

    /**
     * Track an uploaded image URL in the session.
     */
    public static function trackUpload(string $url): void
    {
        $images = self::getTrackedImages();
        $images[] = $url;
        Session::put(self::SESSION_KEY, array_unique($images));
    }

    /**
     * Get all tracked image URLs from the session.
     */
    public static function getTrackedImages(): array
    {
        return Session::get(self::SESSION_KEY, []);
    }

    /**
     * Clear all tracked images from the session.
     */
    public static function clear(): void
    {
        Session::forget(self::SESSION_KEY);
    }

    /**
     * Get images that were uploaded but not in the final content.
     */
    public static function getOrphanedFromSession(?string $finalHtml): array
    {
        $trackedImages = self::getTrackedImages();

        if (empty($trackedImages)) {
            return [];
        }

        $usedImages = LexicalImageCleaner::extractImageUrls($finalHtml);

        return array_diff($trackedImages, $usedImages);
    }

    /**
     * Clean up orphaned images from the session tracking and delete them.
     */
    public static function cleanupSessionOrphans(?string $finalHtml): void
    {
        $orphaned = self::getOrphanedFromSession($finalHtml);

        if (! empty($orphaned)) {
            LexicalImageCleaner::deleteImages($orphaned);
        }

        self::clear();
    }
}
