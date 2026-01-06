# Contributing to Code Translator

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/Fergonz1993/code-translator.git
cd code-translator

# Install dependencies
bun install

# Copy environment file
cp .env.example .env.local

# Start development server
bun run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Production build |
| `bun run test` | Run all tests |
| `bun run lint` | Run ESLint |

## Project Structure

```text
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   └── page.tsx        # Main page
├── components/         # React components
│   ├── ui/            # Reusable UI primitives
│   └── *.tsx          # Feature components
├── hooks/             # Custom React hooks
├── lib/               # Utilities and services
└── tests/             # Test files
```

## Code Style

- Use TypeScript strict mode
- Follow existing file structure patterns
- Add section comments (`// ===== SECTION =====`)
- Export types from dedicated files

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run `bun run test` and `bun run lint`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Bug Reports

Please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/OS version
- Console errors (if any)
