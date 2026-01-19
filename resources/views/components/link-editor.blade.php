<template x-if="showLinkEditor">
    <div x-anchor.bottom-start="linkEditorAnchor" class="pt-2"
         @click.outside="closeLinkEditorDialog()"
    >
        <div class="dropdown w-[420px] align-middle relative">
            {{-- Edit Mode --}}
            <div class="p-4 space-y-4" x-show="linkEditMode">
                {{-- Link Type Toggle (only show if internal links are available) --}}
                <div x-show="hasInternalLinks" class="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
                    <button
                        type="button"
                        @click="linkType = 'external'"
                        :class="{
                            'bg-primary-500 text-white': linkType === 'external',
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300': linkType !== 'external'
                        }"
                        class="flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                    >
                        {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.link_editor.external_url') }}
                    </button>
                    <button
                        type="button"
                        @click="linkType = 'internal'"
                        :class="{
                            'bg-primary-500 text-white': linkType === 'internal',
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300': linkType !== 'internal'
                        }"
                        class="flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                    >
                        {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.link_editor.internal_page') }}
                    </button>
                </div>

                {{-- External URL Input --}}
                <div x-show="linkType === 'external' || !hasInternalLinks">
                    <x-filament::input.wrapper>
                        <x-filament::input
                            type="text"
                            x-model="linkEditorUrl"
                            x-on:keydown.enter="$event.preventDefault(); updateLink()"
                            placeholder="{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.link_editor.url_placeholder') }}"
                            class="w-full"
                        />
                    </x-filament::input.wrapper>
                </div>

                {{-- Internal Page Select --}}
                <div x-show="linkType === 'internal' && hasInternalLinks">
                    <x-filament::input.wrapper>
                        <x-filament::input.select
                            x-model="selectedInternalLink"
                            @change="onInternalLinkSelected()"
                            class="w-full"
                        >
                            <option value="">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.link_editor.select_page') }}</option>
                            <template x-for="link in internalLinks" :key="link.slug">
                                <option :value="link.slug" x-text="link.title"></option>
                            </template>
                        </x-filament::input.select>
                    </x-filament::input.wrapper>

                    {{-- URL Preview for internal links --}}
                    <div x-show="selectedInternalLink" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span class="font-medium">URL:</span>
                        <span x-text="getInternalLinkUrl()"></span>
                    </div>
                </div>

                {{-- Open in New Tab Toggle --}}
                <div class="flex items-center gap-3 py-1">
                    <input
                        type="checkbox"
                        id="linkOpenInNewTab"
                        x-model="linkOpenInNewTab"
                        class="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
                    />
                    <label for="linkOpenInNewTab" class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.link_editor.open_in_new_tab') }}
                    </label>
                </div>

                {{-- Action Buttons --}}
                <div class="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        @click="closeLinkEditorDialog()"
                        class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                        {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.cancel') }}
                    </button>
                    <button
                        type="button"
                        @click="updateLink()"
                        class="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
                    >
                        {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.edit') }}
                    </button>
                </div>
            </div>

            {{-- View Mode (existing link) --}}
            <div class="flex items-center" x-show="linkEditMode == false">
                <a
                    class="text-blue-500 hover:underline hover:text-blue-700 whitespace-nowrap overflow-hidden ms-3 text-ellipsis block break-words flex-1"
                    style="padding: 12px 0;"
                    :href="linkEditorUrl"
                    x-text="linkEditorUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                ></a>
                <div class="ms-2 flex items-center gap-1 pe-2">
                    <div class="link-edit dark:invert" @click="linkEditMode = true; detectLinkType()" role="button" tabindex="0"></div>
                    <div class="link-trash dark:invert" @click="removeLink()" role="button" tabindex="0"></div>
                </div>
            </div>
        </div>
    </div>
</template>
