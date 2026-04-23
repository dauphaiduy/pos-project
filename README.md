# POS System

A desktop Point-of-Sale application built with Electron, React, TypeScript, and SQLite.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [IPC API](#ipc-api)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Development Workflow](#development-workflow)
- [Adding New Features](#adding-new-features)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 35 |
| Frontend | React 19 + TypeScript + Vite |
| State management | Zustand |
| Database | SQLite via `better-sqlite3` |
| IPC bridge | Electron `contextBridge` + `ipcMain.handle` |
| Monorepo | npm workspaces |

---

## Project Structure

```
pos-project/
├── package.json                  # Monorepo root — workspaces + dev scripts
├── tsconfig.json                 # Root TypeScript project references
│
├── packages/
│   └── shared-types/             # @pos/shared-types — shared TS interfaces
│       └── src/index.ts
│
└── apps/
    ├── main/                     # Electron main process (Node.js)
    │   └── src/
    │       ├── main.ts           # App entry — BrowserWindow, app lifecycle
    │       ├── db/
    │       │   └── database.ts   # SQLite connection + schema migration
    │       ├── repositories/
    │       │   └── order.repository.ts   # Raw DB queries
    │       ├── services/
    │       │   └── order.service.ts      # Business logic + validation
    │       └── ipc/
    │           └── order.handler.ts      # IPC channel registration
    │
    ├── preload/                  # Electron preload script
    │   └── src/
    │       └── preload.ts        # contextBridge — exposes electronAPI to renderer
    │
    └── renderer/                 # React + Vite frontend
        └── src/
            ├── main.tsx          # React DOM entry
            ├── App.tsx           # Root component
            ├── types/
            │   └── electron.d.ts # window.electronAPI type declarations
            ├── store/
            │   └── orderStore.ts # Zustand store
            └── components/
                ├── CreateOrder.tsx
                └── OrderList.tsx
```

---

## Architecture

The app follows clean architecture with strict separation across three Electron contexts:

```
Renderer (React)
   │  window.electronAPI.createOrder(input)
   ▼
Preload (contextBridge)
   │  ipcRenderer.invoke('orders:create', input)
   ▼
Main Process
   ├── ipc/order.handler.ts        ← receives IPC call
   ├── services/order.service.ts   ← validates input
   └── repositories/order.repository.ts  ← runs SQL via better-sqlite3
```

**Security model:**
- `nodeIntegration: false` — renderer has no direct Node.js access
- `contextIsolation: true` — renderer and preload run in separate V8 contexts
- Only explicitly whitelisted methods are exposed via `contextBridge`

---

## Database Schema

The SQLite database file is stored at Electron's `userData` path:
- **Linux:** `~/.config/pos-project/pos.db`
- **macOS:** `~/Library/Application Support/pos-project/pos.db`
- **Windows:** `%APPDATA%\pos-project\pos.db`

```sql
CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  total      INTEGER NOT NULL,              -- amount in cents (e.g. 1500 = $15.00)
  status     TEXT    NOT NULL DEFAULT 'pending',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

WAL (Write-Ahead Logging) mode is enabled for better concurrent read performance.

---

## IPC API

The preload script exposes `window.electronAPI` to the renderer with the following methods:

### `window.electronAPI.createOrder(input)`

Creates a new order.

**Input:**
```ts
interface CreateOrderInput {
  total: number;   // required, must be > 0 (in cents)
  status?: string; // optional, defaults to "pending"
}
```

**Returns:** `Promise<Order>`

**Validation:** throws if `total <= 0`

---

### `window.electronAPI.listOrders()`

Returns all orders sorted by `created_at` descending.

**Returns:** `Promise<Order[]>`

---

### Shared `Order` type

```ts
interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
}
```

Defined in `packages/shared-types/src/index.ts` and shared across all workspaces.

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- GCC/G++ — required to compile `better-sqlite3`
  - **Fedora/RHEL:** `sudo dnf install gcc-c++ make`
  - **Ubuntu/Debian:** `sudo apt install build-essential`
  - **macOS:** `xcode-select --install`

### Install

```bash
npm install
```

### Rebuild native module for Electron

`better-sqlite3` is a native addon and must be compiled against Electron's Node ABI:

```bash
npx electron-rebuild -f -w better-sqlite3
```

> Re-run this after every `npm install`.

### Build shared types (first time only)

```bash
npm run build --workspace=packages/shared-types
```

---

## Scripts

All scripts are run from the **monorepo root**.

| Script | Description |
|---|---|
| `npm run dev` | Starts Vite renderer + tsc watch for main & preload (no Electron window) |
| `npm run dev:full` | Full dev mode — starts everything and auto-launches Electron once Vite is ready |
| `npm run build` | Production build for all workspaces in dependency order |
| `npm run electron:start` | Launches Electron against the last build |

---

## Development Workflow

**Option A — manual (recommended for first run):**

```bash
# Terminal 1: build & watch main + preload
npm run build --workspace=packages/shared-types
npm run build --workspace=apps/preload
npm run dev --workspace=apps/main        # tsc --watch

# Terminal 2: start Vite renderer dev server
npm run dev --workspace=apps/renderer

# Terminal 3: launch Electron
NODE_ENV=development npx electron apps/main/dist/main.js
```

**Option B — all-in-one:**

```bash
npm run dev:full
```

Uses `concurrently` + `wait-on` to start all processes in the correct order and opens Electron once the renderer is ready on `http://localhost:5173`.

---

## Adding New Features

To add a new entity (e.g. `products`):

1. **shared-types** — add `Product` and `CreateProductInput` interfaces to `packages/shared-types/src/index.ts`
2. **db** — add `CREATE TABLE IF NOT EXISTS products ...` to `apps/main/src/db/database.ts`
3. **repository** — create `apps/main/src/repositories/product.repository.ts`
4. **service** — create `apps/main/src/services/product.service.ts`
5. **ipc handler** — create `apps/main/src/ipc/product.handler.ts` and register it in `main.ts`
6. **preload** — expose new methods in `apps/preload/src/preload.ts` and update `apps/renderer/src/types/electron.d.ts`
7. **renderer** — add a Zustand store slice and React components

## legacy Vite template content



The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
