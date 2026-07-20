# Kiến trúc monorepo

## Tổng quan

Repository dùng pnpm workspace và Turborepo. Hai ứng dụng vẫn có vòng đời
build/deploy độc lập:

```text
apps/web  -> Next.js App Router
apps/api  -> NestJS + Prisma
```

Các package nội bộ không được import source xuyên biên giới ứng dụng:

```text
packages/contracts         Kiểu, enum và hằng số trung lập
packages/api-client        Điểm xuất cho client sinh từ OpenAPI
packages/eslint-config     Cấu hình ESLint dùng chung
packages/typescript-config Cấu hình TypeScript dùng chung
```

## Biên module

- `apps/web/src/app`: route, layout, loading/error boundary và ghép trang.
- `apps/web/src/features`: UI và logic theo nghiệp vụ.
- `apps/web/src/components`: UI, layout và thành phần thật sự dùng chung.
- `apps/web/src/lib`: adapter hạ tầng, auth và API.
- `apps/api/src/modules`: controller, service, DTO và guard theo domain.
- `apps/api/src/database`: Prisma module/service.
- `apps/api/src/config`: validation và truy cập cấu hình.
- `apps/api/prisma`: schema, migration và seed thuộc API.

Luồng backend hiện tại:

```text
HTTP request -> Controller -> Service -> PrismaService -> Database
```

Repository layer chỉ nên được thêm vào một domain khi query đủ phức tạp hoặc cần
thay implementation trong test.

## Quy tắc dependency

- Web không import DTO, service, Prisma model hoặc source từ API.
- API và Prisma seed dùng `@stu/contracts` cho permission catalog.
- `@stu/api-client` được dành cho code sinh từ OpenAPI; client viết tay hiện tại
  vẫn nằm trong web cho đến khi Swagger/OpenAPI generation được triển khai.
- Package nội bộ phải khai báo bằng `workspace:*`.

## Environment

Mỗi app có file mẫu riêng:

- `apps/web/.env.example`
- `apps/api/.env.example`

Trong local development, copy chúng thành `apps/web/.env.local` và
`apps/api/.env`. Không đặt secret trong biến `NEXT_PUBLIC_*`.

## Lệnh thường dùng

```bash
corepack enable
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

Chạy riêng từng ứng dụng:

```bash
pnpm web:dev
pnpm api:dev
pnpm test:auth
pnpm prisma:migrate
```

Turborepo đảm bảo package phụ thuộc được build trước app sử dụng nó.
