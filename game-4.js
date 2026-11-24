/* ==========================================================
   Kasse
   ========================================================== */
function buildRegister(x, z){
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  world.add(g);
  const bodyMat = mat(0xf2e9dc), dark = mat(0x2e3944), metal = mat(0x9aa7b4);

  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.0, 1.0), bodyMat);
  counter.position.set(0, .5, -1.9);
  counter.castShadow = true; counter.receiveShadow = true;
  g.add(counter);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.76, .08, 1.06), mat(0x4fb6ff));
  strip.position.set(0, 1.02, -1.9);
  g.add(strip);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(1.02, .14, 3.0), dark);
  belt.position.set(0, .86, 0); belt.receiveShadow = true;
  g.add(belt);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(.2, .8, 3.0), metal);
  legs.position.set(0, .4, 0);
  g.add(legs);

  const rollers = [];
  for(let i=0;i<7;i++){
    const r = new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.94,8), metal);
    r.rotation.z = Math.PI/2;
    r.position.set(0, .94, -1.2 + i*0.4);
    g.add(r); rollers.push(r);
  }

  const col = new THREE.Mesh(new THREE.BoxGeometry(.16, 1.2, .16), metal);
  col.position.set(.78, .6, -.1);
  g.add(col);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.28, .12, .28), mat(0xff6b57));
  head.position.set(.78, 1.24, -.25);
  g.add(head);

  const mon = new THREE.Mesh(new THREE.BoxGeometry(.62, .44, .08), mat(0x2b2f36));
  mon.position.set(-.7, 1.32, -1.55);
  mon.rotation.y = .55;
  g.add(mon);
  const monScreen = new THREE.Mesh(new THREE.PlaneGeometry(.52, .34),
    new THREE.MeshLambertMaterial({color:0x2ad6a5, emissive:0x14a87c, emissiveIntensity:.5}));
  monScreen.position.set(-.7, 1.32, -1.5);
  monScreen.rotation.y = .55;
  g.add(monScreen);

  addCollider(x, z - 0.9, 1.9, 3.3);

  const reg = {
    x:x, z:z, group:g, items:[], bag:[], bagCount:0,
    total:0, scanned:[], customer:null, queue:[], rollers:rollers,
    scanZ: z - 1.2
  };
  registers.push(reg);
  return reg;
}

function addBeltItem(r, pid){
  const m = productMesh(pid);
  m.position.set(r.x, .95, r.z + 1.4);
  world.add(m);
  r.items.push({pid:pid, mesh:m, scanned:false, targetZ:r.z+1.4});
}

function updateRegisters(dt){
  for(const r of registers){
    for(const ro of r.rollers) ro.rotation.x += dt*3.2;
    const list = r.items.slice().sort((a,b) => a.mesh.position.z - b.mesh.position.z);
    let z = r.scanZ;
    for(const it of list){ it.targetZ = z; z += 0.44; }
    for(const it of list){
      const p = it.mesh.position;
      if(p.z > it.targetZ) p.z = Math.max(it.targetZ, p.z - dt*0.85);
      else p.z = it.targetZ;
    }
  }
}

function registerInteract(r){
  const unscanned = r.items.filter(i => !i.scanned);
  if(unscanned.length){
    const front = unscanned.slice().sort((a,b) => a.mesh.position.z - b.mesh.position.z)[0];
    if(front.mesh.position.z - r.scanZ > 0.4){
      toast('Die Ware läuft noch auf dem Band …');
      return;
    }
    front.scanned = true;
    front.mesh.traverse(o => {
      if(o.isMesh && o.material && o.material.color){
        o.material = o.material.clone();
        o.material.color.setHex(0x8ef0b8);
      }
    });
    r.total += state.prices[front.pid];
    r.scanned.push(front.pid);
    AU.scan();
    bagItem(r, front);
    renderReceipt(r);
    return;
  }
  if(r.total > 0){ completeSale(r); return; }
  toast('Noch keine Ware auf dem Band');
}

function bagItem(r, item){
  const i = r.items.indexOf(item);
  if(i >= 0) r.items.splice(i, 1);
  const n = r.bagCount++;
  const col = n % 3, row = Math.floor(n/3);
  item.mesh.position.set(r.x - 1.35 + col*0.16, 0.62 + row*0.02, r.z - 1.55 + col*0.14);
  item.mesh.scale.setScalar(0.85);
  r.bag.push(item.mesh);
}

function clearRegister(r){
  for(const it of r.items) world.remove(it.mesh);
  for(const m of r.bag) world.remove(m);
  r.items.length = 0;
  r.bag.length = 0;
  r.bagCount = 0;
  r.total = 0;
  r.scanned.length = 0;
  renderReceipt(r);
}

function completeSale(r){
  const amount = r.total;
  state.money += amount;
  state.revenue += amount;
  state.soldToday += r.scanned.length;
  AU.cash();
  toast('Kassiert: ' + eur(amount), 'good');
  const c = r.customer;
  r.customer = null;
  clearRegister(r);
  if(c){ c.paid = true; }
  updateHUD();
}

function renderReceipt(r){
  const lines = $('#receiptLines');
  lines.innerHTML = '';
  const counts = {};
  for(const pid of r.scanned) counts[pid] = (counts[pid] || 0) + 1;
  for(const pid in counts){
    const d = document.createElement('div');
    d.innerHTML = '<span>' + PMAP[pid].name + (counts[pid] > 1 ? ' ×' + counts[pid] : '') +
      '</span><span>' + eur(state.prices[pid] * counts[pid]) + '</span>';
    lines.appendChild(d);
  }
  $('#receiptTotal').textContent = eur(r.total);
}
const updateReceipt = renderReceipt;

/* ==========================================================
   Wegfindung (A*-Grid)
   ========================================================== */
const NAV = {g:.5, x0:-14, z0:-10, w:60, h:48, blocked:null};
const cellX = x => Math.floor((x - NAV.x0)/NAV.g);
const cellZ = z => Math.floor((z - NAV.z0)/NAV.g);
const wxC = cx => NAV.x0 + (cx + .5)*NAV.g;
const wzC = cz => NAV.z0 + (cz + .5)*NAV.g;

function navFree(cx, cz){
  return cx >= 0 && cz >= 0 && cx < NAV.w && cz < NAV.h && !NAV.blocked[cz*NAV.w + cx];
}

function navBlock(x0, z0, x1, z1){
  const c0 = clamp(Math.floor((x0-NAV.x0)/NAV.g), 0, NAV.w-1);
  const c1 = clamp(Math.ceil((x1-NAV.x0)/NAV.g), 0, NAV.w-1);
  const r0 = clamp(Math.floor((z0-NAV.z0)/NAV.g), 0, NAV.h-1);
  const r1 = clamp(Math.ceil((z1-NAV.z0)/NAV.g), 0, NAV.h-1);
  for(let cz=r0; cz<=r1; cz++) for(let cx=c0; cx<=c1; cx++) NAV.blocked[cz*NAV.w + cx] = 1;
}

function navReset(){
  if(!NAV.blocked) NAV.blocked = new Uint8Array(NAV.w*NAV.h);
  NAV.blocked.fill(0);
  for(let x=0; x<NAV.w; x++){ NAV.blocked[x] = 1; NAV.blocked[(NAV.h-1)*NAV.w + x] = 1; }
  for(let z=0; z<NAV.h; z++){ NAV.blocked[z*NAV.w] = 1; NAV.blocked[z*NAV.w + NAV.w-1] = 1; }
  for(const c of colliders) navBlock(c.minX - 0.22, c.minZ - 0.22, c.maxX + 0.22, c.maxZ + 0.22);
}

function nearestFree(cx, cz){
  if(navFree(cx, cz)) return {cx:cx, cz:cz};
  for(let r=1; r<12; r++){
    for(let dz=-r; dz<=r; dz++) for(let dx=-r; dx<=r; dx++){
      if(Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
      if(navFree(cx+dx, cz+dz)) return {cx:cx+dx, cz:cz+dz};
    }
  }
  return null;
}

function findPath(from, to){
  const s = nearestFree(cellX(from.x), cellZ(from.z));
  const t = nearestFree(cellX(to.x), cellZ(to.z));
  if(!s || !t) return null;
  const W = NAV.w;
  const si = s.cz*W + s.cx, gi = t.cz*W + t.cx;
  const open = [si];
  const gS = {}, fS = {}, came = {}, closed = {};
  gS[si] = 0;
  fS[si] = Math.abs(s.cx - t.cx) + Math.abs(s.cz - t.cz);
  let guard = 0;
  while(open.length && guard++ < 8000){
    let bi = 0;
    for(let i=1;i<open.length;i++) if((fS[open[i]]||0) < (fS[open[bi]]||0)) bi = i;
    const cur = open.splice(bi,1)[0];
    if(cur === gi){
      const cells = [cur];
      let n = cur;
      while(came[n] !== undefined){ n = came[n]; cells.push(n); }
      cells.reverse();
      const pts = [];
      for(let i=1;i<cells.length;i++){
        const cz = Math.floor(cells[i]/W), cx = cells[i] - cz*W;
        pts.push({x:wxC(cx), z:wzC(cz)});
      }
      pts.push({x:to.x, z:to.z});
      return pts;
    }
    closed[cur] = 1;
    const cz = Math.floor(cur/W), cx = cur - cz*W;
    const nb = [[1,0],[-1,0],[0,1],[0,-1]];
    for(const d of nb){
      const ncx = cx + d[0], ncz = cz + d[1];
      if(!navFree(ncx, ncz)) continue;
      const ni = ncz*W + ncx;
      if(closed[ni]) continue;
      const tent = (gS[cur] || 0) + 1;
      if(gS[ni] === undefined || tent < gS[ni]){
        came[ni] = cur;
        gS[ni] = tent;
        fS[ni] = tent + Math.abs(ncx - t.cx) + Math.abs(ncz - t.cz);
        if(open.indexOf(ni) < 0) open.push(ni);
      }
    }
  }
  return null;
}

/* ==========================================================
   Kunden
   ========================================================== */
state.dayEvents = [];
state.disappointed = 0;

const SHIRTS = [0xff6b57,0x4fb6ff,0x39cf9b,0xffc93c,0xff8fd1,0xb07bff,0xff9d5c,0x6bd0ff];
const SKINS  = [0xffcf9f,0xe8b48a,0xc98a5c,0x8d5a3b,0xffdcc0];
const HAIRS  = [0x3a2a1e,0x1f1a16,0xc9823a,0xe8d7a8,0x7a4a2a];

function makeShopperMesh(scale){
  const g = new THREE.Group();
  const shirt = mat(pick(SHIRTS)), skin = mat(pick(SKINS)), pants = mat(0x3d4b5e), hairM = mat(pick(HAIRS));
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.52,.58,.32), shirt);
  torso.position.y = 1.02; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.44,.4,.4), skin);
  head.position.y = 1.53; head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(.48,.12,.44), hairM);
  hair.position.y = 1.73; g.add(hair);
  const eyeGeo = new THREE.BoxGeometry(.06,.08,.03), eyeMat = mat(0x241a12);
  const e1 = new THREE.Mesh(eyeGeo, eyeMat); e1.position.set(-.1,1.55,.205); g.add(e1);
  const e2 = new THREE.Mesh(eyeGeo, eyeMat); e2.position.set(.1,1.55,.205); g.add(e2);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(.07,.07,.06), skin);
  nose.position.set(0,1.47,.21); g.add(nose);
  const armGeo = new THREE.BoxGeometry(.14,.46,.16); armGeo.translate(0,-.23,0);
  const aL = new THREE.Mesh(armGeo, shirt); aL.position.set(-.34,1.28,0); g.add(aL);
  const aR = new THREE.Mesh(armGeo, shirt); aR.position.set(.34,1.28,0); g.add(aR);
  const legGeo = new THREE.BoxGeometry(.18,.5,.2); legGeo.translate(0,-.25,0);
  const lL = new THREE.Mesh(legGeo, pants); lL.position.set(-.13,.55,0); g.add(lL);
  const lR = new THREE.Mesh(legGeo, pants); lR.position.set(.13,.55,0); g.add(lR);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(.4,.2,.3), mat(0xd9dee4));
  basket.position.set(.3,.72,.22); g.add(basket);
  if(scale) g.scale.setScalar(scale);
  return {group:g, legL:lL, legR:lR, armL:aL, armR:aR, basket:basket};
}

class Shopper {
  constructor(){
    this.mesh = makeShopperMesh();
    this.group = this.mesh.group;
    this.pos = new THREE.Vector3(rnd(-1.2,1.2), 0, 12.6);
    this.group.position.copy(this.pos);
    scene.add(this.group);
    this.speed = rnd(1.45, 2.0);
    this.list = [];
    this.basket = [];
    this.basketMeshes = [];
    this.state = 'enter';
    this.path = null; this.wp = 0;
    this.timer = 0; this.waiting = false; this.walking = false;
    this.patience = 75; this.paid = false; this.dead = false;
    this.phase = rnd(0,10); this.scanTimer = 0;
    const pool = PRODUCTS.filter(p => state.unlocked[p.cat]);
    const n = rndi(1,5);
    for(let i=0;i<n;i++) this.list.push(pick(pool).id);
    state.custToday++;
    this.goTo(0, 6.4);
  }

  goTo(x, z){
    const p = findPath(this.pos, {x:x, z:z});
    this.path = p; this.wp = 0;
    if(!p){ this.path = null; }
  }

  walk(dt){
    if(!this.path || this.wp >= this.path.length) return true;
    const t = this.path[this.wp];
    const dx = t.x - this.pos.x, dz = t.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if(d < 0.14){ this.wp++; return this.wp >= this.path.length; }
    const s = Math.min(this.speed*dt, d);
    this.pos.x += dx/d*s;
    this.pos.z += dz/d*s;
    this.group.position.set(this.pos.x, 0, this.pos.z);
    this.group.rotation.y = Math.atan2(dx, dz);
    this.phase += dt*8;
    const sw = Math.sin(this.phase)*0.5;
    this.mesh.legL.rotation.x = sw;
    this.mesh.legR.rotation.x = -sw;
    this.mesh.armL.rotation.x = -sw*0.6;
    this.mesh.armR.rotation.x = sw*0.6;
    return this.wp >= this.path.length;
  }

  findShelf(pid){
    const cat = PMAP[pid].cat;
    for(const s of shelves) if(s.accepts(cat) && s.count(pid) > 0) return s;
    return null;
  }

  update(dt){
    if(this.dead) return;
    this.timer -= dt;
    switch(this.state){
      case 'enter':
        if(this.walk(dt)){ this.state = 'shop'; this.timer = 0.25; }
        break;
      case 'shop':
        this.shopUpdate(dt);
        break;
      case 'toQueue':
        if(this.walk(dt)) this.state = 'queue';
        break;
      case 'queue':
        this.queueUpdate(dt);
        break;
      case 'unload':
        this.unloadUpdate(dt);
        break;
      case 'wait':
        this.patience -= dt;
        if(this.paid){ this.finish(); break; }
        if(this.patience <= 0) this.abandon();
        break;
      case 'leave':
        if(this.walk(dt)) this.destroy();
        break;
    }
  }

  shopUpdate(dt){
    if(this.waiting){
      if(this.timer > 0) return;
      this.waiting = false;
      this.takeItem();
      this.timer = 0.15;
      return;
    }
    if(this.walking){
      if(this.walk(dt)){ this.walking = false; this.waiting = true; this.timer = 0.6; }
      return;
    }
    if(!this.list.length){ this.joinQueue(); return; }
    const pid = this.list[0];
    const sh = this.findShelf(pid);
    if(!sh){ this.list.shift(); this.disappoint(); return; }
    this.targetShelf = sh;
    this.walking = true;
    this.goTo(sh.front.x + rnd(-0.2,0.2), sh.front.z + rnd(-0.15,0.15));
  }

  takeItem(){
    const pid = this.list.shift();
    if(!pid) return;
    const sh = this.targetShelf;
    if(sh && sh.removeProduct(pid)){
      this.basket.push(pid);
      if(this.basketMeshes.length < 4){
        const m = productMesh(pid);
        m.scale.setScalar(0.62);
        m.position.set(-0.12 + (this.basketMeshes.length%2)*0.24, 0.1, 0);
        this.mesh.basket.add(m);
        this.basketMeshes.push(m);
      }
      AU.pick();
    } else {
      this.disappoint();
    }
  }

  disappoint(){
    state.disappointed++;
    this.group.position.y = 0;
    const mark = new THREE.Mesh(new THREE.BoxGeometry(.1,.5,.1), mat(0xff6b57));
    mark.position.set(.3, 2.0, 0);
    this.group.add(mark);
    const dot = new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.12), mat(0xff6b57));
    dot.position.set(.3, 1.7, 0);
    this.group.add(dot);
    setTimeout(() => { this.group.remove(mark); this.group.remove(dot); }, 1600);
    if(Math.random() < 0.35) toast('Ein Kunde findet sein Produkt nicht …');
  }

  joinQueue(){
    let best = null;
    for(const r of registers){
      const load = r.queue.length + (r.customer ? 1 : 0);
      if(!best || load < best.load) best = {r:r, load:load};
    }
    if(!best){ this.leave(false); return; }
    this.register = best.r;
    best.r.queue.push(this);
    this.state = 'toQueue';
    const idx = best.r.queue.indexOf(this);
    this.goTo(best.r.x, best.r.z + 2.3 + idx*0.95);
  }

  queueUpdate(dt){
    const r = this.register;
    if(!r){ this.leave(false); return; }
    if(this.walk(dt)){
      const idx = r.queue.indexOf(this);
      if(!r.customer && idx === 0){
        r.customer = this;
        this.state = 'unload';
        this.timer = 0.8;
        this.goTo(r.x, r.z + 2.0);
      }
    }
  }

  unloadUpdate(dt){
    this.walk(dt);
    if(this.timer > 0) return;
    if(this.basket.length){
      const pid = this.basket.shift();
      addBeltItem(this.register, pid);
      if(this.basketMeshes.length){
        const m = this.basketMeshes.pop();
        this.mesh.basket.remove(m);
      }
      AU.place();
      this.timer = 0.55;
    } else {
      this.state = 'wait';
      this.patience = 80;
    }
  }

  finish(){
    this.state = 'leave';
    this.paid = false;
    this.leaveCleanup();
    this.goTo(0, 11.2);
  }

  abandon(){
    toast('Ein Kunde hat zu lange gewartet.', 'bad');
    AU.err();
    const r = this.register;
    if(r && r.customer === this){ r.customer = null; clearRegister(r); }
    this.leaveCleanup();
    this.state = 'leave';
    this.goTo(0, 11.2);
  }

  leave(happy){
    this.leaveCleanup();
    this.state = 'leave';
    this.goTo(0, 11.2);
  }

  leaveCleanup(){
    const r = this.register;
    if(!r) return;
    if(r.customer === this) r.customer = null;
    const i = r.queue.indexOf(this);
    if(i >= 0) r.queue.splice(i, 1);
  }

  destroy(){
    this.dead = true;
    scene.remove(this.group);
  }
}

function updateShoppers(dt){
  for(let i=shoppers.length-1; i>=0; i--){
    shoppers[i].update(dt);
    if(shoppers[i].dead) shoppers.splice(i, 1);
  }
}
