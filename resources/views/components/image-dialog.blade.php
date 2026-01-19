@php
    $id = uniqid();
@endphp

<div x-ref="imageModal" modal-id="{{ $id }}">
    <x-filament::modal id="{{ $id }}">
        <x-slot name="heading">
            @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_uploader.upload_image')
        </x-slot>

        <label for="image-upload">
            @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_uploader.image')
        </label>

        <x-filament::input.wrapper>
            <x-filament::input
                type="file"
                accept="image/*"
                x-ref="image_input"
            />
        </x-filament::input.wrapper>

        <label for="alt-text">
            @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_uploader.alt')
        </label>

        <x-filament::input.wrapper>
            <x-filament::input
                type="text"
                x-ref="image_alt"
            />
        </x-filament::input.wrapper>

        <x-slot name="footerActions">
            <div class="dialog-actions ms-auto">
                <x-filament::button
                    type="button"
                    @click.prevent="
                        (async () => {
                            const ok = await handleImage();
                            if (ok) {
                                // close by id (reliable)
                                $dispatch('close-modal', { id: '{{ $id }}' });

                                // clear inputs
                                if ($refs.image_input) $refs.image_input.value = '';
                                if ($refs.image_alt) $refs.image_alt.value = '';
                            }
                        })()
                    "
                >
                    @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.image_uploader.upload')
                </x-filament::button>

                <x-filament::button
                    type="button"
                    color="gray"
                    @click.prevent="
                        $dispatch('close-modal', { id: '{{ $id }}' });
                        if ($refs.image_input) $refs.image_input.value = '';
                        if ($refs.image_alt) $refs.image_alt.value = '';
                    "
                >
                    @lang('filament-meta-lexical-editor::filament-meta-lexical-editor.cancel')
                </x-filament::button>
            </div>
        </x-slot>
    </x-filament::modal>
</div>
