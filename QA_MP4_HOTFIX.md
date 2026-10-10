# AUDIXO V39.1 MP4 Hotfix QA

## Root cause, based on V39 source and user screenshot
The V39 page disabled ALL MP4 resolution buttons when `preview.qualities` was empty. The server-side API parser only recognized a short list of `qualities` response schemas. The screenshot proves that metadata loading worked, but not that the backend returned usable MP4 quality metadata.

## Corrections
- Parse nested API envelopes and common quality field/value variants.
- Preserve strict quality selection when a supported list is present.
- Enable manual resolution selection with explicit `Try - unverified` status when preview returned NO recognized quality list. This is a fallback, not a claim of support.
- Existing server request still sends `format: mp4`, `quality: <selected>`. Rejections are shown to users.

## Verification
- Mocked API contract checks passed (MP3 / MP4, status, downloads, response-shape variants).
- All 68 TS/TSX files parsed without syntax diagnostics.
- Archive integrity tested separately.

## Limitations
- Live `https://ytdl.tiers.rest` endpoint could not be reached from this environment (DNS resolution blocked).
- Real MP4 conversion and 1440p availability not verified.
- Full production Vite build not run (project dependencies not available in local environment).
- If the remote API rejects a resolution, change/request support on the remote API server.
