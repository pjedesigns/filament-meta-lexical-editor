<?php

use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Storage;
use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalConfig;
use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalSessionImageTracker;

beforeEach(function () {
    // Use a generic test disk - the package config determines which disk to use
    Storage::fake('lexical-test');
    Session::flush();
    config(['filament-meta-lexical-editor.disk' => 'lexical-test']);
    config(['filament-meta-lexical-editor.directory' => 'lexical']);
    config(['filesystems.disks.lexical-test' => [
        'driver' => 'local',
        'root' => storage_path('framework/testing'),
        'url' => '/storage',
        'visibility' => 'public',
    ]]);
});

describe('LexicalSessionImageTracker', function () {
    describe('trackUpload', function () {
        it('tracks a single uploaded image URL', function () {
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image1.jpg');

            $tracked = LexicalSessionImageTracker::getTrackedImages();

            expect($tracked)->toBe(['/storage/lexical/image1.jpg']);
        });

        it('tracks multiple uploaded image URLs', function () {
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image1.jpg');
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image2.jpg');
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image3.jpg');

            $tracked = LexicalSessionImageTracker::getTrackedImages();

            expect($tracked)->toHaveCount(3)
                ->toContain('/storage/lexical/image1.jpg')
                ->toContain('/storage/lexical/image2.jpg')
                ->toContain('/storage/lexical/image3.jpg');
        });

        it('does not duplicate URLs', function () {
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image1.jpg');
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image1.jpg');

            $tracked = LexicalSessionImageTracker::getTrackedImages();

            expect($tracked)->toHaveCount(1);
        });
    });

    describe('getTrackedImages', function () {
        it('returns empty array when no images tracked', function () {
            $tracked = LexicalSessionImageTracker::getTrackedImages();

            expect($tracked)->toBe([]);
        });

        it('returns tracked images', function () {
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image1.jpg');

            $tracked = LexicalSessionImageTracker::getTrackedImages();

            expect($tracked)->toBe(['/storage/lexical/image1.jpg']);
        });
    });

    describe('clear', function () {
        it('clears all tracked images', function () {
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image1.jpg');
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image2.jpg');

            LexicalSessionImageTracker::clear();

            $tracked = LexicalSessionImageTracker::getTrackedImages();

            expect($tracked)->toBe([]);
        });
    });

    describe('getOrphanedFromSession', function () {
        it('returns images not in the final HTML', function () {
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image1.jpg');
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image2.jpg');

            $finalHtml = '<img src="/storage/lexical/image1.jpg">';

            $orphaned = LexicalSessionImageTracker::getOrphanedFromSession($finalHtml);

            expect($orphaned)->toBe([1 => '/storage/lexical/image2.jpg']);
        });

        it('returns all images when final HTML is empty', function () {
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image1.jpg');
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image2.jpg');

            $orphaned = LexicalSessionImageTracker::getOrphanedFromSession('');

            expect($orphaned)->toBe([
                '/storage/lexical/image1.jpg',
                '/storage/lexical/image2.jpg',
            ]);
        });

        it('returns all images when final HTML is null', function () {
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image1.jpg');

            $orphaned = LexicalSessionImageTracker::getOrphanedFromSession(null);

            expect($orphaned)->toBe(['/storage/lexical/image1.jpg']);
        });

        it('returns empty when all images are used', function () {
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image1.jpg');
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image2.jpg');

            $finalHtml = '<img src="/storage/lexical/image1.jpg"><img src="/storage/lexical/image2.jpg">';

            $orphaned = LexicalSessionImageTracker::getOrphanedFromSession($finalHtml);

            expect($orphaned)->toBe([]);
        });

        it('returns empty when no images were tracked', function () {
            $orphaned = LexicalSessionImageTracker::getOrphanedFromSession('<img src="/storage/lexical/image1.jpg">');

            expect($orphaned)->toBe([]);
        });
    });

    describe('cleanupSessionOrphans', function () {
        it('deletes orphaned images and clears session', function () {
            $disk = LexicalConfig::getDisk();
            Storage::disk($disk)->put('lexical/keep.jpg', 'keep this');
            Storage::disk($disk)->put('lexical/delete.jpg', 'delete this');

            LexicalSessionImageTracker::trackUpload('/storage/lexical/keep.jpg');
            LexicalSessionImageTracker::trackUpload('/storage/lexical/delete.jpg');

            $finalHtml = '<img src="/storage/lexical/keep.jpg">';

            LexicalSessionImageTracker::cleanupSessionOrphans($finalHtml);

            expect(Storage::disk($disk)->exists('lexical/keep.jpg'))->toBeTrue();
            expect(Storage::disk($disk)->exists('lexical/delete.jpg'))->toBeFalse();
            expect(LexicalSessionImageTracker::getTrackedImages())->toBe([]);
        });

        it('clears session even when no orphans exist', function () {
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image1.jpg');

            $finalHtml = '<img src="/storage/lexical/image1.jpg">';

            LexicalSessionImageTracker::cleanupSessionOrphans($finalHtml);

            expect(LexicalSessionImageTracker::getTrackedImages())->toBe([]);
        });

        it('deletes all tracked images when final HTML is empty', function () {
            $disk = LexicalConfig::getDisk();
            Storage::disk($disk)->put('lexical/image1.jpg', 'content');
            Storage::disk($disk)->put('lexical/image2.jpg', 'content');

            LexicalSessionImageTracker::trackUpload('/storage/lexical/image1.jpg');
            LexicalSessionImageTracker::trackUpload('/storage/lexical/image2.jpg');

            LexicalSessionImageTracker::cleanupSessionOrphans('');

            expect(Storage::disk($disk)->exists('lexical/image1.jpg'))->toBeFalse();
            expect(Storage::disk($disk)->exists('lexical/image2.jpg'))->toBeFalse();
        });
    });
});
