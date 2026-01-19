<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalConfig;
use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalSessionImageTracker;

class LexicalImageUploadController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $maxKb = (int) config('filament-meta-lexical-editor.max_kb', 5120);
        $allowedMimes = config('filament-meta-lexical-editor.allowed_mimes', 'jpg,jpeg,png,gif,webp,svg');

        $request->validate([
            'image' => ['required', 'file', 'image', "max:{$maxKb}", "mimes:{$allowedMimes}"],
            'alt' => ['nullable', 'string', 'max:255'],
        ]);

        $disk = LexicalConfig::getDisk();
        $dir = LexicalConfig::getDirectory();

        $file = $request->file('image');

        $filename = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs($dir, $filename, $disk);

        $url = Storage::disk($disk)->url($path);

        // Track uploaded image in session for cleanup on create
        LexicalSessionImageTracker::trackUpload($url);

        [$width, $height] = @getimagesize($file->getRealPath()) ?: [null, null];

        return response()->json([
            'url' => $url,
            'alt' => $request->input('alt'),
            'width' => $width,
            'height' => $height,
        ]);
    }
}
