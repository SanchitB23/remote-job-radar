This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Update the environment variables in `.env.local` with your actual values:
   - **Clerk Authentication**: Get your keys from [Clerk Dashboard](https://dashboard.clerk.com)
   - **GraphQL Endpoints**: Update if your API server runs on different URLs

### Running the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

The following environment variables are required:

### Authentication (Clerk)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `CLERK_JWT_KID`: Your JWT Key ID
- `CLERK_JWT_ISSUER`: Your JWT issuer URL

### GraphQL API

- `NEXT_PUBLIC_GRAPHQL_HTTP_ENDPOINT`: GraphQL HTTP endpoint (default: `http://localhost:4000/graphql`)
- `NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT`: GraphQL WebSocket endpoint (default: `ws://localhost:4000/graphql`)

Copy `.env.example` to `.env.local` and update the values accordingly.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
