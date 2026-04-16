# Lias veckopeng — PWA Implementation Plan

A premium, game-meets-banking PWA built on the existing Vue 3 + Vite + Pinia + Firebase scaffold at `/Users/jk/kod/allowance`.

---

## Stack Additions

| Package | Purpose |
|---|---|
| `vue-i18n` | Swedish translations |
| `canvas-confetti` | Confetti animations |
| `@vueuse/core` | `useLocalStorage`, `useDark`, etc. |
| `@types/canvas-confetti` | Types |

No Tailwind is currently installed — the project uses plain CSS. We'll add Tailwind CSS v3 as requested.

> [!IMPORTANT]
> The existing project has no Tailwind. We will install `tailwindcss@3`, `postcss`, and `autoprefixer` and wire them up.

---

## Architecture Overview

```
src/
├── assets/           (global CSS + Tailwind base)
├── components/
│   ├── BottomNav.vue
│   ├── BucketCard.vue
│   ├── ConfettiEffect.vue
│   ├── DreamCard.vue
│   └── TransactionItem.vue
├── composables/
│   └── useWeeklyDeposit.ts
├── firebase.ts        (add Firestore)
├── i18n/
│   └── index.ts
│   └── sv.ts
├── router/index.ts    (updated)
├── stores/
│   ├── auth.ts        (keep)
│   ├── allowance.ts   (NEW — buckets + transactions)
│   ├── dreams.ts      (NEW — saving goals)
│   └── theme.ts       (NEW — light/dark)
└── views/
    ├── DashboardView.vue
    ├── DreamsView.vue
    ├── HeroView.vue
    ├── HistoryView.vue
    ├── AdminView.vue
    └── LoginView.vue  (keep/update)
```

---

## Data Model (Firestore + localStorage)

### Firestore collections (no auth needed — single-user app)
```
allowance/
  buckets: { spend: number, give: number, save: number }
  lastDeposit: Timestamp
  transactions: [{ id, date, description, amount, bucket }]
  dreams: [{ id, name, targetAmount, imageUrl, createdAt }]
  charityChoice: string
```

Offline: mirror to `localStorage` via a Pinia plugin / `useLocalStorage`.

---

## Proposed Changes

### 1. Dependencies

#### [MODIFY] [package.json](file:///Users/jk/kod/allowance/package.json)
Add: `tailwindcss`, `postcss`, `autoprefixer`, `vue-i18n`, `canvas-confetti`, `@vueuse/core`

---

### 2. Config & Setup

#### [NEW] tailwind.config.js
Content: dark mode `'class'`, purge paths, custom color palette (purples/pinks/yellows).

#### [NEW] postcss.config.js
Wire Tailwind + autoprefixer.

#### [MODIFY] [vite.config.ts](file:///Users/jk/kod/allowance/vite.config.ts)
Update PWA manifest: name → "Lias veckopeng", theme color, icons.

#### [MODIFY] [index.html](file:///Users/jk/kod/allowance/index.html)
Add Google Fonts (Inter), Swedish `lang="sv"`, meta description.

#### [MODIFY] [firebase.ts](file:///Users/jk/kod/allowance/src/firebase.ts)
Add Firestore: `getFirestore`, export `db`.

#### [MODIFY] [main.ts](file:///Users/jk/kod/allowance/src/main.ts)
Wire `vue-i18n` plugin.

---

### 3. i18n

#### [NEW] src/i18n/sv.ts
All Swedish UI strings.

#### [NEW] src/i18n/index.ts
Create and export the i18n instance.

---

### 4. Pinia Stores

#### [NEW] src/stores/allowance.ts
- State: `buckets { spend, give, save }`, `transactions[]`, `lastDeposit`
- Actions: `depositWeekly()`, `deductFromBucket()`, `addToBucket()`, `loadFromFirestore()`, `syncToFirestore()`
- Offline: write-through to `localStorage`; on load, try Firestore first then fall back.

#### [NEW] src/stores/dreams.ts
- State: `dreams[]`
- Actions: `addDream()`, `deleteDream()`, `loadDreams()`, `syncDreams()`

#### [NEW] src/stores/theme.ts
- State: `isDark` (persisted in `localStorage`)
- Toggle applies/removes `dark` class on `<html>`

---

### 5. Composables

#### [NEW] src/composables/useWeeklyDeposit.ts
- On app mount: check `lastDeposit` timestamp
- If it's past Friday 16:00 and no deposit this week → trigger `depositWeekly()`
- Uses `setInterval` to re-check periodically while app is open

---

### 6. Components

#### [NEW] src/components/BottomNav.vue
Tab bar (Dashboard, Drömmar, Hjältar, Historia) with animated active indicator.

#### [NEW] src/components/BucketCard.vue
Large gradient card showing bucket name, emoji, balance, with glow/hover effect.

#### [NEW] src/components/ConfettiEffect.vue
Wraps `canvas-confetti`; exposes `trigger()` method.

#### [NEW] src/components/DreamCard.vue
Image, name, target, progress bar, % complete label.

#### [NEW] src/components/TransactionItem.vue
Icon, description, amount (colored +/-), date.

---

### 7. Views

#### [MODIFY] src/App.vue
Add dark-mode class watcher, `<BottomNav>` layout shell, route-based nav visibility.

#### [NEW] src/views/DashboardView.vue
- Three `<BucketCard>` components
- Greeting with Lia's name + fun emoji
- Next payday countdown

#### [NEW] src/views/DreamsView.vue
- List of saving goals with progress bars (Save bucket / target)
- "Lägg till ny dröm" FAB
- Add dream modal: name, target amount, image upload (stored as base64 in Firestore)
- Confetti when goal hits 100%

#### [NEW] src/views/HeroView.vue
- Charity selector (Radio buttons styled as cards): Hundstallet 🐕, WWF 🐼, Barncancerfonden 🎗️
- Impact meter (text computed from Give balance)
- "Dags att donera!" button — glows when `give >= 100`, triggers confetti on confirm

#### [NEW] src/views/HistoryView.vue
- Scrollable transaction list grouped by week

#### [NEW] src/views/AdminView.vue
- Accessed via secret route `/admin` — password protected (`"lia2024"` stored in env or hardcoded)
- Adjust any bucket ± amount
- Reset weekly timer
- Parent-only, not shown in bottom nav

#### [MODIFY] src/router/index.ts
Remove auth guard (app is single-user, no login needed for child)
Add all new routes; `/admin` gets a simple PIN guard.

---

## Light / Dark Mode

- Default: **Light mode**
- Toggle hidden in a `⚙️` settings button on dashboard header
- `localStorage` key: `theme`
- Tailwind `dark:` variants throughout

---

## Confetti

Triggered in two places:
1. When a dream reaches 100% progress
2. When donation is confirmed in Hero View

Uses `canvas-confetti` with pink/purple/yellow colors to match the palette.

---

## PWA Manifest Updates

```json
{
  "name": "Lias veckopeng",
  "short_name": "Veckopeng",
  "theme_color": "#a855f7",
  "background_color": "#fdf4ff",
  "display": "standalone"
}
```

---

## Verification Plan

### Automated Tests
- Existing Vitest setup is kept; no new unit tests are required for this scope.

### Manual / Browser Verification
- Run `npm run dev` and open browser at `localhost:5173/allowance/`
- Check all 4 tabs render correctly on a mobile viewport
- Verify weekly deposit logic fires (can force by setting `lastDeposit` in past)
- Admin page PIN prompt works
- Confetti triggers on dream completion and donation
- Dark mode toggle persists on reload
- Offline: kill network, reload — data still shows from localStorage
