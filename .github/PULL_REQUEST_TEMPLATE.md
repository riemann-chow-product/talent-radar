## Summary

Briefly describe what this PR changes (English only).

## Motivation

Why is this change needed? Link the related issue: `Closes #...`

## Changes

- [ ] Item 1
- [ ] Item 2

## Test plan

How was this verified?

```bash
cd server && mvn clean package   # builds the jar; no Java tests exist yet
python3 -m py_compile scripts/*.py
for f in assets/js/*.js; do node --check "$f"; done
python3 scripts/scrub_seed_pii.py --check
```

- [ ] Backend builds (`mvn clean package`); note that the project has no Java tests yet
- [ ] Front-end checked in a browser (demo mode and online mode)
- [ ] Crawler / seed data regenerated and all consumer files kept in sync
- [ ] `server/target/*.jar` and `classes/` rebuilt if Java sources or seeds changed
- [ ] PII check passes (`scripts/scrub_seed_pii.py --check`)
- [ ] Documentation updated (README / CONTRIBUTING)

## Checklist

- [ ] PR title, description and **all commit messages are in English**
- [ ] Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, ...)
- [ ] No IDE files, local databases, `maven-status/*.lst` or credentials committed
      (`server/target/` jars are tracked intentionally — see CONTRIBUTING.md)
- [ ] UI strings do not expose infrastructure names (e.g. "Spring Boot", "MySQL")

## Screenshots

Add before/after screenshots for UI changes.
