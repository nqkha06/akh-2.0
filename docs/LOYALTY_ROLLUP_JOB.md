# Daily Loyalty Rollup

## Schedule

The API registers `loyalty.rollup-daily` in the shared `system-jobs` BullMQ
queue. By default it runs at `00:00 UTC` every day:

```text
0 0 * * *
```

The schedule can be overridden with `LOYALTY_ROLLUP_CRON`. UTC is fixed so
the scheduler, seven-day window, stored timestamps, and member Loyalty API use
the same day boundary.

## Calculation

Before ranking users, the worker drains completed access logs up to midnight
through the existing visit aggregation worker. The rollup then counts records
from `stu_access_logs` where:

- `is_earn = true`
- `completed_at >= midnight - 7 days`
- `completed_at < midnight`

Published Loyalty tiers are ordered by `minimum_valid_views`. Each user is
assigned the highest tier whose threshold is less than or equal to the user's
valid-view count. Users whose views fall outside the window are recalculated
and can move back to a lower tier.

The result is stored on `users`:

- `loyalty_tier_id`
- `loyalty_valid_views`
- `loyalty_window_started_at`
- `loyalty_window_ended_at`
- `loyalty_calculated_at`

## Idempotency

`loyalty_rollup_runs.day_key` is unique. The full rank update and run record are
written in one serializable transaction. Retrying an already completed date
returns its stored result without applying the updates twice.

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `LOYALTY_ROLLUP_DISABLED` | `false` | Removes/skips the daily scheduler when `true`. |
| `LOYALTY_ROLLUP_CRON` | `0 0 * * *` | BullMQ cron pattern, evaluated in UTC. |

The API process registers schedules. The separate worker process must be
running to consume `system-jobs`.
