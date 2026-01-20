# Filament Meta Lexical Editor

A modern, extensible rich-text editor for FilamentPHP built on Meta's Lexical framework.

## Features

- **Rich Text Editing**: Full-featured WYSIWYG editor with headings, lists, quotes, and code blocks
- **Text Formatting**: Bold, italic, underline, strikethrough, subscript, superscript
- **Text Casing**: Lowercase, uppercase, capitalize transformations
- **Font Controls**: Configurable font families and sizes
- **Color Pickers**: Text color and background color selection
- **Link Management**: Insert, edit, and remove hyperlinks with internal link support
- **Image Upload**: Upload and manage images with alt text and dimensions
- **Tables**: Insert and edit tables with headers, borders, and cell padding options
- **Column Layouts**: Multi-column layouts (2, 3, or 4 columns)
- **Media Embeds**: YouTube videos and Twitter/X tweets
- **Collapsible Sections**: Expandable/collapsible content blocks
- **Date Picker**: Insert formatted dates with multiple format options
- **Keyboard Shortcuts**: Full keyboard shortcut support
- **HTML Sanitization**: Built-in XSS protection for safe content storage
- **RTL Support**: Right-to-left text direction support
- **Orphaned Image Cleanup**: Automatic cleanup of deleted images on save

## Installation

Install the package via Composer:

```bash
composer require pjedesigns/filament-meta-lexical-editor
```

Publish the configuration file (optional):

```bash
php artisan vendor:publish --tag="filament-meta-lexical-editor-config"
```

Publish Filament assets (if you haven't already):

```bash
php artisan filament:assets
```

> **Note:** The package automatically registers its assets with Filament. Running `filament:assets` is sufficient - no separate asset publishing is required.

## Usage

### Basic Usage

Add the editor to your Filament form:

```php
use Pjedesigns\FilamentMetaLexicalEditor\MetaLexicalEditor;

public static function form(Form $form): Form
{
    return $form
        ->schema([
            MetaLexicalEditor::make('content'),
        ]);
}
```

### Toolbar Configuration

#### Using String Names (Recommended)

The simplest way to configure the toolbar:

```php
MetaLexicalEditor::make('content')
    ->enabledToolbars([
        'bold',
        'italic',
        'underline',
        'divider',
        'h1',
        'h2',
        'h3',
        'divider',
        'bullet',
        'numbered',
        'divider',
        'link',
        'image',
    ]);
```

#### Using Enum Constants

For IDE autocompletion support:

```php
use Pjedesigns\FilamentMetaLexicalEditor\Enums\ToolbarItem;

MetaLexicalEditor::make('content')
    ->enabledToolbars([
        ToolbarItem::BOLD,
        ToolbarItem::ITALIC,
        ToolbarItem::UNDERLINE,
        ToolbarItem::DIVIDER,
        ToolbarItem::H1,
        ToolbarItem::H2,
        ToolbarItem::H3,
        ToolbarItem::DIVIDER,
        ToolbarItem::BULLET,
        ToolbarItem::NUMBERED,
        ToolbarItem::DIVIDER,
        ToolbarItem::LINK,
        ToolbarItem::IMAGE,
    ]);
```

#### Using Presets

Quick configurations for common use cases:

```php
// Minimal: bold, italic, underline, link
MetaLexicalEditor::make('content')->preset('minimal');

// Basic: undo/redo, basic formatting, lists, link
MetaLexicalEditor::make('content')->preset('basic');

// Standard: headings, lists, quotes, formatting, alignment
MetaLexicalEditor::make('content')->preset('standard');

// Full: all available toolbar items
MetaLexicalEditor::make('content')->preset('full');
```

### Enabling Features

#### Images

Images are disabled by default for security. Enable them with:

```php
MetaLexicalEditor::make('content')
    ->hasImages();
```

#### Tables

Tables are enabled by default. To disable:

```php
MetaLexicalEditor::make('content')
    ->hasTables(false);
```

#### Column Layouts

```php
MetaLexicalEditor::make('content')
    ->hasColumns();
```

#### YouTube Embeds

```php
MetaLexicalEditor::make('content')
    ->hasYouTube();
```

#### Twitter/X Embeds

```php
MetaLexicalEditor::make('content')
    ->hasTweets();
```

#### Collapsible Sections

```php
MetaLexicalEditor::make('content')
    ->hasCollapsible();
```

#### Date Picker

```php
MetaLexicalEditor::make('content')
    ->hasDate();
```

#### All Embeds

Enable YouTube, Tweets, and Collapsible sections at once:

```php
MetaLexicalEditor::make('content')
    ->hasEmbeds();
```

#### Full Featured Example

```php
MetaLexicalEditor::make('content')
    ->hasImages()
    ->hasColumns()
    ->hasYouTube()
    ->hasTweets()
    ->hasCollapsible()
    ->hasDate();
```

### Internal Links

Configure predefined internal pages for the link editor:

```php
MetaLexicalEditor::make('content')
    ->internalLinks([
        'Home' => '/',
        'About Us' => 'about-us',
        'Contact' => 'contact',
        'Privacy Policy' => 'privacy-policy',
    ]);
```

Or with explicit format:

```php
MetaLexicalEditor::make('content')
    ->internalLinks([
        ['title' => 'Home', 'slug' => '/'],
        ['title' => 'About Us', 'slug' => 'about-us'],
    ], 'https://example.com'); // Optional site URL
```

### Image Cleanup

By default, the editor automatically cleans up orphaned images when content is saved (images that were uploaded but later removed from the content). To disable:

```php
MetaLexicalEditor::make('content')
    ->cleanupOrphanedImages(false);
```

### Custom HTML Sanitization

Override the default sanitizer with your own implementation:

```php
MetaLexicalEditor::make('content')
    ->sanitizeHtmlUsing(function (string $html): string {
        // Your custom sanitization logic
        return $html;
    });
```

## Displaying Content

### In Infolists

Use the `LexicalContentEntry` component to display editor content with full support for embedded media (YouTube, Tweets):

```php
use Pjedesigns\FilamentMetaLexicalEditor\Infolists\Components\LexicalContentEntry;

public static function infolist(Infolist $infolist): Infolist
{
    return $infolist
        ->schema([
            LexicalContentEntry::make('content')
                ->hiddenLabel(),
        ]);
}
```

### In Tables

Use the `SanitizedHtmlColumn` component for table views:

```php
use Pjedesigns\FilamentMetaLexicalEditor\Tables\Columns\SanitizedHtmlColumn;

public static function table(Table $table): Table
{
    return $table
        ->columns([
            SanitizedHtmlColumn::make('content')
                ->limit(100),
        ]);
}
```

### In Blade Views

For frontend display, you need to include the frontend CSS and wrap your content:

#### Step 1: Publish the Frontend CSS

```bash
php artisan vendor:publish --tag="filament-meta-lexical-editor-frontend"
```

This publishes `frontend.css` to `public/vendor/filament-meta-lexical-editor/frontend.css`.

#### Step 2: Include the CSS in Your Layout

Add this to your frontend layout's `<head>`:

```blade
<link rel="stylesheet" href="{{ asset('vendor/filament-meta-lexical-editor/frontend.css') }}">
```

Or import it in your Vite build (e.g., in your `app.css`):

```css
@import '../../vendor/pjedesigns/filament-meta-lexical-editor/resources/css/frontend.css';
```

#### Step 3: Wrap Your Content

Output the content wrapped in a `lexical-content` div:

```blade
<div class="lexical-content">
    {!! $post->content !!}
</div>
```

#### Twitter Embeds

For Twitter embeds to work on the frontend, include the Twitter widget script:

```blade
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
```

#### Dark Mode Support

The frontend CSS includes dark mode styles. Add the `dark` class to a parent element:

```blade
<body class="dark">
    <div class="lexical-content">
        {!! $post->content !!}
    </div>
</body>
```

## Configuration

The configuration file (`config/filament-meta-lexical-editor.php`) allows you to customize:

### Storage Settings

```php
// Storage disk for uploaded images
'disk' => env('FILAMENT_META_LEXICAL_EDITOR_DISK'),

// Directory for uploaded images
'directory' => env('FILAMENT_META_LEXICAL_EDITOR_DIR', 'lexical'),

// Maximum file size in KB (default: 5MB)
'max_kb' => env('FILAMENT_META_LEXICAL_EDITOR_MAX_KB', 5120),

// Allowed MIME types
'allowed_mimes' => env('FILAMENT_META_LEXICAL_EDITOR_MIMES', 'jpg,jpeg,png,gif,webp,svg'),
```

### Route Middleware

```php
'middleware' => ['web', 'auth'],
```

### Upload Route

```php
'upload_route' => '/filament-meta-lexical-editor/upload-image',
```

### Font Settings

```php
'fonts' => [
    'families' => [
        'Arial' => 'Arial',
        'Courier New' => 'Courier New',
        'Georgia' => 'Georgia',
        'Times New Roman' => 'Times New Roman',
        'Trebuchet MS' => 'Trebuchet MS',
        'Verdana' => 'Verdana',
    ],
    'min_size' => 8,
    'max_size' => 72,
    'default_size' => 15,
],
```

## Available Toolbar Items

| String Value | Enum Constant | Description |
|-------------|---------------|-------------|
| `undo` | `UNDO` | Undo last action |
| `redo` | `REDO` | Redo last undone action |
| `fontFamily` | `FONT_FAMILY` | Font family selector |
| `fontSize` | `FONT_SIZE` | Font size controls |
| `normal` | `NORMAL` | Paragraph format |
| `h1` - `h6` | `H1` - `H6` | Heading levels 1-6 |
| `bold` | `BOLD` | Bold text |
| `italic` | `ITALIC` | Italic text |
| `underline` | `UNDERLINE` | Underlined text |
| `strikethrough` | `STRIKETHROUGH` | Strikethrough text |
| `subscript` | `SUBSCRIPT` | Subscript text |
| `superscript` | `SUPERSCRIPT` | Superscript text |
| `lowercase` | `LOWERCASE` | Convert to lowercase |
| `uppercase` | `UPPERCASE` | Convert to uppercase |
| `capitalize` | `CAPITALIZE` | Capitalize words |
| `bullet` | `BULLET` | Bullet list |
| `numbered` | `NUMBERED` | Numbered list |
| `quote` | `QUOTE` | Block quote |
| `code` | `CODE` | Code block |
| `icode` | `ICODE` | Inline code |
| `link` | `LINK` | Insert/edit hyperlink |
| `textColor` | `TEXT_COLOR` | Text color picker |
| `backgroundColor` | `BACKGROUND_COLOR` | Background color picker |
| `left` | `LEFT` | Align left |
| `center` | `CENTER` | Align center |
| `right` | `RIGHT` | Align right |
| `justify` | `JUSTIFY` | Justify text |
| `start` | `START` | Align to start (RTL-aware) |
| `end` | `END` | Align to end (RTL-aware) |
| `indent` | `INDENT` | Increase indentation |
| `outdent` | `OUTDENT` | Decrease indentation |
| `hr` | `HR` | Horizontal rule |
| `image` | `IMAGE` | Image upload |
| `table` | `TABLE` | Insert table |
| `columns` | `COLUMNS` | Column layout |
| `youtube` | `YOUTUBE` | YouTube embed |
| `tweet` | `TWEET` | Twitter/X embed |
| `collapsible` | `COLLAPSIBLE` | Collapsible section |
| `date` | `DATE` | Date picker |
| `clear` | `CLEAR` | Clear formatting |
| `divider` | `DIVIDER` | Visual toolbar separator |

## Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|--------------|-------|
| Bold | `Ctrl+B` | `⌘+B` |
| Italic | `Ctrl+I` | `⌘+I` |
| Underline | `Ctrl+U` | `⌘+U` |
| Undo | `Ctrl+Z` | `⌘+Z` |
| Redo | `Ctrl+Y` | `⌘+Shift+Z` |
| Insert Link | `Ctrl+K` | `⌘+K` |
| Heading 1-6 | `Ctrl+Alt+1-6` | `⌘+Opt+1-6` |
| Paragraph | `Ctrl+Alt+0` | `⌘+Opt+0` |
| Bullet List | `Ctrl+Alt+7` | `⌘+Opt+7` |
| Numbered List | `Ctrl+Alt+8` | `⌘+Opt+8` |
| Quote | `Ctrl+Alt+Q` | `⌘+Opt+Q` |
| Code Block | `Ctrl+Alt+C` | `⌘+Opt+C` |
| Increase Font | `Ctrl+Shift+.` | `⌘+Shift+.` |
| Decrease Font | `Ctrl+Shift+,` | `⌘+Shift+,` |

## Security

The package includes robust HTML sanitization to prevent XSS attacks:

- **Dangerous Tags Removed**: `<script>`, `<object>`, `<embed>`, `<style>`, `<form>`, etc.
- **Event Handlers Stripped**: `onclick`, `onerror`, `onload`, etc.
- **URL Validation**: Blocks `javascript:`, `data:`, `file:` protocols
- **Style Sanitization**: Only allows safe CSS properties
- **Image Source Validation**: Only allows `http://`, `https://`, and relative paths
- **Iframe Allowlist**: YouTube and Vimeo domains are permitted for video embeds

## Testing

Run the test suite:

```bash
composer test
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

## Security Vulnerabilities

Please review [our security policy](../../security/policy) on how to report security vulnerabilities.

## Credits

- [Paul Egan](https://github.com/pjedesigns)
- Based on [Meta's Lexical Editor](https://lexical.dev/)
- Inspired by [malzariey/filament-lexical-editor](https://github.com/malzariey/filament-lexical-editor)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
