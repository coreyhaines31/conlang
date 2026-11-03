import {AbsoluteFill, Img, staticFile} from 'remotion';
import {GenerateCard} from './GenerateCard';

export type OgVideoProps = {
  name: string;
  icon: string;
  headline: string;
  headlineAccent: string;
  body: string;
  domain: string;
};

// The site's own system stacks (globals.css --font-sans / --font-mono).
export const FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
export const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
// globals.css light theme, converted from oklch.
export const FOREGROUND = '#202020';
export const MUTED = '#646464';
export const PRIMARY = '#644a40';
export const BORDER = '#d8d8d8';

// The editor's plain light field: brand, headline and the h1's subline on the left, the Generate Words card on the right.
export const OgVideo = (props: OgVideoProps) => (
  <AbsoluteFill style={{background: '#f9f9f9', color: FOREGROUND, fontFamily: FONT, WebkitFontSmoothing: 'antialiased'}}>
    <div style={{position: 'absolute', left: 80, top: 84, width: 540, height: 462, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em'}}>
        <Img src={staticFile(props.icon)} style={{width: 40, height: 50}} />
        {props.name}
      </div>
      <div>
        <div style={{fontSize: 78, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.04em'}}>
          {props.headline} <span style={{color: PRIMARY}}>{props.headlineAccent}</span>
        </div>
        <div style={{fontSize: 27, lineHeight: 1.35, color: MUTED, marginTop: 24, letterSpacing: '-0.01em'}}>{props.body}</div>
      </div>
      <div style={{fontSize: 24, color: MUTED, fontFamily: MONO}}>{props.domain}</div>
    </div>
    <div style={{position: 'absolute', left: 668, top: 84, width: 460, height: 462}}>
      <GenerateCard />
    </div>
  </AbsoluteFill>
);
