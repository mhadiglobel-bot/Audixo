# AUDIXO V39 — Online Audio Studio

A **React + TypeScript + Vite** audio editing project with local waveform editors, Demucs AI separation, effects, mashup editing and one permission-based YouTube MP3/MP4 conversion page.

## What's new in V39

- Official AUDIXO artwork. Loader shows original wave mark once with the supplied colored lettering cropped separately, no repeated symbol. Smaller header identity.
- Faster hero slogan animation: Make Sound Your Own / Shape Every Beat / Create Without Limits / Remix Your World / Your Sound. Reimagined.
- Four compact homepage tool cards: fixed 320 kbps MP3 target, MP4 resolution showcase, five stems, creative preset/beat library.
- Redesigned unified **YouTube to MP3 / MP4** page with accessible format switch, URL clear button, analyze preview, original-title filenames and authenticated server-side API proxy.
- **MP3:** one visible 320 kbps output target; the REST API must actually encode at this bitrate. **MP4:** only resolutions returned by `/api/preview` are enabled (240/360/480/720/1080/1440 where available).
- VOCALS: deliberate Studio AI versus approximate Fast Preview, one-click vocal-only/instrumental-only/mix playback via track mutes; stems may still contain bleed.
- Contact page replaces nonfunctional form with **Official Email Coming Soon** until configured via `src/config/site.ts`.
- More consistent premium light-neon surfaces, compact panels, stable timeline overflow/track-focus controls, mobile layout refinements.

## Main routes

- `/`: Home
- `/tools/youtube-to-mp3`: combined YouTube MP3 / MP4 converter
- `/tools/vocals`: Studio AI / preview stem separation
- `/editor`: full browser audio studio
- `/tools/mashup`: mashup timeline
- `/tools/echo`, `/tools/pitch`, `/tools/slowed-reverb`, `/tools/spatial-motion`, `/tools/trim-audio`: focused audio tools
- `/contact`: upcoming support email

## Setup

See **`DEPLOY_V39_STEP_BY_STEP.txt`**. Environment Variable 1 is the API base origin `https://ytdl.tiers.rest`; any auth token is private and optional depending on actual API implementation; canonical site URL is optional until Vercel assigns a production domain.

`npm ci` installs dependencies, `npm run build` builds the client/SEO pages, and `npm run dev` runs Vite locally. The API proxy is a Vercel Node serverless function in `api/media.ts`. Conversion itself occurs on your independently hosted REST YTDL service, not inside the Vercel frontend. API credentials must **never** have the `VITE_` prefix.

## Important operational limitations

- **This release did not pass a real production build in this environment:** no network/DNS access to install npm packages. TypeScript syntax and simulated API adapter assertions pass; see `QA_V39.md`.
- A requested 320 kbps MP3 is not proof of actual encoded bitrate or source audio fidelity. Verify output with `ffprobe`.
- A media source over two hours is not guaranteed: background queue, upstream service limits, file size, bandwidth and Vercel proxy streaming may limit it.
- AI model downloads and separation are device-dependent; no algorithm guarantees perfect vocal/instrument isolation. Fast Preview is intentionally labeled approximate.
- Only download or transform media you own or have permission to use and comply with platform terms.

The official AUDIXO logo artwork is retained from the supplied asset; it is not regenerated or rebranded.
