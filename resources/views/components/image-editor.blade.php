@php
    $id = uniqid();
@endphp

<div x-ref="imageEditorModal" modal-id="{{ $id }}">
    <x-filament::modal id="{{ $id }}">
        <x-slot name="heading">
            @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.update_image')
        </x-slot>

        <label for="image_editor_alt">
            @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.alt')
        </label>
        <x-filament::input.wrapper>
            <x-filament::input
                id="image_editor_alt"
                type="text"
                x-ref="image_editor_alt"
            />
        </x-filament::input.wrapper>

        <input
            type="checkbox"
            x-model="imageLockAspect"
            @change="toggleImageLockAspect()"
        />

        <label for="image_editor_width">
            @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.width')
        </label>
        <x-filament::input.wrapper>
            <x-filament::input
                id="image_editor_width"
                type="number"
                x-ref="image_editor_width"
                @input="imageWidthInput()"
            />
        </x-filament::input.wrapper>

        <label for="image_editor_height">
            @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.height')
        </label>
        <x-filament::input.wrapper>
            <x-filament::input
                id="image_editor_height"
                type="number"
                x-ref="image_editor_height"
                @input="imageHeightInput()"
            />
        </x-filament::input.wrapper>

        {{-- Alignment --}}
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.alignment')
            </label>
            <div class="flex flex-wrap gap-1">
                @foreach ([
                    'none' => 'filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.alignment_none',
                    'left' => 'filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.alignment_left',
                    'center' => 'filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.alignment_center',
                    'right' => 'filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.alignment_right',
                    'full' => 'filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.alignment_full',
                ] as $value => $label)
                    <button
                        type="button"
                        @click="imageAlignment = '{{ $value }}'"
                        :class="{
                            'bg-primary-500 text-white ring-primary-500': imageAlignment === '{{ $value }}',
                            'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-gray-300 dark:ring-gray-600': imageAlignment !== '{{ $value }}',
                        }"
                        class="px-3 py-1.5 text-sm font-medium rounded-md ring-1 transition-colors"
                    >
                        @lang($label)
                    </button>
                @endforeach
            </div>
        </div>

        {{-- CSS Classes --}}
        <div>
            <label for="image_editor_css_classes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.css_classes')
            </label>
            <x-filament::input.wrapper>
                <x-filament::input
                    id="image_editor_css_classes"
                    type="text"
                    x-model="imageCssClasses"
                    placeholder="{{ __('filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.css_classes_placeholder') }}"
                />
            </x-filament::input.wrapper>
        </div>

        {{-- Link URL --}}
        <div>
            <label for="image_editor_link_url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.link_url')
            </label>
            <x-filament::input.wrapper>
                <x-filament::input
                    id="image_editor_link_url"
                    type="url"
                    x-model="imageLinkUrl"
                    placeholder="https://..."
                />
            </x-filament::input.wrapper>
        </div>

        {{-- Link Target --}}
        <div x-show="imageLinkUrl" x-cloak class="flex items-center gap-2">
            <input
                type="checkbox"
                id="image_editor_link_target"
                :checked="imageLinkTarget === '_blank'"
                @change="imageLinkTarget = $event.target.checked ? '_blank' : '_self'"
            />
            <label for="image_editor_link_target" class="text-sm text-gray-700 dark:text-gray-300">
                @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.link_new_tab')
            </label>
        </div>

        {{-- Loading Strategy --}}
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.loading')
            </label>
            <x-filament::input.wrapper>
                <x-filament::input.select x-model="imageLoading">
                    <option value="lazy">
                        @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.loading_lazy')
                    </option>
                    <option value="eager">
                        @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_editor.loading_eager')
                    </option>
                </x-filament::input.select>
            </x-filament::input.wrapper>
        </div>

        <x-slot name="footerActions">
            <div class="dialog-actions ms-auto">
                <x-filament::button
                    type="button"
                    @click.prevent="
                        updateImage();
                        resetImageEditorForm();
                        activeImageKey = null;
                        close();
                    "
                >
                    @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.edit')
                </x-filament::button>

                <x-filament::button
                    type="button"
                    color="danger"
                    @click.prevent="
                        deleteImage();
                        resetImageEditorForm();
                        activeImageKey = null;
                        close();
                    "
                >
                    @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.delete')
                </x-filament::button>

                <x-filament::button
                    type="button"
                    color="gray"
                    @click.prevent="
                        resetImageEditorForm();
                        activeImageKey = null;
                        close();
                    "
                >
                    @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.cancel')
                </x-filament::button>
            </div>
        </x-slot>
    </x-filament::modal>
</div>
