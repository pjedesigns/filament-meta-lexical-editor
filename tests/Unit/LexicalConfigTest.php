<?php

use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalConfig;

describe('LexicalConfig', function () {
    describe('getDisk', function () {
        it('returns package-specific disk when configured', function () {
            config(['filament-meta-lexical-editor.disk' => 'custom-disk']);
            config(['filament.default_filesystem_disk' => 's3']);
            config(['filesystems.default' => 'local']);

            expect(LexicalConfig::getDisk())->toBe('custom-disk');
        });

        it('falls back to Filament disk when package disk not set', function () {
            config(['filament-meta-lexical-editor.disk' => null]);
            config(['filament.default_filesystem_disk' => 's3']);
            config(['filesystems.default' => 'local']);

            expect(LexicalConfig::getDisk())->toBe('s3');
        });

        it('falls back to Laravel default disk when neither package nor Filament disk set', function () {
            config(['filament-meta-lexical-editor.disk' => null]);
            config(['filament.default_filesystem_disk' => null]);
            config(['filesystems.default' => 'local']);

            expect(LexicalConfig::getDisk())->toBe('local');
        });

        it('falls back to public when no disks configured', function () {
            config(['filament-meta-lexical-editor.disk' => null]);
            config(['filament.default_filesystem_disk' => null]);
            config(['filesystems.default' => null]);

            expect(LexicalConfig::getDisk())->toBe('public');
        });

        it('ignores empty string as package disk', function () {
            config(['filament-meta-lexical-editor.disk' => '']);
            config(['filament.default_filesystem_disk' => 's3']);

            expect(LexicalConfig::getDisk())->toBe('s3');
        });
    });

    describe('getDirectory', function () {
        it('returns configured directory', function () {
            config(['filament-meta-lexical-editor.directory' => 'custom-dir']);

            expect(LexicalConfig::getDirectory())->toBe('custom-dir');
        });

        it('returns default lexical directory when not configured', function () {
            config(['filament-meta-lexical-editor.directory' => null]);

            expect(LexicalConfig::getDirectory())->toBe('lexical');
        });
    });
});
