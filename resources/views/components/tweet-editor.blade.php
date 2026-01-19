<template x-if="showTweetEditor">
    <div x-anchor.bottom-start="tweetEditorAnchor" class="pt-2"
         @click.outside="closeTweetEditorDialog()"
    >
        <div class="dropdown w-80 p-4 space-y-4">
            {{-- Tweet URL/ID --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.tweet_editor.url') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input
                        type="text"
                        x-model="tweetUrl"
                        placeholder="https://twitter.com/user/status/..."
                        class="w-full"
                    />
                </x-filament::input.wrapper>
                <p class="text-xs text-gray-500 mt-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.tweet_editor.url_hint') }}
                </p>
            </div>

            {{-- Width --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.tweet_editor.width') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input.select x-model="tweetWidth" class="w-full">
                        <option value="550px">550px ({{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.tweet_editor.width_default') }})</option>
                        <option value="100%">{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.tweet_editor.width_full') }}</option>
                        <option value="450px">450px</option>
                        <option value="350px">350px</option>
                    </x-filament::input.select>
                </x-filament::input.wrapper>
            </div>

            {{-- Alignment --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.tweet_editor.alignment') }}
                </label>
                <x-filament::input.wrapper>
                    <x-filament::input.select x-model="tweetAlignment" class="w-full">
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
                    @click="closeTweetEditorDialog()"
                    class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.cancel') }}
                </button>
                <button
                    type="button"
                    @click="insertTweet()"
                    :disabled="!tweetUrl.trim()"
                    class="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.tweet_editor.insert_tweet') }}
                </button>
            </div>
        </div>
    </div>
</template>
