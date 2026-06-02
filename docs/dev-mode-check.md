# JL1 — Dev Mode Check

## Goal

Check if the project starts locally from a clean install.

## Commands tested

    rm -rf node_modules
    npm install
    npm run dev

## Problem found

After a clean install, the backend initially failed because Prisma Client was not generated before starting the backend.

Error:

    Module '"@prisma/client"' has no exported member 'User'.

## Fix applied

Added a root script:

    "prisma:generate": "prisma generate --schema backend/prisma/schema.prisma"

Updated the root dev script to run Prisma generation before starting the app:

    "dev": "npm run build -w shared && npm run prisma:generate && concurrently \"npm run dev -w backend\" \"npm run dev -w frontend\""

## Final result

After the fix, the clean test works.

Frontend: http://localhost:5173/

Backend:

    [server] listening on http://localhost:3001
    [server] NODE_ENV=development

## Notes

`npm install` shows deprecated package warnings and 5 moderate vulnerabilities.

This does not block dev mode startup, but should be reviewed later.