import React,{lazy,Suspense,useEffect,useRef,useState} from 'react';
import {SocialIconButtons} from './SocialIconButtons';
import {LanguageDie} from './LanguageDie.jsx';
import {podcastColumns,filmFestEpisodes,podcastURL,episodeURL} from './podcast-data.js';
import {isSpaceRoute,isSiteRoute} from '../space-source/route-protocol.js';
import {LANGUAGE_KEY,textFor,episodeTitle} from './i18n.js';
import {useLocaleTransition} from './useLocaleTransition.js';
import {useReadingTransition} from './useReadingTransition.js';
const SpaceHome=lazy(()=>import('./SpaceHome.jsx'));
const A=import.meta.env.BASE_URL+'assets/';
const channelKeys={'film-fest':'filmFest',focus:'focus','in-cinemas':'cinema'};

function Podcast({category,language}){
 const t=key=>textFor(language,key),column=podcastColumns.find(([key])=>key===category);
 if(!column)return <NotFound language={language}/>;
 return <section className="podcast-content" aria-label={t(channelKeys[category])}>
  <div className="reader-eyebrow">PARALLAX / PODCAST</div><h1>{t(channelKeys[category])}</h1><p className="reader-subtitle">{t('episodes')}</p>
  <nav className="collection-tabs" aria-label={t('categorySwitch')}>{podcastColumns.map(([id])=><a key={id} href={'#/podcast/'+id} aria-current={category===id?'page':undefined}>{t(channelKeys[id])}</a>)}</nav>
  {category==='film-fest'?<ol className="linked-episodes">{filmFestEpisodes.map(([number,title,id])=><li key={id}><a href={episodeURL(id)} target="_blank" rel="noopener noreferrer"><span className="episode-number">{number}</span><img src={A+'logo.jpg'} alt="" loading="lazy"/><span className="episode-copy"><strong>{episodeTitle(language,title,id)}</strong><small>{t('brand')+' · '+t('xiaoyuzhou')}</small></span><span className="episode-play" aria-label={t('listen')}>↗</span></a></li>)}</ol>:<p className="collection-empty">{t('empty')}</p>}
  <a className="original-podcast" href={podcastURL} target="_blank" rel="noopener noreferrer">{t('follow')}</a>
 </section>;
}
function About({language}){const t=key=>textFor(language,key);return <section className="about-content"><div className="reader-eyebrow">PARALLAX / {t('about')}</div><h1>{t('aboutTitle')}</h1><div className="about-intro"><img src={A+'logo.jpg'} alt={t('logoAlt')}/><div><p>{t('aboutP1')}</p><p>{t('aboutP2')}</p></div></div></section>;}
function Contact({language}){
 const t=key=>textFor(language,key);
 return <section className="contact-content"><div className="reader-eyebrow">PARALLAX / {t('contact')}</div><h1>{t('contactTitle')}</h1><p>{t('contactP')}</p><SocialIconButtons language={language}/></section>;
}
function Articles({language}){const t=key=>textFor(language,key);return <section className="article-content"><div className="reader-eyebrow">PARALLAX / JOURNAL</div><h1>{t('articles')}</h1><p className="collection-empty">{t('stay')}</p></section>;}
function NotFound({language}){return <section><h1>{textFor(language,'notFound')}</h1><a href="#/home">{textFor(language,'backDesk')}</a></section>;}
export function App(){
 const [route,setRoute]=useState(()=>location.hash.slice(2)||'home');
 const {language,phase,cycleLanguage}=useLocaleTransition();
 const {displayed:contentRoute,phase:contentPhase}=useReadingTransition(route);
 const reader=useRef(null),reading=!isSpaceRoute(route),t=key=>textFor(language,key);
 const backRoute=route.startsWith('podcast/')?'podcast':'intro';
 useEffect(()=>{const change=()=>setRoute(location.hash.slice(2)||'home');window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 useEffect(()=>{document.documentElement.lang=language;document.title=textFor(language,'siteTitle');try{localStorage.setItem(LANGUAGE_KEY,language);}catch{}},[language]);
 useEffect(()=>{if(reading)reader.current?.focus({preventScroll:true});},[reading]);
 useEffect(()=>{reader.current?.querySelector('.reader-body')?.scrollTo(0,0);},[contentRoute]);
 useEffect(()=>{if(!reading)return;const key=event=>{if(event.key==='Escape'&&!document.querySelector('.space-frame')?.shadowRoot?.querySelector('dialog[open]'))location.hash='/'+backRoute;};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[reading,backRoute]);
 return <div className={'unified-site locale-'+phase+' '+(reading?'is-reading':'')}>
  <Suspense fallback={<div className="space-loading">{t('loading')}</div>}><SpaceHome route={isSiteRoute(route)?route:'articles'} language={language} languagePhase={phase}/></Suspense>
  <LanguageDie language={language} onToggle={cycleLanguage}/>
  <div className={'reading-veil '+(reading?'visible':'')} aria-hidden="true"/>
  {reading&&<main className={'reading-layer content-'+contentPhase} ref={reader} tabIndex="-1" aria-label={t('readingLabel')}><article className="reading-card"><div className="reader-top"><a href={'#/'+backRoute}>← {t(backRoute==='podcast'?'backPodcasts':'back')}</a><a className="reader-close" href={'#/'+backRoute} aria-label={t('close')}>×</a></div><div className="reader-body" aria-busy={contentPhase==='out'}>{contentRoute.startsWith('podcast/')?<Podcast category={contentRoute.split('/')[1]} language={language}/>:contentRoute==='about'?<About language={language}/>:contentRoute==='contact'?<Contact language={language}/>:contentRoute==='articles'?<Articles language={language}/>:<NotFound language={language}/>}</div></article></main>}
 </div>;
}
