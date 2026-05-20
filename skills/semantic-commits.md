# Semantic Commits

## Purpose
Standardize version control in the repository by consistently using defined semantic prefixes for every autonomous commit made by the AI.

## Mandatory Directives
- **Standardize version control**: Ensure historical legibility and clean structure in Git.
- **Mandatory use of recognizable prefixes**: Use prefixes such as `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, etc., every time the AI performs an autonomous commit to the repository.

## Anti-patterns
- Creating commits with generic, vague, or prefix-less messages (e.g., "commit", "changes", "updating files").
- Using invented or non-standardized prefixes (e.g., `bug:`, `revert:`, `new:`).
- Making massive commits that bundle changes of varying nature (e.g., fixing a bug and adding a feature in the same commit) under a single mixed prefix.
- Omitting the use of the imperative mood or present tense in the commit description (e.g., using "fix: corrected physics" instead of "fix: correct physics").
