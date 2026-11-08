import {VerseText} from './components/verse-text.tsx';
import {textFor} from './i18n.js';

// The supplied component owns only its text effect; the scene keeps its own clock.
export function HomeSlogan({language,phase}){
 return <div className={'home-slogan locale-'+phase}>
  <VerseText key={language} text={textFor(language,'slogan').join('\n')} seed={1610} tone="dark" speed={.85} />
 </div>;
}
