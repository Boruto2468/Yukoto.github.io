import ids from './wordIds.json';
// The guided studio owns the review algorithm. Other site modules only append evidence
// to the same per-language local progress record. No word is marked mastered on exposure.
const KEY='yukoto.hybrid.v1';
type WordEvidence={seen?:number;attempts?:number;correct?:number;practice?:number;ease?:number;interval?:number;due?:string;native?:string;meaning?:string};
type Progress={completed:string[];words:Record<string,WordEvidence>;skills:Record<string,number>;streak:number;lastActive:string|null};
const normal=():Progress=>({completed:[],words:{},skills:{},streak:0,lastActive:null});
export function recordGuidedRecall(native:string,correct:boolean,skill:'recall'|'writing'='recall',meaning=''){
 if(!native.trim())return;
 try{
  const saved=JSON.parse(localStorage.getItem(KEY)||'null') as null|{version:number;progress:{ja:Progress;zh:Progress};settings?:object};
  const data=saved?.version===1&&saved?.progress?.ja&&saved?.progress?.zh?saved:{version:1,settings:{audio:true,roman:true,language:'zh',conversationUrl:'../#conversation'},progress:{ja:normal(),zh:normal()}};
  const p=data.progress.zh;const id=(ids.zh as Record<string,string>)[native]||`zh-external:${native}`;
  const old=p.words[id]||{};const interval=correct?(old.interval===0||!old.interval?1:old.interval===1?3:Math.max(1,Math.round(old.interval*(old.ease||2.5)))):1;
  const date=new Date();date.setDate(date.getDate()+interval);
  p.words[id]={...old,native,meaning:meaning||old.meaning||'',attempts:(old.attempts||0)+1,correct:(old.correct||0)+(correct?1:0),interval,ease:Math.max(1.3,(old.ease||2.5)+(correct?.1:-.2)),due:date.toISOString()};
  p.skills[skill]=(p.skills[skill]||0)+1;
  const day=new Date().toLocaleDateString('en-CA');
  if(p.lastActive!==day){const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);const yd=yesterday.toLocaleDateString('en-CA');p.streak=p.lastActive===yd?p.streak+1:1;p.lastActive=day}
  localStorage.setItem(KEY,JSON.stringify(data));window.dispatchEvent(new Event('yukoto:progress-updated')); 
 }catch{/* Offline learning remains usable if browser storage is blocked. */}
}
