/* ==========================================================
   Spieler, Kamera, Steuerung, Interaktion, Bestellung
   ========================================================== */
const player = {
  pos: new THREE.Vector3(-2.6, 0, 6.6), yaw: 0, group: null,
  legL: null, legR: null, armL: null, armR: null, holder: null,
  phase: 0, held: null, speed: 4.3, radius: 0.38,
  view: null, bob: 0, bobX: 0, roll: 0, eye: 1.62
};
let camYaw = 0, camPitch = -0.04;
let gameState = 'menu';   // menu | play | paused | panel | closed
let panelOpen = false;
let target = null;
const keys = {};
const mobileMove = {active:false, x:0, y:0};

/* ==========================================================
   Egoperspektive: zwei Arme mit Händen, fest an der Kamera
   ========================================================== */
function buildPlayer(){
  scene.add(camera);
  camera.rotation.order = 'YXZ';

  const view = new THREE.Group();
  view.visible = false;
  camera.add(view);

  const skinM = mat(0xffd2a6);
  const sleeveM = mat(0xff6b57);
  const cuffM = mat(0xe4553f);
  const nailM = mat(0xffe3c9);

  function arm(side){
    const g = new THREE.Group();
    /* Ärmel */
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.07, 0.20, 8), sleeveM);
    sleeve.rotation.x = Math.PI/2; sleeve.position.z = -0.09; g.add(sleeve);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.06, 0.035, 8), cuffM);
    cuff.rotation.x = Math.PI/2; cuff.position.z = -0.20; g.add(cuff);
    /* Unterarm */
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.055, 0.13, 8), skinM);
    fore.rotation.x = Math.PI/2; fore.position.z = -0.25; g.add(fore);

    /* Hand als eigene Gruppe – leicht nach unten gekippt */
    const hand = new THREE.Group();
    hand.position.z = -0.305;
    hand.rotation.x = -0.30;
    const wrist = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.048, 0.06), skinM);
    wrist.position.z = -0.01; hand.add(wrist);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.046, 0.115), skinM);
    palm.position.z = -0.10; hand.add(palm);
    /* Finger (leicht gefächert und gebeugt) */
    for(let i=0;i<4;i++){
      const len = i === 0 ? 0.066 : (i === 3 ? 0.05 : 0.059);
      const base = new THREE.Group();
      base.position.set(-0.036 + i*0.024, 0.001, -0.155);
      base.rotation.x = -0.32; base.rotation.z = (i-1.5)*0.05;
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.021, 0.027, len), skinM);
      f.position.z = -len/2;
      base.add(f);
      const nail = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.006, 0.014), nailM);
      nail.position.set(0, 0.017, -len + 0.006);
      base.add(nail);
      hand.add(base);
    }
    /* Daumen */
    const thumbBase = new THREE.Group();
    thumbBase.position.set(side * 0.05, 0.004, -0.06);
    thumbBase.rotation.y = side * 0.75;
    thumbBase.rotation.x = -0.25;
    const th = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.028, 0.072), skinM);
    th.position.z = -0.036;
    thumbBase.add(th);
    hand.add(thumbBase);
    g.add(hand);

    g.traverse(o => { if(o.isMesh){ o.castShadow = false; o.receiveShadow = false; } });
    g.position.set(side * 0.30, -0.27, -0.32);
    g.rotation.order = 'YXZ';
    g.rotation.set(0.28, side * 0.30, side * 0.18);
    view.add(g);
    return g;
  }

  player.armL = arm(-1);
  player.armR = arm(1);

  const holder = new THREE.Group();
  holder.position.set(0, -0.10, -0.72);
  view.add(holder);

  view.scale.setScalar(0.94);
  player.view = view;
  player.holder = holder;
  player.group = null;
}

/* ---------- Kollision Spieler gegen Möbel/Wände ---------- */
function resolveCollisions(p, r){
  for(let i=0;i<colliders.length;i++){
    const c = colliders[i];
    const cx = clamp(p.x, c.minX, c.maxX);
    const cz = clamp(p.z, c.minZ, c.maxZ);
    const dx = p.x - cx, dz = p.z - cz;
    const d2 = dx*dx + dz*dz;
    if(d2 < r*r){
      if(d2 > 1e-6){
        const d = Math.sqrt(d2);
        p.x = cx + dx/d*r; p.z = cz + dz/d*r;
      } else {
        const l = p.x - c.minX, rr = c.maxX - p.x, t = p.z - c.minZ, b = c.maxZ - p.z;
        const m = Math.min(l, rr, t, b);
        if(m === l) p.x = c.minX - r;
        else if(m === rr) p.x = c.maxX + r;
        else if(m === t) p.z = c.minZ - r;
        else p.z = c.maxZ + r;
      }
    }
  }
  p.x = clamp(p.x, -14, 14.5);
  p.z = clamp(p.z, -9.5, 13.5);
}

/* ---------- Kamera (Egoperspektive) ---------- */
function updateCamera(dt){
  camera.position.set(player.pos.x + player.bobX, player.eye + player.bob, player.pos.z);
  camera.rotation.set(camPitch, camYaw, player.roll, 'YXZ');
}

/* ---------- Spieler-Update ---------- */
function updatePlayer(dt){
  const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
  const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
  let mx = 0, mz = 0;
  if(keys['KeyW'] || keys['ArrowUp']) mz += 1;
  if(keys['KeyS'] || keys['ArrowDown']) mz -= 1;
  if(keys['KeyD'] || keys['ArrowRight']) mx += 1;
  if(keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
  if(mobileMove.active){ mx += mobileMove.x; mz -= mobileMove.y; }
  const len = Math.hypot(mx, mz);
  let moving = false;
  if(len > 0.02){
    const nx = mx/len, nz = mz/len;
    let dx = fx*nz + rx*nx, dz = fz*nz + rz*nx;
    const dl = Math.hypot(dx, dz) || 1;
    dx /= dl; dz /= dl;
    const sp = player.speed * Math.min(1, len) * dt;
    player.pos.x += dx*sp;
    player.pos.z += dz*sp;
    player.yaw = Math.atan2(-dx, -dz);
    moving = true;
    player.phase += dt*10;
  } else {
    player.phase += dt*1.6;
  }
  resolveCollisions(player.pos, player.radius);

  player.bob += ((Math.abs(Math.sin(player.phase))*0.034*(moving?1:0)) - player.bob) * Math.min(1, dt*14);
  player.bobX += ((Math.cos(player.phase)*0.021*(moving?1:0)) - player.bobX) * Math.min(1, dt*10);
  player.roll += (((moving ? -Math.sin(player.phase)*0.013 : 0)) - player.roll) * Math.min(1, dt*8);

  updateHands(dt, moving);
  if(moving && Math.random() < dt*3.6) AU.step();
}

/* ---------- Hände: laufen, atmen, tragen ---------- */
function handLerp(a, x, y, z, dt){
  const k = Math.min(1, dt*12);
  a.rotation.x += (x - a.rotation.x)*k;
  a.rotation.y += (y - a.rotation.y)*k;
  a.rotation.z += (z - a.rotation.z)*k;
}
function updateHands(dt, moving){
  if(!player.view) return;
  const t = performance.now()*0.001;
  const held = player.held;
  const walk = moving ? Math.sin(player.phase)*0.055 : 0;
  const breath = Math.sin(t*1.7)*0.018;

  let ax = 0.28, ay = 0.28, az = 0.18;
  let bx = 0.28, by = 0.28, bz = 0.18;

  if(held && held.kind === 'crate'){
    ax = 0.92; ay = 0.44; az = 0.04;
    bx = 0.92; by = 0.44; bz = 0.04;
  } else if(held && held.kind === 'product'){
    ax = 0.86; ay = 0.44; az = 0.02;
    bx = 0.46; by = 0.32; bz = 0.16;
  }

  handLerp(player.armR, ax + walk + breath, ay, -az, dt);
  handLerp(player.armL, bx - walk - breath, -by, bz, dt);

  const v = player.view;
  v.position.y = Math.sin(player.phase*2)*0.012*(moving?1:0) + Math.sin(t*1.4)*0.004;
  v.position.x = Math.cos(player.phase)*0.007*(moving?1:0);
  v.rotation.z = Math.sin(player.phase)*0.018*(moving?1:0);
  v.rotation.x = -player.bob*0.6;
}

/* ---------- Interaktionsziel suchen ---------- */
function setPrompt(text, show){
  const el = $('#prompt');
  if(!show || !text){ el.classList.add('hidden'); return; }
  $('#promptText').textContent = text;
  el.classList.remove('hidden');
}

function registerLabel(r){
  if(r.items.some(i => !i.scanned)) return 'Produkt scannen';
  if(r.total > 0) return 'Kassieren (' + eur(r.total) + ')';
  return 'Kasse – warte auf Kunden';
}

function updateTarget(){
  const f = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
  const cands = [];
  cands.push({kind:'terminal', pos:new THREE.Vector3(TERM.x, 0, TERM.z + 1.1), label:'Bestellterminal' });
  for(const r of registers) cands.push({kind:'register', ref:r, pos:new THREE.Vector3(r.x, 0, r.z - 1.4), label:registerLabel(r)});
  for(const c of crates){
    if(c.carried) continue;
      cands.push({kind:'crate', ref:c, pos:c.group.position,
      label: c.opened ? 'Produkt entnehmen' : (c.group.position.z > 8.0 ? 'Karton aufnehmen' : 'Karton öffnen')});
  }
  for(const s of shelves) cands.push({kind:'shelf', ref:s, pos:s.front, label:'Einräumen'});
  cands.push({kind:'door', pos:new THREE.Vector3(0,0,8.9), label: state.open ? 'Laden schließen' : 'Laden öffnen'});

  let best = null, bestScore = -99;
  for(const c of cands){
    const dx = c.pos.x - player.pos.x, dz = c.pos.z - player.pos.z;
    const dist = Math.hypot(dx, dz);
    if(dist > 3.0) continue;
    const dot = (dx*f.x + dz*f.z) / Math.max(dist, 0.001);
    if(dot < -0.1) continue;
    const score = dot*1.6 - dist*0.25;
    if(score > bestScore){ bestScore = score; best = c; }
  }
  target = best;
  if(player.held && player.held.kind === 'crate'){ setPrompt('Karton abstellen (E)', true); return; }
  if(!best){ setPrompt('', false); return; }
  let label = best.label;
  if(best.kind === 'shelf' && !(player.held && player.held.kind === 'product')) label = best.ref.def.label + ' ansehen';
  if(best.kind === 'crate' && !best.ref.opened) label = 'Karton öffnen';
  setPrompt(label + ' (E)', true);
}

/* ---------- Interaktion auslösen ---------- */
function interact(){
  if(gameState !== 'play' || panelOpen) return;
  if(player.held && player.held.kind === 'crate'){ dropCrate(); return; }
  if(!target) return;
  if(target.kind === 'terminal') openOrder();
  else if(target.kind === 'shelf') shelfInteract(target.ref);
  else if(target.kind === 'crate') crateInteract(target.ref);
  else if(target.kind === 'register') registerInteract(target.ref);
  else if(target.kind === 'door') toggleStore();
}

/* ---------- Getragene Dinge ---------- */
function setHeld(obj){
  player.held = obj;
  const h = player.holder;
  while(h.children.length) h.remove(h.children[0]);
  if(!obj) return;
  if(obj.kind === 'crate'){
    const g = obj.crate.group;
    g.position.set(0, 0.02, 0);
    g.rotation.set(0, 0, 0);
    g.scale.setScalar(0.64);
    h.position.set(0, -0.14, -0.86);
    h.add(g);
    obj.crate.carried = true;
  } else {
    h.position.set(0.14, -0.18, -0.66);
    const m = productMesh(obj.pid);
    m.rotation.set(0.20, -0.35, 0);
    m.scale.setScalar(0.92);
    h.add(m);
  }
}

function clearHeld(){
  const o = player.held;
  if(o && o.kind === 'crate'){
    o.crate.carried = false;
    o.crate.group.scale.setScalar(1);
  }
  player.held = null;
  const h = player.holder;
  while(h.children.length) h.remove(h.children[0]);
}

/* ==========================================================
   Kartons
   ========================================================== */
function makeCrate(pid, qty){
  const g = new THREE.Group();
  const card = mat(0xc99155), dark = mat(0xa9763f);
  const body = new THREE.Mesh(new THREE.BoxGeometry(.74,.5,.74), card);
  body.position.y = .25; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(.62,.42,.62), mat(0x6b4a2a));
  inner.position.y = .3; g.add(inner);
  const flaps = [];
  for(const sz of [-1,1]){
    const piv = new THREE.Group();
    piv.position.set(0, .5, sz*.36);
    const fm = new THREE.Mesh(new THREE.BoxGeometry(.7,.05,.36), dark);
    fm.position.z = -sz*.18; fm.castShadow = true;
    piv.add(fm); g.add(piv);
    flaps.push({piv:piv, sz:sz, open:0});
  }
  const tape = mat(0xe3d3ae);
  const tapeTop = new THREE.Mesh(new THREE.BoxGeometry(.3,.012,.78), tape);
  tapeTop.position.set(0,.505,0); g.add(tapeTop);
  const tapeSide = new THREE.Mesh(new THREE.BoxGeometry(.76,.012,.09), tape);
  tapeSide.position.set(0,.503,.29); g.add(tapeSide);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(.46,.24),
    new THREE.MeshLambertMaterial({map: signTexture(PMAP[pid].name + ' ×' + qty, '', '#fff7e8', '#2b2118')})
  );
  label.position.set(0, .27, .372);
  g.add(label);
  const c = {
    group: g, pid: pid, qty: qty, opened: false, carried: false,
    flaps: flaps, openAmt: 0, contents: []
  };
  return c;
}

function refreshCrateContents(c){
  for(const m of c.contents) c.group.remove(m);
  c.contents.length = 0;
  if(!c.opened) return;
  const n = Math.min(3, c.qty);
  for(let i=0;i<n;i++){
    const m = productMesh(c.pid);
    m.scale.setScalar(0.85);
    m.position.set((i-1)*0.2, 0.34, 0);
    c.group.add(m);
    c.contents.push(m);
  }
}

function openCrate(c){
  c.opened = true;
  refreshCrateContents(c);
  AU.openBox();
  toast('Karton geöffnet – Produkte einzeln entnehmen', 'good');
}

function crateInteract(c){
  if(!c.opened){
    if(player.held){ toast('Hände voll – erst ablegen', 'bad'); AU.err(); return; }
    // Draußen an der Rampe: aufnehmen und in den Laden tragen.
    if(c.group.position.z > 8.0){
      setHeld({kind:'crate', crate:c});
      AU.pick();
      toast('Karton aufgenommen – im Laden abstellen und öffnen');
      return;
    }
    openCrate(c);
    return;
  }
  if(player.held){ toast('Hände voll – erst ablegen', 'bad'); AU.err(); return; }
  if(c.qty <= 0){ toast('Karton ist leer'); return; }
  c.qty--;
  refreshCrateContents(c);
  setHeld({kind:'product', pid:c.pid});
  AU.pick();
  if(c.qty <= 0){
    removeCrate(c);
    toast('Karton geleert', 'good');
  }
}

function pickCrate(c){
  if(player.held){ toast('Hände voll', 'bad'); AU.err(); return; }
  setHeld({kind:'crate', crate:c});
  AU.pick();
}

function dropCrate(){
  const o = player.held;
  if(!o || o.kind !== 'crate') return;
  const c = o.crate;
  const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
  const px = clamp(player.pos.x + fx*1.0, -13.5, 14);
  const pz = clamp(player.pos.z + fz*1.0, -9, 13);
  player.holder.remove(c.group);
  world.add(c.group);
  c.group.position.set(px, 0, pz);
  c.group.rotation.set(0, camYaw + holdYaw, 0);
  c.group.scale.setScalar(1);
  c.carried = false;
  player.held = null;
  holdYaw = 0;
  AU.place();
}

function removeCrate(c){
  if(c.carried) return;
  world.remove(c.group);
  const i = crates.indexOf(c);
  if(i >= 0) crates.splice(i, 1);
}

function updateCrates(dt){
  for(const c of crates){
    if(c.opened && c.openAmt < 1){
      c.openAmt = Math.min(1, c.openAmt + dt*2.4);
      for(const f of c.flaps){
        f.piv.rotation.x = -f.sz * f.openAmt * 1.9;
      }
    }
    if(!c.carried){
      c.group.position.y = 0;
    }
  }
}

/* ==========================================================
   Lieferung & Bestellung
   ========================================================== */
let rampCount = 0;
function nextRampSpot(){
  const i = rampCount++ % 9;
  const col = i % 3, row = Math.floor(i/3);
  return new THREE.Vector3(-6.9 + col*1.15, 0, 10.0 + row*1.1);
}

function stockOf(pid){
  let n = 0;
  for(const s of shelves) n += s.count(pid);
  for(const c of crates) if(c.pid === pid) n += c.qty;
  return n;
}

function orderProduct(pid){
  const p = PMAP[pid];
  const cost = p.buy*10 + 4;
  if(state.money < cost){ toast('Nicht genug Geld für diese Bestellung', 'bad'); AU.err(); return; }
  state.money -= cost;
  state.expenses += cost;
  const c = makeCrate(pid, 10);
  const spot = nextRampSpot();
  c.group.position.copy(spot);
  c.group.rotation.y = rnd(-0.2, 0.2);
  world.add(c.group);
  crates.push(c);
  AU.ok();
  toast('Lieferung: ' + p.name + ' ×10 · ' + eur(cost), 'good');
  updateHUD();
}

/* ==========================================================
   Terminal-UI
   ========================================================== */
const UPGRADES = [
  {id:'unlock_frozen', name:'Tiefkühl-Sortiment freischalten', desc:'Tiefkühlpizza & Eis werden bestellbar.', cost:250},
  {id:'unlock_care',   name:'Körperpflege freischalten',       desc:'Shampoo & Zahnpasta werden bestellbar.', cost:250},
  {id:'shelf1',        name:'Zusätzliches Regal',               desc:'Ein weiteres Regal an der linken Wand.', cost:180},
  {id:'register2',     name:'Zweite Kasse aufstellen',          desc:'Kürzere Warteschlangen, mehr Kunden pro Tag.', cost:650},
  {id:'employee',      name:'Mitarbeiter einstellen',           desc:'Räumt offene Kartons automatisch ein.', cost:450}
];

function renderOrderList(){
  const el = $('#orderList');
  el.innerHTML = '';
  for(const p of PRODUCTS){
    if(!state.unlocked[p.cat]) continue;
    const row = document.createElement('div');
    row.className = 'pitem';
    row.innerHTML = '<div class="nm">' + p.name + '<span>' + CATS[p.cat] + '</span></div>' +
      '<div class="price">EK ' + eur(p.buy) + '</div>' +
      '<div class="stocktag">Regal: ' + stockOf(p.id) + '</div>' +
      '<button class="btn small primary">10 Stück</button>';
    const btn = row.querySelector('button');
    btn.onclick = () => { orderProduct(p.id); renderOrderList(); renderPriceList(); };
    if(state.money < p.buy*10 + 4) btn.disabled = true;
    el.appendChild(row);
  }
}

function renderPriceList(){
  const el = $('#priceList');
  el.innerHTML = '';
  for(const p of PRODUCTS){
    if(!state.unlocked[p.cat]) continue;
    const row = document.createElement('div');
    row.className = 'pitem';
    row.innerHTML = '<div class="nm">' + p.name + '<span>EK ' + eur(p.buy) + ' · empfohlen ' + eur(p.sell) + '</span></div>' +
      '<div class="price">VK</div>' +
      '<input type="number" step="0.1" min="0.1" value="' + state.prices[p.id].toFixed(2) + '" />' +
      '<div class="stocktag">' + stockOf(p.id) + ' Stk</div>';
    const inp = row.querySelector('input');
    inp.onchange = () => {
      const v = parseFloat(inp.value);
      if(!isFinite(v) || v <= 0){ inp.value = state.prices[p.id].toFixed(2); return; }
      state.prices[p.id] = Math.max(0.1, Math.round(v*100)/100);
      toast(p.name + ': neuer Preis ' + eur(state.prices[p.id]), 'good');
    };
    el.appendChild(row);
  }
}

function renderUpgradeList(){
  const el = $('#upgradeList');
  el.innerHTML = '';
  for(const u of UPGRADES){
    const done = !!state.upgrades[u.id];
    const row = document.createElement('div');
    row.className = 'pitem';
    row.innerHTML = '<div class="nm">' + u.name + '<span>' + u.desc + '</span></div>' +
      '<div class="price">' + eur(u.cost) + '</div>' +
      '<div class="stocktag">' + (done ? 'gekauft' : '') + '</div>' +
      '<button class="btn small ' + (done ? '' : 'primary') + '">' + (done ? '✓' : 'Kaufen') + '</button>';
    const btn = row.querySelector('button');
    if(done) btn.disabled = true;
    else btn.onclick = () => buyUpgrade(u);
    if(!done && state.money < u.cost) btn.disabled = true;
    el.appendChild(row);
  }
}

function buyUpgrade(u){
  if(state.upgrades[u.id]) return;
  if(state.money < u.cost){ toast('Nicht genug Geld', 'bad'); AU.err(); return; }
  state.money -= u.cost;
  state.expenses += u.cost;
  state.upgrades[u.id] = 1;
  if(u.id === 'unlock_frozen'){ state.unlocked.frozen = 1; }
  if(u.id === 'unlock_care'){ state.unlocked.care = 1; }
  if(u.id === 'shelf1'){ shelves.push(new Shelf({type:'normal', x:-9.7, z:5.6, rot:Math.PI/2})); }
  if(u.id === 'register2'){ buildRegister(4.6, 3.0); }
  if(u.id === 'employee'){ hireEmployee(); }
  AU.cash();
  toast('Gekauft: ' + u.name, 'good');
  renderUpgradeList(); renderOrderList(); renderPriceList(); updateHUD();
  saveGame();
}

function openOrder(){
  panelOpen = true;
  gameState = 'panel';
  document.exitPointerLock && document.exitPointerLock();
  renderOrderList(); renderPriceList(); renderUpgradeList();
  $('#order').classList.add('show');
}
function closeOrder(){
  panelOpen = false;
  gameState = 'play';
  $('#order').classList.remove('show');
}

function toast(msg, type){
  const el = document.createElement('div');
  if(type) el.className = type;
  el.textContent = msg;
  $('#toast').appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .35s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 360);
  }, 2500);
}
