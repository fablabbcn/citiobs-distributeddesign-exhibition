# CitiObs × Distributed Design — Exhibition players

Static site for the exhibition tablets: one minimal fullscreen player per work, plus an index (`index.html`).

Live site (GitHub Pages): https://fablabbcn.github.io/citiobs-distributeddesign-exhibition/

| Page | Media |
|---|---|
| `marcus-smith/` | `track-1.mp3` … `track-5.mp3` (Abiir Shirdoon, Eliz Mizon, Jace Clarkson, Judit Davis, Shona Jemphrey) |
| `katerina-kovarickova/` | `video.mp4` — pending |
| `morris-mburu-1/` | `audio.mp3` |
| `morris-mburu-2/` | `video.mp4`, `poster.jpg` (1080p re-encode of the 4K original) |
| `wu-siou-ming/` | `video.mp4`, `poster.jpg` |

A page whose file is missing shows a dimmed play button. To fill it in, drop the file
into the folder with the name above and push. To change the type or file list, edit the
`data-type` / `data-src` attributes on `<body>` in that folder's `index.html`.

Touch: tap to play/pause (on a playing video the first tap only reveals the controls) · drag the bottom line to seek · tap the dots to switch tracks. Playback goes fullscreen and keeps the screen awake.
Keyboard: Space play/pause · f fullscreen · ←/→ switch track or skip 5 s.

For the exhibition tablet: open the site in Chrome, then menu → Add to Home screen. Launched from the icon it runs fullscreen with no browser bar.

## Publishing

The site is plain HTML/CSS/JS with no build step. It is served by GitHub Pages from the
`main` branch root (Settings → Pages → Deploy from a branch → `main` / `/ (root)`).
`.nojekyll` makes Pages serve the files as-is. All paths are relative, so it works under
the `/citiobs-distributeddesign-exhibition/` subpath.

Media files are committed directly; keep each under GitHub's 100 MB per-file limit
(re-encode larger videos, e.g. `ffmpeg -i in.mov -c:v libx264 -crf 23 -preset slow -c:a aac -movflags +faststart video.mp4`).

## Local preview

Needs a server with HTTP range support (video seeking), e.g. `npx http-server -p 8765 -c-1`.

## Credits

Artworks © their respective artists — Marcus Smith, Kateřina Kováříčková, Morris Mburu, Wu Siou Ming.
Exhibition produced by [Fab Lab Barcelona](https://fablabbarcelona.org) for CitiObs and Distributed Design.
