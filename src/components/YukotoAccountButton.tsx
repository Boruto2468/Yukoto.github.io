import {useEffect,useState} from 'react';
import {UserRound} from 'lucide-react';
import {getAccount,observeAccount} from '../account/auth';

export function YukotoAccountButton({active,onClick}:{active:boolean;onClick:()=>void}){
 const [account,setAccount]=useState(getAccount);
 const [failedPhoto,setFailedPhoto]=useState<string|null>(null);
 useEffect(()=>{const unsubscribe=observeAccount(setAccount);return()=>{unsubscribe()};},[]);
 const name=account?.name||account?.email||'your account';
 const label=account?`Signed in as ${name}. Open account`:'Sign in with Google';
 const photo=account?.photo&&account.photo!==failedPhoto?account.photo:null;
 return <button type="button" className={`icon-button account-button${account?' signed-in':''}${active?' active':''}`} onClick={onClick} aria-label={label} title={label} aria-current={active?'page':undefined}>
  {photo?<img src={photo} alt="" referrerPolicy="no-referrer" onError={()=>setFailedPhoto(photo)}/>:account?<span className="account-initial" aria-hidden="true">{Array.from(name.trim())[0]?.toLocaleUpperCase()||'U'}</span>:<UserRound size={20} aria-hidden="true"/>}
 </button>;
}
