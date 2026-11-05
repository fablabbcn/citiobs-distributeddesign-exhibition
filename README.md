# Exhibition players

Static site: one minimal fullscreen player per work, plus an index (`index.html`).

| Page | Media |
|---|---|
| `marcus-smith/` | `track-1.mp3` … `track-5.mp3` (Abiir Shirdoon, Eliz Mizon, Jace Clarkson, Judit Davis, Shona Jemphrey) |
| `katerina-kovarickova/` | `video.mp4` — pending |
| `morris-mburu-1/` | `video.mp4` — pending |
| `morris-mburu-2/` | `audio.mp3` — pending |
| `wu-siou-ming/` | `video.mp4`, `poster.jpg` |

A page whose file is missing shows a dimmed play button. To fill it in, drop the file
into the folder with the name above and push. To change the type or file list, edit the
`data-type` / `data-src` attributes on `<body>` in that folder's `index.html`.

Touch: tap to play/pause (on a playing video the first tap only reveals the controls) · drag the bottom line to seek · tap the dots to switch tracks. Playback goes fullscreen and keeps the screen awake.
Keyboard: Space play/pause · f fullscreen · ←/→ switch track or skip 5 s.

For the exhibition tablet: open the site in Chrome, then menu → Add to Home screen. Launched from the icon it runs fullscreen with no browser bar.

Local preview needs a server with HTTP range support (video seeking), e.g. `npx http-server -p 8765 -c-1`.