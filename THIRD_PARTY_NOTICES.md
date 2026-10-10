# Third-party components

Audixo Studio V26 uses the following third-party software through its package dependencies or optional browser/runtime integrations. Keep upstream notices and license obligations when distributing compiled builds.

## Frontend and audio

- React 18.3.1 / React DOM 18.3.1
- React Router DOM 6.30.1
- Vite 5.4.21 and TypeScript 5.6.3 for build tooling
- `@breezystack/lamejs` 1.2.7 for browser MP3 work. Review the upstream LAME/LGPL-related distribution terms for compiled redistribution.

## Local source separation

- `demucs-web` 1.0.2
- ONNX Runtime Web 1.24.3
- HTDemucs ONNX model converted by timcsy

The model is downloaded on demand from a pinned Hugging Face revision and is not bundled in this ZIP:

https://huggingface.co/timcsy/demucs-web-onnx/resolve/92e33df61cfc9eb820272aaa62d2ef6dcf4d950d/htdemucs_embedded.onnx

Pinned model SHA-256 used by the worker:

`e5e425c17683f163a472462eb5f5a4ffcd11c31858d57fbd0833b012d8b88077`

Relevant upstream projects:

- https://github.com/timcsy/demucs-web
- https://github.com/microsoft/onnxruntime
- https://github.com/facebookresearch/demucs

## Fonts

V26 requests Manrope and Nunito Sans from Google Fonts in `index.html`; font binaries are not bundled in this source package. The CSS includes system-font fallbacks if the remote font request is unavailable.

## Optional media conversion provider

The YouTube-to-MP3 API can call an operator-configured Cobalt-compatible HTTPS endpoint or discover compatible community instances. No third-party converter webpage, executable, FFmpeg binary, yt-dlp binary, AI weight file or downloaded media is bundled in this ZIP.

Only process media you are permitted to use. Source-media rights remain with their owners.
