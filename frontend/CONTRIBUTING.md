# Contributing to Fafa Access Frontend

Thank you for your interest in contributing to the Fafa Access Frontend! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure if needed
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📋 Development Guidelines

### Code Style

- We use TypeScript for type safety
- Follow the existing code structure and patterns
- Use functional components with React Hooks
- Keep components small and focused (single responsibility principle)
- Use meaningful variable and function names

### Component Guidelines

- **Reusable components** go in `src/components/`
- **Page components** go in `src/pages/`
- **Layout components** go in `src/layouts/`
- **Utility functions** go in `src/utils/`
- **Custom hooks** go in `src/hooks/`
- **Type definitions** go in `src/types/`

### Styling

- We use Tailwind CSS for styling
- Follow the existing Tailwind patterns
- Use semantic class names
- Avoid inline styles when possible

### TypeScript

- Always define proper types
- Avoid using `any` type
- Use interfaces for object shapes
- Use type aliases for unions and complex types

### File Naming

- Components: PascalCase (e.g., `UserProfile.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Types: PascalCase (e.g., `UserTypes.ts`)

## 🔍 Code Quality

### Linting

Before committing, ensure your code passes linting:

```bash
npm run lint
```

### Building

Ensure your changes build successfully:

```bash
npm run build
```

### Testing

If tests exist, run them before committing:

```bash
npm test
```

## 📝 Commit Guidelines

We follow conventional commit messages:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat: add user profile page
fix: resolve navigation issue on mobile
docs: update API integration guide
```

## 🔄 Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure code passes linting and builds successfully
4. Write clear commit messages
5. Push your branch and create a pull request
6. Describe your changes in the PR description
7. Wait for code review and address feedback

## 🐛 Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser and version
- Any error messages

## 💡 Feature Requests

We welcome feature requests! Please:

- Check if the feature already exists or is planned
- Clearly describe the feature and its benefits
- Provide use cases and examples
- Be open to discussion and feedback

## 📚 Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## ❓ Questions

If you have questions, please:

- Check the README.md first
- Search existing issues
- Create a new issue with the "question" label

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing! 🎉
