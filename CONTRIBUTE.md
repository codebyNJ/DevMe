# Contributing to DevMe

We welcome contributions from the community! Whether you're fixing bugs, adding new features, or improving documentation, your help is appreciated.

## How to Contribute

### 1. Fork the Repository

1. Click the "Fork" button in the top-right corner of the repository page
2. Clone your forked repository to your local machine
   ```bash
   git clone https://github.com/your-username/DevMe.git
   cd DevMe
   ```
3. Add the original repository as an upstream remote
   ```bash
   git remote add upstream https://github.com/original-owner/DevMe.git
   ```

### 2. Set Up Development Environment

1. Install the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `DevMe` directory

2. Make your changes in a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### 3. Making Changes

- Follow the existing code style and structure
- Write clear commit messages
- Keep changes focused and atomic
- Update documentation when necessary
- Test your changes thoroughly

### 4. Testing

Run the test files in the `tests/` directory to ensure everything works as expected:
- `tests/debug-test.html` - Basic functionality
- `tests/api-test.html` - API connectivity
- `tests/test-cdn.html` - CDN loading

### 5. Submitting a Pull Request

1. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a pull request against the `main` branch
3. Fill out the PR template with details about your changes
4. Wait for code review and address any feedback

## Code Style Guidelines

- Use consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add comments for complex logic
- Follow JavaScript best practices
- Keep functions small and focused

## Reporting Issues

Found a bug or have a feature request? Please open an issue with:

1. A clear title and description
2. Steps to reproduce the issue
3. Expected vs actual behavior
4. Browser/OS version if relevant
5. Screenshots if applicable

## Development Workflow

1. Always work on a new branch for each feature/fix
2. Keep your fork in sync with the main repository:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```
3. Rebase your feature branch before creating a PR:
   ```bash
   git checkout feature/your-feature-name
   git rebase main
   ```

## Code Review Process

1. All PRs require at least one approval
2. Maintainers will review your code for:
   - Code quality
   - Functionality
   - Performance impact
   - Security considerations
3. Be responsive to feedback and requested changes

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.
