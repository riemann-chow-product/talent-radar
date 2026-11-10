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
cd server && mvn test
python3 -m py_compile scripts/crawl_market_jobs.py scripts/crawl_channel_jobs.py
node --check assets/js/app.js
```

- [ ] Backend tests pass
- [ ] Front-end checked in a browser (demo mode and online mode)
- [ ] Crawler / seed data regenerated and all consumer files kept in sync
- [ ] Documentation updated (README / CONTRIBUTING)

## Checklist

- [ ] PR title, description and **all commit messages are in English**
- [ ] Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, ...)
- [ ] No build output (`server/target/`), IDE files or credentials committed
- [ ] UI strings do not expose infrastructure names (e.g. "Spring Boot", "MySQL")

## Screenshots

Add before/after screenshots for UI changes.
