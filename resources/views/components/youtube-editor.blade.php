<template x-if="showYouTubeEditor">
    <div x-anchor.bottom-start="youTubeEditorAnchor" class="pt-2"
         @click.outside="closeYouTubeEditorDialog()"
    >
        <div class="dropdown w-80 p-4 space-y-4">
            {{-- YouTube URL/ID --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.youtube_editor.url') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input
                        type="text"
                        x-model="youTubeUrl"
                        placeholder="https://www.youtube.com/watch?v=..."
                        class="w-full"
                    />
                </x-filament::input.wrapper>
                <p class="text-xs text-gray-500 mt-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.youtube_editor.url_hint') }}
                </p>
            </div>

            {{-- Width --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.youtube_editor.width') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input.select x-model="youTubeWidth" class="w-full">
                        <option value="100%">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.youtube_editor.width_full') }}</option>
                        <option value="75%">75%</option>
                        <option value="50%">50%</option>
                        <option value="800px">800px</option>
                        <option value="640px">640px</option>
                        <option value="480px">480px</option>
                    </x-filament::input.select>
                </x-filament::input.wrapper>
            </div>

            {{-- Alignment --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.youtube_editor.alignment') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input.select x-model="youTubeAlignment" class="w-full">
                        <option value="left">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.left_align') }}</option>
                        <option value="center">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.center_align') }}</option>
                        <option value="right">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.right_align') }}</option>
                    </x-filament::input.select>
                </x-filament::input.wrapper>
            </div>

            {{-- Action Buttons --}}
            <div class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    @click="closeYouTubeEditorDialog()"
                    class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.cancel') }}
                </button>
                <button
                    type="button"
                    @click="insertYouTube()"
                    :disabled="!youTubeUrl.trim()"
                    class="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.youtube_editor.insert_video') }}
                </button>
            </div>
        </div>
    </div>
</template>
