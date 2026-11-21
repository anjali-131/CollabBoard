import React,{useEffect,useState} from 'react';
import {AuthProvider,useAuth} from './auth/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';import Dashboard from './pages/Dashboard.jsx';import BoardPage from './pages/BoardPage.jsx';import InvitePage from './pages/InvitePage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PasswordRecoveryPage from './pages/PasswordRecoveryPage.jsx';
function Shell(){const auth=useAuth();const [route,setRoute]=useState(location.pathname+location.search);const [theme,setTheme]=useState(()=>{try{return localStorage.getItem('collabboard-theme')==='dark'?'dark':'light';}catch{return 'light';}});const toggleTheme=()=>setTheme(value=>value==='dark'?'light':'dark');const navigate=next=>{history.pushState({},'',next);setRoute(next);};useEffect(()=>{const pop=()=>setRoute(location.pathname+location.search);addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop);},[]);useEffect(()=>{const expire=()=>{auth.logout();navigate(`/login?expired=1&next=${encodeURIComponent(route)}`);};addEventListener('auth:expired',expire);return()=>removeEventListener('auth:expired',expire);},[route,auth.logout]);useEffect(()=>{document.documentElement.dataset.theme=theme;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#111827':'#f8fafc');try{localStorage.setItem('collabboard-theme',theme);}catch{}},[theme]);const path=route.split('?')[0];const params=new URLSearchParams(route.split('?')[1]||'');
 useEffect(()=>{if(auth.loading)return;if(path==='/'&&params.get('room')){const dest=`/board/${encodeURIComponent(params.get('room'))}`;navigate(auth.user?dest:`/login?next=${encodeURIComponent(dest)}`);return;}if(!auth.user&&!['/','/login','/signup','/forgot-password','/reset-password'].includes(path)){navigate(`/login?next=${encodeURIComponent(route)}`);return;}if(auth.user&&['/login','/signup'].includes(path))navigate('/dashboard');},[route,auth.loading,auth.user]);
 if(auth.loading&&!(path==='/'&&!params.get('room')))return <div className="auth-loading">✳　Loading your workspace…</div>;
 if(path==='/')return <LandingPage navigate={navigate} theme={theme} toggleTheme={toggleTheme}/>;
 if(path==='/login'||path==='/signup')return <AuthPage key={path} mode={path.slice(1)} navigate={navigate} theme={theme} toggleTheme={toggleTheme}/>;
 if(path==='/forgot-password'||path==='/reset-password')return <PasswordRecoveryPage key={path} mode={path==='/reset-password'?'reset':'forgot'} navigate={navigate} theme={theme} toggleTheme={toggleTheme}/>;
 if(path==='/invite')return <InvitePage token={params.get('token')||''} navigate={navigate} theme={theme} toggleTheme={toggleTheme}/>;
 const match=path.match(/^\/board\/([\w-]+)$/);if(match&&auth.user)return <BoardPage key={match[1]} boardId={decodeURIComponent(match[1])} navigate={navigate} theme={theme} toggleTheme={toggleTheme}/>;
 if(auth.user)return <Dashboard user={auth.user} navigate={navigate} theme={theme} toggleTheme={toggleTheme} logout={async()=>{await auth.logout();navigate('/login');}}/>;
 return <AuthPage mode="login" navigate={navigate} theme={theme} toggleTheme={toggleTheme}/>;
}
export default function App(){return <AuthProvider><Shell/></AuthProvider>;}
