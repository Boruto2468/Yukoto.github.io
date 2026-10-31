import {readFileSync,writeFileSync,existsSync} from 'node:fs';
function env(path){const o={};if(!existsSync(path))return o;for(const l of readFileSync(path,'utf8').split(/\r?\n/)){const m=l.match(/^\s*(VITE_[A-Z0-9_]+)=(.*)$/);if(m)o[m[1]]=m[2].trim().replace(/^['"]|['"]$/g,'')}return o}
const v={...env('.env'),...env('.env.local'),...process.env};
// Only PUBLIC configuration is emitted. Do not add Worker or Paystack secrets.
const publicConfig={apiUrl:v.VITE_YUKOTO_API_URL||'',firebaseKey:v.VITE_FIREBASE_API_KEY||''};
writeFileSync('public/student-config.js','window.YUKOTO_PUBLIC_CONFIG='+JSON.stringify(publicConfig).replace(/</g,'\\u003c')+';\n');
