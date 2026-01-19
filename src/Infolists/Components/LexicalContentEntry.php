<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Infolists\Components;

use Filament\Infolists\Components\TextEntry;
use Illuminate\Support\HtmlString;

class LexicalContentEntry extends TextEntry
{
    protected string $view = 'filament-meta-lexical-editor::infolists.components.lexical-content-entry';

    protected function setUp(): void
    {
        parent::setUp();

        // Render raw HTML since it's already been sanitized when saved
        $this->formatStateUsing(fn (?string $state): ?HtmlString => $state ? new HtmlString($state) : null);

        // Add the lexical-content class for styling
        $this->extraAttributes(['class' => 'lexical-content']);
    }
}
