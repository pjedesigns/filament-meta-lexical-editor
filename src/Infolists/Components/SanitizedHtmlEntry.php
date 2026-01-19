<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Infolists\Components;

use Closure;
use Filament\Infolists\Components\TextEntry;
use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalHtmlSanitizer;

class SanitizedHtmlEntry extends TextEntry
{
    protected ?Closure $sanitizeUsing = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->html();

        $this->formatStateUsing(function ($state): string {
            if (! is_string($state) || $state === '') {
                return '';
            }

            if ($this->sanitizeUsing) {
                return (string) ($this->sanitizeUsing)($state);
            }

            return LexicalHtmlSanitizer::sanitize($state);
        });
    }

    public function sanitizeUsing(?Closure $callback): static
    {
        $this->sanitizeUsing = $callback;

        return $this;
    }
}
