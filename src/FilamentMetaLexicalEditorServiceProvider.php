<?php

namespace Pjedesigns\FilamentMetaLexicalEditor;

use Filament\Support\Assets\AlpineComponent;
use Filament\Support\Assets\Asset;
use Filament\Support\Assets\Css;
use Filament\Support\Facades\FilamentAsset;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

class FilamentMetaLexicalEditorServiceProvider extends PackageServiceProvider
{
    public static string $name = 'filament-meta-lexical-editor';

    public static string $viewNamespace = 'filament-meta-lexical-editor';

    public function configurePackage(Package $package): void
    {
        $package
            ->name('filament-meta-lexical-editor')
            ->hasTranslations()
            ->hasViews(static::$viewNamespace)
            ->hasAssets()
            ->hasConfigFile()
            ->hasRoutes('web');
    }

    public function packageBooted(): void
    {
        FilamentAsset::register(
            $this->getAssets(),
            $this->getAssetPackageName()
        );

        FilamentAsset::registerScriptData(
            $this->getScriptData(),
            $this->getAssetPackageName()
        );
    }

    protected function getAssetPackageName(): string
    {
        return 'pjedesigns/filament-meta-lexical-editor';
    }

    /**
     * @return array<Asset>
     */
    protected function getAssets(): array
    {
        $publicDist = public_path('vendor/'.$this->getAssetPackageName());
        $packageDist = __DIR__.'/../resources/dist';

        $dist = is_dir($publicDist) ? $publicDist : $packageDist;

        $manifestPath = $dist.'/manifest.json';

        $manifest = is_file($manifestPath)
            ? json_decode(file_get_contents($manifestPath), true)
            : [];

        $js = $manifest['js'] ?? 'filament-meta-lexical-editor.js';
        $css = $manifest['css'] ?? 'filament-meta-lexical-editor.css';

        return [
            AlpineComponent::make('lexical-component', $dist.'/'.$js),
            Css::make('filament-meta-lexical-editor-styles', $dist.'/'.$css),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function getScriptData(): array
    {
        return [
            'metaLexicalEditor' => [
                'uploadUrl' => config('filament-meta-lexical-editor.upload_route'),
                'fonts' => config('filament-meta-lexical-editor.fonts'),
            ],
        ];
    }
}
