<template x-if="showLayoutEditor">
    <div x-anchor.bottom-start="layoutEditorAnchor" class="pt-2"
         @click.outside="closeLayoutEditorDialog()"
    >
        <div class="dropdown w-64 p-4 space-y-4">
            {{-- Column Count --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.columns_editor.column_count') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input.select x-model.number="layoutColumns" class="w-full">
                        <option value="2">2 {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.columns_editor.columns') }}</option>
                        <option value="3">3 {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.columns_editor.columns') }}</option>
                        <option value="4">4 {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.columns_editor.columns') }}</option>
                    </x-filament::input.select>
                </x-filament::input.wrapper>
            </div>

            {{-- Action Buttons --}}
            <div class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    @click="closeLayoutEditorDialog()"
                    class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.cancel') }}
                </button>
                <button
                    type="button"
                    @click="insertLayout()"
                    class="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
                >
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.columns_editor.insert_layout') }}
                </button>
            </div>
        </div>
    </div>
</template>
