# hewittoscar.party

Annual Oscar party photo gallery. Browse photos by year with lightbox viewing.

## Stack

- React 19 + Vite 7 + MUI 7 + TypeScript
- React Router for year-based navigation (`/`, `/:year`)
- Dark theme, Inter font, `#ef4444` accent

## Development

```bash
pnpm install
pnpm dev
```

Photos are not included in the repo. In development, the app reads from `public/photos/`. In production, photos are served from DreamHost via Vercel rewrite (`/photos/*` proxies to `photos.hewittoscar.party`).

## Photo Manifest

`src/data/photo-manifest.json` maps years to photo filenames. To regenerate from local photo files:

```bash
node scripts/generate-manifest.js
```

## Deployment

App auto-deploys to Vercel on push to `main`. Photos (~19GB) stay on DreamHost.

To upload new photos:

```bash
scp -r <photo-dirs> kevgrz@iad1-shared-b7-16.dreamhost.com:~/hewittoscar.party/photos/
```

## Live

https://hewittoscar.party
