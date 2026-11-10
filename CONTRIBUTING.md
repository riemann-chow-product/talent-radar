# Contributing to TalentRadar

Thanks for helping improve TalentRadar. This document describes the project conventions.

## Language policy (required)

**All issues, pull requests and commit messages must be written in English.**

This applies to:

- issue titles and bodies (including bug reports and feature requests),
- pull request titles and descriptions,
- every commit message (subject **and** body),
- code review comments and discussions.

The product UI and the seed job data are Chinese; that is product content, not
contribution text. Technical comments already in the codebase may be in Chinese, but
new contribution metadata must be English. Using one language for the whole history
keeps `git log`, changelogs and release notes consistent and searchable.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short imperative summary>

[optional body: what changed and why]
[optional footer: Closes #123]
```

Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`,
`perf`, `style`.

Examples:

```
feat(radar): add WeChat channel job sync to seed files
fix(api): fall back to demo data when health probe fails
docs(readme): add Chinese translation and English default
chore(seed): refresh channel job snapshots
```

Rules:

- Subject line: imperative mood, no trailing period, at most 72 characters.
- Explain **why** in the body when the change is not obvious.
- One logical change per commit.
- Reference issues/PRs in the footer (`Closes #123`, `Refs #123`).

A commit template is provided. Enable it once per clone:

```bash
git config commit.template .gitmessage
```

## Issues

Use the English templates under `.github/ISSUE_TEMPLATE/`. Before opening an issue:

1. Search existing issues to avoid duplicates.
2. Include reproduction steps, expected vs. actual behaviour, and environment
   (OS, JDK/Node/Python versions, browser, Docker or local run).
3. For crawler issues, name the affected source and include the command you ran.

## Pull requests

1. Fork the repository and create a topic branch from `main`.
2. Keep commits focused and write all commit messages in English (see above).
3. Update documentation when behaviour or configuration changes.
4. Run the checks locally before requesting review:

   ```bash
   cd server && mvn test
   python3 -m py_compile scripts/crawl_market_jobs.py scripts/crawl_channel_jobs.py
   node --check assets/js/app.js   # and the other changed JS files
   ```

5. If you change job data, regenerate it with the crawlers and keep **all** consumer
   seed files in sync (see the README section "Job data and crawlers").
6. Fill in the English pull request template: summary, motivation, test plan and any
   screenshots for UI changes.
7. Do not commit build output (`server/target/`), IDE files or local databases.

## Code style

- Java: 4-space indent, standard Spring Boot idioms; keep controllers thin.
- JavaScript: ES5-compatible style, 2-space indent, `var`, no build step.
- Python: 4-space indent, standard library only for the crawlers.
- Keep user-facing UI strings free of infrastructure names (for example, do not
  display "Spring Boot" or "MySQL" in the interface).

## License

By contributing you agree that your contributions are licensed under the
[Apache License 2.0](LICENSE).
