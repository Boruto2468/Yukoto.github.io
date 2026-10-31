import {useEffect,useRef,type ReactNode} from 'react';
import {X} from 'lucide-react';

export function YukotoMobileNavigation({onClose,children}:{onClose:()=>void;children:ReactNode}){
 const panel=useRef<HTMLElement>(null);
 useEffect(()=>{
  const media=window.matchMedia('(max-width: 1120px)');
  if(!media.matches){onClose();return;}
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const focusable=()=>Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')||[]);
  focusable()[0]?.focus();
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose();}
   if(event.key==='Tab'){
    const controls=focusable(),first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
   }
  };
  const onResize=()=>{if(!media.matches)onClose();};
  document.addEventListener('keydown',onKeyDown);
  media.addEventListener('change',onResize);
  return()=>{
   document.body.style.overflow=previousOverflow;
   document.removeEventListener('keydown',onKeyDown);
   media.removeEventListener('change',onResize);
   document.getElementById('chinese-menu-toggle')?.focus();
  };
 },[onClose]);
 return <div className="cn-mobile-navigation" role="dialog" aria-modal="true" aria-label="Main navigation">
  <button className="cn-nav-backdrop" type="button" onClick={onClose} aria-label="Close navigation" tabIndex={-1}/>
  <nav ref={panel} id="chinese-mobile-sidebar" className="cn-mobile-sidebar" aria-label="Main navigation">
   <div className="cn-sidebar-heading"><span>Navigation</span><button className="icon-button" type="button" onClick={onClose} aria-label="Close navigation"><X size={20}/></button></div>
   {children}
  </nav>
 </div>;
}
