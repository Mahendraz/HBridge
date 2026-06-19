# HBridge - Hearty Bridge Project

## Project Overview

Hearty Bridge is a healthcare collaboration platform connecting parents and therapists for managing children's therapeutic journeys.

## Repository Structure

```
HBridge/
├── .claude/
│   ├── agents/           # Custom subagent definitions
│   └── settings.local.json
├── docs/                 # Project documentation
└── nextjs-boilerplate/
    └── hearty-bridge/    # Main Next.js application (work here)
```

## Main Application

All development work happens inside `nextjs-boilerplate/hearty-bridge/`.

See `nextjs-boilerplate/hearty-bridge/CLAUDE.md` for full app-specific instructions.

## Quick Commands

Run from `nextjs-boilerplate/hearty-bridge/`:

```bash
npm run dev       # Start development server (port 3000)
npm run build     # Build for production
npm run lint      # Run ESLint
npx tsc --noEmit  # TypeScript type check
```

## Environment: WSL2 on Windows

This repo is developed inside **WSL2**. Key constraints:

- **Run dev server via PowerShell** (opens a Windows terminal window):
  ```bash
  cmd.exe /c start powershell.exe -NoExit -Command "cd 'E:\Work\Hendra\HBridge\nextjs-boilerplate\hearty-bridge'; npm run dev"
  ```

- **MongoDB runs as a Windows service** on `127.0.0.1:27017`. It is NOT reachable from WSL's
  own `localhost`. Always run DB scripts through Windows PowerShell's Node.js:
  ```bash
  powershell.exe -Command "cd 'E:\Work\Hendra\HBridge\nextjs-boilerplate\hearty-bridge'; node scripts\<script>.js 2>&1"
  ```

- **`mongosh` is not installed**. Use Node.js + mongoose scripts in `scripts/` for DB queries.

See `nextjs-boilerplate/hearty-bridge/CLAUDE.md` → **WSL Environment** section for full details.

## Documentation

Full project documentation is in `docs/COMPREHENSIVE_DOCUMENTATION.md`.
