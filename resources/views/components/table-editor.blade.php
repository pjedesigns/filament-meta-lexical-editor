<template x-if="showTableEditor">
    <div x-anchor.bottom-start="tableEditorAnchor" class="pt-2"
         @click.outside="closeTableEditorDialog()"
    >
        <div class="dropdown w-80 p-4 space-y-4">
            {{-- Dimensions --}}
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.rows') }}
                    </label>
                    <x-filament::input.wrapper>
                        <x-filament::input
                            type="number"
                            x-model.number="tableRows"
                            min="1"
                            max="20"
                            class="w-full"
                        />
                    </x-filament::input.wrapper>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.columns') }}
                    </label>
                    <x-filament::input.wrapper>
                        <x-filament::input
                            type="number"
                            x-model.number="tableCols"
                            min="1"
                            max="10"
                            class="w-full"
                        />
                    </x-filament::input.wrapper>
                </div>
            </div>

            {{-- Include Header Row --}}
            <div class="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="tableHasHeaders"
                    x-model="tableHasHeaders"
                    class="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
                />
                <label for="tableHasHeaders" class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.include_header') }}
                </label>
            </div>

            {{-- Border Style --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.border_style') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input.select x-model="tableBorderStyle" class="w-full">
                        <option value="light">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.border_light') }}</option>
                        <option value="medium">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.border_medium') }}</option>
                        <option value="heavy">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.border_heavy') }}</option>
                        <option value="none">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.border_none') }}</option>
                    </x-filament::input.select>
                </x-filament::input.wrapper>
            </div>

            {{-- Cell Padding --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.cell_padding') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input.select x-model="tableCellPadding" class="w-full">
                        <option value="compact">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.padding_compact') }}</option>
                        <option value="normal">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.padding_normal') }}</option>
                        <option value="relaxed">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.padding_relaxed') }}</option>
                    </x-filament::input.select>
                </x-filament::input.wrapper>
            </div>

            {{-- Table Layout --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.table_layout') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input.select x-model="tableLayout" class="w-full">
                        <option value="auto">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.layout_responsive') }}</option>
                        <option value="fixed">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.layout_fixed') }}</option>
                    </x-filament::input.select>
                </x-filament::input.wrapper>
            </div>

            {{-- Table Width --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.table_width') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input.select x-model="tableWidth" class="w-full">
                        <option value="100%">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.width_full') }}</option>
                        <option value="75%">75%</option>
                        <option value="50%">50%</option>
                        <option value="600px">600px</option>
                        <option value="400px">400px</option>
                        <option value="auto">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.width_auto') }}</option>
                    </x-filament::input.select>
                </x-filament::input.wrapper>
            </div>

            {{-- Action Buttons --}}
            <div class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    @click="closeTableEditorDialog()"
                    class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.cancel') }}
                </button>
                <button
                    type="button"
                    @click="insertTable()"
                    class="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
                >
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.table_editor.insert_table') }}
                </button>
            </div>
        </div>
    </div>
</template>
