# Link preview video

Remotion source for `public/og-video.mp4` (the homepage `og:video` that iMessage and Discord autoplay) and `public/og-image.png` (the homepage `og:image` still, frame 225 of the 6-second, 60 fps loop). Needs Node and ffmpeg.

```sh
cd og && npm install && npm run render
```

`npm run studio` opens a live preview. `OgVideo.tsx` is the shell (logo, headline, subline) and takes its text as props in `Root.tsx`; `GenerateCard.tsx` is the Generate Words card. Its words are real output of `src/lib/generator.ts` (Elvish preset, seed 7). The loop ends on its first frame, so keep the first and last frames identical when changing the timing.

This folder is excluded from the Next.js typecheck and lint and has its own `package.json`; nothing in it is served.
