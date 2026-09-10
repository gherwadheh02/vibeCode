# vibecode

Backend service built with [Bun](https://bun.com), [ElysiaJS](https://elysiajs.com), and [Drizzle ORM](https://orm.drizzle.team) with MySQL.

## Prerequisites
- [Bun](https://bun.com) >= 1.0
- MySQL Server

## Setup

1. Clone repository and install dependencies:
```bash
bun install
```

2. Configure environment variables:
```bash
cp .env.example .env
```
Update `DATABASE_URL` and `PORT` as needed.

3. Database migrations:
```bash
bun run db:generate
bun run db:push
```

## Running the Application

- **Development mode (hot reload)**:
```bash
bun run dev
```

- **Production mode**:
```bash
bun run start
```

- **Run unit tests**:
```bash
bun test
```
