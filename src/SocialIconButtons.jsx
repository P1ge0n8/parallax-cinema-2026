import { useId, useState } from 'react';
import './social-icon-buttons.css';

const socials = [
  { label: '小红书', href: 'https://xhslink.cn/m/3WX73xVhBbt', brand: '#ff405a', icon: 'xiaohongshu' },
  { label: '小宇宙', href: 'https://www.xiaoyuzhoufm.com/podcast/678bd3cc2271efa33738daf8', brand: '#42c7e5', icon: 'xiaoyuzhou' },
];

function SocialButtonBorder({ side, brand }) {
  const id = useId().replaceAll(':', '');
  const path = side === 'left' ? 'M10.6 2.14A17.5 17.5 0 0 0 10.6 33.86' : 'M25.4 2.14A17.5 17.5 0 0 1 25.4 33.86';
  return <svg className="social-button-border" viewBox="0 0 36 36" aria-hidden="true" style={{ color: brand }}>
    <defs>
      <linearGradient id={id} x1="0" y1="2.14" x2="0" y2="33.86" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="currentColor" stopOpacity="0"/><stop offset=".28" stopColor="currentColor" stopOpacity=".2"/><stop offset=".5" stopColor="currentColor" stopOpacity=".86"/><stop offset=".72" stopColor="currentColor" stopOpacity=".2"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/>
      </linearGradient>
      <radialGradient id={id+'-fill'} cx={side === 'left' ? '0' : '36'} cy="18" r="25" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="currentColor" stopOpacity=".14"/><stop offset=".42" stopColor="currentColor" stopOpacity=".06"/><stop offset=".82" stopColor="currentColor" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <circle className="social-button-fill-edge" cx="18" cy="18" r="17" fill={`url(#${id}-fill)`}/>
    <circle className="social-button-border-base" cx="18" cy="18" r="17.5"/>
    <path className="social-button-border-edge" d={path} stroke={`url(#${id})`}/>
  </svg>;
}

export function SocialIconButtons() {
  const [hovered, setHovered] = useState(-1);
  const [focused, setFocused] = useState(-1);
  const active = hovered >= 0 ? hovered : focused;
  return <div className="social-icon-buttons" role="group" aria-label="关注视差之见" onMouseLeave={() => setHovered(-1)}>
    {socials.map((social, index) => {
      const side = active < 0 || index === active ? undefined : index < active ? 'right' : 'left';
      return <a className="social-icon-button" key={social.icon} href={social.href} target="_blank" rel="noopener noreferrer" title={social.label} aria-label={`${social.label}（新窗口打开）`} data-adjacent-side={side} style={{ '--social-brand': social.brand }} onMouseEnter={() => setHovered(index)} onFocus={() => setFocused(index)} onBlur={() => setFocused(-1)}>
        <SocialButtonBorder side={side} brand={active < 0 ? 'transparent' : socials[active].brand}/>
        <span className={'social-icon-button-swap social-icon-'+social.icon}><img src={`${import.meta.env.BASE_URL}assets/social/${social.icon}.png`} alt=""/></span>
        <span className="social-icon-button-swap social-icon-button-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span>
      </a>;
    })}
  </div>;
}
