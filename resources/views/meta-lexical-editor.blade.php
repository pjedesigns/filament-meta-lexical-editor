@php
    use Filament\Support\Facades\FilamentAsset;
    $statePath = $getStatePath();
    $toolbars = $getEnabledToolbars();
    $internalLinks = $getInternalLinks();
    $hasInternalLinks = $hasInternalLinks();
    $siteUrl = $getSiteUrl();
@endphp
<x-dynamic-component
    :component="$getFieldWrapperView()"
    :field="$field"
>
    <div
        x-data="{
            isFullscreen: false,
            toggleFullscreen() {
                this.isFullscreen = !this.isFullscreen;
                document.body.style.overflow = this.isFullscreen ? 'hidden' : '';
            }
        }"
        x-on:keydown.escape.window="if (isFullscreen) { isFullscreen = false; document.body.style.overflow = ''; }"
        x-on:keydown.f11.window.prevent="toggleFullscreen()"
        x-on:toggle-fullscreen.window="toggleFullscreen()"
        :class="{
            'lexical-editor-fullscreen': isFullscreen
        }"
        @class([
            'lexical-editor rounded-md relative text-gray-950 bg-white shadow-sm ring-1 dark:bg-white/5 dark:text-white',
            'ring-gray-950/10 dark:ring-white/20' => ! $errors->has($statePath),
            'ring-danger-600 dark:ring-danger-600' => $errors->has($statePath),
        ])
    >

        <div
            x-load
            x-load-src="{{ FilamentAsset::getAlpineComponentSrc('lexical-component', 'pjedesigns/filament-meta-lexical-editor') }}"
            x-data="lexicalComponent({
                state: $wire.{{ $applyStateBindingModifiers("\$entangle('{$statePath}')") }},
                enabledToolbars: @js($toolbars),
                internalLinks: @js($internalLinks),
                hasInternalLinks: @js($hasInternalLinks),
                siteUrl: @js($siteUrl),
            })"
            wire:ignore
            class="editor-shell w-full h-full flex flex-col"
        >

            <div class="toolbar flex-wrap flex-shrink-0">
                @foreach($toolbars as $toolbar)
                    <x-filament-meta-lexical-editor::toolbar :toolbar="$toolbar"/>
                @endforeach
            </div>

            <div class="editor-container tree-view p-2 flex-1 overflow-auto">
                <div class="editor-scroller h-full">
                    <div x-ref="editor"
                         @link-clicked="showLinkEditorDialog( $event.detail.target,$event.detail.url, false)"
                         @link-created="showLinkEditorDialog( $event.detail.target, $event.detail.url,)"
                         @close-link-editor-dialog="closeLinkEditorDialog()"
                         class="editor h-full"
                         style="max-width: unset" contenteditable="true" role="textbox" spellcheck="true"
                         aria-placeholder="Enter some rich text..." data-lexical-editor="true"  >

                    </div>

                </div>
            </div>
            <x-filament-meta-lexical-editor::dialogs/>

        </div>

    </div>


</x-dynamic-component>
