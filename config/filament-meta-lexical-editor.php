<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Storage Disk
    |--------------------------------------------------------------------------
    |
    | The disk to use for storing uploaded images. By default, this uses the
    | same disk as Filament (from config/filament.php 'default_filesystem_disk'),
    | which falls back to the FILESYSTEM_DISK environment variable, or 'public'.
    |
    | You can override this by setting FILAMENT_META_LEXICAL_EDITOR_DISK in
    | your .env file or by changing this value directly.
    |
    */
    'disk' => env('FILAMENT_META_LEXICAL_EDITOR_DISK'),

    /*
    |--------------------------------------------------------------------------
    | Storage Directory
    |--------------------------------------------------------------------------
    |
    | The directory within the disk where uploaded images will be stored.
    |
    */
    'directory' => env('FILAMENT_META_LEXICAL_EDITOR_DIR', 'lexical'),

    /*
    |--------------------------------------------------------------------------
    | Maximum File Size (KB)
    |--------------------------------------------------------------------------
    |
    | The maximum file size allowed for image uploads in kilobytes.
    |
    */
    'max_kb' => env('FILAMENT_META_LEXICAL_EDITOR_MAX_KB', 5120),

    /*
    |--------------------------------------------------------------------------
    | Allowed MIME Types
    |--------------------------------------------------------------------------
    |
    | Comma-separated list of allowed image MIME types for upload.
    |
    */
    'allowed_mimes' => env('FILAMENT_META_LEXICAL_EDITOR_MIMES', 'jpg,jpeg,png,gif,webp,svg'),

    /*
    |--------------------------------------------------------------------------
    | Route Middleware
    |--------------------------------------------------------------------------
    |
    | The middleware to apply to the image upload route.
    |
    */
    'middleware' => ['web', 'auth'],

    /*
    |--------------------------------------------------------------------------
    | Upload Route
    |--------------------------------------------------------------------------
    |
    | The URL path for the image upload endpoint.
    |
    */
    'upload_route' => '/filament-meta-lexical-editor/upload-image',

    /*
    |--------------------------------------------------------------------------
    | Font Settings
    |--------------------------------------------------------------------------
    |
    | Configure the available font families and size constraints.
    |
    */
    'fonts' => [
        'families' => [
            'Arial' => 'Arial',
            'Courier New' => 'Courier New',
            'Georgia' => 'Georgia',
            'Times New Roman' => 'Times New Roman',
            'Trebuchet MS' => 'Trebuchet MS',
            'Verdana' => 'Verdana',
        ],
        'min_size' => 8,
        'max_size' => 72,
        'default_size' => 15,
    ],
];
