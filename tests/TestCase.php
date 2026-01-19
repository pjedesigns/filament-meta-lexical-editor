<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Tests;

use Illuminate\Database\Eloquent\Factories\Factory;
use Orchestra\Testbench\TestCase as Orchestra;
use Pjedesigns\FilamentMetaLexicalEditor\FilamentMetaLexicalEditorServiceProvider;

class TestCase extends Orchestra
{
    protected function setUp(): void
    {
        parent::setUp();

        Factory::guessFactoryNamesUsing(
            fn (string $modelName) => 'Pjedesigns\\FilamentMetaLexicalEditor\\Database\\Factories\\'.class_basename($modelName).'Factory'
        );
    }

    protected function getPackageProviders($app): array
    {
        return [
            FilamentMetaLexicalEditorServiceProvider::class,
        ];
    }

    public function getEnvironmentSetUp($app): void
    {
        config()->set('database.default', 'testing');
        config()->set('database.connections.testing', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
        ]);

        config()->set('filament-meta-lexical-editor.disk', 'local');
        config()->set('filament-meta-lexical-editor.directory', 'lexical-test');
        config()->set('filament-meta-lexical-editor.max_kb', 5120);
        config()->set('filament-meta-lexical-editor.allowed_mimes', 'jpg,jpeg,png,gif,webp,svg');
    }
}
