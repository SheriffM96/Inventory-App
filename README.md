# Mishkak Inventory

A simple inventory tracker for Mishkak: log daily purchases and items given out
(usage), see live stock levels, and generate daily/monthly reports.

- **Storekeeper**: logs **purchases** (received from a vendor, cost required)
  and **issuances** (stock handed to a named person on the kitchen, bar, or
  cleaning team). Storekeeper does not log "usage."
- **Kitchen staff**: logs their own **usage** only, and sees an opening/
  received/used/closing balance for their team, reconciled daily.
- **Bar staff**: same as kitchen, scoped to the bar team.
- **Manager**: view-only - dashboard, reports, items & vendors, and staff
  management. Managers do not log purchases, issuances, or usage themselves.

When logging a purchase or issuance, staff pick a **category first** (e.g.
Dairy & Fats), then the item within that category, which shows the item's
unit automatically. Every entry is timestamped with the date and time it was
logged (not editable, so the record always matches when it actually happened).

Staff sign in by picking their name and entering a 4-digit PIN - no emails or
passwords to manage.

## 1. Prerequisites

- A free [Neon](https://neon.tech) (or Supabase/Railway) PostgreSQL database.
- A free [GitHub](https://github.com) account, and this project pushed to a repo.
- A free [Vercel](https://vercel.com) account, connected to your GitHub.
- [Node.js](https://nodejs.org) 20+ if you want to run it on your own computer too.

## 2. Create the database

1. Sign up at [neon.tech](https://neon.tech) and create a new project (any region close to you).
2. Copy the connection string it gives you (starts with `postgresql://...?sslmode=require`).

## 3. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL="<your Neon connection string>"
SESSION_SECRET="<a long random string>"
```

Generate a `SESSION_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Run it locally (optional, but recommended before deploying)

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000 and sign in with one of the seeded demo accounts:

| Name           | Role              | PIN  |
|----------------|-------------------|------|
| Storekeeper    | Storekeeper       | 1111 |
| Kitchen Staff  | Kitchen         | 2222 |
| Bar Staff      | Bar             | 3333 |
| Manager        | Manager           | 9999 |

**Change these PINs (or delete these demo accounts and add real staff) from the
"Staff" page as the Manager before using this for real.**

The seed script also loads the ingredient list (derived from the actual
Mishkak menu and mocktail recipe book) grouped into practical stock categories
- Meat, Poultry & Seafood; Dairy & Fats; Fruits & Vegetables; Dry & Pantry
Ingredients; Beverages & Mocktail Supplies; Disposables & Packaging; Cleaning
& Hygiene - so you don't have to type them all in by hand. Kitchen equipment
and tableware are intentionally left out; this app tracks day-to-day
consumable stock, not durable equipment. It also seeds a handful of demo
vendors and recipients (named people on each team) - replace these with your
real suppliers and staff from the "Items & Vendors" page.

Add, edit, or deactivate items any time from the "Items & Vendors" page, or
bulk add/update them by uploading an .xlsx file there (see below) - handy
whenever the menu changes and you need to add or remove ingredients in bulk.
Unit is a fixed dropdown list (kg, g, litre, ml, pcs, bunch, tin, bottle, box,
pack, case, roll, carton, tray) so every item stays consistent.

## 5. Push to GitHub

```bash
git remote add origin https://github.com/<your-username>/mishkak-inventory.git
git branch -M main
git push -u origin main
```

(Create the empty repo on GitHub first, without a README/license, then run the
commands above.)

## 6. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. Add the same two environment variables from your `.env` file
   (`DATABASE_URL` and `SESSION_SECRET`) in the Vercel project's Environment
   Variables settings.
3. Deploy. Vercel will run `npm run build` (which also runs
   `prisma generate`) automatically on every push to `main`.
4. After the first deploy, run the database migration and seed once against
   your production database (from your own computer, with `.env` pointed at
   the same `DATABASE_URL` you gave Vercel):
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

From then on, any `git push` to `main` auto-deploys. If you change
`prisma/schema.prisma` later, run `npx prisma migrate dev` locally to create a
new migration, commit it, then run `npx prisma migrate deploy` once against
production (or add it as a Vercel build step).

## How stock levels are calculated

**Central stock** (what the storekeeper physically has on hand) has an
**opening stock** (0 by default - set it from the Items page if you already
have stock when you start using the app), then:

```
opening stock + all purchases logged - all issuances logged
```

Issuance, not usage, is what leaves the central store - usage is what
kitchen/bar staff do with stock *after* it's already been handed to them. The
Manager Dashboard shows this running balance for every item (with a category
filter), flags anything at or below its "reorder level" (set from the Items &
Vendors page), and shows the total amount spent on purchases.

**Each team's own balance** (shown to Kitchen/Bar staff on their Log Activity
page) reconciles daily:

```
opening balance (yesterday's closing) + received today (issued to their team)
  - used today (their own usage logs) = closing balance
```

## Bulk updating the item list from Excel

From the "Items & Vendors" page, the Manager can download a starter template
or upload an .xlsx file to add or update many items at once - useful when the
menu changes and ingredients need to be added or swapped. The file needs
three columns, in any order, with these exact header names in row 1:

| Item          | Category        | Unit |
|---------------|-----------------|------|
| Sumac         | Dry & Pantry Ingredients | g    |
| Pomegranate juice | Beverages & Mocktail Supplies | litre |

("Name" also works instead of "Item".) Existing items are matched by name
(case-sensitive) and have their category/unit updated; anything not already
in the system is added as a new item. **Nothing is ever deleted or
deactivated by an upload** - if an ingredient has been dropped from the menu,
deactivate it manually from the item list below the upload button.

## Reports

- **Daily report** (`/reports/daily`): pick a date, see every purchase (with
  vendor and cost), every issuance (with recipient and team), and total usage
  by item, each with the time it was logged - with a CSV download.
- **Monthly report** (`/reports/monthly`): pick a month, see quantity bought,
  amount spent, quantity issued, quantity used, and quantity remaining (as of
  the end of that month) for every item, with a CSV download.

## Adding WhatsApp notifications later

WhatsApp is not wired up yet by design (it needs its own account setup), but
every purchase/issuance/usage log already calls `notifyManager()` in
[`src/lib/notify.ts`](src/lib/notify.ts), and every attempt is recorded in the
`NotificationLog` table so you can see what *would* have been sent.

To turn it on with Twilio (simplest option):

1. Sign up at [twilio.com](https://www.twilio.com) and enable the WhatsApp
   sandbox (or a production WhatsApp sender once approved).
2. Set these environment variables (locally and in Vercel):
   ```
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   TWILIO_WHATSAPP_FROM=+1415XXXXXXX      # your Twilio WhatsApp number
   MANAGER_WHATSAPP_TO=+2547XXXXXXXX      # manager's WhatsApp number
   ```
3. In `src/lib/notify.ts`, uncomment the Twilio `fetch(...)` block.

No other code changes are needed - purchases, issuances, and usage already
trigger a notification for every entry.

## Project structure

```
prisma/schema.prisma   Database models (User, Item, Vendor, Recipient, Purchase, Issuance, Usage, StockCount, NotificationLog)
prisma/seed.ts          Seed data: item list, vendors, recipients, demo users
src/lib/                Shared logic: db client, auth/session, stock calculations, units list, notify stub
src/middleware.ts        Route protection (login required; manager-only pages; /log blocked for managers)
src/app/login/           PIN sign-in
src/app/log/             Purchase + Issuance forms (storekeeper), Usage form + team reconciliation (kitchen/bar)
src/app/stock-take/      Storekeeper (+ Manager): physical stock count, becomes the new on-hand baseline
src/app/dashboard/       Manager: stock levels (with category filter), purchases, issuances, usage activity
src/app/reports/         Manager: daily and monthly reports + CSV export
src/app/items/           Manager: items, vendors, recipients, Excel import/template
src/app/users/           Manager: manage staff logins
```

## Running on your shop's own PC instead of the cloud

If you'd rather not use Vercel/Neon, you can run this on any always-on
computer in the shop:

```bash
npm install
npx prisma migrate deploy
npm run build
npm start
```

Staff can then reach it from their phones at `http://<that computer's local IP>:3000`
as long as they're on the same WiFi network. You'd still need a local
PostgreSQL install (or keep using a free Neon database over the internet,
which also works fine from a shop PC).
