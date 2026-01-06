# Changelog

All notable changes to Code Translator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Command Palette (⌘K) for quick actions
- Onboarding tutorial for new users
- Language auto-detection on paste
- Toast notification system
- Translation feedback (thumbs up/down)
- Share translation functionality
- Mobile navigation drawer
- Virtual scrolling for long code
- Service worker for offline caching
- CSRF token protection
- Input sanitization utilities
- API key encryption
- Audit logging for security events
- Analytics event tracking
- Feature flag system

### Changed
- Refactored page.tsx to use extracted components
- Improved Header component modularity
- Enhanced Footer component
- Better error handling with ErrorBoundary

### Security
- Added CSP headers via middleware
- Implemented rate limiting
- Added origin validation
- Secure session management
- XSS protection headers

## [1.0.0] - 2026-01-01

### Added
- Initial release
- Code to English translation
- Multiple AI providers (OpenAI, Google, Anthropic)
- Credit-based payment system
- BYOK (Bring Your Own Key) mode
- Dark mode support
- Translation history
- Export translations
