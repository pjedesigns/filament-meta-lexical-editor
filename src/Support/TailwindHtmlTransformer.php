<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Support;

class TailwindHtmlTransformer
{
    /**
     * Default mapping from Lexical CSS classes to Tailwind CSS classes.
     */
    protected static array $defaultMap = [
        // Typography - Headings
        'lexical__h1' => 'text-4xl font-bold mb-4',
        'lexical__h2' => 'text-3xl font-semibold mb-3',
        'lexical__h3' => 'text-2xl font-semibold mb-2',
        'lexical__h4' => 'text-xl font-semibold mb-2',
        'lexical__h5' => 'text-lg font-medium mb-1',
        'lexical__h6' => 'text-base font-medium mb-1',

        // Typography - Text formatting
        'lexical__paragraph' => 'mb-4',
        'lexical__textBold' => 'font-bold',
        'lexical__textItalic' => 'italic',
        'lexical__textUnderline' => 'underline',
        'lexical__textStrikethrough' => 'line-through',
        'lexical__textUnderlineStrikethrough' => 'underline line-through',
        'lexical__textSubscript' => 'text-xs align-sub',
        'lexical__textSuperscript' => 'text-xs align-super',
        'lexical__textCode' => 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-sm',
        'lexical__textLowercase' => 'lowercase',
        'lexical__textUppercase' => 'uppercase',
        'lexical__textCapitalize' => 'capitalize',

        // Links
        'lexical__link' => 'text-blue-600 hover:underline dark:text-blue-400',

        // Lists
        'lexical__ul' => 'list-disc list-inside mb-4 space-y-1',
        'lexical__ol' => 'list-decimal list-inside mb-4 space-y-1',
        'lexical__listItem' => '',

        // Quote
        'lexical__quote' => 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-700 dark:text-gray-300',

        // Code block
        'lexical__code' => 'bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4',

        // Tables
        'lexical__table' => 'w-full border-collapse mb-4',
        'lexical__tableCell' => 'border border-gray-300 dark:border-gray-600 p-2 align-top',
        'lexical__tableCellHeader' => 'border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-700 font-semibold',
        'lexical__tableRowStriping' => 'even:bg-gray-50 dark:even:bg-gray-800',

        // Alignment
        'lexical__ltr' => 'text-left',
        'lexical__rtl' => 'text-right',

        // Horizontal Rule
        'lexical__hr' => 'my-6 border-gray-300 dark:border-gray-600',

        // Images
        'lexical__editor-image' => 'max-w-full h-auto',
        'lexical__inline-editor-image' => 'max-w-full h-auto',

        // Hashtag
        'lexical__hashtag' => 'bg-blue-50 dark:bg-blue-900/20 border-b border-blue-300 dark:border-blue-600',

        // Indent
        'lexical__indent' => 'pl-10',
    ];

    /**
     * Transform Lexical HTML classes to Tailwind CSS classes.
     *
     * @param  string  $html  The HTML content with Lexical classes
     * @param  array  $customMap  Optional custom class mappings to merge with or override defaults
     * @param  bool  $removeOriginal  Whether to remove the original Lexical classes after transformation
     */
    public static function transform(string $html, array $customMap = [], bool $removeOriginal = true): string
    {
        if (empty($html)) {
            return $html;
        }

        $map = array_merge(static::$defaultMap, $customMap);

        // Use DOMDocument to safely parse and transform the HTML
        $dom = new \DOMDocument('1.0', 'UTF-8');

        // Suppress errors for malformed HTML
        libxml_use_internal_errors(true);

        // Wrap in div to preserve structure
        $dom->loadHTML(
            '<?xml encoding="UTF-8"><div>'.$html.'</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );

        libxml_clear_errors();

        $xpath = new \DOMXPath($dom);

        // Find all elements with class attributes
        $elements = $xpath->query('//*[@class]');

        foreach ($elements as $element) {
            $classes = $element->getAttribute('class');
            $classArray = preg_split('/\s+/', trim($classes));
            $newClasses = [];
            $tailwindClasses = [];

            foreach ($classArray as $class) {
                if (isset($map[$class])) {
                    // Add Tailwind classes
                    if (! empty($map[$class])) {
                        $tailwindClasses = array_merge(
                            $tailwindClasses,
                            preg_split('/\s+/', $map[$class])
                        );
                    }

                    // Keep original class only if not removing
                    if (! $removeOriginal) {
                        $newClasses[] = $class;
                    }
                } else {
                    // Keep non-Lexical classes
                    $newClasses[] = $class;
                }
            }

            // Combine new classes with Tailwind classes
            $finalClasses = array_merge($newClasses, $tailwindClasses);
            $finalClasses = array_unique($finalClasses);

            if (! empty($finalClasses)) {
                $element->setAttribute('class', implode(' ', $finalClasses));
            } else {
                $element->removeAttribute('class');
            }
        }

        // Extract the content from within our wrapper div
        $wrapper = $dom->getElementsByTagName('div')->item(0);
        $output = '';

        foreach ($wrapper->childNodes as $child) {
            $output .= $dom->saveHTML($child);
        }

        return $output;
    }

    /**
     * Get the default class mappings.
     */
    public static function getDefaultMap(): array
    {
        return static::$defaultMap;
    }

    /**
     * Set/override default class mappings globally.
     * Useful for customizing defaults in a service provider.
     */
    public static function setDefaultMap(array $map): void
    {
        static::$defaultMap = array_merge(static::$defaultMap, $map);
    }

    /**
     * Add a single class mapping.
     */
    public static function addMapping(string $lexicalClass, string $tailwindClasses): void
    {
        static::$defaultMap[$lexicalClass] = $tailwindClasses;
    }

    /**
     * Remove a class mapping.
     */
    public static function removeMapping(string $lexicalClass): void
    {
        unset(static::$defaultMap[$lexicalClass]);
    }

    /**
     * Reset to original default mappings.
     */
    public static function resetDefaults(): void
    {
        static::$defaultMap = [
            'lexical__h1' => 'text-4xl font-bold mb-4',
            'lexical__h2' => 'text-3xl font-semibold mb-3',
            'lexical__h3' => 'text-2xl font-semibold mb-2',
            'lexical__h4' => 'text-xl font-semibold mb-2',
            'lexical__h5' => 'text-lg font-medium mb-1',
            'lexical__h6' => 'text-base font-medium mb-1',
            'lexical__paragraph' => 'mb-4',
            'lexical__textBold' => 'font-bold',
            'lexical__textItalic' => 'italic',
            'lexical__textUnderline' => 'underline',
            'lexical__textStrikethrough' => 'line-through',
            'lexical__textUnderlineStrikethrough' => 'underline line-through',
            'lexical__textSubscript' => 'text-xs align-sub',
            'lexical__textSuperscript' => 'text-xs align-super',
            'lexical__textCode' => 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-sm',
            'lexical__textLowercase' => 'lowercase',
            'lexical__textUppercase' => 'uppercase',
            'lexical__textCapitalize' => 'capitalize',
            'lexical__link' => 'text-blue-600 hover:underline dark:text-blue-400',
            'lexical__ul' => 'list-disc list-inside mb-4 space-y-1',
            'lexical__ol' => 'list-decimal list-inside mb-4 space-y-1',
            'lexical__listItem' => '',
            'lexical__quote' => 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-700 dark:text-gray-300',
            'lexical__code' => 'bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4',
            'lexical__table' => 'w-full border-collapse mb-4',
            'lexical__tableCell' => 'border border-gray-300 dark:border-gray-600 p-2 align-top',
            'lexical__tableCellHeader' => 'border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-700 font-semibold',
            'lexical__tableRowStriping' => 'even:bg-gray-50 dark:even:bg-gray-800',
            'lexical__ltr' => 'text-left',
            'lexical__rtl' => 'text-right',
            'lexical__hr' => 'my-6 border-gray-300 dark:border-gray-600',
            'lexical__editor-image' => 'max-w-full h-auto',
            'lexical__inline-editor-image' => 'max-w-full h-auto',
            'lexical__hashtag' => 'bg-blue-50 dark:bg-blue-900/20 border-b border-blue-300 dark:border-blue-600',
            'lexical__indent' => 'pl-10',
        ];
    }
}
