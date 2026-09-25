/* BANKSTR · the RuneScape grail bank */
import * as THREE from './three.module.min.js';

/* ============ CONFIG (edit at launch) ============ */
const CONFIG = {
  CA: '',                 // contract address
  X_URL: '',              // e.g. https://x.com/yourhandle
  BUY_URL: '',            // defaults to pump.fun/coin/<CA>
  WALLET: '',             // bank wallet (Solana)
  SAVED_GP: 0,            // GP saved toward the current grail
  BOND_USD: 9.65,         // store price per Bond (20-pack)
  FALLBACK_BOND_GP: 12182995
};
/* Deposit log: { date:'2026-10-01', entry:'Tumeken\'s shadow banked', amount:'788M GP', itemId:27277, proof:'https://…' } */
const LOG = [];

const CAP = 2147483647, BOND_ID = 13190;
const GRAILS = [
  {id:27277,name:"Tumeken's shadow",short:'Shadow',icon:'grail-shadow.png',wiki:"Tumeken%27s_shadow",snap:[787555000,788000000]},
  {id:22486,name:'Scythe of Vitur',short:'Scythe',icon:'grail-scythe.png',wiki:'Scythe_of_vitur',snap:[1188585000,1195770219]},
  {id:20997,name:'Twisted bow',short:'Twisted bow',icon:'grail-bow.png',wiki:'Twisted_bow',snap:[1388000000,1389847927]}
];

/* ============ helpers ============ */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmtGp(n){if(n==null||isNaN(n))return'—';const a=Math.abs(n);if(a>=1e9)return(n/1e9).toFixed(2).replace(/\.?0+$/,'')+'B';if(a>=1e6)return(n/1e6).toFixed(a>=1e8?0:1).replace(/\.0$/,'')+'M';if(a>=1e4)return Math.round(n/1e3)+'K';return Math.round(n).toLocaleString('en-US')}
const gpc=n=>n<1e5?'gp-y':n<1e7?'gp-w':'gp-g';
const fmtUsd=n=>n>=1000?'$'+Math.round(n).toLocaleString('en-US'):'$'+n.toFixed(n<10?2:0);
function ago(ts){if(!ts)return'—';const s=Math.max(0,Date.now()/1000-ts);if(s<90)return Math.round(s)+'s ago';if(s<5400)return Math.round(s/60)+'m ago';if(s<172800)return Math.round(s/3600)+'h ago';return Math.round(s/86400)+'d ago'}
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
let toastT;function toast(t,m){const e=$('#toast');e.innerHTML=`<b>${esc(t)}</b>${m?esc(m):''}`;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),2600)}
async function copy(t){try{await navigator.clipboard.writeText(t);return true}catch(e){const a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch(_){}a.remove();return ok}}
const S={prices:{},bondGp:CONFIG.FALLBACK_BOND_GP,live:false,updated:0,series:{},owned:new Set(LOG.filter(e=>e.itemId).map(e=>e.itemId))};
const priceOf=g=>{const p=S.prices[g.id];if(p&&p.high&&p.high<CAP)return p;return{high:g.snap[1],low:g.snap[0],snap:true}};
const usdPerGp=()=>CONFIG.BOND_USD/S.bondGp;
const queue=()=>[...GRAILS].sort((a,b)=>priceOf(a).high-priceOf(b).high);
const current=()=>queue().find(g=>!S.owned.has(g.id));

/* ============ links ============ */
function setupLinks(){const buy=CONFIG.BUY_URL||(CONFIG.CA?`https://pump.fun/coin/${CONFIG.CA}`:'');
  $$('[data-buy]').forEach(a=>{if(buy)a.href=buy;else{a.removeAttribute('target');a.addEventListener('click',e=>{e.preventDefault();toast('Not live yet','Buying opens at launch.')})}});
  $$('[data-x]').forEach(a=>{if(CONFIG.X_URL)a.href=CONFIG.X_URL;else{a.removeAttribute('target');a.addEventListener('click',e=>{e.preventDefault();toast('X coming soon','Our link goes live at launch.')})}});
  const links=$('#links');$('#burger').addEventListener('click',()=>links.classList.toggle('open'));$$('#links a').forEach(a=>a.addEventListener('click',()=>links.classList.remove('open')))}

/* ============ THE HALL (three.js) ============ */
function cobbleCanvas(W,H,seed,cell=13,tone=[58,50,42]){const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');const r=rng(seed);const pts=[];
  for(let gy=-1;gy<=H/cell+1;gy++)for(let gx=-1;gx<=W/cell+1;gx++){pts.push({x:gx*cell+(gy%2)*cell*.5+(r()-.5)*cell*.7,y:gy*cell+(r()-.5)*cell*.6,t:(r()-.5)*22})}
  const img=g.createImageData(W,H),a=img.data;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let d1=1e9,d2=1e9,b=null;for(const p of pts){const dx=x-p.x,dy=y-p.y;if(dx>cell*2||dx<-cell*2||dy>cell*2||dy<-cell*2)continue;const d=dx*dx+dy*dy;if(d<d1){d2=d1;d1=d;b=p}else if(d<d2)d2=d}
    const e=Math.sqrt(d2)-Math.sqrt(d1),i=(y*W+x)*4;if(e<1.3){a[i]=18;a[i+1]=14;a[i+2]=11;a[i+3]=255;continue}
    const dx=(x-b.x)/cell,dy=(y-b.y)/cell;let l=1-(dx+dy)*.55;if(e<2.4)l*=.72;const n=(r()-.5)*14,k=Math.max(.4,Math.min(1.5,l));
    a[i]=(tone[0]+b.t+n)*k;a[i+1]=(tone[1]+b.t+n)*k;a[i+2]=(tone[2]+b.t*.8+n)*k;a[i+3]=255}
  g.putImageData(img,0,0);return c}
const M=c=>new THREE.MeshLambertMaterial({color:c,flatShading:true});
const GOLDM=()=>new THREE.MeshLambertMaterial({color:0xF0BE3A,flatShading:true,emissive:0x4a2c00});
const seg=(rt,rb,h,m,sx=1,sz=1)=>{const g=new THREE.CylinderGeometry(rt,rb,h,4,1);g.rotateY(Math.PI/4);const me=new THREE.Mesh(g,m);me.scale.set(sx,1,sz);return me};
const box=(x,y,z,m)=>new THREE.Mesh(new THREE.BoxGeometry(x,y,z),m);
const limb=(par,len,rt,rb,m,px,py,pz,rx=0,rz=0)=>{const p=new THREE.Group();p.position.set(px,py,pz);p.rotation.set(rx,0,rz);const s=seg(rt,rb,len,m);s.position.y=-len/2;p.add(s);par.add(p);return p};
function person(o){const G=new THREE.Group();const SK=M(o.skin||0xD9A57E),TOP=M(o.top),TOP2=M(o.top2||o.top),LEG=M(o.leg||o.top),BOOT=M(0x1c1410),HAIR=M(o.hair||0x3a2414);
  const body=new THREE.Group();G.add(body);
  const torso=seg(.62,.46,1.15,TOP,1,.62);torso.position.y=2.28;body.add(torso);
  if(o.suit){const l=box(.36,.62,.05,M(0xE8E4DA));l.position.set(0,2.52,.3);body.add(l);const t=box(.1,.5,.04,M(o.tie||0xB8232A));t.position.set(0,2.46,.34);body.add(t);
    for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.045,0),GOLDM());const k=i/8;b.position.set(-.3+k*.6,2.0-Math.sin(k*Math.PI)*.12,.33);body.add(b)}}
  if(o.belt){const b=box(.98,.12,.64,M(o.belt));b.position.set(0,1.78,0);body.add(b)}
  if(o.robe){const r=new THREE.Mesh(new THREE.CylinderGeometry(.46,.78,1.7,6),TOP2);r.position.y=.9;G.add(r)}
  else{const hips=seg(.46,.44,.3,TOP2,1,.62);hips.position.y=1.6;body.add(hips);
    for(const sx of[-.2,.2]){const up=limb(G,.78,.17,.15,LEG,sx,1.55,0,sx<0?-.08:.1,0);const lo=limb(up,.78,.15,.12,LEG,0,-.78,0,sx<0?.1:-.04,0);const bt=box(.26,.16,.44,BOOT);bt.position.set(0,-.84,.08);lo.add(bt)}}
  const head=new THREE.Group();head.position.set(0,3.2,0);body.add(head);head.add(seg(.4,.34,.7,SK,1,.95));
  const nose=box(.08,.12,.1,SK);nose.position.set(0,-.02,.35);head.add(nose);
  for(const ex of[-.1,.1]){const e=box(.07,.05,.02,M(0x151010));e.position.set(ex,.08,.34);head.add(e)}
  if(o.tache){const t=box(.3,.07,.06,HAIR);t.position.set(0,-.15,.34);head.add(t)}
  if(o.beard){const bd=seg(.3,.08,.55,M(o.beard),1,.6);bd.position.set(0,-.4,.2);bd.rotation.x=Math.PI;head.add(bd)}
  const hair=box(.6,.14,.56,HAIR);hair.position.set(0,.24,-.04);head.add(hair);
  if(o.hat==='top'){const br=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.05,10),M(0x141418));br.position.y=.36;head.add(br);const cr=new THREE.Mesh(new THREE.CylinderGeometry(.33,.3,.62,10),M(0x141418));cr.position.y=.68;head.add(cr);const bd=new THREE.Mesh(new THREE.CylinderGeometry(.315,.31,.1,10),GOLDM());bd.position.y=.46;head.add(bd)}
  if(o.hat==='helm'){const h=seg(.46,.42,.8,M(0x9aa0aa));h.position.y=.04;head.add(h);const v=box(.5,.06,.1,M(0x111111));v.position.set(0,.06,.36);head.add(v);const p=new THREE.Mesh(new THREE.ConeGeometry(.08,.35,4),M(0xB8232A));p.position.y=.58;head.add(p)}
  if(o.hat==='wizard'){const br=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.05,8),M(o.hatc));br.position.y=.34;head.add(br);const c=new THREE.Mesh(new THREE.ConeGeometry(.38,1.1,8),M(o.hatc));c.position.set(0,.9,-.05);c.rotation.x=-.15;head.add(c)}
  if(o.hat==='hood'){const h=new THREE.Mesh(new THREE.ConeGeometry(.52,1.0,6),M(o.hatc));h.position.set(0,.22,-.1);head.add(h)}
  if(o.hat==='party'){const c=new THREE.Mesh(new THREE.ConeGeometry(.3,.62,8),M(o.hatc));c.position.y=.62;c.rotation.z=.12;head.add(c);const pom=new THREE.Mesh(new THREE.IcosahedronGeometry(.1,0),M(0xffffff));pom.position.set(-.05,.95,0);head.add(pom)}
  if(o.hat==='bandana'){const b=box(.66,.16,.6,M(o.hatc));b.position.y=.28;head.add(b)}
  if(o.hat==='visor'){const band=box(.78,.1,.72,M(0x1f6b3a));band.position.y=.28;head.add(band);const brim=box(.62,.04,.36,new THREE.MeshLambertMaterial({color:0x2fbf5a,transparent:true,opacity:.75,flatShading:true}));brim.position.set(0,.26,.46);brim.rotation.x=.25;head.add(brim)}
  if(o.glasses){for(const gx of[-.11,.11]){const f=new THREE.Mesh(new THREE.TorusGeometry(.07,.015,4,10),GOLDM());f.position.set(gx,.08,.36);head.add(f)}}
  if(o.vest){const v=seg(.64,.48,.9,M(o.vest),1,.64);v.position.y=2.2;body.add(v);for(let k=0;k<3;k++){const bt=new THREE.Mesh(new THREE.IcosahedronGeometry(.04,0),GOLDM());bt.position.set(0,2.45-k*.2,.34);body.add(bt)}const tie=box(.12,.36,.04,M(0x8a1a1a));tie.position.set(0,2.62,.33);body.add(tie)}
  const rA=limb(body,.62,.16,.14,TOP,-.64,2.72,0,o.ra?.[0]??.1,o.ra?.[1]??.18);const rF=limb(rA,.6,.14,.12,TOP,0,-.62,0,o.rf?.[0]??-.35,o.rf?.[1]??0);const rH=box(.18,.2,.18,SK);rH.position.y=-.66;rF.add(rH);
  const lA=limb(body,.62,.16,.14,TOP,.64,2.72,0,o.la?.[0]??.1,o.la?.[1]??-.18);const lF=limb(lA,.6,.14,.12,TOP,0,-.62,0,o.lf?.[0]??-.35,o.lf?.[1]??0);const lH=box(.18,.2,.18,SK);lH.position.y=-.66;lF.add(lH);
  let coin=null;
  const hold=(F,w)=>{if(!w)return;const g=new THREE.Group();g.position.y=-.68;F.add(g);
    if(w==='sack'){const s=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,1),M(0xA8844E));s.scale.set(1,1.12,.95);s.position.set(0,-.55,.1);g.add(s);const r=new THREE.Mesh(new THREE.TorusGeometry(.14,.035,4,10),GOLDM());r.rotation.x=Math.PI/2;g.add(r)}
    if(w==='sword'){const bl=box(.1,1.5,.04,M(0xD8DEE6));bl.position.y=.85;g.add(bl);const cg=box(.5,.08,.1,GOLDM());cg.position.y=.1;g.add(cg);g.rotation.x=-.2}
    if(w==='staff'){const st=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,3,5),M(0x6B4520));st.position.y=.4;g.add(st);const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.2,0),new THREE.MeshLambertMaterial({color:0x7a5aff,emissive:0x4a2aff,flatShading:true}));orb.position.y=1.95;g.add(orb)}
    if(w==='bow'){const b=new THREE.Mesh(new THREE.TorusGeometry(.95,.05,4,16,Math.PI),M(0x6a8a3a));b.rotation.z=Math.PI/2;g.add(b);const str=box(.015,1.9,.015,M(0xeeeeee));str.position.x=-.02;g.add(str)}
    if(w==='pick'){const h=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.7,5),M(0x7A5028));h.position.y=.5;g.add(h);const hd=new THREE.Mesh(new THREE.TorusGeometry(.6,.07,4,10,Math.PI*.8),M(0xB8BEC8));hd.position.y=1.1;hd.rotation.z=Math.PI*.1;g.add(hd)}
    if(w==='coin'){coin=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.05,14),GOLDM());coin.rotation.x=1.2;coin.position.y=-.1;g.add(coin)}};
  hold(rF,o.rh);hold(lF,o.lh);
  G.userData={body,head,rA,lA,rF,lF,coin,base:{ra:rA.rotation.x,la:lA.rotation.x},cheer:(o.ra?.[0]??0)<-2||(o.la?.[0]??0)<-2};
  return G}

const CAST=[
  {name:'Sir Vault',o:{top:0x8E959E,top2:0x6E757E,leg:0x5E656E,hat:'helm',rh:'sword',ra:[-1.2,.3],rf:[-.6,0]},lines:['Halt! Nothing leaves this bank.','Grails go in. Grails stay in. That is the whole job.']},
  {name:'Robin Bank',o:{top:0x3E6B2E,top2:0x2E4F22,leg:0x4A3A28,hat:'hood',hatc:0x2E5424,lh:'bow',la:[-.3,-.35],lf:[-.4,0],belt:0x3a2414},lines:['Robin Bank. I rob no one. I bank for everyone.','First up is Tumeken\'s shadow, then the Scythe, then the bow.']},
  {name:'The Bankster',o:{top:0x2b3352,top2:0x343d60,suit:1,hat:'top',tache:1,rh:'sack',la:[-.15,-.75],lf:[.2,1.55]},lines:['Welcome to BANKSTR, friend.','Creator fees buy Bonds. Bonds fill this bank with grails. Simple.']},
  {name:'Party Penny',o:{top:0x7A2E8C,top2:0x5E2270,leg:0x2a2a30,hat:'party',hatc:0x2E9A3A,ra:[-2.6,.3],rf:[-.2,0],la:[-2.6,-.3],lf:[-.2,0]},lines:['Every grail that lands gets a party!','And a screenshot. Every drop goes on the deposit log.']},
  {name:'Mr. Fees',o:{top:0x1E4A3A,top2:0x163a2e,suit:1,tie:0xE0B03A,hat:'top',tache:1,rh:'coin',ra:[-2.2,.2],rf:[-.3,0]},lines:['Every trade pays a little creator fee.','I walk those fees straight to the Bond shop. Official route only.']},
  {name:'Mr. Bond',o:{top:0x5A1E24,top2:0x4A181e,suit:1,tie:0xE0B03A,hat:'top',tache:1,lh:'coin',la:[-2.3,-.2],lf:[-.3,0],rh:'sack'},lines:['The name is Bond. Old School Bond.','The only real-money route the game allows. So that is how we do it.']},
  {name:'Merchant Mo',o:{top:0xC8A030,top2:0x9A7A20,leg:0x3a2a1a,hat:'bandana',hatc:0xB8232A,tache:1,la:[-2.5,-.3],lf:[-.3,0],lh:'coin'},lines:['Prices? Live from the Grand Exchange, every minute.','Scroll down. The grail board is right there.']},
  {name:'The Exchange Wizard',o:{top:0x2E4AA8,top2:0x243C8C,robe:1,hat:'wizard',hatc:0x2E4AA8,beard:0xDDDDDD,hair:0xCCCCCC,rh:'staff',ra:[-.5,.2],rf:[-.6,0]},lines:['I see... three grails in your future.','Shadow, Scythe, Twisted bow. Cheapest first.']},
  {name:'The Enforcer',o:{top:0x3a3a44,top2:0x2a2a34,leg:0x2a2a30,hat:'helm',rh:'sword',ra:[-.6,.2],rf:[-1.2,0]},lines:['The bank is a collection, not a claim.','Nothing gets paid out. Nothing gets sold for holders. Rules are rules.']},
  {name:'The Banker',banker:1,o:{top:0xECE8DC,top2:0x1c1c22,leg:0x1c1c22,vest:0x22222a,hat:'visor',tache:1,glasses:1,hair:0x8a7a6a},lines:['Welcome to the Bank of BANKSTR.','Every grail we buy gets deposited right here. I count every coin.','Nothing leaves the bank. Not on my watch.']},
  {name:'Old Grinder',o:{top:0x6B4A2A,top2:0x4E3620,leg:0x3E5A2A,hat:'party',hatc:0xD83030,rh:'pick',ra:[-.9,.25],rf:[-.9,0],belt:0x2a1a0c},lines:['Back in my day we grinded for grails.','Now the fees do the grinding. Kids these days.']}
];

function hall(){const cv=$('#hall');let R;try{R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,premultipliedAlpha:false,powerPreference:'high-performance'})}catch(e){cv.style.background='url(banner.jpg) center/cover';window.__hallReady=true;return}
  R.setPixelRatio(Math.min(1.5,devicePixelRatio||1));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.setClearColor(0x000000,0);
  const S=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(35,1,.1,200);
  // wall + floor
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(90,30),new THREE.ShadowMaterial({opacity:.5}));floor.rotation.x=-Math.PI/2;floor.position.set(0,0,8);floor.receiveShadow=true;S.add(floor);
  // lights
  S.add(new THREE.AmbientLight(0x6a5a50,.95));
  const k1=new THREE.DirectionalLight(0xffb070,1.7);k1.position.set(-9,9,9);k1.castShadow=true;k1.shadow.mapSize.set(2048,2048);Object.assign(k1.shadow.camera,{left:-20,right:20,top:14,bottom:-8,near:1,far:50});S.add(k1);
  const k2=new THREE.DirectionalLight(0xffb070,1.3);k2.position.set(9,8,9);S.add(k2);
  const rim=new THREE.DirectionalLight(0xff7a30,1.2);rim.position.set(0,5,-6);S.add(rim);
  // torches
  const flameFrames=[...Array(6)].map((_,f)=>{const c=document.createElement('canvas');c.width=48;c.height=80;const g=c.getContext('2d');const r=rng(40+f);
    const tongue=(x,y,w,h,l,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(x-w/2,y);g.bezierCurveTo(x-w*.62,y-h*.38,x-w*.05-l*.35,y-h*.55,x-l*.1,y-h*.72);g.quadraticCurveTo(x+l*.5,y-h*.86,x+l,y-h);g.quadraticCurveTo(x+l*.2+w*.22,y-h*.7,x+w*.3,y-h*.45);g.bezierCurveTo(x+w*.55,y-h*.3,x+w*.55,y-h*.1,x+w/2,y);g.closePath();g.fill()};
    const T=[0,1,2,3,4].map(i=>({x:24+(i-2)*4+(r()-.5)*3,h:(34+r()*22)*(i==2?1.25:1),w:16+r()*6,l:(r()-.5)*12}));
    for(const [col,k] of [['rgba(150,24,6,.9)',1],['#D8400C',.8],['#FF8A1A',.6],['#FFD04A',.38],['#FFF6C0',.16]])for(const t of T)tongue(t.x,76,t.w*(.35+.65*k),t.h*(.3+.7*k),t.l*k,col);
    const tx=new THREE.CanvasTexture(c);tx.magFilter=THREE.NearestFilter;tx.colorSpace=THREE.SRGBColorSpace;return tx});
  const torches=[];const mkTorch=x=>{const g=new THREE.Group();g.position.set(x,7.2,-5.6);S.add(g);
    const st=box(.28,1.6,.28,M(0x4a2a14));st.position.y=-.4;g.add(st);const br=box(.7,.18,.5,M(0x161412));br.position.y=-.9;g.add(br);const cup=new THREE.Mesh(new THREE.CylinderGeometry(.34,.2,.3,6),M(0x1c1916));cup.position.y=.4;g.add(cup);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:flameFrames[0],transparent:true,depthWrite:false}));sp.scale.set(1.5,2.5,1);sp.position.y=1.6;g.add(sp);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.55}));glow.scale.set(6,6,1);glow.position.y=1.2;g.add(glow);
    const L=new THREE.PointLight(0xff8a30,40,22,1.5);L.position.set(0,1.2,1.4);g.add(L);torches.push({sp,glow,L,x,f:0});return g};
  function glowTex(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,170,60,.9)');gr.addColorStop(1,'rgba(255,120,30,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)}
  mkTorch(-13.8);mkTorch(13.8);
  // embers
  const EN=90,eg=new THREE.BufferGeometry(),ep=new Float32Array(EN*3),ev=[];for(let i=0;i<EN;i++){ev.push({x:0,y:0,z:0,v:0,l:0});}
  eg.setAttribute('position',new THREE.BufferAttribute(ep,3));const embers=new THREE.Points(eg,new THREE.PointsMaterial({color:0xffb040,size:.09,transparent:true,opacity:.9}));S.add(embers);
  const resetE=(e)=>{const t=torches[(Math.random()*torches.length)|0];e.x=t.x+(Math.random()-.5)*.5;e.y=9+Math.random()*.5;e.z=-5.3;e.v=.02+Math.random()*.03;e.l=1};ev.forEach(e=>{resetE(e);e.y+=Math.random()*5});
  // cast
  const POS={'Sir Vault':[-11.6,1.2,.4],'Robin Bank':[-9.1,-3,.32],'The Bankster':[-6.6,1.8,.23],'Party Penny':[-5.4,-3.2,.19],'Mr. Fees':[-3.3,1.9,.95],'Mr. Bond':[3.3,1.9,-.95],'Merchant Mo':[5.4,-3.2,-.19],'The Exchange Wizard':[6.6,1.8,-.23],'The Enforcer':[9.1,-3,-.32],'Old Grinder':[11.6,1.2,-.4],'The Banker':[0,-1.45,0]};
  // ---- bank booth ----
  const booth=new THREE.Group();booth.position.set(0,0,-.2);booth.scale.setScalar(1.15);S.add(booth);const WD=M(0x55361a),WDD=M(0x3a2210),BR=new THREE.MeshLambertMaterial({color:0xC89A3A,flatShading:true});
  const counter=box(4.6,1.55,1.1,WD);counter.position.y=.78;booth.add(counter);const top=box(4.9,.14,1.35,WDD);top.position.y=1.6;booth.add(top);
  for(const x of[-1.55,0,1.55]){const p=box(1.3,1.1,.04,WDD);p.position.set(x,.8,.57);booth.add(p)}
  const trim=box(4.6,.08,.04,BR);trim.position.set(0,1.42,.57);booth.add(trim);const trim2=box(4.6,.08,.04,BR);trim2.position.set(0,.12,.57);booth.add(trim2);
  const emb=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.06,16),BR);emb.rotation.x=Math.PI/2;emb.position.set(0,.8,.6);booth.add(emb);
  for(const x of[-2.35,2.35]){const po=box(.14,1.9,.14,BR);po.position.set(x,2.6,.2);booth.add(po)}
  const rail=box(4.84,.12,.14,BR);rail.position.set(0,3.55,.2);booth.add(rail);
  for(let k=-6;k<=6;k++){if(Math.abs(k)<2)continue;const bar=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.7,5),BR);bar.position.set(k*.34,3.2,.2);booth.add(bar)}
  const bl=new THREE.PointLight(0xffc860,6,6,1.8);bl.position.set(0,3.4,1.8);S.add(bl);
  // coins on the counter
  const coinG=new THREE.CylinderGeometry(.12,.12,.04,12),coinM=GOLDM();const cy=1.69;
  const pile=new THREE.Group();pile.position.set(-1.25,cy,-.2);booth.add(pile);const rr=rng(4);for(let k=0;k<22;k++){const c=new THREE.Mesh(coinG,coinM);c.position.set((rr()-.5)*.55,rr()*.16,(rr()-.5)*.4);c.rotation.set((rr()-.5)*.5,0,(rr()-.5)*.5);pile.add(c)}
  const stack=[];for(let k=0;k<12;k++){const c=new THREE.Mesh(coinG,coinM);c.position.set(-.3,cy+k*.045,-.15);c.visible=false;booth.add(c);stack.push(c)}
  const paper=box(.5,.02,.36,M(0xEDE3C8));paper.position.set(1.1,1.68,-.15);paper.rotation.y=.15;booth.add(paper);
  const ink=box(.14,.021,.14,M(0xB8232A));ink.position.set(1.12,1.69,-.12);ink.visible=false;booth.add(ink);
  const people=CAST.map((c,i)=>{const g=person(c.o);const [x,z,ry]=POS[c.name];g.position.set(x,0,z);if(c.banker)g.scale.setScalar(1.15);g.rotation.y=ry;g.userData.i=i;g.userData.ry=ry;g.userData.phase=Math.random()*6;g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;m.userData.who=i}});S.add(g);return g});
  const BK=people[CAST.findIndex(c=>c.banker)];const bu=BK.userData;bu.custom=true;
  const handCoin=new THREE.Mesh(coinG,coinM);handCoin.position.set(0,-.78,.05);handCoin.rotation.x=.3;bu.rF.add(handCoin);
  const stamp=new THREE.Group();stamp.position.y=-.8;bu.lF.add(stamp);const sh=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.26,6),M(0x6B4520));sh.position.y=.08;stamp.add(sh);const sb=box(.2,.08,.16,M(0x8a1a1a));sb.position.y=-.08;stamp.add(sb);
  let stackN=0,lastPh=0,stamps=0;
  // fit camera
  const fit=()=>{const w=cv.clientWidth,h=cv.clientHeight;R.setSize(w,h,false);const asp=w/h;cam.aspect=asp;
    const narrow=asp<1;const span=narrow?11:28,d=24;const hf=2*Math.atan(span/2/d);const vf=2*Math.atan(Math.tan(hf/2)/asp);cam.fov=THREE.MathUtils.radToDeg(vf);
    const vis=2*d*Math.tan(vf/2);const feet=narrow?.86:.9;const L=(feet-.5)*vis;cam.position.set(0,L+.6,d);cam.lookAt(0,L,0);cam.updateProjectionMatrix()};
  fit();addEventListener('resize',fit);
  // interaction
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(-9,-9);let hover=-1,talking=-1,talkT=0;const tip=$('#tip');let look=0;
  const pick=()=>{ray.setFromCamera(mouse,cam);const hit=ray.intersectObjects(people,true)[0];return hit?hit.object.userData.who:-1};
  cv.addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);look=mouse.x;
    hover=pick();cv.style.cursor=hover>=0?'pointer':'';if(hover>=0){tip.style.display='block';tip.innerHTML=`Talk-to <b>${esc(CAST[hover].name)}</b>`;tip.style.left=(e.clientX-r.left+16)+'px';tip.style.top=(e.clientY-r.top+14)+'px'}else tip.style.display='none'});
  cv.addEventListener('pointerleave',()=>{hover=-1;tip.style.display='none'});
  cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);const who=pick();if(who>=0){talking=who;talkT=0;openDialog(who)}});
  // dialogue
  let line=0,cur=-1;const dlg=$('#dlg');
  function openDialog(i){cur=i;line=0;$('#hint').style.display='none';show()}
  function show(){const c=CAST[cur];$('#dlgName').textContent=c.name;typeText($('#dlgText'),c.lines[line]);dlg.classList.add('on');$('#dlgNext').textContent=line<c.lines.length-1?'Click here to continue':'Click here to close'}
  let typeT;function typeText(el,t){clearInterval(typeT);let k=0;el.textContent='';typeT=setInterval(()=>{el.textContent=t.slice(0,++k);if(k>=t.length)clearInterval(typeT)},16)}
  $('#dlgNext').addEventListener('click',()=>{const c=CAST[cur];if(line<c.lines.length-1){line++;talkT=0;talking=cur;show()}else{dlg.classList.remove('on');cur=-1}});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&dlg.classList.contains('on')){dlg.classList.remove('on');cur=-1}});
  // loop
  let vis=true;new IntersectionObserver(es=>vis=es[0].isIntersecting).observe(cv);
  const clock=new THREE.Clock();
  (function tick(){requestAnimationFrame(tick);if(!vis)return;const t=clock.getElapsedTime(),dt=Math.min(.05,clock.getDelta()||.016);
    torches.forEach((T,k)=>{if(Math.random()<.35){T.f=(T.f+1+((Math.random()*3)|0))%flameFrames.length;T.sp.material.map=flameFrames[T.f]}T.sp.scale.y=2.4+Math.random()*.25;T.glow.material.opacity=.45+Math.random()*.2;T.L.intensity=32+Math.random()*14});
    ev.forEach((e,i)=>{e.y+=e.v;e.x+=Math.sin(t*2+i)*.004;e.l-=.006;if(e.l<=0||e.y>16)resetE(e);ep[i*3]=e.x;ep[i*3+1]=e.y;ep[i*3+2]=e.z});eg.attributes.position.needsUpdate=true;
    {const P=1.5,ph=(t%P)/P;const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;let rz,fx;
      if(ph<.35){const k=ease(ph/.35);rz=.05+k*.32;fx=-.55-k*.35}else if(ph<.45){rz=.37;fx=-.9-Math.sin((ph-.35)/.1*Math.PI)*.15}else if(ph<.8){const k=ease((ph-.45)/.35);rz=.37-k*.5;fx=-.9+k*.1}else if(ph<.9){rz=-.13;fx=-.8-Math.sin((ph-.8)/.1*Math.PI)*.18}else{const k=(ph-.9)/.1;rz=-.13+k*.18;fx=-.8+k*.25}
      bu.rA.rotation.set(-.62,0,rz);bu.rF.rotation.x=fx;handCoin.visible=ph>.38&&ph<.86;
      if(lastPh<.86&&ph>=.86){stackN++;if(stackN>stack.length){stackN=0}stack.forEach((c,k)=>c.visible=k<stackN)}lastPh=ph;
      const Q=2.7,q=(t%Q)/Q;let la,lf;if(q<.62){la=-.55;lf=-.7}else if(q<.8){const k=(q-.62)/.18;la=-.55-k*.65;lf=-.7-k*.6}else if(q<.86){const k=(q-.8)/.06;la=-1.2+k*.75;lf=-1.3+k*.75}else{la=-.45;lf=-.55}
      bu.lA.rotation.set(la,0,-.28);bu.lF.rotation.x=lf;if(q>.84&&q<.86&&!ink.visible){ink.visible=true;stamps++}if(q<.1&&ink.visible&&stamps%3===0){ink.visible=false}
      const lookUp=(t%9)>7.4;bu.head.rotation.x+=((lookUp?-.05:.32)-bu.head.rotation.x)*.08;bu.body.position.y=Math.sin(t*1.4)*.02}
    people.forEach((p,i)=>{const u=p.userData;const ph=u.phase;if(u.custom){if(i===talking){talkT+=dt;if(talkT>1.2)talking=-1}const tg=(i===hover?(look*.9):0);u.head.rotation.y+=(tg-u.head.rotation.y)*.06;return}u.body.position.y=Math.sin(t*1.6+ph)*.035;
      if(u.cheer){u.rA.rotation.x=u.base.ra+Math.sin(t*4+ph)*.18;u.lA.rotation.x=u.base.la+Math.sin(t*4+ph+1)*.18}else{u.rA.rotation.x=u.base.ra+Math.sin(t*1.6+ph)*.05;u.lA.rotation.x=u.base.la-Math.sin(t*1.6+ph)*.05}
      if(u.coin)u.coin.rotation.z=t*6;
      const target=(look*.9)-p.position.x*.03;u.head.rotation.y+=((i===hover?target*1.3:target*.6)-u.head.rotation.y)*.06;
      const lift=(i===hover)?.12:0;if(i===talking){talkT+=dt;const j=Math.max(0,Math.sin(Math.min(1,talkT*2.2)*Math.PI))*.55;p.position.y=j;u.rA.rotation.x=u.base.ra-1.6*Math.max(0,Math.sin(Math.min(1,talkT*1.2)*Math.PI));if(talkT>1.2)talking=-1}else p.position.y+=(lift-p.position.y)*.2;
      p.rotation.y+=((i===hover||i===cur?-p.position.x*.01:u.ry)-p.rotation.y)*.08});
    R.render(S,cam);window.__hallReady=true})();
}

/* ============ grails + GE ============ */
function renderGrails(){const q=queue(),upg=usdPerGp(),cur=current();
  const box=$('#grailCards');box.innerHTML=q.map((g,i)=>{const p=priceOf(g),raw=S.prices[g.id]||{},own=S.owned.has(g.id),t=Math.max(raw.highTime||0,raw.lowTime||0);
    return `<article class="rs gcard reveal in ${cur===g?'cur':''}"><div class="g-top"><div class="g-slot slot"><img src="${g.icon}" alt=""></div><div><div class="g-q">GRAIL #${i+1}</div><div class="g-name">${esc(g.name)}</div><div class="g-st ${own?'st-yes':cur===g?'st-next':'st-no'}">${own?'In the bank':cur===g?'Saving for this now':'Up next'}</div></div></div>
     <div class="g-price"><b class="${own?'':''}">${fmtGp(p.high)}</b><span>≈ ${fmtUsd(p.high*upg)}</span></div>
     <div class="g-chart"><i id="gl${g.id}">PRICE · 90 DAYS</i><canvas id="gc${g.id}"></canvas></div>
     <div class="g-links"><span>${p.snap?'snapshot':'last trade '+ago(t)}</span><a href="https://prices.runescape.wiki/osrs/item/${g.id}" target="_blank" rel="noopener">Price history ↗</a></div></article>`}).join('');
  q.forEach(g=>{drawChart(g);loadSeries(g)});
  if(cur){const p=priceOf(cur);$('#tIcon').src=cur.icon;$('#tName').textContent=cur.name;const pct=Math.min(100,CONFIG.SAVED_GP/p.high*100);$('#tFill').style.width=pct+'%';$('#tPct').textContent=(pct<1&&pct>0?pct.toFixed(2):Math.floor(pct))+'% funded';
    $('#tHave').innerHTML=`<span class="${gpc(CONFIG.SAVED_GP)}">${fmtGp(CONFIG.SAVED_GP)} GP</span> saved`;$('#tNeed').innerHTML=`${fmtGp(p.high)} GP · ≈ ${fmtUsd(p.high*upg)} in Bonds`}
  else{$('#tName').textContent='The set is complete';$('#tFill').style.width='100%';$('#tPct').textContent='3 / 3 banked'}
  const set=GRAILS.reduce((a,g)=>a+priceOf(g).high,0);$('#setGp').textContent=fmtGp(set)+' GP';$('#setUsd').textContent='≈ '+fmtUsd(set*upg)+' in Bonds';
  renderBank()}
async function loadSeries(g){if(S.series[g.id])return;try{const j=await fetch(`https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=24h&id=${g.id}`).then(r=>r.json());
    S.series[g.id]=(j.data||[]).map(d=>{const a=d.avgHighPrice,b=d.avgLowPrice;const v=a&&b?(a+b)/2:(a||b);return v?[d.timestamp,v]:null}).filter(Boolean).slice(-90)}catch(e){S.series[g.id]=[]}drawChart(g)}
function drawChart(g){const c=document.getElementById('gc'+g.id),L=document.getElementById('gl'+g.id);if(!c)return;const d=S.series[g.id];const r=c.getBoundingClientRect();if(!r.width)return;const dpr=Math.min(2,devicePixelRatio||1);c.width=r.width*dpr;c.height=r.height*dpr;const x=c.getContext('2d');x.scale(dpr,dpr);const W=r.width,H=r.height;
  if(!d){L.textContent='LOADING…';return}if(d.length<2){L.textContent='NO CHART DATA';return}
  const vs=d.map(p=>p[1]),mn=Math.min(...vs),mx=Math.max(...vs),pad=(mx-mn)*.2||mx*.03,lo=mn-pad,hi=mx+pad;const X=i=>4+(W-8)*i/(d.length-1),Y=v=>18+(H-24)*(1-(v-lo)/(hi-lo));
  const gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(255,170,50,.3)');gr.addColorStop(1,'rgba(255,170,50,0)');x.beginPath();x.moveTo(X(0),H);d.forEach((p,i)=>x.lineTo(X(i),Y(p[1])));x.lineTo(X(d.length-1),H);x.fillStyle=gr;x.fill();
  x.beginPath();d.forEach((p,i)=>{i?x.lineTo(X(i),Y(p[1])):x.moveTo(X(i),Y(p[1]))});x.strokeStyle='#FFB02A';x.lineWidth=2;x.stroke();
  const chg=(vs[vs.length-1]-vs[0])/vs[0]*100;L.textContent=`90D · ${chg>=0?'+':''}${chg.toFixed(1)}%`}
function geStatus(){const el=$('#geStatus');if(S.live){el.textContent=`Live from the Grand Exchange · updated ${ago(S.updated/1000)}`;$('#geDot').classList.add('live')}else{el.textContent=S.updated?'Offline · showing the 25 Sep snapshot':'Connecting to the Grand Exchange…';$('#geDot').classList.remove('live')}}
async function fetchPrices(){try{const ids=[...GRAILS.map(g=>g.id),BOND_ID];const res=await Promise.all(ids.map(id=>fetch(`https://prices.runescape.wiki/api/v1/osrs/latest?id=${id}`).then(r=>r.json())));
    res.forEach(j=>Object.entries(j.data||{}).forEach(([id,v])=>{if(+id===BOND_ID){if(v.high)S.bondGp=v.high}else S.prices[id]=v}));S.live=true;S.updated=Date.now()}catch(e){S.live=false;S.updated=S.updated||Date.now()}
  renderGrails();geStatus()}

/* ============ bank ============ */
function renderBank(){const g=$('#bankGrid');let h='';
  GRAILS.forEach(x=>{const own=S.owned.has(x.id);h+=`<div class="bslot slot item ${own?'':'ph'}" title="${esc(x.name)}"><img src="${x.icon}" alt="${esc(x.name)}"><span class="q">${own?1:0}</span></div>`});
  for(let i=0;i<5;i++)h+=`<div class="bslot slot item ph" title="Next chapter"><img src="mystery.png" alt="Next chapter"></div>`;
  for(let i=8;i<24;i++)h+=`<div class="bslot slot"></div>`;g.innerHTML=h;
  let v=0;S.owned.forEach(id=>{const x=GRAILS.find(g=>g.id===id);if(x)v+=priceOf(x).high});$('#bankValue').innerHTML=`<span class="${gpc(v)}">${fmtGp(v)}</span> GP`;
  $('#bankGrails').textContent=`${S.owned.size} / 3`;$('#bankCount').textContent=`${S.owned.size} / 3`}
function setupPin(){const bank=$('#bankPanel');bank.classList.add('locked');const pad=$('#pinPad'),dots=$$('#pinDots i');let code='';
  const build=()=>{const d=[0,1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-.5);pad.innerHTML=d.map(n=>`<button data-n="${n}">${n}</button>`).join('')};
  const open=msg=>{$('#pinMsg').textContent=msg;setTimeout(()=>bank.classList.remove('locked'),500)};
  pad.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;code+=b.dataset.n;dots[code.length-1].textContent='*';
    if(code.length<4){$('#pinMsg').textContent=['First','Second','Third','Fourth'][code.length]+' digit, please.';build()}else open('Correct PIN. Welcome to your bank.')});
  $('#pinSkip').addEventListener('click',()=>open('No problem. The bank is public anyway.'));build()}
function setupLog(){const b=$('#logBody');b.innerHTML=LOG.length?LOG.map(e=>`<div class="log-row"><span>${esc(e.date)} · ${esc(e.entry)}</span><span>${e.proof?`<a href="${esc(e.proof)}" target="_blank" rel="noopener">${esc(e.amount)} ↗</a>`:esc(e.amount)}</span></div>`).join(''):`<div class="log-empty"><b>No deposits yet.</b><span>The first grail lands here, with a screenshot.</span></div>`;
  $('#csvBtn').addEventListener('click',()=>{const k=['date','entry','amount','proof'];const rows=[k.join(',')].concat(LOG.map(e=>k.map(x=>`"${String(e[x]??'').replace(/"/g,'""')}"`).join(',')));const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));a.download='bankstr-deposits.csv';document.body.appendChild(a);a.click();a.remove();toast('Log exported','bankstr-deposits.csv')});
  const w=CONFIG.WALLET;if(w){$('#wAddr').textContent=w;$('#wScan').href=`https://solscan.io/account/${w}`}else{$('#wScan').removeAttribute('target');$('#wScan').addEventListener('click',e=>{e.preventDefault();toast('Wallet not live yet','It goes public at launch.')})}
  $('#wCopy').addEventListener('click',()=>{if(!w){toast('Wallet not live yet','It goes public at launch.');return}copy(w).then(ok=>toast(ok?'Address copied':'Copy failed'))})}

/* ============ faq ============ */
const FAQ=[
  {q:'What is BANKSTR?',a:'A RuneScape grail bank. Creator fees buy Bonds, and Bonds bring the rarest items in the game into one public bank.'},
  {q:"Is this allowed by the game's rules?",a:"We only use Old School Bonds from the official store. No gold sellers, no account sales, nothing handed out. The game still has the final say."},
  {q:'Do the grails back the token?',a:"No. The bank is a collection, not a reserve. Nothing can be redeemed and nothing is paid out. Hold it because you like the quest."},
  {q:'Which grails, and in what order?',a:"Tumeken's shadow, then the Scythe of Vitur, then the Twisted bow. Cheapest first, so the bank fills up fast."},
  {q:"What's the contract address?",a:()=>CONFIG.CA?`It's ${CONFIG.CA}. I've copied it for you.`:'Not live yet. It goes up here and on our X at launch. Never trust one from a DM.'},
  {q:'Goodbye.',a:'Safe travels. Remember: nothing leaves the bank.'}];
let npcMode='menu',faqVis=false;
function npcMenu(){npcMode='menu';$('#npc').innerHTML=`<div class="npc-say"><span class="who">The Banker</span>Good day. How may I help you?</div><div class="opts"><div class="h">Select an Option</div>${FAQ.map((f,i)=>`<button class="opt" data-i="${i}"><span>${i+1}.</span>${esc(f.q)}</button>`).join('')}</div>`;$$('#npc .opt').forEach(b=>b.addEventListener('click',()=>npcAnswer(+b.dataset.i)))}
function npcAnswer(i){npcMode='ans';const f=FAQ[i];const a=typeof f.a==='function'?f.a():f.a;if(f.q.startsWith("What's the contract")&&CONFIG.CA)copy(CONFIG.CA);
  $('#npc').innerHTML=`<div class="npc-say"><span class="who">You</span>${esc(f.q)}</div><div class="npc-say" style="margin-top:14px"><span class="who">The Banker</span>${esc(a)}</div><button class="cont2" id="npcCont">Click here to continue</button>`;$('#npcCont').addEventListener('click',npcMenu)}
function setupFaq(){npcMenu();new IntersectionObserver(e=>faqVis=e[0].isIntersecting,{threshold:.3}).observe($('#faq'));
  addEventListener('keydown',e=>{if(!faqVis)return;if(npcMode==='menu'&&/^[1-6]$/.test(e.key))npcAnswer(+e.key-1);else if(npcMode==='ans'&&(e.key===' '||e.key==='Enter')){e.preventDefault();npcMenu()}})}

/* ============ nav + reveal ============ */
function setupNav(){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)$$('#links a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id))}),{rootMargin:'-45% 0px -50% 0px'});$$('main section[id]').forEach(s=>io.observe(s));
  const rv=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rv.unobserve(e.target)}}),{threshold:.08});$$('.reveal').forEach(el=>rv.observe(el));
  addEventListener('resize',()=>GRAILS.forEach(drawChart))}


/* ============ loading screen ============ */
function loader(){const L=$('#loader'),f=$('#lfill'),eyes=$('#eyes'),emb=$('#embers');let p=0,fonts=false,start=performance.now();document.fonts.ready.then(()=>fonts=true);
  const spawnEyes=()=>{const e=document.createElement('div');const sm=Math.random()<.5;e.className='eye'+(sm?' sm':'')+(Math.random()<.2?' gr':'');const side=Math.random();
    const x=side<.5?(3+Math.random()*25):(72+Math.random()*25),y=10+Math.random()*80;e.style.left=x+'%';e.style.top=y+'%';e.innerHTML='<i></i><i></i>';eyes.appendChild(e);setTimeout(()=>e.remove(),3300)};
  const spawnEmber=()=>{const e=document.createElement('i');e.className='ember';e.style.left=(Math.random()*100)+'%';e.style.setProperty('--dx',((Math.random()-.5)*120)+'px');e.style.animationDuration=(4+Math.random()*4)+'s';emb.appendChild(e);setTimeout(()=>e.remove(),8200)};
  spawnEyes();const eT=setInterval(spawnEyes,420),mT=setInterval(spawnEmber,160);
  (function step(){const el=performance.now()-start;const ready=(window.__hallReady&&fonts&&el>1600)||el>6000;const cap=ready?100:(window.__hallReady?88:62);
    p=Math.min(cap,p+(ready?5:(p<cap?1.2+Math.random()*2.2:0)));f.style.width=p+'%';
    if(p>=100){setTimeout(()=>{L.classList.add('done');setTimeout(()=>{clearInterval(eT);clearInterval(mT)},800)},400)}else setTimeout(step,60)})()}

/* ============ wallet + inventory (read-only) ============ */
const RPCS=['/api/rpc','https://solana-rpc.publicnode.com','https://api.mainnet-beta.solana.com'];
const TK='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',TK22='TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
let W=null;
async function rpc(method,params){let last;for(const u of RPCS){try{const r=await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});if(!r.ok){last=r.status;continue}const j=await r.json();if(j.result!==undefined)return j.result;last=j.error&&j.error.message}catch(e){last=e.message}}throw new Error(last||'rpc')}
const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
function prov(w){if(w==='phantom')return window.phantom?.solana?.isPhantom?window.phantom.solana:(window.solana?.isPhantom?window.solana:null);if(w==='solflare')return window.solflare?.isSolflare?window.solflare:null;return null}
const short=a=>a.slice(0,4)+'…'+a.slice(-4);
function stackFmt(n){if(n>=1e7)return[Math.floor(n/1e6)+'M','gp-g'];if(n>=1e5)return[Math.floor(n/1e3)+'K','gp-w'];if(n>=100)return[Math.floor(n).toLocaleString('en-US'),'gp-y'];if(n>=1)return[(+n.toFixed(2)).toString(),'gp-y'];return[(+n.toPrecision(3)).toString(),'gp-y']}
async function connectW(w){const p=prov(w);const url=encodeURIComponent(location.href.split('#')[0]),ref=encodeURIComponent(location.origin);
  if(!p){if(isMobile){location.href=w==='phantom'?`https://phantom.app/ul/browse/${url}?ref=${ref}`:`https://solflare.com/ul/v1/browse/${url}?ref=${ref}`}else{window.open(w==='phantom'?'https://phantom.app/download':'https://solflare.com/download','_blank','noopener');toast(`${w==='phantom'?'Phantom':'Solflare'} not found`,'Install it, then refresh this page.')}return}
  try{const res=await p.connect();const pk=(res&&res.publicKey)||p.publicKey;if(!pk)throw new Error('no key');W={w,p,addr:pk.toString()};try{localStorage.setItem('bankstr_wallet',w)}catch(e){}
    $('#wModal').classList.remove('on');onConnected();try{p.on&&p.on('disconnect',()=>disconnectW(true));p.on&&p.on('accountChanged',k=>{if(k){W.addr=k.toString();onConnected()}else disconnectW(true)})}catch(e){}}
  catch(e){toast('Connection cancelled','Nothing was shared.')}}
function onConnected(){$('#walletBtn').textContent=short(W.addr);$('#invAddr').textContent=short(W.addr);$('#invWallet').textContent=W.w==='phantom'?'Phantom':'Solflare';$('#inv').classList.add('on');loadInv()}
async function disconnectW(silent){try{W&&W.p.disconnect&&await W.p.disconnect()}catch(e){}W=null;try{localStorage.removeItem('bankstr_wallet')}catch(e){}$('#walletBtn').textContent='Connect wallet';$('#inv').classList.remove('on');if(!silent)toast('Disconnected')}
async function tokenMeta(mints){const out={};if(!mints.length)return out;try{const j=await fetch('https://lite-api.jup.ag/tokens/v2/search?query='+mints.slice(0,100).join(',')).then(r=>r.json());(Array.isArray(j)?j:[]).forEach(t=>{out[t.id]={name:t.name,sym:t.symbol,icon:t.icon}})}catch(e){}return out}
async function loadInv(){const g=$('#invGrid');g.innerHTML='<div class="inv-load">Opening your inventory…</div>';
  try{const addr=W.addr;const [bal,a,b]=await Promise.all([rpc('getBalance',[addr]),rpc('getTokenAccountsByOwner',[addr,{programId:TK},{encoding:'jsonParsed'}]).catch(()=>({value:[]})),rpc('getTokenAccountsByOwner',[addr,{programId:TK22},{encoding:'jsonParsed'}]).catch(()=>({value:[]}))]);
    const map={};[...(a.value||[]),...(b.value||[])].forEach(x=>{const i=x.account.data.parsed.info;const amt=i.tokenAmount.uiAmount||0;if(amt>0)map[i.mint]=(map[i.mint]||0)+amt});
    let toks=Object.entries(map).map(([mint,amt])=>({mint,amt}));const meta=await tokenMeta(toks.map(t=>t.mint));
    toks.forEach(t=>{const m=meta[t.mint]||{};t.name=m.name||short(t.mint);t.sym=m.sym||'';t.icon=m.icon||'';t.known=!!meta[t.mint]});
    toks.sort((x,y)=>(y.mint===CONFIG.CA)-(x.mint===CONFIG.CA)||(y.known-x.known)||y.amt-x.amt);
    const sol=(bal.value||0)/1e9;const items=[{name:'Coins (SOL)',amt:sol,img:'coin.png',pix:1}].concat(toks.map(t=>({name:t.mint===CONFIG.CA?'BANKSTR':(t.sym?`${t.name} ($${t.sym})`:t.name),amt:t.amt,img:t.mint===CONFIG.CA?'chest.png':t.icon,pix:t.mint===CONFIG.CA,fb:t.sym||t.mint.slice(0,4)})));
    renderInv(items.slice(0,28),items.length)}
  catch(e){g.innerHTML='<div class="inv-load">Could not reach Solana right now.<br>Hit Refresh in a moment.</div>'}}
function renderInv(items,total){const g=$('#invGrid');let h='';
  items.forEach((it,k)=>{const [q,cl]=stackFmt(it.amt);h+=`<div class="islot slot item" data-k="${k}">${it.img?`<img class="${it.pix?'':'logo'}" src="${esc(it.img)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'fb',textContent:${JSON.stringify(String(it.fb||'?'))}}))">`:`<span class="fb">${esc(it.fb||'?')}</span>`}<span class="q ${cl}">${q}</span></div>`});
  for(let k=items.length;k<28;k++)h+='<div class="islot slot"></div>';g.innerHTML=h;
  $('#invCount').textContent=`${Math.min(total,28)} / 28${total>28?' (+'+(total-28)+')':''}`;
  $$('#invGrid .item').forEach(el=>{const it=items[+el.dataset.k];el.addEventListener('mouseenter',()=>$('#invHover').innerHTML=`Examine <b>${esc(it.name)}</b>: ${it.amt.toLocaleString('en-US',{maximumFractionDigits:6})}`);el.addEventListener('mouseleave',()=>$('#invHover').innerHTML='&nbsp;')})}
function setupWallet(){const m=$('#wModal');$('#stPh').textContent=prov('phantom')?'DETECTED':(isMobile?'OPEN APP':'INSTALL');$('#stSf').textContent=prov('solflare')?'DETECTED':(isMobile?'OPEN APP':'INSTALL');
  $('#walletBtn').addEventListener('click',()=>{if(W){$('#inv').classList.toggle('on')}else{m.classList.add('on')}});
  $('#wClose').addEventListener('click',()=>m.classList.remove('on'));m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('on')});
  $$('.wopt').forEach(b=>b.addEventListener('click',()=>connectW(b.dataset.w)));
  $('#invClose').addEventListener('click',()=>$('#inv').classList.remove('on'));$('#wDisc').addEventListener('click',()=>disconnectW());$('#wRefresh').addEventListener('click',()=>W&&loadInv());
  addEventListener('keydown',e=>{if(e.key==='Escape')m.classList.remove('on')});
  // quiet reconnect if the wallet already trusts this site
  let last=null;try{last=localStorage.getItem('bankstr_wallet')}catch(e){}
  if(last==='phantom'&&prov('phantom')){prov('phantom').connect({onlyIfTrusted:true}).then(r=>{W={w:'phantom',p:prov('phantom'),addr:r.publicKey.toString()};$('#walletBtn').textContent=short(W.addr);$('#invAddr').textContent=short(W.addr);$('#invWallet').textContent='Phantom';loadInv()}).catch(()=>{})}}
/* ============ boot ============ */
loader();setupLinks();setupNav();setupWallet();renderGrails();geStatus();setupPin();setupLog();setupFaq();hall();fetchPrices();setInterval(fetchPrices,60000);setInterval(geStatus,5000);
