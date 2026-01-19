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
