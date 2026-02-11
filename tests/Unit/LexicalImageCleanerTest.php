<?php

use Illuminate\Support\Facades\Storage;
use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalImageCleaner;

beforeEach(function () {
    // Use a generic test disk - the package config determines which disk to use
    Storage::fake('lexical-test');
    config(['filament-meta-lexical-editor.disk' => 'lexical-test']);
    config(['filament-meta-lexical-editor.directory' => 'lexical']);
    config(['filesystems.disks.lexical-test' => [
        'driver' => 'local',
        'root' => storage_path('framework/testing'),
        'url' => '/storage',
        'visibility' => 'public',
    ]]);
});

describe('LexicalImageCleaner', function () {
    describe('extractImageUrls', function () {
        it('extracts image URLs from HTML', function () {
            $html = '<p>Some text</p><img src="/storage/lexical/image1.jpg"><p>More text</p><img src="/storage/lexical/image2.png">';

            $urls = LexicalImageCleaner::extractImageUrls($html);

            expect($urls)->toBe(['/storage/lexical/image1.jpg', '/storage/lexical/image2.png']);
        });

        it('returns empty array for HTML without images', function () {
            $html = '<p>Some text without images</p>';

            $urls = LexicalImageCleaner::extractImageUrls($html);

            expect($urls)->toBe([]);
        });

        it('returns empty array for null HTML', function () {
            $urls = LexicalImageCleaner::extractImageUrls(null);

            expect($urls)->toBe([]);
        });

        it('returns empty array for empty HTML', function () {
            $urls = LexicalImageCleaner::extractImageUrls('');

            expect($urls)->toBe([]);
        });

        it('handles malformed HTML gracefully', function () {
            $html = '<img src="/storage/lexical/image.jpg"><p>Unclosed paragraph';

            $urls = LexicalImageCleaner::extractImageUrls($html);

            expect($urls)->toBe(['/storage/lexical/image.jpg']);
        });

        it('extracts URLs with various protocols', function () {
            $html = '<img src="https://example.com/image.jpg"><img src="/local/image.png">';

            $urls = LexicalImageCleaner::extractImageUrls($html);

            expect($urls)->toBe(['https://example.com/image.jpg', '/local/image.png']);
        });
    });

    describe('getOrphanedImages', function () {
        it('returns images that were removed', function () {
            $oldHtml = '<img src="/storage/lexical/image1.jpg"><img src="/storage/lexical/image2.jpg">';
            $newHtml = '<img src="/storage/lexical/image1.jpg">';

            $orphaned = LexicalImageCleaner::getOrphanedImages($oldHtml, $newHtml);

            expect($orphaned)->toBe([1 => '/storage/lexical/image2.jpg']);
        });

        it('returns empty array when no images were removed', function () {
            $oldHtml = '<img src="/storage/lexical/image1.jpg">';
            $newHtml = '<img src="/storage/lexical/image1.jpg"><img src="/storage/lexical/image2.jpg">';

            $orphaned = LexicalImageCleaner::getOrphanedImages($oldHtml, $newHtml);

            expect($orphaned)->toBe([]);
        });

        it('returns all images when all were removed', function () {
            $oldHtml = '<img src="/storage/lexical/image1.jpg"><img src="/storage/lexical/image2.jpg">';
            $newHtml = '<p>No images anymore</p>';

            $orphaned = LexicalImageCleaner::getOrphanedImages($oldHtml, $newHtml);

            expect($orphaned)->toBe(['/storage/lexical/image1.jpg', '/storage/lexical/image2.jpg']);
        });

        it('handles null old HTML', function () {
            $orphaned = LexicalImageCleaner::getOrphanedImages(null, '<img src="/storage/lexical/image.jpg">');

            expect($orphaned)->toBe([]);
        });

        it('handles null new HTML', function () {
            $orphaned = LexicalImageCleaner::getOrphanedImages('<img src="/storage/lexical/image.jpg">', null);

            expect($orphaned)->toBe(['/storage/lexical/image.jpg']);
        });
    });

    describe('deleteImages', function () {
        it('deletes images from storage', function () {
            $disk = config('filament-meta-lexical-editor.disk');
            Storage::disk($disk)->put('lexical/image1.jpg', 'fake content');
            Storage::disk($disk)->put('lexical/image2.jpg', 'fake content');

            expect(Storage::disk($disk)->exists('lexical/image1.jpg'))->toBeTrue();
            expect(Storage::disk($disk)->exists('lexical/image2.jpg'))->toBeTrue();

            LexicalImageCleaner::deleteImages(['/storage/lexical/image1.jpg']);

            expect(Storage::disk($disk)->exists('lexical/image1.jpg'))->toBeFalse();
            expect(Storage::disk($disk)->exists('lexical/image2.jpg'))->toBeTrue();
        });

        it('handles non-existent images gracefully', function () {
            LexicalImageCleaner::deleteImages(['/storage/lexical/nonexistent.jpg']);

            // Should not throw an exception
            expect(true)->toBeTrue();
        });

        it('ignores external URLs', function () {
            $disk = config('filament-meta-lexical-editor.disk');
            Storage::disk($disk)->put('lexical/image.jpg', 'fake content');

            LexicalImageCleaner::deleteImages(['https://external.com/image.jpg']);

            // Local image should still exist
            expect(Storage::disk($disk)->exists('lexical/image.jpg'))->toBeTrue();
        });
    });

    describe('cleanupOrphaned', function () {
        it('deletes only orphaned images', function () {
            $disk = config('filament-meta-lexical-editor.disk');
            Storage::disk($disk)->put('lexical/keep.jpg', 'keep this');
            Storage::disk($disk)->put('lexical/delete.jpg', 'delete this');

            $oldHtml = '<img src="/storage/lexical/keep.jpg"><img src="/storage/lexical/delete.jpg">';
            $newHtml = '<img src="/storage/lexical/keep.jpg">';

            LexicalImageCleaner::cleanupOrphaned($oldHtml, $newHtml);

            expect(Storage::disk($disk)->exists('lexical/keep.jpg'))->toBeTrue();
            expect(Storage::disk($disk)->exists('lexical/delete.jpg'))->toBeFalse();
        });

        it('does nothing when no images were removed', function () {
            $disk = config('filament-meta-lexical-editor.disk');
            Storage::disk($disk)->put('lexical/image1.jpg', 'content');
            Storage::disk($disk)->put('lexical/image2.jpg', 'content');

            $oldHtml = '<img src="/storage/lexical/image1.jpg">';
            $newHtml = '<img src="/storage/lexical/image1.jpg"><img src="/storage/lexical/image2.jpg">';

            LexicalImageCleaner::cleanupOrphaned($oldHtml, $newHtml);

            expect(Storage::disk($disk)->exists('lexical/image1.jpg'))->toBeTrue();
            expect(Storage::disk($disk)->exists('lexical/image2.jpg'))->toBeTrue();
        });

        it('handles transition from content to empty', function () {
            $disk = config('filament-meta-lexical-editor.disk');
            Storage::disk($disk)->put('lexical/image.jpg', 'content');

            $oldHtml = '<img src="/storage/lexical/image.jpg">';
            $newHtml = '';

            LexicalImageCleaner::cleanupOrphaned($oldHtml, $newHtml);

            expect(Storage::disk($disk)->exists('lexical/image.jpg'))->toBeFalse();
        });

        it('handles null to null transition', function () {
            LexicalImageCleaner::cleanupOrphaned(null, null);

            // Should not throw an exception
            expect(true)->toBeTrue();
        });
    });

    describe('deleteImages multiple files', function () {
        it('deletes multiple images at once', function () {
            $disk = config('filament-meta-lexical-editor.disk');
            Storage::disk($disk)->put('lexical/image1.jpg', 'content1');
            Storage::disk($disk)->put('lexical/image2.jpg', 'content2');
            Storage::disk($disk)->put('lexical/image3.jpg', 'content3');

            LexicalImageCleaner::deleteImages([
                '/storage/lexical/image1.jpg',
                '/storage/lexical/image2.jpg',
            ]);

            expect(Storage::disk($disk)->exists('lexical/image1.jpg'))->toBeFalse();
            expect(Storage::disk($disk)->exists('lexical/image2.jpg'))->toBeFalse();
            expect(Storage::disk($disk)->exists('lexical/image3.jpg'))->toBeTrue();
        });

        it('handles empty array of images', function () {
            LexicalImageCleaner::deleteImages([]);

            // Should not throw an exception
            expect(true)->toBeTrue();
        });

        it('handles mix of existing and non-existing images', function () {
            $disk = config('filament-meta-lexical-editor.disk');
            Storage::disk($disk)->put('lexical/exists.jpg', 'content');

            LexicalImageCleaner::deleteImages([
                '/storage/lexical/exists.jpg',
                '/storage/lexical/nonexistent.jpg',
            ]);

            expect(Storage::disk($disk)->exists('lexical/exists.jpg'))->toBeFalse();
        });
    });

    describe('extractImageUrls edge cases', function () {
        it('extracts images with alt attributes', function () {
            $html = '<img src="/storage/lexical/photo.jpg" alt="My photo">';

            $urls = LexicalImageCleaner::extractImageUrls($html);

            expect($urls)->toBe(['/storage/lexical/photo.jpg']);
        });

        it('extracts images with multiple attributes', function () {
            $html = '<img src="/storage/lexical/photo.jpg" alt="Photo" width="100" height="50" loading="lazy">';

            $urls = LexicalImageCleaner::extractImageUrls($html);

            expect($urls)->toBe(['/storage/lexical/photo.jpg']);
        });

        it('does not extract images without src', function () {
            $html = '<img alt="No source">';

            $urls = LexicalImageCleaner::extractImageUrls($html);

            expect($urls)->toBe([]);
        });
    });

    describe('getOrphanedImages edge cases', function () {
        it('handles both HTML being null', function () {
            $orphaned = LexicalImageCleaner::getOrphanedImages(null, null);

            expect($orphaned)->toBe([]);
        });

        it('handles both HTML being empty', function () {
            $orphaned = LexicalImageCleaner::getOrphanedImages('', '');

            expect($orphaned)->toBe([]);
        });

        it('handles duplicate images in old HTML', function () {
            $oldHtml = '<img src="/storage/lexical/image.jpg"><img src="/storage/lexical/image.jpg">';
            $newHtml = '<p>No images</p>';

            $orphaned = LexicalImageCleaner::getOrphanedImages($oldHtml, $newHtml);

            // array_diff returns unique orphaned URLs
            expect($orphaned)->toContain('/storage/lexical/image.jpg');
        });
    });
});
