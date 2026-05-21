# Q-Hub

Interní vzdělávací systém (LMS) postavený na React + PostgreSQL.

Stack:

- **Frontend**: Vite, React 19, TypeScript, TailwindCSS, framer-motion, lucide-react
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Auth**: bcrypt + JWT (httpOnly cookie)

## Instalace

```bash
npm install
```

## Konfigurace

Vytvoř `server/.env` podle `server/.env.example`:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
JWT_SECRET="<vygeneruj náhodný 64+ znakový řetězec>"
PORT=4000
CLIENT_ORIGIN="http://localhost:3000"
ADMIN_EMAILS="admin1@firma.cz,admin2@firma.cz"
```

> Tabulky se vytvoří **s prefixem `qhub_`**, takže nekolidují s existujícími tabulkami v databázi.

## První spuštění

```bash
# 1. Vygeneruj Prisma klienta
npm run db:generate

# 2. Vytvoř qhub_* tabulky v DB
npm run db:migrate     # interaktivní (vytvoří migraci)
# nebo non-interaktivně:
# npm run db:push

# 3. Nahraj výchozí kurzy/kvízy/mentory/atd.
npm run db:seed

# 4. Spusť API (:4000) i frontend (:3000) zároveň
npm run dev
```

Otevři <http://localhost:3000>. Při prvním otevření se zaregistruj — uživatel s emailem
uvedeným v `ADMIN_EMAILS` dostane automaticky roli `admin`.

## Skripty

| Script | Co dělá |
|--------|---------|
| `npm run dev` | API i frontend zároveň |
| `npm run dev:api` | jen Express backend (port 4000) |
| `npm run dev:web` | jen Vite frontend (port 3000) |
| `npm run build` | build frontendu |
| `npm run db:migrate` | nová Prisma migrace |
| `npm run db:push` | rychlé sync schématu (bez migrace) |
| `npm run db:seed` | naseeduje výchozí data |
| `npm run db:studio` | spustí Prisma Studio |

## Struktura

```text
.
├── App.tsx              # Hlavní React entry point (login / dashboard / admin)
├── components/          # Dashboard + AdminDashboard + 13 admin sub-modulů + LoginPage
├── lib/                 # api.ts (fetch wrapper), useQhubData (hooky), sync.ts
├── types.ts             # Sdílené TS typy
├── server/              # Express + Prisma backend
│   ├── index.ts         # Express server
│   ├── prisma.ts        # Prisma client singleton
│   ├── prisma/schema.prisma
│   ├── prisma/seed.ts
│   ├── lib/             # env, jwt, crud helper
│   ├── middleware/auth.ts
│   └── routes/          # auth, users, courses, quizzes, …
└── index.html
```

## API endpointy

Všechny endpointy běží pod `/api/*`, frontend k nim přistupuje přes Vite proxy.

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- **Users**: `GET/PUT /api/users/me`, `GET /api/users` (admin)
- **Settings**: `GET /api/settings`, `PUT /api/settings` (admin)
- **CRUD entities**: `/api/courses`, `/api/quizzes`, `/api/mentors`, `/api/ebooks`, `/api/streams`,
  `/api/artifacts`, `/api/challenges`, `/api/tasks`, `/api/levels`
- **User-aware**: `/api/bookings`, `/api/tickets`, `/api/submissions`, `/api/events`, `/api/sessions`

## Poznámky

- Existující tabulky v DB (`Category`, `Customer`, `Product`, …) se nedotýkají — používá se vlastní prefix `qhub_`.
- Heslo se hashuje přes `bcryptjs` (10 rounds).
- JWT cookie má `httpOnly + sameSite=lax`, platnost 30 dní.
