# Deployment (Docker / VPS)

This deploys the whole stack with Docker Compose on a single Linux server
(DigitalOcean, Hetzner, EC2, Lightsail, etc.). It also works unchanged on
Railway/Render if you point them at the individual Dockerfiles.

```
Internet ──► :80/:443 reverse proxy (Caddy/Traefik/nginx)  ─┐   (optional TLS)
                                                            │
                              host :8080 ──► web (nginx)  ───┤
                                                 │ /api/*    │
                                                 ▼           │
                                            api (:3000, internal only)
                                                 │
                                                 ▼
                                            db (postgres, internal only, named volume)
```

- **`web`** – nginx serving the built React app; proxies `/api/*` to `api`.
- **`api`** – the Express server; runs `prisma migrate deploy` on every start.
- **`db`** – PostgreSQL; **not** published to the host, data in the `pgdata` volume.

Files used: [`Dockerfile`](Dockerfile), [`client/Dockerfile`](client/Dockerfile),
[`client/nginx.conf`](client/nginx.conf), [`docker-compose.prod.yml`](docker-compose.prod.yml),
[`docker/api-entrypoint.sh`](docker/api-entrypoint.sh), [`.env.production.example`](.env.production.example).

---

## 1. Server prerequisites

- A Linux host with Docker Engine + Compose v2:
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```
- Ports: only **80/443** need to be open publicly. `8080` can stay local if you
  put a TLS proxy in front (recommended); otherwise open `8080`.

## 2. Get the code onto the server

```bash
git clone <your-repo-url> todo-app
cd todo-app
```

## 3. Configure secrets

```bash
cp .env.production.example .env.production
nano .env.production
```

Set real values:

| Variable            | Notes                                                                 |
|---------------------|----------------------------------------------------------------------|
| `POSTGRES_USER`     | database user (default `postgres`)                                   |
| `POSTGRES_PASSWORD` | **required** — strong random password                               |
| `POSTGRES_DB`       | database name (default `todo_api`)                                  |
| `JWT_SECRET`        | **required** — `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `JWT_EXPIRES_IN`    | token lifetime, e.g. `1h`, `7d`                                     |
| `WEB_PORT`          | host port for the web container (default `8080`)                    |

`.env.production` is gitignored — never commit it.

`DATABASE_URL` is assembled automatically inside `docker-compose.prod.yml` from
the Postgres values, pointing at the internal `db` hostname.

## 4. Build and start

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Check it:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl http://localhost:8080/api/health          # -> {"data":{"status":"ok"}}
curl -I http://localhost:8080/                  # -> 200, serves the SPA
```

Migrations run automatically on `api` startup — watch them with:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f api
```

The app is now live on `http://<server-ip>:8080`.

---

## 5. TLS / custom domain (recommended)

Put a reverse proxy in front so users hit `https://todo.example.com`. Example
with **Caddy** (automatic Let's Encrypt) — create `/etc/caddy/Caddyfile`:

```
todo.example.com {
    reverse_proxy localhost:8080
}
```

```bash
docker run -d --name caddy --restart unless-stopped \
  --network host \
  -v /etc/caddy/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  caddy:2
```

Then you can set `WEB_PORT=8080` and only expose 80/443 via Caddy.

(Traefik or an nginx host block pointing at `127.0.0.1:8080` work equally well.)

---

## 6. Updating a running deployment

```bash
cd todo-app
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker image prune -f
```

New migrations in `prisma/migrations/` are applied automatically on the next
`api` start. Zero manual DB steps.

---

## 7. Database operations

**Backup:**

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  pg_dump -U postgres todo_api | gzip > backup-$(date +%F).sql.gz
```

**Restore:**

```bash
gunzip -c backup-2026-08-27.sql.gz | \
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  psql -U postgres -d todo_api
```

**Cron nightly backup** (`crontab -e`):

```
0 3 * * * cd /home/deploy/todo-app && docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db pg_dump -U postgres todo_api | gzip > /home/deploy/backups/todo-$(date +\%F).sql.gz
```

**Open a psql shell:**

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec db psql -U postgres -d todo_api
```

---

## 8. Operations cheatsheet

| Task                         | Command                                                                                      |
|------------------------------|---------------------------------------------------------------------------------------------|
| Start                        | `docker compose --env-file .env.production -f docker-compose.prod.yml up -d`                 |
| Stop (keep data)             | `docker compose --env-file .env.production -f docker-compose.prod.yml down`                  |
| Stop + delete data           | `docker compose --env-file .env.production -f docker-compose.prod.yml down -v`               |
| Rebuild + restart            | `... up -d --build`                                                                          |
| Logs (all / one service)     | `... logs -f` / `... logs -f api`                                                            |
| Shell into API container     | `... exec api sh`                                                                            |
| Run an ad-hoc Prisma command | `... exec api npx prisma migrate status`                                                     |
| Restart just the API         | `... restart api`                                                                            |

Replace `...` with `docker compose --env-file .env.production -f docker-compose.prod.yml`
(or add an alias: `alias dc='docker compose --env-file .env.production -f docker-compose.prod.yml'`).

---

## 9. Production checklist

- [ ] `JWT_SECRET` is long, random, and unique to this environment
- [ ] `POSTGRES_PASSWORD` is strong and stored only in `.env.production`
- [ ] `.env.production` is **not** in git
- [ ] `db` port is not published to the host (it is not, by default)
- [ ] TLS terminated by a reverse proxy; users reach the app over HTTPS
- [ ] Automated `pg_dump` backups configured and test-restored once
- [ ] `docker compose ... logs api` shows migrations applied and
      `Todo API listening ... (production)`
- [ ] Server firewall allows only 22, 80, 443

---

## Verified

The production stack in this repo was built and smoke-tested end-to-end:
images build, `web` serves the SPA and proxies `/api`, `api` auto-applies the
`20260101000000_init` migration on startup, `db` stays internal, and the full
register → login → create/list todo flow works through `http://localhost:8080`.
