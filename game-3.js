/* ==========================================================
   Spieler, Kamera, Steuerung, Interaktion, Bestellung
   ========================================================== */
const player = {
  pos: new THREE.Vector3(0, 0, 5.8), yaw: Math.PI, group: null,
  legL: null, legR: null, armL: null, armR: null, holder: null,
  phase: 0, held: null, speed: 4.4, radius: 0.38
};
let camYaw = Math.PI, camPitch = -0.2;
const camDist = 4.9;
let gameState = 'menu';   // menu | play | paused | panel | closed
let panelOpen = false;
let target = null;
const keys = {};
const mobileMove = {active:false, x:0, y:0};

function buildPlayer(){
  const g = new THREE.Group();
  const skin = mat(0xffcf9f), shirt = mat(0xff6b57), pants = mat(0x3d5a80);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.58,.64,.36), shirt);
  torso.position.y = 1.12; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.48,.44,.44), skin);
  head.position.y = 1.68; head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.BoxGeometry(.52,.14,.48), mat(0x3a2a1e));
  hair.position.y = 1.9; g.add(hair);
  const eyeGeo = new THREE.BoxGeometry(.07,.09,.03), eyeMat = mat(0x241a12);
  const e1 = new THREE.Mesh(eyeGeo, eyeMat); e1.position.set(-.11,1.7,.225); g.add(e1);
  const e2 = new THREE.Mesh(eyeGeo, eyeMat); e2.position.set(.11,1.7,.225); g.add(e2);
  const armGeo = new THREE.BoxGeometry(.16,.52,.18); armGeo.translate(0,-.26,0);
  const armL = new THREE.Mesh(armGeo, shirt); armL.position.set(-.38,1.4,0); armL.castShadow = true; g.add(armL);
  const armR = new THREE.Mesh(armGeo, shirt); armR.position.set(.38,1.4,0); armR.castShadow = true; g.add(armR);
  const legGeo = new THREE.BoxGeometry(.2,.56,.22); legGeo.translate(0,-.28,0);
  const legL = new THREE.Mesh(legGeo, pants); legL.position.set(-.15,.62,0); legL.castShadow = true; g.add(legL);
  const legR = new THREE.Mesh(legGeo, pants); legR.position.set(.15,.62,0); legR.castShadow = true; g.add(legR);
  const holder = new THREE.Group(); holder.position.set(0,1.02,.52); g.add(holder);
  g.position.copy(player.pos);
  scene.add(g);
  player.group = g; player.legL = legL; player.legR = legR;
  player.armL = armL; player.armR = armR; player.holder = holder;
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

/* ---------- Kamera ---------- */
const camTarget = new THREE.Vector3();
function updateCamera(dt){
  const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  camTarget.set(
    player.pos.x - Math.sin(camYaw)*camDist*cp,
    1.45 + camDist*sp,
    player.pos.z - Math.cos(camYaw)*camDist*cp
  );
  if(camTarget.y < 0.8) camTarget.y = 0.8;
  camera.position.lerp(camTarget, 1 - Math.pow(0.0008, dt));
  camera.lookAt(player.pos.x, 1.35, player.pos.z);
}

/* ---------- Spieler-Update ---------- */
function updatePlayer(dt){
  const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
  const rx = -Math.cos(camYaw), rz = Math.sin(camYaw);
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
    moving = true;
    player.phase += dt*9;
  } else {
    player.phase += dt*1.5;
  }
  player.group.rotation.y = camYaw;
  resolveCollisions(player.pos, player.radius);
  player.group.position.x = player.pos.x;
  player.group.position.z = player.pos.z;
  player.group.position.y = moving ? Math.abs(Math.sin(player.phase))*0.045 : 0;
  const sw = moving ? Math.sin(player.phase)*0.55 : Math.sin(player.phase*0.4)*0.04;
  player.legL.rotation.x = sw;
  player.legR.rotation.x = -sw;
  player.armL.rotation.x = -sw*0.7;
  player.armR.rotation.x = (player.held ? -1.25 : sw*0.7);
  if(moving && Math.random() < dt*3.4) AU.step();
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
  const f = new THREE.Vector3(Math.sin(camYaw), 0, Math.cos(camYaw));
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
    g.position.set(0, 0, 0);
    g.rotation.set(0, 0, 0);
    g.scale.setScalar(0.86);
    h.add(g);
    obj.crate.carried = true;
  } else {
    h.add(productMesh(obj.pid));
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
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(.46,.24),
    new THREE.MeshLambertMaterial({map: signTexture(PMAP[pid].name, '', '#fff7e8', '#2b2118')})
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
  const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
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
