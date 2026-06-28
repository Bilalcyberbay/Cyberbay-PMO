This is a [Next.js](https://nextjs.org) workspace app for **Cyberpay PMO** bootstrapped using PostgreSQL, NextAuth.js v5, and Prisma.

## Prerequisites

Before running the application, make sure you have:
1. A running **PostgreSQL** database server.
2. Created a database named `cyberpay_pmo`.

## Getting Started

### 1. Environment Configuration
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Update `DATABASE_URL` in `.env` with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/cyberpay_pmo?schema=public"
```

### 2. Database Migration
Run the Prisma migrations to create the required database tables:
```bash
npx prisma migrate dev --name init
```

### 3. Start Development Server
Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. Log in with any email (a new user and workspace will automatically seed on your first login!).

