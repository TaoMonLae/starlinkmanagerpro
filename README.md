# Starlink Manager Pro

Premium private SaaS dashboard for managing Starlink accounts, owners, billing dates, payments, receivables, renewals, reports and operational status.

Developed by **Tao Mon Lae**.

## Stack

- React, Vite, Tailwind CSS, React Router, Axios, Recharts, Framer Motion
- Node.js, Express.js, JWT, bcrypt, Multer
- PostgreSQL, Prisma ORM
- PDFKit for printable receipts and reports
- Ubuntu 24.04, PM2, Nginx reverse proxy, Cloudflare SSL

## Local Setup

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
cp .env.example .env
createdb starlink_manager_pro_v5
npx prisma migrate dev
# Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first — seed will refuse to run otherwise.
npm run prisma:seed
npm run dev
```

Client: `http://localhost:8115`
API: `http://localhost:8112/api`

If either port is already in use, stop the old dev process first:

```bash
lsof -ti tcp:8112,tcp:8115 | xargs kill
```

This project uses npm workspaces. Install dependencies from the repository root with `npm install`.

### Initial admin

There is no default admin account. Before running `npm run prisma:seed`, set both
`ADMIN_EMAIL` and `ADMIN_PASSWORD` (min 12 characters) in your `.env`. The seed
script will refuse to run without them. Generate a strong password with:

```bash
node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"
```

## Latest Updates

- **Production hardening pass:**
  - Removed the `GET /api/settings/backup` endpoint and its Settings UI button. The endpoint exposed a full `pg_dump` of the entire multi-tenant database to any authenticated user.
  - Login form no longer pre-fills any credentials.
  - `prisma:seed` now refuses to run without `ADMIN_EMAIL` and `ADMIN_PASSWORD` (min 12 chars) — no default admin is ever created.
  - Currency conversion in CSV/PDF reports now throws on missing exchange rates instead of silently returning unconverted amounts.
  - CSV export sanitizes cells starting with `= + - @ \t \r` (formula injection) and declares `charset=utf-8`.
  - JWT verification failures are now logged at warn level for operator visibility.
  - Helmet `crossOriginResourcePolicy` reverted to default (`same-origin`).
- Renamed the product to **Starlink Manager Pro**.
- Added editable app name in Settings.
- Added logo upload in Settings, with sidebar preview.
- Payment receipt PDFs include the uploaded logo when available.
- Receivables report PDFs include the uploaded logo and configured app name.
- Account setup now uses **Billing date** instead of only a numeric billing day.
- Account pages now support adding past payment history with an exact payment date.
- Added safe settings serialization so password hashes are never returned in settings responses.
- Settings save no longer resends the stored base64 logo payload.
- Added production environment examples for `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, and `CLIENT_URL`.
- Added create-account registration and per-user private data isolation.

## Core Features

- Secure admin login with JWT and bcrypt
- User registration for separate private workspaces
- Protected routes and inactivity auto logout
- Dashboard KPI cards, charts, upcoming renewals and activity feed
- Account CRUD with owner, status, currency, billing date and notes
- Per-user account, owner, payment, receivable, dashboard and report isolation
- Managed owners for accounts operated on behalf of other people or teams
- Billing logic for next due date, paid, due soon, overdue and upcoming
- Mark paid from an account or billing view
- Manual payment entry with exact historical payment date
- Payment history ledger and printable receipt PDFs
- Custom app name and uploaded logo branding
- Receivables/debt tracking for Starlink bills paid on behalf of others
- Reports with charts, CSV export and branded PDF receivables report
- CSV/XLSX account import
- Settings, change password and theme preference
- Currency settings for USD, SGD, MYR and MMK with live cached conversion

## API Routes

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `GET|POST /api/accounts`
- `GET|PUT|DELETE /api/accounts/:id`
- `GET|POST /api/owners`
- `PUT|DELETE /api/owners/:id`
- `GET|POST /api/payments`
- `POST /api/payments/mark-paid/:accountId`
- `GET /api/payments/:id/receipt.pdf`
- `GET|POST /api/receivables`
- `PUT|DELETE /api/receivables/:id`
- `POST /api/receivables/:id/receive`
- `GET /api/dashboard`
- `GET /api/reports`
- `GET /api/reports/export.csv`
- `GET /api/reports/receivables.pdf`
- `POST /api/import`
- `GET|PUT /api/settings`
- `POST /api/settings/logo`
- `GET /api/settings/rates`

## Environment

Server `.env`:

```bash
NODE_ENV=production
PORT=8112
DATABASE_URL="postgresql://starlink_app:replace-this-password@localhost:5432/starlink_manager_pro_v5?schema=public"
JWT_SECRET="generate-a-long-random-secret"
JWT_EXPIRES_IN="8h"
CLIENT_URL="https://starlink.taomonlae.com"
# Required by the seed script. Min 12 characters. Seed refuses to run without these.
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="generate-a-strong-password"
EXCHANGE_RATE_API_URL="https://open.er-api.com/v6/latest"
```

Client `.env`:

```bash
VITE_API_URL=https://starlink.taomonlae.com/api
```

## Production Deployment on Ubuntu 24.04

1. Install system packages:

```bash
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

2. Create PostgreSQL database and user:

```bash
sudo -u postgres psql
CREATE DATABASE starlink_manager_pro_v5;
CREATE USER starlink_app WITH ENCRYPTED PASSWORD 'replace-this-password';
GRANT ALL PRIVILEGES ON DATABASE starlink_manager_pro_v5 TO starlink_app;
\q
```

3. Deploy source:

```bash
sudo mkdir -p /var/www/starlink-manager-pro
sudo chown -R $USER:$USER /var/www/starlink-manager-pro
git clone <your-repo-url> /var/www/starlink-manager-pro
cd /var/www/starlink-manager-pro
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

4. Edit `server/.env` and `client/.env`, then migrate, seed and build:

```bash
cd server
npx prisma migrate deploy
npm run prisma:seed
cd ../client
npm run build
cd ..
```

5. Start API with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

6. Configure Nginx:

```bash
sudo cp deploy/starlink.taomonlae.com.conf /etc/nginx/sites-available/starlink.taomonlae.com
sudo ln -s /etc/nginx/sites-available/starlink.taomonlae.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

7. Cloudflare SSL:

- Point `starlink.taomonlae.com` to your VPS IP in Cloudflare DNS.
- Use Cloudflare SSL mode `Full` or `Full (strict)`.
- Optionally issue an origin certificate from Cloudflare and install it in Nginx.
- If not using Cloudflare origin certificates, run:

```bash
sudo certbot --nginx -d starlink.taomonlae.com
```

## Import Format

CSV or Excel files can include these columns:

`account_name`, `gmail_email`, `location`, `monthly_cost`, `billing_date`, `billing_day`, `status`, `notes`

Use `billing_date` for new imports. `billing_day` is still accepted for older files.

Statuses: `ACTIVE`, `SUSPENDED`, `BACKUP`, `CANCELLED`

## Verification

Recommended checks before production deployment:

```bash
npm run build -w client
npm run check -w server
npx prisma migrate status --schema server/prisma/schema.prisma
```
