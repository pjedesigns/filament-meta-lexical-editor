<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Support;

class LexicalConfig
{
    /**
     * Get the storage disk to use for the Lexical editor.
     *
     * Priority:
     * 1. Package-specific config (filament-meta-lexical-editor.disk)
     * 2. Filament's default filesystem disk (filament.default_filesystem_disk)
     * 3. Laravel's default filesystem disk (filesystems.default / FILESYSTEM_DISK)
     * 4. Fallback to 'public'
     */
    public static function getDisk(): string
    {
        // Check package-specific configuration first
        $disk = config('filament-meta-lexical-editor.disk');

        if (! empty($disk)) {
            return $disk;
        }

        // Fall back to Filament's default filesystem disk
        $filamentDisk = config('filament.default_filesystem_disk');

        if (! empty($filamentDisk)) {
            return $filamentDisk;
        }

        // Fall back to Laravel's default filesystem disk
        $laravelDisk = config('filesystems.default');

        return ! empty($laravelDisk) ? $laravelDisk : 'public';
    }

    /**
     * Get the storage directory to use for the Lexical editor.
     */
    public static function getDirectory(): string
    {
        $directory = config('filament-meta-lexical-editor.directory');

        return ! empty($directory) ? $directory : 'lexical';
    }
}
