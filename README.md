# Cigarboxxd

Letterboxd-style social cataloging, rebuilt for cigarette reviews.

## What changed

- The movie/TMDB layer has been replaced with a first-party cigarette catalog and review API.
- All catalog, review, moderation, and blacklist writes now go through Next.js route handlers.
- `admin` and `support` roles are enforced server-side.
- The app includes account banning, account deletion, comment removal, email blacklisting, and audit logging.
- The FDA Searchable Tobacco Products Database can be imported into the `cigarettes` collection with a seed script.
- Free image suggestions can be pulled from Openverse for admin curation.

## Stack

- Next.js 15 + React 18
- Firebase Authentication for sign-in
- Firebase Admin SDK + Firestore for protected app data
- Zod for request validation
- TailwindCSS for UI styling

## Security model

- Firestore is intended to be server-only for this app. The included [firestore.rules](./firestore.rules) denies all direct client access.
- Registration is validated server-side and checked against the email blacklist before account creation.
- Review and auth-sensitive endpoints are rate-limited in-process.
- Moderation is soft-delete based for reviews and accounts so actions remain auditable.
- Admin actions are written to `auditLogs`.
- Security headers are set in [next.config.ts](./next.config.ts).

Recommended production additions:

- Firebase App Check
- Centralized log shipping/SIEM
- Error monitoring and alerting
- WAF or edge rate limiting in front of auth-heavy endpoints
- Secret rotation for Firebase Admin credentials

## Environment

Create `.env.local` for development or `.env.production` for the live server from [.env.example](./.env.example).

Required client variables:

```env
NEXT_PUBLIC_API_KEY=
NEXT_PUBLIC_AUTH_DOMAIN=
NEXT_PUBLIC_PROJECT_ID=
NEXT_PUBLIC_STORAGE_BUCKET=
NEXT_PUBLIC_MESSAGING_ID=
NEXT_PUBLIC_APP_ID=
NEXT_PUBLIC_APP_URL=
```

Required server variables:

```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
INITIAL_ADMIN_EMAIL=
```

Notes:

- `FIREBASE_ADMIN_PRIVATE_KEY` must preserve newline escapes, for example `-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n`.
- The first account registered with `INITIAL_ADMIN_EMAIL` becomes the bootstrap admin if no admin exists yet.

## Local development

```bash
npm install
npm run dev
```

Useful scripts:

```bash
npm run typecheck
npm run build
npm run validate:env
npm run seed:fda
```

## Deployment

The app is configured for self-hosted production:

- `next.config.ts` uses `output: "standalone"` for production packaging
- `Dockerfile` builds and runs the standalone server
- `deploy/docker-compose.prod.yml` provides a private app container on `127.0.0.1:3000`
- `scripts/validate-runtime-config.mjs` fails startup when required runtime env is missing
- `/api/health` is a lightweight liveness probe
- `/api/ready` verifies env and Firestore connectivity for readiness checks
- `deploy/nginx/cigarboxxd.conf.example` shows a reverse-proxy setup for a real domain
- `deploy/systemd/cigarboxxd-compose.service.example` shows a boot-time service wrapper

### Production server flow

Assumption below:

- Ubuntu server
- repo path `/opt/cigarboxxd`
- app container bound only to `127.0.0.1:3000`
- Nginx handles the public domain and TLS

Bootstrap the server:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git
sudo systemctl enable --now docker
sudo mkdir -p /opt
cd /opt
sudo git clone <your-repo-url> cigarboxxd
sudo chown -R $USER:$USER /opt/cigarboxxd
cd /opt/cigarboxxd
cp .env.example .env.production
```

Fill `.env.production` with your real values, then start the app:

```bash
cd /opt/cigarboxxd/deploy
docker compose -f docker-compose.prod.yml up -d --build
```

Check private health before exposing it:

```bash
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:3000/api/ready
```

If you want `systemd` to manage the compose stack on boot, copy:

- `deploy/systemd/cigarboxxd-compose.service.example`

to:

- `/etc/systemd/system/cigarboxxd.service`

then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cigarboxxd
sudo systemctl status cigarboxxd
```

### Manual container flow

Build:

```bash
docker build -t cigarboxxd .
```

Run:

```bash
docker run --env-file .env.production -p 127.0.0.1:3000:3000 cigarboxxd
```

### Reverse proxy and domain

Recommended production layout:

1. Run the Next app on a private port such as `127.0.0.1:3000`.
2. Put Nginx or Caddy in front of it for TLS termination and domain routing.
3. Use the example config in `deploy/nginx/cigarboxxd.conf.example`.
4. Point your DNS `A`/`AAAA` record to the server and issue TLS certificates with Let’s Encrypt.

Example Nginx and certificate rollout:

```bash
sudo cp deploy/nginx/cigarboxxd.conf.example /etc/nginx/sites-available/cigarboxxd.conf
sudo nano /etc/nginx/sites-available/cigarboxxd.conf
sudo ln -s /etc/nginx/sites-available/cigarboxxd.conf /etc/nginx/sites-enabled/cigarboxxd.conf
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.example -d www.your-domain.example
```

Then verify the public endpoint:

```bash
curl https://your-domain.example/api/health
curl https://your-domain.example/api/ready
```

### Runtime checks

- `GET /api/health`: container/process liveness
- `GET /api/ready`: runtime readiness including Firestore access

## Seeding the FDA cigarette catalog

The seed script downloads the FDA export directly from:

- https://www.accessdata.fda.gov/scripts/searchtobacco/index.cfm?action=export.viewFile

Run it after Firebase Admin credentials are configured:

```bash
npm run seed:fda
```

On the live server:

```bash
cd /opt/cigarboxxd
node --env-file=.env.production scripts/seed-fda-cigarettes.mjs
```

Optional dry run:

```bash
node --env-file=.env.production scripts/seed-fda-cigarettes.mjs --dry-run --limit=5
```

What it does:

- downloads the official tobacco product export
- filters `Category === Cigarette`
- normalizes records into the app schema
- writes them into the `cigarettes` collection

## Image sourcing

Catalog seed data does not include pack imagery.

For admin curation, the dashboard includes Openverse-powered image search using:

- https://api.openverse.org/v1/images/

Use caution here:

- exact branded pack images may be copyrighted or trademark-sensitive
- Openverse results must still be checked for accuracy and license fit
- generic placeholders are safer than incorrect or unlicensed pack art

## Main routes

- `/` home
- `/auth` sign in / register
- `/cigarettes` cigarette catalog
- `/cigarette/[id]` cigarette detail + review thread
- `/members` public member directory
- `/profile/[id]` public profile
- `/reviews` global review feed
- `/settings` self-service profile edit
- `/admin` admin / support operations

## Verification

Verified locally with:

```bash
npm run validate:env
npm run typecheck
npm run build
```

## Sources

- Letterboxd inspiration: https://letterboxd.com
- Reference clone used as starting point: https://github.com/janaiscoding/letterboxd-clone
- FDA tobacco catalog export: https://www.accessdata.fda.gov/scripts/searchtobacco/index.cfm?action=export.viewFile
- Openverse image API: https://api.openverse.org/v1/images/
