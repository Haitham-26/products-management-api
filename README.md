# Inventory Management System — Backend (API)

The REST API powering **Inventix**, a multi-tenant inventory management platform for tracking products, stock, orders, and returns across an organization.

This is the **backend/API** repository. The frontend (React UI) lives in a separate repo.

**🔗 Live API:** [add your deployed API base URL here]
**📄 API Docs (Swagger):** `https://inventix-syng.onrender.com/api-docs`
**🎨 Frontend repo:** [https://github.com/Haitham-26/inventory-management-ui](https://github.com/Haitham-26/inventory-management-ui)

---

## Overview

A Node.js/Express/MongoDB API that handles authentication, multi-tenant organizations with role-based permissions, product/inventory management, orders, returns, and reporting — with full request validation, structured error handling, and interactive API documentation.

## Features

- **Authentication** — email/password with email verification (OTP-style tokens), Google OAuth, JWT access + refresh token flow, forgot/reset password
- **Multi-tenant organizations** — every account is scoped to an organization; owners can invite team members via email, manage roles (Owner / Admin / Member), and assign granular per-entity CRUD permissions
- **Products** — full CRUD, bulk status updates, bulk soft-delete, stock management, Cloudinary image uploads
- **Categories & Tags** — CRUD with usage counts kept in sync on product changes
- **Orders** — creation, bulk status updates with inventory adjustment logic, stock availability validation
- **Returns** — full return lifecycle (create, activate, cancel, update) tied back to orders
- **Dashboard** — aggregated stats (revenue, profit, orders breakdown, top products) via optimized MongoDB aggregation pipelines
- **Settings** — per-organization inventory and general settings
- **Scheduled jobs** — cron job to clean up unverified user accounts
- **API documentation** — full OpenAPI/Swagger spec with request/response schemas, served at `https://inventix-syng.onrender.com/api-docs`
- **Security** — rate limiting, centralized error handling, Zod-based request validation on every endpoint

## Tech Stack

| Category     | Tech                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| Runtime      | Node.js, TypeScript                                                         |
| Framework    | Express                                                                     |
| Database     | MongoDB, Mongoose                                                           |
| Auth         | JWT (access + refresh tokens), Google OAuth (`google-auth-library`), bcrypt |
| Validation   | Zod                                                                         |
| File uploads | Multer, Cloudinary                                                          |
| Email        | Resend, HTML templates (localized EN/AR)                                    |
| Docs         | swagger-jsdoc, swagger-ui-express                                           |
| Scheduling   | node-cron                                                                   |
| Other        | express-rate-limit, cors, cookie-parser, dayjs                              |

## Architecture Notes

A few decisions worth calling out for anyone reviewing the code:

- **Layered structure per feature** — each domain (`product`, `order`, `return`, `category`, `tag`, `organization`, `user`, `settings`, `dashboard`) is split into a route file (`*.service.ts`), a controller, and one or more Zod validators, keeping request parsing, business logic, and routing clearly separated.
- **Request-scoped context** — `RequestContext` attaches the authenticated user and derived values (like `scopeId`) to the request, avoiding repeated lookups across middleware and controllers.
- **Organization scoping** — `OrgScopeMiddleware` resolves whether a request should be scoped to a user's own data or their organization's shared data, so the rest of the app doesn't need to special-case ownership vs. membership.
- **Granular permissions** — `UserPermissionsMiddleware` checks per-entity CRUD permissions (stored as a `Map` on the user) for organization members, while owners/non-members bypass the check entirely.
- **Centralized error handling** — a single `APIError` class plus `errorHandler` normalizes Zod validation errors, JWT errors, and custom API errors into consistent HTTP responses.
- **Transaction-safe file handling** — flows involving both Cloudinary uploads and MongoDB writes (e.g. product updates) are structured as pre-transaction uploads → transaction-only DB writes → post-commit cleanup, to avoid orphaned assets if a transaction rolls back.
- **Aggregation-first reporting** — dashboard stats are computed with consolidated single-pass MongoDB aggregation pipelines (`$group` + `$cond` buckets) rather than multiple redundant queries.

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- A MongoDB instance (local or Atlas)
- Cloudinary account (image uploads)
- Resend account (transactional email)
- Google OAuth credentials (Google login)

### Installation

```bash
git clone git@github.com:Haitham-26/inventory-management-api.git
cd inventory-management-api
yarn
```

### Environment Variables

Create a `.env.development` file in the project root:

```env
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

DB=your_mongodb_connection_string
PORT=5000

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RESEND_API_KEY=your_resend_api_key
MAIL_FROM=noreply@yourdomain.com

NODE_ENV=development
```

### Run locally

```bash
yarn dev
```

The API will be available at `http://localhost:5000`, with interactive docs at `http://localhost:5000/api-docs`.

### Build for production

```bash
yarn build
yarn start
```

## Available Scripts

| Command      | Description                                           |
| ------------ | ----------------------------------------------------- |
| `yarn dev`   | Start the dev server with hot-reload (`tsx watch`)    |
| `yarn build` | Compile TypeScript and copy email templates to `dist` |
| `yarn start` | Run the compiled production build                     |

## API Documentation

The full API is documented with OpenAPI/Swagger, including request/response schemas for every endpoint. Once the server is running, visit:

```
https://inventix-syng.onrender.com/api-docs
```

## Known Limitations

- **Transactional emails are disabled on the live demo.** Email sending (signup verification, password reset, team invitations) is fully implemented using Resend, but the hosted demo runs on a free tier without a configured production email domain. As a result, verification/reset emails won't be delivered on the live version. This does **not** reflect a gap in functionality — it works end-to-end when run with a valid `RESEND_API_KEY` and verified sending domain (e.g. locally, or on a production deployment).

## Project Structure

```
src/
├── controllers/    # Request handlers / business logic, per feature
├── routes/        # Express routers + route-level Swagger docs, per feature
├── services/       # Reusable services (currently Cloudinary uploads)
├── validators/       # Zod request validation schemas, per feature
├── models/            # Mongoose schemas/models
├── middlewares/        # Auth, org scoping, permissions, uploads, rate limiting
├── errors/              # Centralized APIError class & error handler
├── mailer/               # Email sending + localized HTML templates (EN/AR)
├── cron/                  # Scheduled jobs
├── config/                 # Third-party service config (Cloudinary)
├── swagger/                 # OpenAPI schema definitions & setup
├── types/                    # Shared/domain TypeScript types
└── utils/                      # Shared helpers
```

## Related Repository

- Frontend / UI — [https://github.com/Haitham-26/inventory-management-ui](https://github.com/Haitham-26/inventory-management-ui)

---

_This is a personal portfolio project built to demonstrate backend development skills, including multi-tenant architecture, role-based access control, transaction-safe data handling, and API documentation practices._
