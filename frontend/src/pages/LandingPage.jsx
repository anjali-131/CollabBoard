import React, { useRef, useState } from 'react';
import ThemeToggle from '../components/ThemeToggle.jsx';
import './LandingPage.css';

const features = [
  { icon: 'people', title: 'Real-time collaboration', text: 'See teammates join the room and work together as ideas take shape.' },
  { icon: 'board', title: 'A shared whiteboard', text: 'Keep sketches, plans, and discussions together in one persistent space.' },
  { icon: 'pen', title: 'Drawing and erasing tools', text: 'Sketch freely, adjust your stroke, and refine the canvas as you go.' },
  { icon: 'shapes', title: 'Shapes and diagrams', text: 'Arrange shapes and build connected flowcharts for clear visual thinking.' },
  { icon: 'note', title: 'Sticky notes and text', text: 'Capture a thought or add context beside the ideas it belongs to.' },
  { icon: 'chat', title: 'Team chat', text: 'Talk through the work with room members without leaving the board.' },
];

function FeatureIcon({ name }) {
  const paths = {
    people: <><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.3-3 2.2-4.5 5.5-4.5s5.2 1.5 5.5 4.5M16 5.5a3 3 0 0 1 0 5.8M17 14.5c2.4.5 3.7 2 3.9 4.5"/></>,
    board: <><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3M7 9h5M7 13h9"/></>,
    pen: <><path d="m4 16-.8 4.8L8 20l11-11-4-4L4 16Z"/><path d="m13.5 6.5 4 4M4 20l4-1"/></>,
    shapes: <><rect x="3" y="4" width="8" height="8" rx="1.5"/><circle cx="17" cy="16" r="4"/><path d="m14 5 4 4-4 4-4-4 4-4Z"/></>,
    note: <><path d="M5 3h14v14l-4 4H5z"/><path d="M15 21v-4h4M8 8h8M8 12h6"/></>,
    chat: <><path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 9h8M8 13h5"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Brand({ footer = false }) {
  return <a className={`landing-brand${footer ? ' landing-brand-footer' : ''}`} href="#home" aria-label="CollabBoard home"><span className="landing-brand-mark" aria-hidden="true">✳</span><span>collab<span>board</span></span></a>;
}

function ProductPreview() {
  return <div className="product-preview" role="img" aria-label="CollabBoard whiteboard preview">
    <div className="preview-topbar"><Brand/><div className="preview-board-title">Sprint planning <span>⌄</span></div><div className="preview-presence"><i className="preview-avatar avatar-cyan">M</i><i className="preview-avatar avatar-violet">J</i><i className="preview-avatar avatar-coral">A</i><span>3 here</span></div></div>
    <div className="preview-workspace"><div className="preview-tools"><span className="tool-active">↖</span><span>／</span><span>▱</span><span>◯</span><span>T</span><span>▧</span></div><div className="preview-canvas">
      <div className="preview-sticky sticky-yellow"><b>What should we<br/>make easier?</b><span>Explore the friction</span></div>
      <div className="preview-sticky sticky-blue"><b>Start with the<br/>smallest step</b><span>Ship · learn · refine</span></div>
      <div className="preview-flow flow-one"><span>Listen to users</span></div><div className="preview-flow flow-two"><span>Map the journey</span></div><div className="preview-flow flow-three"><span>Build together</span></div>
      <svg className="preview-connectors" viewBox="0 0 580 340" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="preview-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" fill="#8091b3"/></marker></defs><path d="M225 115 C275 115 282 145 320 145"/><path d="M405 170 C445 195 420 222 380 242"/><path d="M255 170 C260 210 285 230 315 245"/></svg>
      <div className="preview-cursor cursor-a"><span>Jules</span><b>↖</b></div><div className="preview-cursor cursor-b"><span>Mina</span><b>↖</b></div>
    </div></div>
    <div className="preview-status"><span><i/> All changes saved</span><span>Board room · sprint-planning</span></div>
  </div>;
}

export default function LandingPage({ navigate, theme = 'light', toggleTheme = () => {} }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const go = path => { setMenuOpen(false); navigate(path); };
  const handleMenuKeyDown = event => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); } };
  const sectionLink = (id, label) => <a href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>;
  return <div className="landing-page" id="home">
    <header className="landing-nav"><div className="landing-nav-inner"><Brand/><button ref={menuButton} className="landing-menu-button" type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen(open => !open)}><span/><span/><span/></button>
      <nav id="landing-navigation" className={`landing-navigation${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation" onKeyDown={handleMenuKeyDown}><ThemeToggle theme={theme} onToggle={toggleTheme} className="landing-theme-toggle"/><a className="landing-signin" href="/login" onClick={e => { e.preventDefault(); go('/login'); }}>Sign In</a></nav>
    </div></header>

    <main>
      <section className="landing-hero" aria-labelledby="hero-title"><div className="landing-container hero-grid"><div className="hero-copy"><div className="hero-eyebrow"><span/> REAL-TIME COLLABORATION</div><h1 id="hero-title">Great ideas are better when <span>built together.</span></h1><p>CollabBoard is a shared digital whiteboard where teams can draw, brainstorm, organize ideas, and collaborate in real time from anywhere.</p><div className="hero-actions"><a className="landing-primary-cta" href="/signup" onClick={e => { e.preventDefault(); go('/signup'); }}>Get Started <span aria-hidden="true">→</span></a><a className="landing-secondary-cta" href="#features">Explore Features <span aria-hidden="true">↓</span></a></div><div className="hero-proof"><span className="proof-avatars"><i>M</i><i>J</i><i>A</i></span><span>A clearer space to think, together.</span></div></div><div className="hero-visual"><div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/><ProductPreview/><div className="hero-caption"><span className="caption-dot"/> One canvas. Your whole team.</div></div></div><div className="hero-bottom-rule"/></section>

      <section className="landing-about landing-container" id="about"><div className="section-kicker">ABOUT COLLABBOARD</div><div className="about-grid"><h2>A shared space for every great idea.</h2><div className="about-copy"><p>Bring brainstorming, visual planning, and team thinking into one flexible workspace. CollabBoard gives everyone a place to add their perspective and move an idea forward.</p><div className="about-points"><span><b>01</b> Work together from anywhere</span><span><b>02</b> Make abstract ideas visible</span><span><b>03</b> Keep plans clear and organized</span></div></div></div></section>

      <section className="landing-features" id="features"><div className="landing-container"><div className="section-heading"><div className="section-kicker">MADE FOR THE WAY TEAMS THINK</div><h2>Everything you need to get ideas moving.</h2><p>From the first sketch to a plan everyone understands.</p></div><div className="feature-grid">{features.map((feature,index)=><article className="feature-item" key={feature.title}><div className="feature-icon"><FeatureIcon name={feature.icon}/></div><span className="feature-index">0{index+1}</span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div></div></section>

      <section className="landing-how landing-container" id="how-it-works"><div className="section-heading"><div className="section-kicker">A SIMPLE WAY TO START</div><h2>From blank page to shared progress.</h2></div><div className="steps-grid"><article className="step-item"><span className="step-number">01</span><div className="step-line"/><h3>Create your account</h3><p>Sign up or sign in to open your CollabBoard workspace.</p></article><article className="step-item"><span className="step-number">02</span><div className="step-line"/><h3>Open a room</h3><p>Create a new board or join a teammate with a room ID or invitation.</p></article><article className="step-item"><span className="step-number">03</span><div className="step-line"/><h3>Build the idea together</h3><p>Sketch, organize, and talk through the work on one shared canvas.</p></article></div></section>

      <section className="landing-value" id="workspace"><div className="landing-container"><div className="section-kicker">DESIGNED FOR CONTINUITY</div><div className="landing-value-row"><h2>Pick up where your team left off.</h2><div><p>Boards save as you work and remain available to authorized room members. Return to the same canvas, diagrams, tasks, and room chat.</p><div className="landing-value-points"><span><b>01</b> Persistent rooms</span><span><b>02</b> Live collaboration</span><span><b>03</b> Member-managed access</span></div></div></div></div></section>
    </main>

    <footer className="landing-footer"><div className="landing-container footer-bottom"><span>© {new Date().getFullYear()} CollabBoard</span></div></footer>
  </div>;
}
