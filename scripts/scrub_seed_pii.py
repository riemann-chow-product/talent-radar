#!/usr/bin/env python3
"""One-off / repeatable PII scrubber for every committed seed consumer.

Scraped WeChat job posts can contain real recruiter names, phone numbers and
emails. Running this script masks those values in all JSON and JS seed files
without changing their structure, ordering, ids or timestamps.

Usage:
    python3 scripts/scrub_seed_pii.py            # scrub and report
    python3 scripts/scrub_seed_pii.py --check    # verify no PII remains

Note: crawl_channel_jobs.py calls the same scrub_pii()/scrub_job() helpers when
it generates new jobs, so re-running the crawler cannot reintroduce PII.
"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from crawl_channel_jobs import scrub_pii  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent

TARGETS = [
    'server/src/main/resources/seed/state.json',
    'server/src/main/resources/seed/real-jobs.json',
    'server/src/main/resources/seed/market-jobs.json',
    'server/target/classes/seed/state.json',
    'server/target/classes/seed/real-jobs.json',
    'server/target/classes/seed/market-jobs.json',
    'assets/js/data.js',
    'assets/js/real-jobs.js',
    'assets/js/market-jobs.js',
]


def main():
    check_only = '--check' in sys.argv
    changed = 0
    for rel in TARGETS:
        path = ROOT / rel
        if not path.exists():
            print('MISSING', rel)
            continue
        original = path.read_text(encoding='utf-8')
        scrubbed = scrub_pii(original)
        if scrubbed != original:
            changed += 1
            if not check_only:
                path.write_text(scrubbed, encoding='utf-8')
            print('PII FOUND ', rel)
        else:
            print('clean     ', rel)
    if check_only:
        print('\nCHECK FAILED: PII still present in %d file(s)' % changed if changed
              else '\nCHECK OK: no PII found')
        return 1 if changed else 0
    print('\nScrubbed %d file(s).' % changed)
    return 0


if __name__ == '__main__':
    sys.exit(main())
