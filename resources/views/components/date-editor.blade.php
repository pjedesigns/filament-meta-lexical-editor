<template x-if="showDateEditor">
    <div x-anchor.bottom-start="dateEditorAnchor" class="pt-2"
         @click.outside="closeDateEditorDialog()"
    >
        <div class="dropdown w-80 p-4 space-y-4">
            {{-- Date Input --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.date') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input
                        type="date"
                        x-model="dateValue"
                        class="w-full"
                    />
                </x-filament::input.wrapper>
            </div>

            {{-- Format --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.format') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input.select x-model="dateFormat" class="w-full">
                        <option value="short">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.format_short') }} (1/15/2024)</option>
                        <option value="medium">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.format_medium') }} (Jan 15, 2024)</option>
                        <option value="long">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.format_long') }} (January 15, 2024)</option>
                        <option value="full">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.format_full') }} (Monday, January 15, 2024)</option>
                        <option value="relative">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.format_relative') }} (2 days ago)</option>
                        <option value="iso">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.format_iso') }} (2024-01-15)</option>
                    </x-filament::input.select>
                </x-filament::input.wrapper>
            </div>

            {{-- Quick Date Buttons --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.quick_select') }}
                </label>
                <div class="flex flex-wrap gap-2">
                    <button
                        type="button"
                        @click="setDateToday()"
                        class="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                        {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.today') }}
                    </button>
                    <button
                        type="button"
                        @click="setDateTomorrow()"
                        class="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                        {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.tomorrow') }}
                    </button>
                    <button
                        type="button"
                        @click="setDateNextWeek()"
                        class="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                        {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.next_week') }}
                    </button>
                </div>
            </div>

            {{-- Preview --}}
            <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.preview') }}:</span>
                <span class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100" x-text="getDatePreview()"></span>
            </div>

            {{-- Action Buttons --}}
            <div class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    @click="closeDateEditorDialog()"
                    class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.cancel') }}
                </button>
                <button
                    type="button"
                    @click="insertDate()"
                    :disabled="!dateValue"
                    class="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.date_editor.insert_date') }}
                </button>
            </div>
        </div>
    </div>
</template>
