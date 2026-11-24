/* ==========================================================
   LEO'S SUPERMARKT — Low-Poly Simulator
   Teil 2: Grundlagen, Audio, Renderer, Produkte, Welt
   ========================================================== */
const THREE = window.THREE;

/* ---------- Mini-Helfer ---------- */
const $ = s => document.querySelector(s);
const eur = v => (Math.round(v*100)/100).toFixed(2).replace('.', ',') + ' €';
const rnd = (a,b) => a + Math.random()*(b-a);
const rndi = (a,b) => Math.floor(rnd(a,b+1));
const pick = a => a[Math.floor(Math.random()*a.length)];
const clamp = (v,a,b) => v<a?a:(v>b?b:v);
const mat = (c,o) => new THREE.MeshLambertMaterial(Object.assign({color:c,flatShading:true},o||{}));

/* ---------- gespeicherte Einstellungen ---------- */
const SKEY = 'leosuper_settings_v1';
const SDEF = {quality:'high',shadows:1,vsync:1,mode:'window',res:'auto',fps:0,platform:'auto',sens:1,master:.8,music:.3,sfx:.9};
const S = Object.assign({}, SDEF, JSON.parse(localStorage.getItem(SKEY)||'{}'));
const saveSet = () => localStorage.setItem(SKEY, JSON.stringify(S));

/* ==========================================================
   Sound — alles per WebAudio synthetisiert (keine Dateien)
   ========================================================== */
const AU = {
  ctx:null, master:null, mus:null, sfx:null, mstep:0, timer:null,
  init(){
    if(this.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext;
    if(!C) return;
    this.ctx = new C();
    this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
    this.mus = this.ctx.createGain(); this.mus.connect(this.master);
    this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
    this.vol(); this.loopMusic();
  },
  vol(){
    if(!this.ctx) return;
    this.master.gain.value = S.master;
    this.mus.gain.value = S.music * 0.4;
    this.sfx.gain.value = S.sfx * 0.9;
  },
  tone(f,d,type,g,to){
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), a = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f,t);
    if(to) o.frequency.exponentialRampToValueAtTime(to, t+d);
    a.gain.setValueAtTime(g || 0.2, t);
    a.gain.exponentialRampToValueAtTime(0.0001, t+d);
    o.connect(a); a.connect(this.sfx); o.start(t); o.stop(t+d+0.02);
  },
  noise(d,g,hz){
    if(!this.ctx) return;
    const t = this.ctx.currentTime, len = Math.max(1, Math.floor(this.ctx.sampleRate*(d||0.15)));
    const n = this.ctx.createBufferSource();
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const dd = buf.getChannelData(0);
    for(let i=0;i<len;i++) dd[i] = (Math.random()*2-1)*(1-i/len);
    n.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value = hz || 900;
    const a = this.ctx.createGain(); a.gain.setValueAtTime(g || 0.2, t);
    a.gain.exponentialRampToValueAtTime(0.0001, t+(d||0.15));
    n.connect(f); f.connect(a); a.connect(this.sfx); n.start(t);
  },
  scan(){ this.tone(1760,.07,'square',.2); setTimeout(()=>this.tone(2400,.06,'square',.13),70); },
  pick(){ this.tone(520,.09,'triangle',.16,780); },
  place(){ this.noise(.12,.22,700); this.tone(180,.09,'sine',.1); },
  openBox(){ this.noise(.24,.26,1800); this.tone(320,.1,'square',.06,170); },
  cash(){ this.tone(880,.1,'sine',.2); setTimeout(()=>this.tone(1320,.18,'sine',.18),95); },
  door(){ this.tone(1320,.14,'sine',.1); setTimeout(()=>this.tone(1760,.2,'sine',.09),120); },
  step(){ this.noise(.06,.07,430); },
  err(){ this.tone(220,.16,'sawtooth',.12,140); },
  ok(){ this.tone(660,.1,'sine',.14); setTimeout(()=>this.tone(990,.12,'sine',.12),80); },
  loopMusic(){
    if(this.timer) return;
    const scale=[262,294,330,392,440,523,587,659];
    const seq=[0,2,4,3,5,4,2,1,0,2,4,5,7,5,4,2];
    this.timer = setInterval(()=>{
      if(!this.ctx || S.music<=0 || this.ctx.state!=='running'){ this.mstep++; return; }
      const t = this.ctx.currentTime, s = this.mstep++ % 16;
      const o = this.ctx.createOscillator(), a = this.ctx.createGain();
      o.type='triangle'; o.frequency.value = scale[seq[s]]/2;
      a.gain.setValueAtTime(0.0001,t);
      a.gain.linearRampToValueAtTime(.16,t+.03);
      a.gain.exponentialRampToValueAtTime(0.0001,t+.45);
      o.connect(a); a.connect(this.mus); o.start(t); o.stop(t+.5);
      if(s%4===0){
        const b=this.ctx.createOscillator(), ba=this.ctx.createGain();
        b.type='sine'; b.frequency.value = [131,131,165,147][(s/4)|0];
        ba.gain.setValueAtTime(.12,t); ba.gain.exponentialRampToValueAtTime(0.0001,t+.55);
        b.connect(ba); ba.connect(this.mus); b.start(t); b.stop(t+.6);
      }
    }, 320);
  }
};

/* ==========================================================
   Renderer, Kamera, Licht
   ========================================================== */
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, powerPreference:'high-performance'});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
if('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ad7f2);
scene.fog = new THREE.Fog(0x9ad7f2, 55, 135);

const camera = new THREE.PerspectiveCamera(72, 1, 0.03, 240);
camera.rotation.order = 'YXZ';
scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8f7a, 0.85));
scene.add(new THREE.AmbientLight(0xffffff, 0.18));

const sun = new THREE.DirectionalLight(0xfff2d4, 1.15);
sun.position.set(16, 24, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0006;
const sc = sun.shadow.camera;
sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 80;
sc.updateProjectionMatrix();
scene.add(sun);
scene.add(sun.target);

const lampWarm = new THREE.PointLight(0xffe6bc, 0.5, 42, 2);
lampWarm.position.set(0, 3.4, 1);
scene.add(lampWarm);
const lampCool = new THREE.PointLight(0xd6ecff, 0.38, 34, 2);
lampCool.position.set(-6.5, 3.2, 3.5);
scene.add(lampCool);

const QUAL = {low:{pr:.8,sh:1024}, medium:{pr:1.1,sh:1024}, high:{pr:1.7,sh:2048}, ultra:{pr:2,sh:2048}};

function onResize(){
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
}

function applyGraphics(){
  const q = QUAL[S.quality] || QUAL.high;
  let pr = Math.min(window.devicePixelRatio || 1, q.pr);
  if(S.res !== 'auto'){
    const target = parseInt(S.res, 10);
    pr = clamp(target / Math.max(window.innerHeight, 320), 0.45, 2);
  }
  renderer.setPixelRatio(pr);
  renderer.shadowMap.enabled = !!S.shadows;
  sun.castShadow = !!S.shadows;
  if(sun.shadow.mapSize.x !== q.sh){
    sun.shadow.mapSize.set(q.sh, q.sh);
    if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map = null; }
  }
  onResize();
}

function applyDisplayMode(){
  try{
    if(S.mode === 'window'){
      if(document.fullscreenElement) document.exitFullscreen();
    } else {
      if(!document.fullscreenElement && document.documentElement.requestFullscreen)
        document.documentElement.requestFullscreen();
    }
  }catch(e){ /* Browser kann es ohne direkten Klick ablehnen */ }
}

/* ==========================================================
   Regal-Interaktion (aufgerufen aus game-3.js / interact())
   ========================================================== */
function shelfInteract(sh){
  if(!sh) return;
  if(player.held && player.held.kind === 'product'){
    const pid = player.held.pid;
    const cat = PMAP[pid].cat;
    if(!sh.accepts(cat)){
      toast(PMAP[pid].name + ' gehört nicht in ' + sh.def.label, 'bad');
      AU.err();
      return;
    }
    const slot = sh.firstEmpty(cat);
    if(!slot){
      toast(sh.def.label + ' ist voll', 'bad');
      AU.err();
      return;
    }
    sh.addProduct(slot, pid);
    clearHeld();
    AU.place();
    updateHUD();
    return;
  }
  if(player.held){ toast('Hände voll – erst ablegen', 'bad'); AU.err(); return; }
  const used = sh.slots.filter(s => s.pid).length;
  toast(sh.def.label + ': ' + used + '/' + sh.slots.length + ' Plätze belegt');
}
