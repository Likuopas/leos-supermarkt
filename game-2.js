/* ==========================================================
   Spieldaten, Regale, Weltaufbau
   ========================================================== */
const CATS = {
  food:'Lebensmittel', drinks:'Getränke', candy:'Süßigkeiten', snacks:'Snacks',
  produce:'Obst & Gemüse', frozen:'Tiefkühl', household:'Haushaltswaren', care:'Körperpflege'
};

const PRODUCTS = [
  {id:'brot',    name:'Bauernbrot',      cat:'food',      buy:1.10, sell:2.20, color:0xd9a066, shape:'box'},
  {id:'nudeln',  name:'Nudeln',          cat:'food',      buy:0.70, sell:1.60, color:0xf2d16b, shape:'box'},
  {id:'konserve',name:'Konservendose',   cat:'food',      buy:0.60, sell:1.30, color:0xc0574b, shape:'can'},
  {id:'wasser',  name:'Mineralwasser',   cat:'drinks',    buy:0.25, sell:0.90, color:0x8fd8ff, shape:'bottle'},
  {id:'cola',    name:'Cola',            cat:'drinks',    buy:0.45, sell:1.50, color:0x8b3a2e, shape:'bottle'},
  {id:'saft',    name:'Orangensaft',     cat:'drinks',    buy:0.80, sell:1.90, color:0xffa62b, shape:'box'},
  {id:'schoko',  name:'Schokoriegel',    cat:'candy',     buy:0.40, sell:1.10, color:0x6b3f24, shape:'box'},
  {id:'gummi',   name:'Gummibärchen',    cat:'candy',     buy:0.50, sell:1.30, color:0xff5c8a, shape:'bag'},
  {id:'chips',   name:'Chips',           cat:'snacks',    buy:0.60, sell:1.60, color:0xffd23f, shape:'bag'},
  {id:'salz',    name:'Salzstangen',     cat:'snacks',    buy:0.40, sell:1.20, color:0xe8dcc0, shape:'bag'},
  {id:'apfel',   name:'Äpfel',           cat:'produce',   buy:0.30, sell:0.80, color:0xd6453f, shape:'round'},
  {id:'banane',  name:'Bananen',         cat:'produce',   buy:0.25, sell:0.70, color:0xffd93d, shape:'round'},
  {id:'tomate',  name:'Tomaten',         cat:'produce',   buy:0.35, sell:0.90, color:0xe8503f, shape:'round'},
  {id:'pizza',   name:'Tiefkühlpizza',   cat:'frozen',    buy:1.30, sell:2.90, color:0xd9a05b, shape:'box'},
  {id:'eis',     name:'Speiseeis',       cat:'frozen',    buy:0.80, sell:2.00, color:0x9fe4ff, shape:'box'},
  {id:'spuel',   name:'Spülmittel',      cat:'household', buy:0.90, sell:2.10, color:0x39cf9b, shape:'bottle'},
  {id:'klopapier',name:'Klopapier',      cat:'household', buy:0.70, sell:1.90, color:0xf4f1e8, shape:'box'},
  {id:'shampoo', name:'Shampoo',         cat:'care',      buy:1.20, sell:2.80, color:0xb07bff, shape:'bottle'},
  {id:'zahn',    name:'Zahnpasta',       cat:'care',      buy:0.80, sell:2.20, color:0x9be3ff, shape:'box'}
];
const PMAP = {};
PRODUCTS.forEach(p => PMAP[p.id] = p);

const SHELF_TYPES = {
  normal:  {label:'Supermarktregal', build:'rack',  w:2.6, d:1.0, h:1.90, rows:3, cols:5, frame:0xeef3f8, accent:0xff6b57, cats:['food','snacks','household','care']},
  drinks:  {label:'Getränkeregal',   build:'rack',  w:2.6, d:1.0, h:2.00, rows:3, cols:5, frame:0xe3edf6, accent:0x4fb6ff, cats:['drinks']},
  candy:   {label:'Süßigkeitenregal', build:'rack',  w:2.4, d:1.0, h:1.75, rows:3, cols:4, frame:0xf6e6f2, accent:0xff8fd1, cats:['candy','snacks']},
  fridge:  {label:'Kühlregal',        build:'rack',  w:3.0, d:1.0, h:2.10, rows:3, cols:5, frame:0xd6e4ee, accent:0x7ee0ff, cats:['drinks','food','frozen'], glass:true},
  freezer: {label:'Tiefkühltruhe',    build:'chest', w:2.0, d:1.0, h:0.85, rows:1, cols:4, frame:0xdce8f0, accent:0x9fe8ff, cats:['frozen']},
  produce: {label:'Obststand',        build:'stand', w:2.2, d:1.0, h:0.95, rows:1, cols:5, frame:0xd39a5f, accent:0x39cf9b, cats:['produce']},
  promo:   {label:'Sonderangebot',    build:'rack',  w:2.2, d:1.0, h:1.40, rows:2, cols:4, frame:0xffe6b3, accent:0xffc93c, cats:['food','drinks','candy','snacks','household','care']}
};

/* ---------- Spielstand ---------- */
const state = {
  money: 620, day: 1, minutes: 8*60, open: true,
  revenue: 0, expenses: 0, custToday: 0, soldToday: 0,
  prices: {}, unlocked: {food:1, drinks:1, candy:1, snacks:1, produce:1, household:1, frozen:0, care:0},
  upgrades: {}, stockDelivered: 0
};
PRODUCTS.forEach(p => state.prices[p.id] = p.sell);

/* ---------- Welt-Container ---------- */
const world = new THREE.Group();
scene.add(world);
const colliders = [];
const shelves = [];
const crates = [];
const registers = [];
const shoppers = [];
const employees = [];

function addCollider(cx, cz, w, d){
  colliders.push({minX:cx-w/2, maxX:cx+w/2, minZ:cz-d/2, maxZ:cz+d/2});
}
function boxMesh(w,h,d,color,x,y,z,opts){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat(color,opts));
  m.position.set(x,y,z);
  m.castShadow = true; m.receiveShadow = true;
  world.add(m);
  return m;
}

function tileTexture(a,b,rx,ry){
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = a; g.fillRect(0,0,128,128);
  g.fillStyle = b; g.fillRect(0,0,64,64); g.fillRect(64,64,64,64);
  g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = 4; g.strokeRect(0,0,128,128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx||11, ry||8);
  t.anisotropy = 4;
  if('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function signTexture(line1,line2,bg,fg){
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0,0,1024,256);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 112px Trebuchet MS, Arial';
  g.fillText(line1, 512, line2 ? 100 : 128);
  if(line2){ g.font = 'bold 50px Trebuchet MS, Arial'; g.fillText(line2, 512, 200); }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  if('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- 3D-Modelle für Produkte ---------- */
function productMesh(pid){
  const p = PMAP[pid];
  const g = new THREE.Group();
  const c = new THREE.Color(p.color);
  const bodyM = mat(p.color);
  const darkM = mat(c.clone().multiplyScalar(0.72).getHex());
  const lightM = mat(c.clone().lerp(new THREE.Color(0xffffff), 0.6).getHex());
  const paperM = mat(0xfff8ea);
  const metalM = mat(0xd9e0e7);
  const add = m => { m.castShadow = true; g.add(m); return m; };
  let hgt = 0.24;

  if(p.shape === 'can'){
    hgt = 0.245;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.20,12), bodyM)).position.y = .12;
    for(const y of [.018,.222]){
      add(new THREE.Mesh(new THREE.CylinderGeometry(.099,.099,.014,12), metalM)).position.y = y;
    }
    add(new THREE.Mesh(new THREE.CylinderGeometry(.0975,.0975,.095,12,1,true), paperM)).position.y = .12;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.0985,.0985,.028,12,1,true), darkM)).position.y = .172;
  } else if(p.shape === 'bottle'){
    hgt = 0.35;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.078,.09,.22,10), bodyM)).position.y = .11;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.036,.078,.07,10), bodyM)).position.y = .255;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.036,.036,.055,10), bodyM)).position.y = .318;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.043,.043,.035,10), darkM)).position.y = .358;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.0925,.0925,.105,10,1,true), paperM)).position.y = .105;
    add(new THREE.Mesh(new THREE.CylinderGeometry(.0935,.0935,.02,10,1,true), lightM)).position.y = .166;
  } else if(p.shape === 'bag'){
    hgt = 0.30;
    add(new THREE.Mesh(new THREE.BoxGeometry(.23,.26,.095), bodyM)).position.y = .145;
    add(new THREE.Mesh(new THREE.BoxGeometry(.24,.035,.078), darkM)).position.y = .285;
    add(new THREE.Mesh(new THREE.BoxGeometry(.212,.028,.07), darkM)).position.y = .014;
    add(new THREE.Mesh(new THREE.BoxGeometry(.132,.10,.01), paperM)).position.set(0,.15,.052);
    const dot = add(new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.012,10), lightM));
    dot.rotation.x = Math.PI/2; dot.position.set(0,.218,.053);
  } else if(p.shape === 'round'){
    hgt = 0.28;
    const b = add(new THREE.Mesh(new THREE.IcosahedronGeometry(.125,1), bodyM));
    b.position.y = .128; b.scale.set(1,.95,1);
    add(new THREE.Mesh(new THREE.CylinderGeometry(.011,.016,.055,5), mat(0x5d7a3a))).position.y = .262;
    const leaf = add(new THREE.Mesh(new THREE.BoxGeometry(.075,.012,.045), mat(0x59a845)));
    leaf.position.set(.045,.256,0); leaf.rotation.z = -0.35;
  } else {
    hgt = 0.24;
    add(new THREE.Mesh(new THREE.BoxGeometry(.24,.21,.16), bodyM)).position.y = .108;
    add(new THREE.Mesh(new THREE.BoxGeometry(.246,.032,.166), darkM)).position.y = .223;
    add(new THREE.Mesh(new THREE.BoxGeometry(.138,.11,.01), paperM)).position.set(0,.115,.085);
    add(new THREE.Mesh(new THREE.BoxGeometry(.196,.026,.01), lightM)).position.set(0,.05,.085);
  }
  g.userData.height = hgt;
  return g;
}

/* ==========================================================
   Regale
   ========================================================== */
class Shelf {
  constructor(spec){
    this.type = spec.type;
    this.def = SHELF_TYPES[spec.type];
    this.spec = spec;
    this.group = new THREE.Group();
    this.group.position.set(spec.x, 0, spec.z);
    this.group.rotation.y = spec.rot || 0;
    world.add(this.group);
    this.rowY = [];
    this.slots = [];
    this.build();
    this.group.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    for(const s of this.slots){ s.node.getWorldPosition(v); s.world = v.clone(); }
    this.front = this.group.localToWorld(new THREE.Vector3(0, 0, this.def.d/2 + 0.6));
    const swap = Math.abs(Math.cos(spec.rot || 0)) < 0.5;
    addCollider(spec.x, spec.z, swap ? this.def.d : this.def.w, swap ? this.def.w : this.def.d);
  }
  build(){
    const d = this.def, W = d.w, D = d.d, H = d.h;
    const frame = mat(d.frame), accent = mat(d.accent);
    let rows = d.rows;
    if(d.build === 'rack'){
      const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, D*0.14), mat(0xf4ecdd));
      back.position.set(0, H/2, -D/2 + D*0.07);
      back.castShadow = true; back.receiveShadow = true;
      this.group.add(back);
      const backStripe = new THREE.Mesh(new THREE.BoxGeometry(W, 0.14, 0.02), accent);
      backStripe.position.set(0, H*0.62, -D/2 - 0.005);
      this.group.add(backStripe);
      const backLabel = new THREE.Mesh(new THREE.PlaneGeometry(W*0.6, H*0.28),
        new THREE.MeshLambertMaterial({map: signTexture(d.label, '', '#fffaf0', '#5d6b76')}));
      backLabel.position.set(0, H*0.4, -D/2 - 0.012);
      backLabel.rotation.y = Math.PI;
      this.group.add(backLabel);
      for(const sx of [-1,1]){
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.1, H, D), frame);
        side.position.set(sx*(W/2 - 0.05), H/2, 0);
        side.castShadow = true;
        this.group.add(side);
      }
      const base = new THREE.Mesh(new THREE.BoxGeometry(W, 0.14, D), accent);
      base.position.y = 0.07; base.receiveShadow = true;
      this.group.add(base);
      const top = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.12, D), accent);
      top.position.y = H - 0.06; top.castShadow = true;
      this.group.add(top);
      const innerB = 0.22, innerT = H - 0.32;
      const gap = (innerT - innerB) / Math.max(1, rows - 1);
      const railM = mat(0xfff8ea), tagM = mat(0xffd93d);
      for(let r=0;r<rows;r++){
        const yb = innerB + r*gap;
        this.rowY.push(yb);
        const board = new THREE.Mesh(new THREE.BoxGeometry(W - 0.14, 0.06, D - 0.06), frame);
        board.position.set(0, yb - 0.03, 0); board.receiveShadow = true;
        this.group.add(board);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(W - 0.16, 0.055, 0.04), railM);
        rail.position.set(0, yb + 0.03, D/2 - 0.02);
        this.group.add(rail);
        const nTags = Math.max(2, Math.round((W - 0.3) / 0.55));
        for(let i=0;i<nTags;i++){
          const tag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, 0.012), tagM);
          tag.position.set(-W/2 + 0.3 + i*((W - 0.6)/Math.max(1,nTags-1)), yb + 0.03, D/2 + 0.005);
          this.group.add(tag);
        }
      }
      /* obere Werbeleiste */
      const topper = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.16, 0.05), accent);
      topper.position.set(0, H - 0.02, D/2 - 0.01);
      this.group.add(topper);
      if(d.glass){
        const glass = new THREE.Mesh(new THREE.BoxGeometry(W - 0.18, H - 0.45, 0.04),
          new THREE.MeshLambertMaterial({color:0xbfeaff, transparent:true, opacity:0.15}));
        glass.position.set(0, H/2, D/2 - 0.04);
        this.group.add(glass);
        const doors = Math.max(2, Math.round(W / 0.9));
        for(let i=0;i<=doors;i++){
          const fr = new THREE.Mesh(new THREE.BoxGeometry(0.045, H - 0.42, 0.05), accent);
          fr.position.set(-W/2 + 0.16 + i*((W - 0.32)/doors), H/2, D/2 - 0.03);
          this.group.add(fr);
        }
      }
      /* Kühllampe */
      if(d.glass){
        const tube = new THREE.Mesh(new THREE.BoxGeometry(W - 0.4, 0.05, 0.07),
          new THREE.MeshLambertMaterial({color:0xffffff, emissive:0xcdf3ff, emissiveIntensity:0.9}));
        tube.position.set(0, H - 0.2, 0.1);
        this.group.add(tube);
      }
    } else if(d.build === 'chest'){
      const base = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), frame);
      base.position.y = H/2; base.castShadow = true; base.receiveShadow = true;
      this.group.add(base);
      const kick = new THREE.Mesh(new THREE.BoxGeometry(W + 0.02, 0.10, D + 0.02), mat(0xb8c8d4));
      kick.position.y = 0.05; this.group.add(kick);
      const rim = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.08, D + 0.06), accent);
      rim.position.y = H; this.group.add(rim);
      const inner = new THREE.Mesh(new THREE.BoxGeometry(W - 0.18, 0.12, D - 0.18), mat(0xe8f6ff));
      inner.position.y = H - 0.04; this.group.add(inner);
      const frost = new THREE.Mesh(new THREE.BoxGeometry(W - 0.22, 0.06, D - 0.22),
        new THREE.MeshLambertMaterial({color:0xffffff, emissive:0xbfeaff, emissiveIntensity:0.35, transparent:true, opacity:0.8}));
      frost.position.y = H + 0.005; this.group.add(frost);
      this.rowY = [H + 0.03];
    } else {
      const top = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, D), frame);
      top.position.y = H - 0.05; top.castShadow = true;
      this.group.add(top);
      for(const sx of [-1,1]) for(const sz of [-1,1]){
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, H, 0.1), accent);
        leg.position.set(sx*(W/2 - 0.12), H/2 - 0.04, sz*(D/2 - 0.12));
        this.group.add(leg);
      }
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, D*0.98), accent);
      skirt.position.y = H - 0.24;
      this.group.add(skirt);
      const crate = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.22, D - 0.28), mat(0xb98a5a));
      crate.position.y = H + 0.02;
      this.group.add(crate);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(W - 0.18, 0.035, D - 0.26), mat(0x8d6238));
      edge.position.y = H + 0.13;
      this.group.add(edge);
      for(let i=0;i<Math.max(2, Math.round(W/0.45));i++){
        const tag = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.012), mat(0xffd93d));
        tag.position.set(-W/2 + 0.3 + i*((W-0.6)/Math.max(1, Math.round(W/0.45)-1)), H - 0.08, D/2 + 0.01);
        this.group.add(tag);
      }
      this.rowY = [H + 0.02];
    }
    rows = (d.build === 'chest') ? 1 : d.rows;
    const stepX = (W - 0.38) / d.cols;
    for(let r=0;r<rows;r++){
      const y = this.rowY[r] !== undefined ? this.rowY[r] : this.rowY[0];
      for(let c=0;c<d.cols;c++){
        const node = new THREE.Group();
        node.position.set(-W/2 + 0.19 + (c + 0.5)*stepX, y, D/2 - 0.24);
        this.group.add(node);
        this.slots.push({pid:null, mesh:null, node:node, world:null});
      }
    }
  }
  accepts(cat){ return this.def.cats.indexOf(cat) >= 0; }
  firstEmpty(cat){
    for(const s of this.slots) if(!s.pid && this.accepts(cat)) return s;
    return null;
  }
  addProduct(slot, pid){
    if(!slot) return false;
    const m = productMesh(pid);
    slot.node.add(m);
    slot.pid = pid; slot.mesh = m;
    return true;
  }
  removeProduct(pid){
    for(const s of this.slots){
      if(s.pid === pid){
        if(s.mesh) s.node.remove(s.mesh);
        s.pid = null; s.mesh = null;
        return true;
      }
    }
    return false;
  }
  count(pid){ let n=0; for(const s of this.slots) if(s.pid === pid) n++; return n; }
}

/* ==========================================================
   Welt aufbauen
   ========================================================== */
const TERM = {x: 8.0, z: -6.1};
let ceiling = null;
const doorPanels = [];
let doorOpen = 0;

function buildWorld(){
  /* Boden im Laden */
  const floorMat = new THREE.MeshLambertMaterial({map: tileTexture('#f4ebdd','#e6d9c6',11,8)});
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(22.4, 16.4), floorMat);
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true;
  world.add(floor);

  /* Außengelände */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), new THREE.MeshLambertMaterial({color:0x93a0a8}));
  ground.rotation.x = -Math.PI/2; ground.position.set(0,-0.03,10); ground.receiveShadow = true;
  world.add(ground);

  /* Wände */
  boxMesh(22.6, 3.7, 0.34, 0xf6efe2, 0, 1.85, -8.2);
  boxMesh(0.34, 3.7, 16.8, 0xf6efe2, -11.2, 1.85, 0);
  boxMesh(0.34, 3.7, 16.8, 0xf6efe2, 11.2, 1.85, 0);
  boxMesh(9.6, 3.7, 0.34, 0xf6efe2, -6.4, 1.85, 8.2);
  boxMesh(9.6, 3.7, 0.34, 0xf6efe2, 6.4, 1.85, 8.2);
  boxMesh(22.6, 0.5, 0.4, 0xff6b57, 0, 0.25, -8.2);
  boxMesh(0.4, 0.5, 16.8, 0xffc93c, -11.2, 0.25, 0);
  boxMesh(0.4, 0.5, 16.8, 0x39cf9b, 11.2, 0.25, 0);

  addCollider(0, -8.2, 23, 0.6);
  addCollider(-11.2, 0, 0.6, 17);
  addCollider(11.2, 0, 0.6, 17);
  addCollider(-6.4, 8.2, 9.6, 0.6);
  addCollider(6.4, 8.2, 9.6, 0.6);

  /* Schild über dem Eingang */
  const signMat = new THREE.MeshLambertMaterial({map: signTexture("LEO'S SUPERMARKT", 'FRISCH · GÜNSTIG · FREUNDLICH', '#ff6b57', '#fff7e8')});
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 1.9), signMat);
  sign.position.set(0, 4.55, 8.42);
  world.add(sign);
  const signBack = new THREE.Mesh(new THREE.BoxGeometry(7.8, 2.1, 0.12), mat(0xe4b23c));
  signBack.position.set(0, 4.55, 8.5);
  world.add(signBack);

  /* Schiebetüren */
  const glassMat = new THREE.MeshLambertMaterial({color:0xbfeaff, transparent:true, opacity:0.35});
  for(const sx of [-1,1]){
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.08), glassMat);
    p.position.set(sx*0.8, 1.5, 8.2);
    world.add(p);
    doorPanels.push({mesh:p, base:sx*0.8, dir:sx});
  }

  /* Bestellterminal */
  boxMesh(1.66, 0.84, 0.86, 0xf6efe3, TERM.x, 0.45, TERM.z);
  boxMesh(1.5, 0.12, 0.76, 0x33404b, TERM.x, 0.06, TERM.z);
  boxMesh(1.72, 0.06, 0.92, 0x39cf9b, TERM.x, 0.88, TERM.z);
  boxMesh(1.24, 0.03, 0.5, 0x2aa88c, TERM.x, 0.905, TERM.z + 0.1);
  const tNeck = boxMesh(0.16, 0.34, 0.14, 0x39424c, TERM.x, 1.06, TERM.z - 0.16);
  tNeck.rotation.x = 0.12;
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.56, 0.07), mat(0x2b2f36));
  bezel.position.set(TERM.x, 1.36, TERM.z - 0.26);
  bezel.rotation.x = -0.16; bezel.castShadow = true;
  world.add(bezel);
  const screenMat = new THREE.MeshLambertMaterial({color:0x2ad6a5, emissive:0x14a87c, emissiveIntensity:0.7});
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.47), screenMat);
  screen.position.set(TERM.x, 1.36, TERM.z - 0.225);
  screen.rotation.x = -0.16;
  world.add(screen);
  boxMesh(0.44, 0.05, 0.2, 0x44515c, TERM.x, 0.96, TERM.z + 0.28);
  const tSign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.38),
    new THREE.MeshLambertMaterial({map: signTexture('BESTELLEN', 'Ware für den Laden', '#39cf9b', '#123b32')}));
  tSign.position.set(TERM.x, 2.15, TERM.z - 0.02);
  world.add(tSign);
  addCollider(TERM.x, TERM.z, 1.8, 1.0);

  /* Lieferrampe */
  const rampMat = new THREE.MeshLambertMaterial({color:0xffd98a});
  const ramp = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.4), rampMat);
  ramp.rotation.x = -Math.PI/2; ramp.position.set(-5.6, 0.01, 10.9);
  world.add(ramp);
  for(let i=0;i<5;i++){
    const st = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.22), new THREE.MeshLambertMaterial({color:0xff6b57}));
    st.rotation.x = -Math.PI/2; st.position.set(-5.6, 0.02, 9.6 + i*0.7);
    world.add(st);
  }

  /* Regale */
  const layout = [
    {type:'normal',  x:-5.6, z:-5.0, rot:0},
    {type:'normal',  x: 0.4, z:-5.0, rot:0},
    {type:'normal',  x:-5.6, z:-2.4, rot:Math.PI},
    {type:'drinks',  x: 0.4, z:-2.4, rot:Math.PI},
    {type:'candy',   x:-5.6, z: 0.2, rot:0},
    {type:'normal',  x: 0.4, z: 0.2, rot:0},
    {type:'normal',  x:-5.6, z: 2.8, rot:Math.PI},
    {type:'normal',  x: 0.4, z: 2.8, rot:Math.PI},
    {type:'fridge',  x:-6.4, z:-7.4, rot:0},
    {type:'freezer', x: 1.6, z:-7.4, rot:0},
    {type:'freezer', x: 4.1, z:-7.4, rot:0},
    {type:'produce', x:-9.7, z:-1.8, rot:Math.PI/2},
    {type:'produce', x:-9.7, z: 1.8, rot:Math.PI/2},
    {type:'promo',   x: 9.9, z: 5.9, rot:-Math.PI/2}
  ];
  for(const spec of layout) shelves.push(new Shelf(spec));

  /* Deckenlampen als Deko */
  for(let i=0;i<4;i++){
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.8,0.08,0.4), new THREE.MeshLambertMaterial({color:0xfff6dd, emissive:0xffeec2, emissiveIntensity:0.5}));
    p.position.set(-6 + i*4, 3.5, -1);
    world.add(p);
  }

  /* Decke (nur im Laden sichtbar) */
  ceiling = new THREE.Mesh(new THREE.BoxGeometry(22.9, 0.16, 16.9),
    new THREE.MeshLambertMaterial({color:0xfffdf6, emissive:0x8b8375}));
  ceiling.position.set(0, 3.78, 0);
  ceiling.receiveShadow = true;
  ceiling.visible = false;
  world.add(ceiling);

  const panelMat = new THREE.MeshLambertMaterial({color:0xffffff, emissive:0xfff4d6, emissiveIntensity:0.85});
  for(let x=-7.5;x<=7.5;x+=5){
    for(const z of [-5.6,-1.4,2.8,6.2]){
      const p = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.07, 0.42), panelMat);
      p.position.set(x, 3.66, z);
      world.add(p);
    }
  }

  /* Sockelleisten */
  const skirt = mat(0xe3d8c6);
  for(const s of [{x:0,z:-8.03,w:22.2,d:0.08},{x:-11.03,z:0,w:0.08,d:16.2},{x:11.03,z:0,w:0.08,d:16.2}]){
    const m = new THREE.Mesh(new THREE.BoxGeometry(s.w, 0.16, s.d), skirt);
    m.position.set(s.x, 0.08, s.z);
    world.add(m);
  }

  /* Fußmatte am Eingang */
  const mat2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.03, 1.4), mat(0x4d5a63));
  mat2.position.set(0, 0.015, 7.0);
  mat2.receiveShadow = true;
  world.add(mat2);
  for(let i=0;i<6;i++){
    const line = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.012, 0.06), mat(0x3d4850));
    line.position.set(0, 0.033, 6.35 + i*0.26);
    world.add(line);
  }

  /* Hängeschilder über den Gängen */
  const aisleSigns = [
    {z:-6.0, t:'LEBENSMITTEL'}, {z:-3.5, t:'GETRÄNKE'},
    {z:-1.1, t:'SÜSS & SALZIG'}, {z:1.6, t:'HAUSHALT'}
  ];
  for(const s of aisleSigns){
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.44),
      new THREE.MeshLambertMaterial({map: signTexture(s.t, '', '#ff6b57', '#fff7e8'), side: THREE.DoubleSide}));
    board.position.set(-2.6, 2.86, s.z);
    world.add(board);
    for(const dx of [-0.8,0.8]){
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.62,4), mat(0x8a949c));
      rod.position.set(-2.6 + dx, 3.36, s.z);
      world.add(rod);
    }
  }

  /* Poster */
  const posters = [
    {x:-8.6, z:-8.02, c:'#ffc93c', t:'FRISCH', s:'Täglich neue Ware'},
    {x:8.6, z:-8.02, c:'#4fb6ff', t:'AKTION', s:'Heute günstiger'}
  ];
  for(const p of posters){
    const board = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5),
      new THREE.MeshLambertMaterial({map: signTexture(p.t, p.s, p.c, '#22303a')}));
    board.position.set(p.x, 2.1, p.z);
    world.add(board);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.6, 0.06), mat(0xffffff));
    frame.position.set(p.x, 2.1, p.z - 0.05);
    world.add(frame);
  }
}
