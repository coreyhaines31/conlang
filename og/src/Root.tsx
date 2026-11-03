import {Composition} from 'remotion';
import {OgVideo, type OgVideoProps} from './OgVideo';

// 6 s at 60 fps. Frame 225 (3.75 s) is the resting frame, rendered as the og:image still.
export const RemotionRoot = () => (
  <Composition
    id="OgVideo"
    component={OgVideo}
    durationInFrames={360}
    fps={60}
    width={1200}
    height={630}
    defaultProps={
      {
        name: 'Conlang',
        icon: 'conlang-icon.svg',
        headline: 'Create Your',
        headlineAccent: 'Language.',
        body: 'Define sounds, create words, and bring your language to life.',
        domain: 'conlang.app',
      } satisfies OgVideoProps
    }
  />
);
