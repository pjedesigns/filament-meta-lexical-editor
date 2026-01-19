<?php

namespace Pjedesigns\FilamentMetaLexicalEditor;

use Closure;
use Filament\Forms\Components\Field;
use InvalidArgumentException;
use Pjedesigns\FilamentMetaLexicalEditor\Enums\ToolbarItem;
use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalHtmlSanitizer;
use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalImageCleaner;
use Pjedesigns\FilamentMetaLexicalEditor\Support\LexicalSessionImageTracker;

class MetaLexicalEditor extends Field
{
    protected string $view = 'filament-meta-lexical-editor::meta-lexical-editor';

    protected ?Closure $sanitizeHtmlUsing = null;

    protected bool $shouldCleanupOrphanedImages = true;

    protected array $internalLinks = [];

    protected ?string $siteUrl = null;

    /**
     * Default toolbar configuration - IMAGE excluded by default.
     * Use hasImages() to include the image toolbar item.
     */
    public array|Closure $enabledToolbars = [
        ToolbarItem::UNDO, ToolbarItem::REDO, ToolbarItem::DIVIDER,
        ToolbarItem::FONT_FAMILY, ToolbarItem::DIVIDER,
        ToolbarItem::NORMAL, ToolbarItem::H1, ToolbarItem::H2, ToolbarItem::H3,
        ToolbarItem::H4, ToolbarItem::H5, ToolbarItem::H6, ToolbarItem::DIVIDER,
        ToolbarItem::BULLET, ToolbarItem::NUMBERED, ToolbarItem::QUOTE,
        ToolbarItem::CODE, ToolbarItem::DIVIDER,
        ToolbarItem::FONT_SIZE, ToolbarItem::DIVIDER,
        ToolbarItem::BOLD, ToolbarItem::ITALIC, ToolbarItem::UNDERLINE,
        ToolbarItem::ICODE, ToolbarItem::LINK, ToolbarItem::DIVIDER,
        ToolbarItem::TEXT_COLOR, ToolbarItem::BACKGROUND_COLOR, ToolbarItem::DIVIDER,
        ToolbarItem::LOWERCASE, ToolbarItem::UPPERCASE, ToolbarItem::CAPITALIZE,
        ToolbarItem::STRIKETHROUGH, ToolbarItem::SUBSCRIPT, ToolbarItem::SUPERSCRIPT,
        ToolbarItem::CLEAR, ToolbarItem::DIVIDER,
        ToolbarItem::LEFT, ToolbarItem::CENTER, ToolbarItem::RIGHT, ToolbarItem::JUSTIFY,
        ToolbarItem::START, ToolbarItem::END, ToolbarItem::DIVIDER,
        ToolbarItem::INDENT, ToolbarItem::OUTDENT, ToolbarItem::DIVIDER,
        ToolbarItem::HR, ToolbarItem::TABLE, ToolbarItem::DIVIDER,
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $this->columnSpanFull();

        $sanitize = function ($state) {
            if (! is_string($state) || $state === '') {
                return $state;
            }

            // If user provided a custom sanitizer, use it.
            $custom = $this->sanitizeHtml($state);
            if ($custom !== $state) {
                return $custom;
            }

            // Default sanitizer
            return LexicalHtmlSanitizer::sanitize($state);
        };

        $this->dehydrateStateUsing(function ($state) use ($sanitize) {
            $sanitizedState = $sanitize($state);

            if ($this->shouldCleanupOrphanedImages) {
                $this->cleanupOrphanedImagesOnSave($sanitizedState);
            }

            return $sanitizedState;
        });

        $this->afterStateHydrated(function ($state, callable $set) use ($sanitize) {
            $clean = $sanitize($state);

            if (is_string($clean) && $clean !== $state) {
                $set($this->getStatePath(), $clean);
            }
        });
    }

    /**
     * Clean up orphaned images when saving.
     * Handles both edit (compare with DB original) and create (compare with session uploads).
     */
    protected function cleanupOrphanedImagesOnSave(?string $newState): void
    {
        $record = $this->getRecord();

        if ($record !== null && $record->exists) {
            // Edit mode: compare with original DB state
            $fieldName = $this->getName();
            $originalState = $record->getOriginal($fieldName);

            if ($originalState !== null) {
                LexicalImageCleaner::cleanupOrphaned($originalState, $newState);
            }

            // Also clean up any session-tracked images not in the final content
            LexicalSessionImageTracker::cleanupSessionOrphans($newState);
        } else {
            // Create mode: clean up session-tracked images not in the final content
            LexicalSessionImageTracker::cleanupSessionOrphans($newState);
        }
    }

    /**
     * Enable or disable automatic cleanup of orphaned images on save.
     */
    public function cleanupOrphanedImages(bool $cleanup = true): static
    {
        $this->shouldCleanupOrphanedImages = $cleanup;

        return $this;
    }

    /**
     * Set the enabled toolbar items.
     *
     * Accepts multiple formats:
     * - Variadic strings: ->enabledToolbars('undo', 'redo', 'divider', 'bold')
     * - Array of strings: ->enabledToolbars(['undo', 'redo', 'divider', 'bold'])
     * - Array of ToolbarItem enums: ->enabledToolbars([ToolbarItem::UNDO, ToolbarItem::REDO])
     * - Closure: ->enabledToolbars(fn() => [...])
     *
     * @param  array<string|ToolbarItem>|Closure|string  ...$enabledToolbars
     */
    public function enabledToolbars(array|Closure|string ...$enabledToolbars): static
    {
        // If single array or closure passed, use it directly
        if (count($enabledToolbars) === 1) {
            $first = $enabledToolbars[0];
            if ($first instanceof Closure) {
                $this->enabledToolbars = $first;

                return $this;
            }
            if (is_array($first)) {
                $this->enabledToolbars = $this->resolveToolbarItems($first);

                return $this;
            }
        }

        // Variadic string/ToolbarItem arguments
        $this->enabledToolbars = $this->resolveToolbarItems($enabledToolbars);

        return $this;
    }

    /**
     * Resolve toolbar items from mixed string/ToolbarItem array.
     *
     * @param  array<string|ToolbarItem>  $items
     * @return array<ToolbarItem>
     */
    protected function resolveToolbarItems(array $items): array
    {
        $resolved = [];

        foreach ($items as $item) {
            if ($item instanceof ToolbarItem) {
                $resolved[] = $item;
            } elseif (is_string($item)) {
                $enumCase = ToolbarItem::tryFrom($item);
                if ($enumCase !== null) {
                    $resolved[] = $enumCase;
                }
            }
        }

        return $resolved;
    }

    public function getEnabledToolbars(): array
    {
        return $this->evaluate($this->enabledToolbars);
    }

    /**
     * Enable or disable the image toolbar item.
     * Images are disabled by default for security.
     */
    public function hasImages(bool $enabled = true): static
    {
        $toolbars = $this->evaluate($this->enabledToolbars);

        if ($enabled) {
            if (! in_array(ToolbarItem::IMAGE, $toolbars, true)) {
                // Insert IMAGE after HR or TABLE, or at end
                $hrIndex = array_search(ToolbarItem::HR, $toolbars, true);
                $tableIndex = array_search(ToolbarItem::TABLE, $toolbars, true);

                $insertIndex = max($hrIndex !== false ? $hrIndex : -1, $tableIndex !== false ? $tableIndex : -1);

                if ($insertIndex !== -1) {
                    array_splice($toolbars, $insertIndex + 1, 0, [ToolbarItem::IMAGE]);
                } else {
                    $toolbars[] = ToolbarItem::IMAGE;
                }
            }
        } else {
            $toolbars = array_filter($toolbars, fn ($item) => $item !== ToolbarItem::IMAGE);
        }

        $this->enabledToolbars = array_values($toolbars);

        return $this;
    }

    /**
     * Enable or disable the table toolbar item.
     * Tables are enabled by default.
     */
    public function hasTables(bool $enabled = true): static
    {
        return $this->toggleToolbarItem(ToolbarItem::TABLE, $enabled, ToolbarItem::HR);
    }

    /**
     * Enable or disable the columns layout toolbar item.
     * Columns are disabled by default.
     */
    public function hasColumns(bool $enabled = true): static
    {
        return $this->toggleToolbarItem(ToolbarItem::COLUMNS, $enabled, ToolbarItem::TABLE);
    }

    /**
     * Enable or disable the YouTube embed toolbar item.
     * YouTube embeds are disabled by default.
     */
    public function hasYouTube(bool $enabled = true): static
    {
        return $this->toggleToolbarItem(ToolbarItem::YOUTUBE, $enabled, ToolbarItem::IMAGE);
    }

    /**
     * Enable or disable the Tweet/X embed toolbar item.
     * Tweet embeds are disabled by default.
     */
    public function hasTweets(bool $enabled = true): static
    {
        return $this->toggleToolbarItem(ToolbarItem::TWEET, $enabled, ToolbarItem::YOUTUBE);
    }

    /**
     * Enable or disable the collapsible section toolbar item.
     * Collapsible sections are disabled by default.
     */
    public function hasCollapsible(bool $enabled = true): static
    {
        return $this->toggleToolbarItem(ToolbarItem::COLLAPSIBLE, $enabled, ToolbarItem::TWEET);
    }

    /**
     * Enable or disable the date picker toolbar item.
     * Date picker is disabled by default.
     */
    public function hasDate(bool $enabled = true): static
    {
        return $this->toggleToolbarItem(ToolbarItem::DATE, $enabled, ToolbarItem::COLLAPSIBLE);
    }

    /**
     * Enable all embed features (YouTube, Tweets, Collapsible sections).
     */
    public function hasEmbeds(bool $enabled = true): static
    {
        return $this
            ->hasYouTube($enabled)
            ->hasTweets($enabled)
            ->hasCollapsible($enabled);
    }

    /**
     * Helper method to toggle a toolbar item.
     */
    protected function toggleToolbarItem(ToolbarItem $item, bool $enabled, ?ToolbarItem $insertAfter = null): static
    {
        $toolbars = $this->evaluate($this->enabledToolbars);

        if ($enabled) {
            if (! in_array($item, $toolbars, true)) {
                if ($insertAfter !== null) {
                    $index = array_search($insertAfter, $toolbars, true);
                    if ($index !== false) {
                        array_splice($toolbars, $index + 1, 0, [$item]);
                    } else {
                        $toolbars[] = $item;
                    }
                } else {
                    $toolbars[] = $item;
                }
            }
        } else {
            $toolbars = array_filter($toolbars, fn ($i) => $i !== $item);
        }

        $this->enabledToolbars = array_values($toolbars);

        return $this;
    }

    /**
     * Set toolbar items using string identifiers.
     * Example: ->toolbarOptions(['undo', 'redo', 'divider', 'bold', 'italic', 'link'])
     *
     * @deprecated Use enabledToolbars() instead, which now supports both formats.
     *
     * @param  array<string|ToolbarItem>  $options
     */
    public function toolbarOptions(array $options): static
    {
        $this->enabledToolbars = $this->resolveToolbarItems($options);

        return $this;
    }

    /**
     * Use a preset toolbar configuration.
     * Available presets: 'minimal', 'basic', 'standard', 'full'
     */
    public function preset(string $preset): static
    {
        $this->enabledToolbars = match ($preset) {
            'minimal' => [
                ToolbarItem::BOLD, ToolbarItem::ITALIC, ToolbarItem::UNDERLINE,
                ToolbarItem::DIVIDER, ToolbarItem::LINK,
            ],
            'basic' => [
                ToolbarItem::UNDO, ToolbarItem::REDO, ToolbarItem::DIVIDER,
                ToolbarItem::BOLD, ToolbarItem::ITALIC, ToolbarItem::UNDERLINE,
                ToolbarItem::DIVIDER, ToolbarItem::LINK, ToolbarItem::DIVIDER,
                ToolbarItem::BULLET, ToolbarItem::NUMBERED,
            ],
            'standard' => [
                ToolbarItem::UNDO, ToolbarItem::REDO, ToolbarItem::DIVIDER,
                ToolbarItem::NORMAL, ToolbarItem::H1, ToolbarItem::H2, ToolbarItem::H3,
                ToolbarItem::DIVIDER, ToolbarItem::BULLET, ToolbarItem::NUMBERED, ToolbarItem::QUOTE,
                ToolbarItem::DIVIDER, ToolbarItem::BOLD, ToolbarItem::ITALIC, ToolbarItem::UNDERLINE,
                ToolbarItem::DIVIDER, ToolbarItem::LINK, ToolbarItem::DIVIDER,
                ToolbarItem::LEFT, ToolbarItem::CENTER, ToolbarItem::RIGHT,
            ],
            'full' => self::getFullToolbar(),
            default => throw new InvalidArgumentException("Unknown toolbar preset: {$preset}"),
        };

        return $this;
    }

    /**
     * Get the full toolbar configuration including all items.
     */
    public static function getFullToolbar(): array
    {
        return [
            ToolbarItem::UNDO, ToolbarItem::REDO, ToolbarItem::DIVIDER,
            ToolbarItem::FONT_FAMILY, ToolbarItem::DIVIDER,
            ToolbarItem::NORMAL, ToolbarItem::H1, ToolbarItem::H2, ToolbarItem::H3,
            ToolbarItem::H4, ToolbarItem::H5, ToolbarItem::H6, ToolbarItem::DIVIDER,
            ToolbarItem::BULLET, ToolbarItem::NUMBERED, ToolbarItem::QUOTE,
            ToolbarItem::CODE, ToolbarItem::DIVIDER,
            ToolbarItem::FONT_SIZE, ToolbarItem::DIVIDER,
            ToolbarItem::BOLD, ToolbarItem::ITALIC, ToolbarItem::UNDERLINE,
            ToolbarItem::ICODE, ToolbarItem::LINK, ToolbarItem::DIVIDER,
            ToolbarItem::TEXT_COLOR, ToolbarItem::BACKGROUND_COLOR, ToolbarItem::DIVIDER,
            ToolbarItem::LOWERCASE, ToolbarItem::UPPERCASE, ToolbarItem::CAPITALIZE,
            ToolbarItem::STRIKETHROUGH, ToolbarItem::SUBSCRIPT, ToolbarItem::SUPERSCRIPT,
            ToolbarItem::CLEAR, ToolbarItem::DIVIDER,
            ToolbarItem::LEFT, ToolbarItem::CENTER, ToolbarItem::RIGHT, ToolbarItem::JUSTIFY,
            ToolbarItem::START, ToolbarItem::END, ToolbarItem::DIVIDER,
            ToolbarItem::INDENT, ToolbarItem::OUTDENT, ToolbarItem::DIVIDER,
            ToolbarItem::HR, ToolbarItem::TABLE, ToolbarItem::COLUMNS, ToolbarItem::DIVIDER,
            ToolbarItem::IMAGE, ToolbarItem::YOUTUBE, ToolbarItem::TWEET, ToolbarItem::DIVIDER,
            ToolbarItem::COLLAPSIBLE, ToolbarItem::DATE, ToolbarItem::DIVIDER,
        ];
    }

    /**
     * Configure internal links for the link editor.
     * Allows users to select from predefined internal pages.
     *
     * Accepts multiple formats:
     * - [['title' => 'About Us', 'slug' => 'about-us']] (explicit)
     * - [['About Us' => 'about-us']] (title as key, slug as value)
     * - ['About Us' => 'about-us'] (simple key-value pairs)
     */
    public function internalLinks(array $links, ?string $siteUrl = null): static
    {
        $this->internalLinks = $this->normalizeInternalLinks($links);
        $this->siteUrl = $siteUrl ?? config('app.url');

        return $this;
    }

    /**
     * Normalize internal links to consistent format: [['title' => ..., 'slug' => ...], ...]
     */
    protected function normalizeInternalLinks(array $links): array
    {
        $normalized = [];

        foreach ($links as $key => $value) {
            // Format: ['title' => 'About Us', 'slug' => 'about-us'] (already normalized)
            if (is_array($value) && isset($value['title'], $value['slug'])) {
                $normalized[] = $value;
            }
            // Format: ['About Us' => 'about-us'] (inside an array wrapper)
            elseif (is_array($value)) {
                foreach ($value as $title => $slug) {
                    if (is_string($title) && is_string($slug)) {
                        $normalized[] = ['title' => $title, 'slug' => $slug];
                    }
                }
            }
            // Format: 'About Us' => 'about-us' (direct key-value)
            elseif (is_string($key) && is_string($value)) {
                $normalized[] = ['title' => $key, 'slug' => $value];
            }
        }

        return $normalized;
    }

    public function getInternalLinks(): array
    {
        return $this->internalLinks;
    }

    public function hasInternalLinks(): bool
    {
        return ! empty($this->internalLinks);
    }

    public function getSiteUrl(): string
    {
        return $this->siteUrl ?? config('app.url');
    }

    public function sanitizeHtmlUsing(?Closure $callback): static
    {
        $this->sanitizeHtmlUsing = $callback;

        return $this;
    }

    protected function sanitizeHtml(?string $html): ?string
    {
        if (! is_string($html) || $html === '') {
            return $html;
        }

        if ($this->sanitizeHtmlUsing instanceof Closure) {
            return (string) ($this->sanitizeHtmlUsing)($html);
        }

        return $html;
    }
}
