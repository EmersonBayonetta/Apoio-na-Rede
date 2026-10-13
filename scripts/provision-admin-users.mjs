// Run locally with a server key and ADMIN_INITIAL_PASSWORD in an ignored .env.local.
// Uses authenticated Supabase Admin APIs; never deploy this script as an endpoint.
import fs from 'node:fs';
import {createClient} from '@supabase/supabase-js';
const local=Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(line=>/^[A-Z][A-Z0-9_]*=/.test(line)).map(line=>{const index=line.indexOf('=');return [line.slice(0,index),line.slice(index+1).trim().replace(/^['"]|['"]$/g,'')];}));
const env={...local,...process.env};
const url=env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const secret=env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const password=env.ADMIN_INITIAL_PASSWORD;
const emails=[...new Set(process.argv.slice(2).map(email=>email.trim().toLowerCase()))];
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url || '') || !secret || !password || password.length<8 || !emails.length || emails.some(email=>!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))){
 console.error('Configure SUPABASE_SECRET_KEY e ADMIN_INITIAL_PASSWORD no .env.local e informe os e-mails como argumentos. Nenhuma conta foi alterada.');process.exit(1);
}
const client=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const existing=new Map();
for(let page=1;;page++){
 const {data,error}=await client.auth.admin.listUsers({page,perPage:1000});
 if(error)throw Error('Não foi possível consultar as contas pelo Supabase Admin.');
 for(const user of data.users)if(user.email)existing.set(user.email.toLowerCase(),user.id);
 if(data.users.length<1000)break;
}
for(const email of emails){
 const id=existing.get(email);
 const {error}=id?await client.auth.admin.updateUserById(id,{password,email_confirm:true}):await client.auth.admin.createUser({email,password,email_confirm:true});
 if(error){console.error(`${email}: não foi possível configurar a conta (${error.code || 'erro do provedor'}).`);process.exitCode=1;}
 else console.log(`${email}: conta configurada para login por senha.`);
}
