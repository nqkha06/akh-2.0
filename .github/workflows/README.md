# CI workflows

Workflow CI nên chạy `pnpm install --frozen-lockfile`, `pnpm lint`,
`pnpm typecheck`, `pnpm test` và `pnpm build`. Deployment của `@stu/web` và
`@stu/api` phải là hai job độc lập.
