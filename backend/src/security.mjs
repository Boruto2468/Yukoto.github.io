const jwksUrl='https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let keys=null,expires=0;
const decode=x=>{const b=atob(x.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-x.length%4)%4));return Uint8Array.from(b,c=>c.charCodeAt(0))};
export async function verifyFirebase(token,project,fetcher=fetch){
 if(!project||project.startsWith('REPLACE_')||!token||token.length>12000)throw Error('Authentication not configured');
 const parts=token.split('.');if(parts.length!==3)throw Error('Invalid token');
 let head,claim;try{head=JSON.parse(new TextDecoder().decode(decode(parts[0])));claim=JSON.parse(new TextDecoder().decode(decode(parts[1])))}catch{throw Error('Invalid JWT')}
 const now=Math.floor(Date.now()/1000);
 if(head.alg!=='RS256'||!head.kid||claim.aud!==project||claim.iss!==`https://securetoken.google.com/${project}`||!claim.sub||typeof claim.sub!=='string'||claim.sub.length>128||!(claim.exp>now)||!(claim.iat<=now+60)||!(claim.auth_time<=now+60))throw Error('Invalid claims');
 if(!keys||Date.now()>expires){const res=await fetcher(jwksUrl);if(!res.ok)throw Error('Signing keys unavailable');keys=(await res.json()).keys;expires=Date.now()+Math.min(3600,Number((res.headers.get('cache-control')||'').match(/max-age=(\d+)/)?.[1]||300))*1000}
 const jwk=keys.find(x=>x.kid===head.kid&&x.kty==='RSA');if(!jwk)throw Error('Unknown signer');
 const k=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',k,decode(parts[2]),new TextEncoder().encode(`${parts[0]}.${parts[1]}`)))throw Error('Invalid signature');
 return {id:claim.sub,email:claim.email_verified===true?String(claim.email||''):'',name:String(claim.name||'Learner').slice(0,100)};
}
export function hasPlus(sub,now=Date.now()){return ['active','nonrenewing'].includes(sub?.status)&&Date.parse(sub?.paid_until||'')>now}
export function validProgress(x){if(x?.version!==1||!x.progress?.ja||!x.progress?.zh)return false;for(const lang of ['ja','zh']){const p=x.progress[lang];if(!Array.isArray(p.completed)||p.completed.length>3000||!p.completed.every(v=>typeof v==='string'&&v.length<200)||typeof p.words!=='object'||!p.words||Object.keys(p.words).length>20000||!p.skills||typeof p.skills!=='object')return false;}return true}
export async function signedPaystack(raw,signature,secret){if(!signature||!secret)return false;const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-512'},false,['sign']);const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(raw)));const actual=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');if(actual.length!==signature.length)return false;let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^signature.charCodeAt(i);return diff===0}
