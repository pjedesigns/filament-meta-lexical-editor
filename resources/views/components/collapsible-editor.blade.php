<template x-if="showCollapsibleEditor">
    <div x-anchor.bottom-start="collapsibleEditorAnchor" class="pt-2"
         @click.outside="closeCollapsibleEditorDialog()"
    >
        <div class="dropdown w-80 p-4 space-y-4">
            {{-- Title --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.collapsible_editor.title') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input
                        type="text"
                        x-model="collapsibleTitle"
                        placeholder="{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.collapsible_editor.title_placeholder') }}"
                        class="w-full"
                    />
                </x-filament::input.wrapper>
            </div>

            {{-- Initial State --}}
            <div class="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="collapsibleOpen"
                    x-model="collapsibleOpen"
                    class="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
                />
                <label for="collapsibleOpen" class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.collapsible_editor.start_open') }}
                </label>
            </div>

            {{-- Action Buttons --}}
            <div class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    @click="closeCollapsibleEditorDialog()"
                    class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.cancel') }}
                </button>
                <button
                    type="button"
                    @click="insertCollapsible()"
                    class="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
                >
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.collapsible_editor.insert_collapsible') }}
                </button>
            </div>
        </div>
    </div>
</template>
