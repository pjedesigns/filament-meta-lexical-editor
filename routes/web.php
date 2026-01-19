<?php

use Illuminate\Support\Facades\Route;
use Pjedesigns\FilamentMetaLexicalEditor\Http\Controllers\LexicalImageUploadController;

Route::post('/filament-meta-lexical-editor/upload-image', LexicalImageUploadController::class)
    ->middleware(array_merge(
        config('filament-meta-lexical-editor.middleware', ['web', 'auth']),
        ['throttle:60,1']
    ))
    ->name('filament-meta-lexical-editor.upload-image');
