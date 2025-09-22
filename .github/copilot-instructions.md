# LendGrid AI Coding Conventions

This document provides guidance for AI coding agents to be productive in the LendGrid codebase.

## Project Overview

LendGrid is a multi-tenant SaaS web app for the financial services industry. It connects loan aggregators with lenders.

- **Frontend:** A Next.js PWA using TypeScript, Tailwind CSS, and Radix UI components. Deployed on Vercel.
- **Backend:** A NestJS GraphQL API using Apollo Server, Mongoose (MongoDB), and JWT for authentication. Deployed on AWS.

## Key Architectural Concepts

- **Multi-tenancy:** The application is designed to serve multiple tenants (loan aggregators and lenders). Be mindful of data separation and tenant-specific logic.
- **Component-Based UI:** The frontend is built with reusable React components located in `components/`. We use `shadcn/ui` components, which are highly customizable.
- **GraphQL API:** The frontend communicates with the backend via a GraphQL API. The schema is defined in `lendgrid-server/schema.gql`.
- **Authentication:** Authentication is handled via JWT. The `lib/auth.ts` file contains authentication-related logic.

## Developer Workflows

### Frontend

- **Running the dev server:** `pnpm dev`
- **Building for production:** `pnpm build`
- **Linting:** `pnpm lint`

### Backend

- **Running the dev server:** `cd lendgrid-server && pnpm start:dev`
- **Building for production:** `cd lendgrid-server && pnpm build`
- **Linting:** `cd lendgrid-server && pnpm lint`
- **Testing:** `cd lendgrid-server && pnpm test`

## Code Conventions

- **Styling:** Use Tailwind CSS for styling. Avoid writing custom CSS.
- **State Management:** For simple state, use React hooks. For complex state, consider using a state management library.
- **API Client:** Use the `lib/api-client.ts` for making GraphQL requests.
- **Forms:** Use `react-hook-form` for forms. Form components are in `components/auth/`.
- **Icons:** Use icons from `lucide-react`. A list of available icons is in `lib/icons.ts`.

## Important Files and Directories

- `app/`: The main application code for the Next.js frontend.
- `components/`: Reusable React components.
- `lib/`: Utility functions and libraries.
- `lendgrid-server/`: The NestJS backend.
- `public/`: Static assets.
- `schema.gql`: The GraphQL schema.

## What to Avoid

- **Don't use `styled-components` or other CSS-in-JS libraries.** We use Tailwind CSS.
- **Don't introduce new state management libraries without discussion.**
- **Don't bypass the API client for making requests.**
