# AUDIXO V39 Quality Assurance

## Verified here

- PASS — 69 TS and TSX source files parsed with TypeScript 5.x compiler syntax parser.
- PASS — 15 offline REST YTDL mock API assertions (`NODE_PATH=<global TS location> node scripts/test-media-proxy.cjs`).
  - API health; metadata (including mock 2-hour duration); MP4 resolution normalization;
    MP3 start at 320 encoding target; MP4 start with selected quality;
    completion job response; authenticated MP3 and MP4 file streaming;
    original-title content disposition; valid/invalid input handling.
- PASS — Original logo bytes included; additional name-only asset cropped from existing official artwork.
- PASS — Contact page no longer includes a form.
- PASS — First Vercel deployment has a build-time URL fallback when the production domain is not known yet.

## Not verified (please do not treat as passed)

- FULL PRODUCTION BUILD: `npm ci` could not fetch dependencies because the execution environment cannot resolve external registries. `tsc --noEmit`, `vite build`, actual rendered-browser screenshot QA, and Vercel production deployment remain UNTESTED here.
- LIVE API: `https://ytdl.tiers.rest` could not be reached from the execution environment; authentication and real conversion need deployment testing.
- FILE QUALITY: actual 320 kbps MP3, frame size of saved MP4, two-hour MP4 download, and binary content correctness need end-to-end tests with authorized media.
- AI VOCALS: actual Demucs model quality/device compatibility and clean isolation not checked with a real audio source; rapid spectral preview is not AI isolation.

## Post-deployment acceptance checklist

1. On mobile and desktop, visit Home and verify logo/loader appears only once and 5 short slogans cycle smoothly.
2. Converter MP3 tab → paste URL → Analyze → original title → 320 displayed only → Download MP3 → inspect actual file codec/bitrate/name.
3. Converter MP4 tab → Analyze → choose one API-reported available resolution → download video → inspect resolution/name and play.
4. Try a video whose API lists only 720p and 1080p: all unsupported options should be disabled.
5. Test a 15-minute and 2-hour authorized source separately; check Vercel logs if download fails.
6. Vocals → Studio AI separation of an authorized short test clip; test Vocals Only/Music Only toggles, WAV stem downloads and mute states. Check for bleed.
7. Test the Echo, Pitch, Slowed+Reverb, 8D/16D, Mashup and Full Studio editors with WAV and MP3, including trimming and export.
8. Confirm full editor track focus / all track display, waveform overflow scrolling and mobile/touch controls.
9. Contact has no input fields until real email is configured; email edit in `src/config/site.ts` shows link after deployment.
10. Inspect Vercel `npm run build` logs and fix any runtime/package errors before going live.
