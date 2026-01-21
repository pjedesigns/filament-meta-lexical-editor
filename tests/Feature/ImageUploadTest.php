<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Storage;
use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalSessionImageTracker;
use Pjedesigns\FilamentMetaLexicalEditor\Tests\Fixtures\User;

beforeEach(function () {
    config(['filament-meta-lexical-editor.disk' => 'local']);
    config(['filament-meta-lexical-editor.directory' => 'lexical-test']);
    Storage::fake('local');
    Session::flush();
});

describe('Image Upload Controller', function () {
    it('uploads an image successfully', function () {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('test.jpg', 100, 100);

        $this->actingAs($user)
            ->post(route('filament-meta-lexical-editor.upload-image'), [
                'image' => $file,
                'alt' => 'Test image',
            ])
            ->assertSuccessful()
            ->assertJsonStructure([
                'url',
                'alt',
                'width',
                'height',
            ]);
    });

    it('returns image dimensions', function () {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('test.png', 200, 150);

        $this->actingAs($user)
            ->post(route('filament-meta-lexical-editor.upload-image'), [
                'image' => $file,
            ])
            ->assertSuccessful()
            ->assertJson([
                'width' => 200,
                'height' => 150,
            ]);
    });

    it('accepts alt text', function () {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('test.jpg');

        $this->actingAs($user)
            ->post(route('filament-meta-lexical-editor.upload-image'), [
                'image' => $file,
                'alt' => 'My alt text',
            ])
            ->assertSuccessful()
            ->assertJson([
                'alt' => 'My alt text',
            ]);
    });

    it('requires authentication', function () {
        $file = UploadedFile::fake()->image('test.jpg');

        $this->post(route('filament-meta-lexical-editor.upload-image'), [
            'image' => $file,
        ])->assertRedirect(route('login'));
    });

    it('requires an image file', function () {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('filament-meta-lexical-editor.upload-image'), [])
            ->assertSessionHasErrors('image');
    });

    it('rejects non-image files', function () {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('document.pdf', 100);

        $this->actingAs($user)
            ->post(route('filament-meta-lexical-editor.upload-image'), [
                'image' => $file,
            ])
            ->assertSessionHasErrors('image');
    });

    it('validates alt text max length', function () {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('test.jpg');

        $this->actingAs($user)
            ->post(route('filament-meta-lexical-editor.upload-image'), [
                'image' => $file,
                'alt' => str_repeat('a', 300),
            ])
            ->assertSessionHasErrors('alt');
    });

    it('stores image with unique filename', function () {
        $user = User::factory()->create();
        $file1 = UploadedFile::fake()->image('test.jpg');
        $file2 = UploadedFile::fake()->image('test.jpg');

        $this->actingAs($user)
            ->post(route('filament-meta-lexical-editor.upload-image'), [
                'image' => $file1,
            ])
            ->assertSuccessful();

        $this->actingAs($user)
            ->post(route('filament-meta-lexical-editor.upload-image'), [
                'image' => $file2,
            ])
            ->assertSuccessful();

        $dir = config('filament-meta-lexical-editor.directory');
        $files = Storage::disk('local')->files($dir);
        expect($files)->toHaveCount(2);
    });

    it('accepts various image formats', function (string $extension) {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image("test.{$extension}");

        $this->actingAs($user)
            ->post(route('filament-meta-lexical-editor.upload-image'), [
                'image' => $file,
            ])
            ->assertSuccessful();
    })->with(['jpg', 'jpeg', 'png', 'gif']);

    it('tracks uploaded image URL in session', function () {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('test.jpg', 100, 100);

        $response = $this->actingAs($user)
            ->post(route('filament-meta-lexical-editor.upload-image'), [
                'image' => $file,
            ])
            ->assertSuccessful();

        $url = $response->json('url');
        $trackedImages = LexicalSessionImageTracker::getTrackedImages();

        expect($trackedImages)->toContain($url);
    });

    it('tracks multiple uploaded images in session', function () {
        $user = User::factory()->create();
        $file1 = UploadedFile::fake()->image('test1.jpg');
        $file2 = UploadedFile::fake()->image('test2.jpg');

        $response1 = $this->actingAs($user)
            ->post(route('filament-meta-lexical-editor.upload-image'), [
                'image' => $file1,
            ])
            ->assertSuccessful();

        $response2 = $this->actingAs($user)
            ->post(route('filament-meta-lexical-editor.upload-image'), [
                'image' => $file2,
            ])
            ->assertSuccessful();

        $trackedImages = LexicalSessionImageTracker::getTrackedImages();

        expect($trackedImages)->toHaveCount(2)
            ->toContain($response1->json('url'))
            ->toContain($response2->json('url'));
    });
});
