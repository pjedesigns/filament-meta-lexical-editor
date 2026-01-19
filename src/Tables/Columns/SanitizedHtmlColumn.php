<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Tables\Columns;

use Closure;
use Filament\Tables\Columns\TextColumn;
use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalHtmlSanitizer;

class SanitizedHtmlColumn extends TextColumn
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
