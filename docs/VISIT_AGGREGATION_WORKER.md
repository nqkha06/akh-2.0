# Visit aggregation worker

## Architecture

Visit completion remains synchronous and only writes an unprocessed
`LinkAccessLog`. Revenue, earned-view limits, link counters, and member balance
are calculated asynchronously by the `system-jobs` BullMQ queue.

- The API process owns the BullMQ Job Scheduler.
- A separate worker process consumes aggregation jobs.
- Redis database and `QUEUE_PREFIX` isolate this project from other local queues.
- BullMQ global concurrency is `1` for this financial aggregation workload.
- Database transactions and unique run keys provide a second idempotency layer.
- One queue job drains several database batches to recover from traffic spikes.

## Local development

Redis must answer on the configured host, port, and database:

```bash
redis-cli -h 127.0.0.1 -p 6379 -n 2 ping
```

Run the API and web application normally, then run the worker in a separate
terminal:

```bash
pnpm api:worker
```

The API registers or updates the recurring scheduler on startup. Starting more
than one worker provides failover, while global concurrency prevents concurrent
financial aggregation runs.

## Configuration

| Variable | Local default | Purpose |
| --- | ---: | --- |
| `QUEUE_ENABLED` | `true` | Enables queue registration in the API. |
| `QUEUE_PREFIX` | `stu-v2` | Redis key namespace. |
| `REDIS_HOST` | `127.0.0.1` | Redis host. |
| `REDIS_PORT` | `6379` | Redis port. |
| `REDIS_DB` | `2` | Logical Redis database for local development. |
| `REDIS_USERNAME` | empty | Redis ACL username. |
| `REDIS_PASSWORD` | empty | Required by validation in production. |
| `REDIS_TLS` | `false` | Enables TLS for managed Redis. |
| `VISIT_AGGREGATION_DISABLED` | `false` | Removes the scheduler when true. |
| `VISIT_AGGREGATION_INTERVAL_MS` | `60000` | Scheduler interval; minimum 10 seconds. |
| `VISIT_AGGREGATION_BATCH_SIZE` | `1000` | Visits processed per database transaction. |
| `VISIT_AGGREGATION_MAX_BATCHES_PER_JOB` | `20` | Maximum batches drained by one queue job. |

## Production requirements

- Run Redis as a private, authenticated service; never expose port 6379 to the
  public internet.
- Enable Redis persistence and monitoring appropriate to the deployment.
- Run the API and worker as separate services with independent health checks,
  restart policies, and resource limits.
- Use the same queue prefix and Redis credentials in the API and workers.
- Deploy at least two worker replicas for failover. Aggregation remains globally
  single-concurrency until the accounting algorithm is deliberately partitioned.
- Move the analytics workload from SQLite to MySQL or PostgreSQL before sustained
  high-volume production traffic. SQLite remains suitable for local development,
  but its write locking is the limiting factor after queueing is introduced.

## Safe tuning order

1. Increase `VISIT_AGGREGATION_MAX_BATCHES_PER_JOB` to drain a longer backlog.
2. Increase `VISIT_AGGREGATION_BATCH_SIZE` gradually while observing transaction
   duration and lock contention.
3. Keep a transaction comfortably below the 60-second timeout.
4. Do not increase global concurrency until daily-limit and balance updates are
   partitioned and load-tested on the production database engine.

## Failure behavior

- A failed database transaction is rolled back and retried with exponential
  backoff.
- A stalled BullMQ job is recovered and can run again safely.
- Every processed access log is guarded by `processedAt IS NULL`.
- If another processor changes a selected row, the transaction aborts instead of
  applying duplicate link or balance increments.
- Completed and failed BullMQ jobs are retained with bounded age/count limits.

