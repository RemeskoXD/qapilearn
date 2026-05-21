# Q-Hub na Coolify

Tento dokument popisuje **kompletní nasazení Q-Hubu na Coolify**. Frontend i backend
běží v jednom Docker kontejneru — Express servíruje API na `/api/*` a Vite build
na všem ostatním. Databáze (PostgreSQL) je externí (vaše stávající).

---

## 1. Co je potřeba na straně Coolify

| Položka | Hodnota |
|---|---|
| Build pack | **Dockerfile** (v rootu projektu) |
| Port | **4000** |
| Healthcheck | `GET /api/health` (už nakonfigurováno v Dockerfile) |
| Persistent storage | ❌ není potřeba (DB je externí) |
| HTTPS | ✅ ano (Coolify/Traefik to řeší samo) |

---

## 2. Příprava repozitáře

1. Commitněte celý projekt do Gitu (GitHub / GitLab / vlastní Gitea).
2. V Coolify zvolte **+ New Resource → Public/Private Repository**.
3. Vyberte větev (`main`) a:
   - **Build Pack:** `Dockerfile`
   - **Dockerfile Location:** `./Dockerfile`
   - **Port (Container):** `4000`

---

## 3. Environment Variables (POVINNÉ)

V Coolify → vaše aplikace → **Environment Variables** nastavte:

```env
# PostgreSQL – plný connection string na váš stávající server
DATABASE_URL=postgresql://uzivatel:heslo@db-host:5432/qhub?schema=public

# JWT podpis – vygenerujte si silný náhodný řetězec (64+ znaků)
# Lokálně:  openssl rand -hex 64
JWT_SECRET=NAHODNY_64_ZNAKOVY_RETEZEC_DEJTE_NECO_OPRAVDU_UNIKATNIHO

# Prostředí
NODE_ENV=production

# Volitelné – mailové adresy, které mají automaticky admin práva (čárkami oddělené)
ADMIN_EMAILS=ty@firma.cz,admin@firma.cz

# Nech prázdné v produkci – frontend běží ze stejného originu jako API
CLIENT_ORIGIN=
```

> **Tip:** Coolify má rovnou tlačítko *Generate secret* — můžete ho použít pro `JWT_SECRET`.

---

## 4. Co se stane při deployi

Coolify spustí `Dockerfile`, který:

1. **Stage `deps`** — `npm ci` (cachuje se mezi deployy → rychlé buildy)
2. **Stage `build`** — `prisma generate` + `vite build` → vznikne `/app/dist`
3. **Stage `runtime`** — alpine node:20 image, ~150 MB
4. Při startu (`CMD npm run start`):
   - `prisma db push` → vytvoří/aktualizuje `qhub_*` tabulky v DB
   - `node server/index.ts` → spustí Express na portu 4000
   - Express servíruje:
     - `/api/*` → REST API
     - vše ostatní → React SPA (`dist/index.html`)

---

## 5. Doména a HTTPS

V Coolify u aplikace nastavte:

- **Domain** — třeba `qhub.firma.cz`
- **Force HTTPS** — zapnout (Coolify automaticky vystaví Let's Encrypt cert)

Express má `app.set('trust proxy', 1)` a JWT cookies používají `secure: true`
v produkci — vše tedy funguje hned po zapnutí HTTPS.

---

## 6. První přihlášení

1. Po prvním deployi otevřete `https://qhub.firma.cz/`
2. Klikněte **Registrovat** a zadejte email z `ADMIN_EMAILS`
3. Po registraci se automaticky stanete adminem
4. V admin sekci → **Uživatelé** přiřaďte ostatním pozice (Technik, Prodejce, …)

---

## 7. Seed (volitelný — výchozí obsah)

Pokud chcete naplnit DB ukázkovými daty (kurzy, mentory, ebooky, levely):

```bash
# z lokálního prostředí, s nastaveným DATABASE_URL na produkční DB
npm run db:seed
```

> ⚠️ Nepouštějte na ostré DB s reálnými uživateli — seed přepíše některé záznamy.

Alternativně si do Coolify aplikace přidejte **One-time job** s příkazem
`npm run db:seed` (Coolify → Application → Commands).

---

## 8. Update / redeploy

1. `git push` → Coolify si všimne změny a automaticky rebuildne.
2. `prisma db push` při startu zaktualizuje schéma DB (přidá/změní sloupce).
3. Health check zajistí, že staré instance běží, dokud nová není zdravá → **zero downtime**.

> Pokud chcete přesnější kontrolu nad migracemi, přepněte v `package.json` skriptu
> `start` z `prisma db push` na `prisma migrate deploy` (potřebuje commitnuté migrace).

---

## 9. Časté problémy

| Problém | Řešení |
|---|---|
| `Can't reach database server` | Zkontrolujte, že je DB dosažitelná z Coolify hostu (firewall, port 5432). |
| `Invalid token` / odhlašování | Změnil se `JWT_SECRET` mezi deployy → znovu nastavte stejný. |
| Frontend načte ale `/api/...` → 502 | Coolify má špatný port — nastavte **4000**. |
| `prisma: command not found` | Nesmíte mít `NODE_ENV=production` během `npm ci` — Dockerfile to dělá správně. |
| Healthcheck failed | Otestujte ručně `curl https://qhub.firma.cz/api/health` → měl by vrátit `{ok:true}`. |

---

## 10. Lokální vývoj (pro porovnání)

```bash
# 1) Spusťte API + frontend zároveň
npm run dev
#   → API:      http://localhost:4000
#   → Frontend: http://localhost:5173

# Pro dev nastavte v server/.env:
# CLIENT_ORIGIN=http://localhost:5173
# NODE_ENV=development
```

---

**Hotovo.** Při dotazech zkontrolujte logy: Coolify → vaše app → **Logs**.
