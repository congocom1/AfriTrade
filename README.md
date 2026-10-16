# AfriTrade

AfriTrade is Shopify × Alibaba for Africa — a pan-African B2B & B2C marketplace with a React/Vite frontend and a separate Flutter mobile project.

## Development prerequisites

Install Node.js, npm, and the Base44 CLI. Access to the appropriate Base44 application is required to run backend functions.

## Local setup

1. Install dependencies with `npm ci` (or `npm install` when intentionally updating the lockfile).
2. Authenticate with `base44 login`.
3. Link the application with `base44 link`.
4. Start the frontend and local Base44 backend together using `base44 dev`.

Use `base44 dev --remote` only when you intentionally want to connect to the hosted backend. Standalone `npm run dev` starts Vite only and does not start the Base44 backend.

Store local credentials in `.env.local`, which is gitignored. Never commit secrets or production credentials.

## Checks

- `npm run lint` — ESLint
- `npm run typecheck` — JavaScript/TypeScript static checking
- `npm test` — Node test suite
- `npm run build` — Vite production build
- `npm run test:e2e` — Playwright tests (requires configured test environment)
- `flutter analyze` and `flutter test` — Flutter project checks (requires Flutter SDK)

## Deployment

Review `base44/config.jsonc` and the Base44 environment settings before deployment. A successful frontend build does not verify backend functions, credentials, payment integrations, or authorization rules. Run tests and verify production configuration in a nonproduction environment first. Do not publish or deploy without explicit approval.

## Project locations

- `src/` — React frontend
- `src/api/base44Client.js` — Base44 SDK client
- `base44/` — Base44 configuration and backend assets
- `test/` — JavaScript tests
- `android/`, `ios/`, `lib/` — Flutter mobile application

Follow `AGENTS.md` for Base44-specific development instructions.
