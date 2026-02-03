# Contributing to UBC Mining Method Selector

Thank you for your interest in contributing to this project! This document provides guidelines for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all experience levels.

## How to Contribute

### Reporting Issues

1. Check if the issue already exists in the GitHub Issues
2. Create a new issue with a clear title and description
3. Include steps to reproduce for bugs
4. Include expected vs actual behavior

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Write/update tests as needed
5. Ensure all tests pass (`npm test`)
6. Ensure linting passes (`npm run lint`)
7. Commit with clear messages
8. Push to your fork
9. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/ubc-mining-method-selector.git
cd ubc-mining-method-selector

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint
```

## Project Structure

```
├── data/                           # Static data files
│   └── method-selector-config.json # Scoring weights configuration
├── docs/                           # Documentation
├── src/
│   ├── app/                        # Next.js pages and layout
│   ├── components/                 # React components
│   │   ├── InputForm.tsx          # Parameter input form
│   │   ├── ResultsDisplay.tsx     # Results display component
│   │   ├── WeightsModal.tsx       # Weights reference modal
│   │   └── PDFReport.tsx          # PDF generation
│   ├── lib/                        # Utility functions
│   │   ├── scoring-engine.ts      # Core scoring logic
│   │   └── utils.ts               # Helper utilities
│   ├── types/                      # TypeScript definitions
│   └── __tests__/                  # Test files
└── public/                         # Static assets
```

## Adding New Mining Methods

**Important**: Adding or modifying mining methods requires expert validation. The scoring weights are based on established mining engineering research.

If you believe a new method should be added:

1. Open an issue to discuss the proposed addition
2. Provide references to peer-reviewed sources
3. Include proposed weights with justification
4. Get maintainer approval before implementing

To implement (after approval):

1. Add the method to `data/method-selector-config.json`:
   - Add to the `methods` array
   - Add weights for all factors in the `weights` object
2. Update tests in `src/__tests__/scoring-engine.test.ts`
3. Update documentation

## Modifying Scoring Weights

**Caution**: The weights are extracted from the validated UBC Excel implementation. Modifications should only be made with:

1. Clear justification based on mining engineering research
2. References to peer-reviewed sources
3. Maintainer approval
4. Updated tests to verify changes

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define explicit types (avoid `any`)
- Use interfaces for object shapes
- Export types from `src/types/index.ts`

### React Components

- Use functional components with hooks
- Prefer composition over inheritance
- Keep components focused and small
- Use `'use client'` directive only when needed

### Naming Conventions

- Components: PascalCase (`InputForm.tsx`)
- Functions: camelCase (`calculateScores`)
- Types/Interfaces: PascalCase (`InputValues`)
- Constants: SCREAMING_SNAKE_CASE or camelCase
- Files: kebab-case or PascalCase for components

### Testing

- Write tests for all scoring engine functions
- Include edge cases and elimination scenarios
- Use descriptive test names
- Group related tests with `describe` blocks

Example:
```typescript
describe('calculateScores', () => {
  it('should rank Open Pit highest for shallow, strong rock deposit', () => {
    // test implementation
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- scoring-engine.test.ts
```

## Documentation

- Update README.md for user-facing changes
- Update docs/ for technical documentation
- Include JSDoc comments for public functions
- Keep code comments minimal but meaningful

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add PDF export functionality
fix: correct elimination threshold calculation
docs: update methodology section in README
test: add golden tests for scoring engine
refactor: simplify category score calculation
```

## Release Process

Releases are managed by maintainers. To request a release:

1. Ensure all tests pass
2. Update version in package.json
3. Update CHANGELOG.md
4. Create a release PR

## Questions?

- Open an issue for general questions
- Tag maintainers for urgent matters
- Check existing issues/PRs before asking

Thank you for contributing!
