import { useCallback, useState } from 'react';
export function useBoard(initial=[]) {
 const [elements,setElements]=useState(initial), [past,setPast]=useState([]), [future,setFuture]=useState([]);
 const update=useCallback((next)=>{setElements(current=>{const value=typeof next==='function'?next(current):next;setPast(p=>[...p,current].slice(-80));setFuture([]);return value;});},[]);
 const undo=()=>{setPast(p=>{if(!p.length)return p;const previous=p[p.length-1];setElements(current=>{setFuture(f=>[current,...f].slice(0,80));return previous;});return p.slice(0,-1);});};
 const redo=()=>{setFuture(f=>{if(!f.length)return f;const next=f[0];setElements(current=>{setPast(p=>[...p,current].slice(-80));return next;});return f.slice(1);});};
 const replace=(value)=>{setElements(value||[]);setPast([]);setFuture([]);};
 return {elements,setElements: update,replace,undo,redo,canUndo:past.length>0,canRedo:future.length>0};
}
