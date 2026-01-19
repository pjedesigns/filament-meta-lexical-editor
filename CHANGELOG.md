# Changelog

All notable changes to `filament-meta-lexical-editor` will be documented in this file.

## [Unreleased]

### Added
- `SanitizedHtmlColumn` table column component for displaying sanitized HTML in Filament tables
- Configurable font families via `config('filament-meta-lexical-editor.fonts.families')`
- Configurable font size limits (`min_size`, `max_size`, `default_size`)
- MIME type whitelist validation for image uploads (`allowed_mimes` config option)
- Rate limiting (60 requests/minute) on image upload endpoint
- `HasLabel` interface implementation on `ToolbarItem` enum
- Comprehensive test suite with Unit and Feature tests
- Full README documentation with usage examples

### Changed
- **BREAKING**: Moved `LexicalHtmlSanitizer` from `support/` to `src/Support/` for PSR-4 compliance
- Cleaned up `FilamentMetaLexicalEditorServiceProvider` - removed unused methods
- Toolbar font families now read from config instead of hardcoded values
- Improved TypeScript type safety - removed `null as any` casts

### Fixed
- PSR-4 autoloading issue with `LexicalHtmlSanitizer` class
- Typo in composer.json: `filaemntPHP` → `filamentPHP`
- Author name format in composer.json: `:Paul Egan` → `Paul Egan`
- Config default inconsistency: controller fallback now matches config default (`lexical`)
- Added explicit `JsonResponse` return type to `LexicalImageUploadController`

### Security
- Added explicit MIME type validation for image uploads
- Added rate limiting to prevent upload abuse
- Comprehensive XSS prevention test coverage

## [1.0.0] - Initial Release

### Added
- `MetaLexicalEditor` Filament form field component
- `SanitizedHtmlEntry` infolist component
- `LexicalHtmlSanitizer` for XSS prevention
- Full toolbar with 40+ items
- Image upload with dimension detection
- Keyboard shortcuts support
- RTL support
- Translation support
