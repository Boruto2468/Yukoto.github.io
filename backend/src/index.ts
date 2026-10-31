import {buildYukotoMandarinInstruction,normalizeYukotoWords,type YukotoTrack} from './instruction';
import {verifyFirebase,validProgress,hasPlus,signedPaystack} from './security.mjs';
interface Env{DB:any;ALLOWED_ORIGINS:string;FIREBASE_PROJECT_ID:string;ADMIN_EMAILS?:string;GEMINI_API_KEY?:string;PAYSTACK_SECRET_KEY?:string;PAYSTACK_MONTHLY_PLAN?:string;PAYSTACK_YEARLY_PLAN?:string}
const reply=(value:any,status=200,origin='')=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json','cache-control':'no-store','vary':'Origin',...(origin?{'access-control-allow-origin':origin,'access-control-allow-methods':'GET, POST, PUT, DELETE, OPTIONS','access-control-allow-headers':'authorization,content-type'}:{})}});
async function jsonBody(req:Request,max=400_000){if(Number(req.headers.get('content-length')||0)>max)throw Error('Too large');const raw=await req.text();if(raw.length>max)throw Error('Too large');return JSON.parse(raw)}
async function paystack(env:Env,url:string,init?:RequestInit){const r=await fetch('https://api.paystack.co'+url,{...init,headers:{Authorization:`Bearer ${env.PAYSTACK_SECRET_KEY}`,'Content-Type':'application/json',...init?.headers}});const x=await r.json() as any;if(!r.ok||!x.status)throw Error('Paystack request failed');return x.data}
function future(plan:string){const d=new Date();if(plan==='yearly')d.setUTCFullYear(d.getUTCFullYear()+1);else d.setUTCMonth(d.getUTCMonth()+1);return d.toISOString()}
async function grant(env:Env,uid:string,plan:string,code:string|null){const until=future(plan);await env.DB.prepare(`INSERT INTO subscriptions(user_id,status,plan,paid_until,subscription_code) VALUES (?,'active',?,?,?) ON CONFLICT(user_id) DO UPDATE SET status='active',plan=excluded.plan,paid_until=CASE WHEN subscriptions.paid_until>excluded.paid_until THEN subscriptions.paid_until ELSE excluded.paid_until END,subscription_code=COALESCE(excluded.subscription_code,subscriptions.subscription_code)`).bind(uid,plan,until,code).run()}
async function paymentWebhook(req:Request,env:Env){if(!env.PAYSTACK_SECRET_KEY)return reply({error:'Billing unavailable'},503);const raw=await req.text();if(raw.length>100_000)return reply({error:'Too large'},413);if(!await signedPaystack(raw,req.headers.get('x-paystack-signature'),env.PAYSTACK_SECRET_KEY))return reply({error:'Bad signature'},401);
 const event=JSON.parse(raw) as any, data=event.data||{};
 if(event.event==='charge.success'){
  const reference=String(data.reference||'');const tx=await paystack(env,'/transaction/verify/'+encodeURIComponent(reference));if(tx.status==='success'&&tx.reference===reference){
   const intent=await env.DB.prepare('SELECT user_id,plan,status FROM checkout_intents WHERE reference=?').bind(reference).first();
   if(intent&&intent.status==='pending'){
    const planCode=intent.plan==='yearly'?env.PAYSTACK_YEARLY_PLAN:env.PAYSTACK_MONTHLY_PLAN;
    const detail=await paystack(env,'/plan/'+encodeURIComponent(planCode||''));
    if(planCode&&Number(tx.amount)===Number(detail.amount)&&tx.currency===detail.currency){
     const result=await env.DB.prepare("UPDATE checkout_intents SET status='paid' WHERE reference=? AND status='pending'").bind(reference).run();
     if(result.meta?.changes)await grant(env,intent.user_id,intent.plan,String(data.subscription?.subscription_code||'')||null);
    }
   }else if(!intent&&data.subscription?.subscription_code){
    const code=String(data.subscription.subscription_code);const sub=await env.DB.prepare('SELECT user_id,plan FROM subscriptions WHERE subscription_code=?').bind(code).first();
    if(sub){const detail=await paystack(env,'/plan/'+encodeURIComponent(sub.plan==='yearly'?env.PAYSTACK_YEARLY_PLAN||'':env.PAYSTACK_MONTHLY_PLAN||''));if(Number(tx.amount)===Number(detail.amount)&&tx.currency===detail.currency)await grant(env,sub.user_id,sub.plan,code);}
   }
  }
 }
 if(event.event==='subscription.create'){
  const code=String(data.subscription_code||''),email=String(data.customer?.email||''),planCode=String(data.plan?.plan_code||'');const plan=planCode===env.PAYSTACK_MONTHLY_PLAN?'monthly':planCode===env.PAYSTACK_YEARLY_PLAN?'yearly':null;
  if(code&&plan&&email){const paid=await env.DB.prepare(`SELECT s.user_id FROM subscriptions s JOIN users u ON u.id=s.user_id WHERE u.email=? AND s.plan=? AND s.status='active' AND s.subscription_code IS NULL ORDER BY s.paid_until DESC LIMIT 1`).bind(email,plan).first();if(paid)await env.DB.prepare('UPDATE subscriptions SET subscription_code=? WHERE user_id=? AND subscription_code IS NULL').bind(code,paid.user_id).run()}
 }
 if(event.event==='subscription.disable'&&data.subscription_code){await env.DB.prepare("UPDATE subscriptions SET status='nonrenewing' WHERE subscription_code=?").bind(String(data.subscription_code)).run()}
 return reply({received:true});}
export default {async fetch(req:Request,env:Env):Promise<Response>{
 const url=new URL(req.url),path=url.pathname,origin=req.headers.get('origin')||'';
 const allowedOrigins=env.ALLOWED_ORIGINS.split(',').map(s=>s.trim());
 // Opening Wrangler's local URL should take the developer to the Vite app.
 if(req.method==='GET'&&path==='/'&&!origin&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&allowedOrigins.includes('http://localhost:5173')){
  return Response.redirect('http://localhost:5173/',302);
 }
 if(path==='/api/billing/webhook'&&req.method==='POST'){try{return await paymentWebhook(req,env)}catch(err){console.error(err);return reply({error:'Webhook failed'},500)}}
 if(!origin||!allowedOrigins.includes(origin))return reply({error:'Origin not allowed'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':origin,'access-control-allow-methods':'GET, POST, PUT, DELETE, OPTIONS','access-control-allow-headers':'authorization,content-type','vary':'Origin'}});
 if(path==='/api/health')return reply({ok:true},200,origin);
 let account:any;try{const jwt=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];account=await verifyFirebase(jwt,env.FIREBASE_PROJECT_ID)}catch{return reply({error:'Please sign in with Google.'},401,origin)}
 try{
  await env.DB.prepare(`INSERT INTO users(id,email,name) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name,last_seen=datetime('now')`).bind(account.id,account.email,account.name).run();
  const subscription=await env.DB.prepare('SELECT status,plan,paid_until FROM subscriptions WHERE user_id=?').bind(account.id).first();const plus=hasPlus(subscription);const plan=plus?'plus':'free';
  const admin=Boolean(account.email)&&env.ADMIN_EMAILS?.split(',').map(e=>e.trim().toLowerCase()).includes(account.email.toLowerCase());
  if(path==='/api/me'&&req.method==='GET')return reply({account,plan,admin,checkoutEnabled:Boolean(env.PAYSTACK_SECRET_KEY&&env.PAYSTACK_MONTHLY_PLAN)},200,origin);
  if(path==='/api/progress'&&req.method==='GET'){const v=await env.DB.prepare('SELECT revision,data FROM progress WHERE user_id=?').bind(account.id).first();return reply({revision:v?.revision||0,data:v?JSON.parse(v.data):null},200,origin)}
  if(path==='/api/progress'&&req.method==='PUT'){
   const body=await jsonBody(req);if(!Number.isInteger(body.revision)||body.revision<0||!validProgress(body.data))return reply({error:'Invalid progress'},400,origin);const value=JSON.stringify(body.data);if(value.length>380_000)return reply({error:'Progress too large'},413,origin);
   const result=body.revision===0?await env.DB.prepare('INSERT INTO progress(user_id,revision,data) VALUES(?,1,?) ON CONFLICT(user_id) DO NOTHING').bind(account.id,value).run():await env.DB.prepare('UPDATE progress SET data=?,revision=revision+1,updated_at=datetime(\'now\') WHERE user_id=? AND revision=?').bind(value,account.id,body.revision).run();
   if(!result.meta?.changes)return reply({error:'Progress updated on another device'},409,origin);return reply({revision:body.revision+1},200,origin);
  }
  if(path==='/api/events'&&req.method==='POST'){const e=await jsonBody(req,1024);if(!['lesson_completed','quiz_submitted','ai_session_started'].includes(e.type)||!['zh','ja',null,undefined].includes(e.language))return reply({error:'Bad event'},400,origin);await env.DB.prepare('INSERT INTO activity(id,user_id,type,language) VALUES(?,?,?,?)').bind(crypto.randomUUID(),account.id,e.type,e.language||null).run();return reply({ok:true},201,origin)}
  if((path==='/'||path==='/api/ai/token')&&req.method==='POST'){
   if(!env.GEMINI_API_KEY)return reply({error:'Gemini API key not configured'},503,origin);
   const e=await jsonBody(req,2048);const track=(typeof e.track==='string'&&/^(starter|hsk(20|30)-[1-6])$/.test(e.track)?e.track:'starter') as YukotoTrack;
   const dailyLimit=plus?20:2,seconds=plus?480:180,day=new Date().toISOString().slice(0,10);
   const count=await env.DB.prepare('INSERT INTO ai_usage(user_id,day,sessions) VALUES(?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET sessions=sessions+1 WHERE sessions<?').bind(account.id,day,dailyLimit).run();if(!count.meta?.changes)return reply({error:'Daily AI limit reached. Come back tomorrow or upgrade.'},429,origin);
   const expireTime=new Date(Date.now()+(seconds+15)*1000).toISOString();
   try{const r=await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens',{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify({uses:1,expireTime,newSessionExpireTime:new Date(Date.now()+60_000).toISOString(),liveConnectConstraints:{model:'models/gemini-3.8-live',config:{responseModalities:['AUDIO'],systemInstruction:{parts:[{text:buildYukotoMandarinInstruction(track,normalizeYukotoWords(e.curriculumWords))}]},inputAudioTranscription:{},outputAudioTranscription:{},speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:'Kore'}}}}}})});
    const data=await r.json() as any;if(!r.ok||!data.name)throw Error('Gemini unavailable');await env.DB.prepare('INSERT INTO activity(id,user_id,type,language) VALUES(?,?,?,?)').bind(crypto.randomUUID(),account.id,'ai_session_started','zh').run();return reply({token:data.name,maxSessionSeconds:seconds,expiresAt:data.expireTime||expireTime},200,origin);
   }catch{await env.DB.prepare('UPDATE ai_usage SET sessions=MAX(0,sessions-1) WHERE user_id=? AND day=?').bind(account.id,day).run();return reply({error:'Gemini temporary token unavailable'},502,origin)}
  }
  if(path==='/api/billing/checkout'&&req.method==='POST'){
   if(!env.PAYSTACK_SECRET_KEY)return reply({error:'Checkout not configured'},503,origin);if(!account.email)return reply({error:'Google verified email required'},400,origin);
   const body=await jsonBody(req,512),interval=body.interval==='yearly'?'yearly':'monthly',planCode=interval==='yearly'?env.PAYSTACK_YEARLY_PLAN:env.PAYSTACK_MONTHLY_PLAN;
   if(!planCode)return reply({error:'Subscription plan not configured'},503,origin);
   const reference='yukoto_'+crypto.randomUUID().replace(/-/g,'');await env.DB.prepare('INSERT INTO checkout_intents(reference,user_id,plan) VALUES(?,?,?)').bind(reference,account.id,interval).run();
   const data=await paystack(env,'/transaction/initialize',{method:'POST',body:JSON.stringify({email:account.email,reference,plan:planCode,callback_url:origin+'/#account'})});return reply({authorization_url:data.authorization_url},200,origin);
  }
  if(path==='/api/admin/stats'&&req.method==='GET'){
   if(!admin)return reply({error:'Not authorised'},403,origin);
   const single=async sql=>(await env.DB.prepare(sql).first())?.n||0;
   const stats={users:await single('SELECT COUNT(*) n FROM users'),subscribers:await single("SELECT COUNT(*) n FROM subscriptions WHERE status IN ('active','nonrenewing') AND datetime(paid_until)>datetime('now')"),activeLearners:await single("SELECT COUNT(DISTINCT user_id) n FROM activity WHERE created_at>=datetime('now','-30 days')"),lessonsCompleted:await single("SELECT COUNT(*) n FROM activity WHERE type='lesson_completed' AND created_at>=datetime('now','-30 days')"),aiSessions:await single("SELECT COALESCE(SUM(sessions),0) n FROM ai_usage WHERE day>=date('now','-30 days')")};
   const daily=await env.DB.prepare("SELECT date(created_at) day,COUNT(DISTINCT user_id) learners FROM activity WHERE created_at>=datetime('now','-14 days') GROUP BY date(created_at) ORDER BY day").all();return reply({...stats,daily:daily.results},200,origin)
  }
  if(path==='/api/me'&&req.method==='DELETE'){
   for(const table of ['progress','activity','ai_usage','checkout_intents','subscriptions','users'])await env.DB.prepare(`DELETE FROM ${table} WHERE ${table==='users'?'id':'user_id'}=?`).bind(account.id).run();return reply({deleted:true},200,origin);
  }
  return reply({error:'Not found'},404,origin);
 }catch(e){console.error('Yukoto API',e);return reply({error:e instanceof SyntaxError?'Invalid JSON':'Request failed. Check server setup.'},e instanceof SyntaxError?400:500,origin)}
 }};
