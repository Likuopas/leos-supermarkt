/* ==========================================================
   Mitarbeiter
   ========================================================== */
function hireEmployee(){
  const m = makeShopperMesh(1.04, {shirt:0xfffaf0, pants:0x2f3b4a, apron:0x39cf9b, cap:0x1aa38a});
  m.group.position.set(-1, 0, -6);
  scene.add(m.group);
  employees.push({group:m.group, mesh:m, timer:1.5, phase:0});
}

function updateEmployees(dt){
  for(const e of employees){
    e.timer -= dt;
    e.phase += dt*2;
    e.group.position.y = Math.abs(Math.sin(e.phase))*0.03;
    if(e.timer > 0) continue;
    e.timer = 1.8;
    let done = false;
    for(const c of crates){
      if(!c.opened || c.qty <= 0) continue;
      const cat = PMAP[c.pid].cat;
      const target = shelves.find(s => s.accepts(cat) && s.firstEmpty(cat));
      if(!target) continue;
      target.addProduct(target.firstEmpty(cat), c.pid);
      c.qty--;
      refreshCrateContents(c);
      AU.place();
      e.group.position.set(target.front.x, 0, target.front.z);
      if(c.qty <= 0) removeCrate(c);
      done = true;
      break;
    }
    if(!done){
      e.group.position.set(rnd(-3,3), 0, rnd(-1,3));
    }
  }
}

/* ==========================================================
   Zeit, Tag, HUD
   ========================================================== */
let spawnTimer = 4;
let navTimer = 0;
let hudTimer = 0;

function updateTime(dt){
  if(!state.open) return;
  state.minutes += dt*2.2;
  if(state.minutes >= 20*60) endDay();
  const hour = state.minutes/60;
  const dayF = clamp(Math.sin((hour - 6)/12*Math.PI), 0, 1);
  sun.intensity = 0.25 + dayF*1.05;
  sun.position.set(Math.cos((hour/24)*Math.PI*2)*22, 12 + dayF*16, 12);
  sun.color.setHSL(0.11, 0.55, 0.55 + dayF*0.22);
  scene.background.setHSL(0.56, 0.62, 0.45 + dayF*0.28);
  scene.fog.color.copy(scene.background);
  lampWarm.intensity = 0.35 + (1-dayF)*0.75;
  lampCool.intensity = 0.3 + (1-dayF)*0.5;
}

function updateSpawns(dt){
  navTimer -= dt;
  if(navTimer <= 0){ navTimer = 3; navReset(); }
  if(!state.open) return;
  spawnTimer -= dt;
  const maxCust = Math.min(12, 4 + Math.floor(state.day*0.7) + (state.upgrades.register2 ? 3 : 0));
  if(spawnTimer <= 0 && shoppers.length < maxCust){
    spawnTimer = rnd(2.5, 6);
    shoppers.push(new Shopper());
  }
}

function updateDoor(dt){
  let near = Math.hypot(player.pos.x, player.pos.z - 8.2) < 3.4;
  if(!near){
    for(const s of shoppers){
      if(Math.hypot(s.pos.x, s.pos.z - 8.2) < 3.0){ near = true; break; }
    }
  }
  const want = (state.open && near) ? 1 : 0;
  const prev = doorOpen;
  doorOpen += (want - doorOpen) * Math.min(1, dt*7);
  for(const p of doorPanels) p.mesh.position.x = p.base + p.dir*doorOpen*1.45;
  if(prev < 0.15 && doorOpen >= 0.15) AU.door();
}

function updateHUD(){
  $('#hudMoney').textContent = eur(state.money);
  $('#hudDay').textContent = 'Tag ' + state.day;
  const hh = Math.floor(state.minutes/60), mm = Math.floor(state.minutes%60);
  $('#hudTime').textContent = (hh<10?'0':'') + hh + ':' + (mm<10?'0':'') + mm;
  $('#hudCust').textContent = state.custToday;
  $('#hudRev').textContent = eur(state.revenue);

  let stock = 0;
  for(const s of shelves) for(const sl of s.slots) if(sl.pid) stock++;
  const openCrates = crates.filter(c => c.qty > 0).length;
  const waiting = shoppers.filter(s => s.state === 'wait' || s.state === 'queue' || s.state === 'unload').length;
  let txt;
  if(waiting > 0) txt = 'Kunden an der Kasse bedienen (' + waiting + ' wartet)';
  else if(openCrates > 0) txt = 'Kartons öffnen und Produkte ins Regal räumen';
  else if(stock < 10) txt = 'Am Terminal Ware bestellen';
  else txt = 'Kunden bedienen · Regale auffüllen';
  $('#objText').textContent = txt;

  const near = registers.find(r => Math.hypot(player.pos.x - r.x, player.pos.z - r.z) < 5);
  const rp = $('#receipt');
  if(near && (near.items.length || near.total > 0 || (near.lastSale && performance.now() - near.lastSale.at < 8000))){
    renderReceipt(near);
    rp.classList.remove('hidden');
  } else {
    rp.classList.add('hidden');
  }
}

function toggleStore(){
  if(gameState !== 'play') return;
  if(state.open){
    endDay();
  } else {
    state.open = true;
    AU.door();
    toast('Laden geöffnet', 'good');
  }
}

function endDay(){
  if(gameState === 'summary') return;
  state.open = false;
  panelOpen = true;
  gameState = 'summary';
  document.exitPointerLock && document.exitPointerLock();
  const profit = state.revenue - state.expenses;
  $('#sumGrid').innerHTML =
    cell('Kunden', String(state.custToday)) +
    cell('Verkaufte Produkte', String(state.soldToday)) +
    cell('Umsatz', eur(state.revenue), 'good') +
    cell('Ausgaben', eur(state.expenses), 'bad') +
    cell('Reingewinn', eur(profit), profit >= 0 ? 'good' : 'bad') +
    cell('Kontostand', eur(state.money));
  const ev = [];
  if(state.disappointed > 0) ev.push(state.disappointed + '× leeres Regal');
  if(shoppers.some(s => s.state === 'wait')) ev.push('Kunden warteten an der Kasse');
  $('#sumEvents').textContent = ev.length ? ('Ereignisse: ' + ev.join(' · ')) : 'Ruhiger Tag ohne besondere Vorkommnisse.';
  $('#summary').classList.add('show');
  saveGame();
}

function cell(k, v, cls){
  return '<div class="sum-cell ' + (cls||'') + '"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>';
}

function nextDay(){
  state.day++;
  state.minutes = 8*60;
  state.revenue = 0;
  state.expenses = 0;
  state.custToday = 0;
  state.soldToday = 0;
  state.disappointed = 0;
  state.open = true;
  $('#summary').classList.remove('show');
  panelOpen = false;
  gameState = 'play';
  saveGame();
  updateHUD();
  toast('Tag ' + state.day + ' beginnt – viel Erfolg!', 'good');
}

/* ==========================================================
   Speichern / Laden
   ========================================================== */
const GKEY = 'leosuper_save_v1';
function hasSave(){ return !!localStorage.getItem(GKEY); }

function saveGame(){
  if(gameState === 'menu') return;
  try{
    const data = {
      money: state.money, day: state.day, minutes: state.minutes,
      prices: state.prices, unlocked: state.unlocked, upgrades: state.upgrades,
      shelves: shelves.map(s => ({type:s.type, slots:s.slots.map(x => x.pid)}))
    };
    localStorage.setItem(GKEY, JSON.stringify(data));
  }catch(e){}
}

function loadGame(){
  const raw = localStorage.getItem(GKEY);
  if(!raw) return false;
  try{
    const d = JSON.parse(raw);
    state.money = d.money;
    state.day = d.day;
    state.minutes = d.minutes;
    state.prices = Object.assign(state.prices, d.prices || {});
    state.unlocked = Object.assign(state.unlocked, d.unlocked || {});
    state.upgrades = d.upgrades || {};
    if(d.shelves){
      d.shelves.forEach((sv, i) => {
        const s = shelves[i];
        if(!s) return;
        for(const slot of s.slots){ if(slot.mesh) slot.node.remove(slot.mesh); slot.pid = null; slot.mesh = null; }
        (sv.slots || []).forEach((pid, j) => {
          if(pid && s.slots[j]) s.addProduct(s.slots[j], pid);
        });
      });
    }
    if(state.upgrades.shelf1 && shelves.length < 15) shelves.push(new Shelf({type:'normal', x:-9.7, z:5.6, rot:Math.PI/2}));
    if(state.upgrades.register2 && registers.length < 2) buildRegister(4.6, 3.0);
    if(state.upgrades.employee && employees.length === 0) hireEmployee();
    navReset();
    return true;
  }catch(e){ return false; }
}

/* ==========================================================
   UI-Steuerung
   ========================================================== */
let settingsFrom = 'menu';

function isMobile(){
  if(S.platform === 'mobile') return true;
  if(S.platform === 'pc') return false;
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua) || (('ontouchstart' in window) && window.innerWidth < 900);
}

function openSettings(from){
  settingsFrom = from || 'menu';
  $('#menu').classList.remove('show');
  $('#pause').classList.remove('show');
  $('#settings').classList.add('show');
}

function closeSettings(){
  $('#settings').classList.remove('show');
  if(settingsFrom === 'pause') $('#pause').classList.add('show');
  else $('#menu').classList.add('show');
}

function applySettingsChange(){
  applyGraphics();
  AU.vol();
  const touch = isMobile();
  document.body.classList.toggle('touch', touch);
  $('#touch').classList.toggle('hidden', !(gameState === 'play' && touch));
}

function initUI(){
  const setVal = (id, v) => { const el = $('#'+id); if(el) el.value = String(v); };
  setVal('setRes', S.res);
  setVal('setQuality', S.quality);
  setVal('setShadows', S.shadows);
  setVal('setVsync', S.vsync);
  setVal('setMode', S.mode);
  setVal('setFps', S.fps);
  setVal('setPlatform', S.platform);
  setVal('setSens', S.sens);
  $('#setSensV').textContent = Number(S.sens).toFixed(1);
  $('#setMaster').value = S.master;
  $('#setMusic').value = S.music;
  $('#setSfx').value = S.sfx;

  const sel = (id, key, isNum) => {
    const el = $('#'+id);
    if(!el) return;
    el.onchange = () => {
      S[key] = isNum ? Number(el.value) : el.value;
      saveSet(); applySettingsChange();
      if(key === 'mode') applyDisplayMode();
    };
  };
  sel('setRes', 'res', false);
  sel('setQuality', 'quality', false);
  sel('setShadows', 'shadows', true);
  sel('setVsync', 'vsync', true);
  sel('setMode', 'mode', false);
  sel('setFps', 'fps', true);
  sel('setPlatform', 'platform', false);

  $('#setSens').oninput = e => { S.sens = Number(e.target.value); $('#setSensV').textContent = S.sens.toFixed(1); saveSet(); };
  $('#setMaster').oninput = e => { S.master = Number(e.target.value); saveSet(); AU.vol(); };
  $('#setMusic').oninput = e => { S.music = Number(e.target.value); saveSet(); AU.vol(); };
  $('#setSfx').oninput = e => { S.sfx = Number(e.target.value); saveSet(); AU.vol(); };

  $('#btnSettings').onclick = () => openSettings('menu');
  $('#btnPauseSettings').onclick = () => openSettings('pause');
  $('#btnSetBack').onclick = closeSettings;
  $('#btnCredits').onclick = () => $('#credits').classList.add('show');
  $('#btnCreditsBack').onclick = () => $('#credits').classList.remove('show');
  $('#btnQuit').onclick = () => {
    try{ window.close(); }catch(e){}
    toast('Der Browser schließt Tabs nicht selbst – Tab bitte einfach zumachen.', 'bad');
  };

  $('#btnPlay').onclick = () => { newGame(); startGame(); };
  $('#btnContinue').onclick = () => { loadGame(); startGame(); };
  $('#btnResume').onclick = () => setPause(false);
  $('#btnSave').onclick = () => { saveGame(); toast('Spiel gespeichert', 'good'); AU.ok(); };
  $('#btnToMenu').onclick = () => {
    saveGame();
    if(player.view) player.view.visible = false;
    if(ceiling) ceiling.visible = false;
    panelOpen = false; gameState = 'menu';
    $('#pause').classList.remove('show');
    $('#hud').classList.add('hidden');
    $('#touch').classList.add('hidden');
    $('#menu').classList.add('show');
    document.exitPointerLock && document.exitPointerLock();
  };
  $('#btnOrderClose').onclick = closeOrder;
  $('#btnNextDay').onclick = nextDay;
  $('#closeStore').onclick = () => { if(gameState === 'play') endDay(); };

  document.querySelectorAll('#order .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#order .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const name = tab.getAttribute('data-tab');
      $('#tabOrder').classList.toggle('hidden', name !== 'order');
      $('#tabPrice').classList.toggle('hidden', name !== 'price');
      $('#tabUpgrade').classList.toggle('hidden', name !== 'upgrade');
    };
  });
}

/* ==========================================================
   Eingabe
   ========================================================== */
function requestLock(){
  if(isMobile() || panelOpen) return;
  if(canvas.requestPointerLock) canvas.requestPointerLock();
}

document.addEventListener('pointerlockchange', () => {
  document.body.classList.toggle('locked', !!document.pointerLockElement);
});

canvas.addEventListener('mousedown', e => {
  if(gameState !== 'play' || panelOpen) return;
  if(e.button !== 0) return;
  if(!document.pointerLockElement){ requestLock(); return; }
  interact();
});

document.addEventListener('mousemove', e => {
  if(!document.pointerLockElement) return;
  camYaw -= e.movementX * 0.0022 * S.sens;
  camPitch = clamp(camPitch - e.movementY * 0.0022 * S.sens, -1.25, 1.25);
});

window.addEventListener('keydown', e => {
  if(e.code === 'Escape'){
    if(gameState === 'paused'){ setPause(false); return; }
    if(panelOpen){ closeOrder(); return; }
    if(gameState === 'play'){ setPause(true); return; }
  }
  if(gameState !== 'play' || panelOpen) return;
  if(e.code === 'KeyE' || e.code === 'Enter'){ interact(); e.preventDefault(); return; }
  if(e.code === 'KeyR' && player.held && player.held.kind === 'crate'){
    holdYaw = (holdYaw + Math.PI/2) % (Math.PI*2);
    player.held.crate.group.rotation.y = holdYaw;
    return;
  }
  keys[e.code] = true;
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('resize', () => { applyGraphics(); });

let holdYaw = 0;

function initTouch(){
  const stick = $('#stick'), knob = $('#knob');
  let sid = null, cx = 0, cy = 0, R = 46;
  const move = t => {
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const d = Math.hypot(dx, dy);
    if(d > R){ dx = dx/d*R; dy = dy/d*R; }
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    mobileMove.active = true;
    mobileMove.x = dx/R;
    mobileMove.y = dy/R;
  };
  stick.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    sid = t.identifier;
    const r = stick.getBoundingClientRect();
    cx = r.left + r.width/2; cy = r.top + r.height/2;
    move(t);
  }, {passive:false});
  stick.addEventListener('touchmove', e => {
    e.preventDefault();
    for(const t of e.changedTouches) if(t.identifier === sid) move(t);
  }, {passive:false});
  const endStick = e => {
    for(const t of e.changedTouches) if(t.identifier === sid){
      sid = null;
      mobileMove.active = false; mobileMove.x = 0; mobileMove.y = 0;
      knob.style.transform = 'translate(0,0)';
    }
  };
  stick.addEventListener('touchend', endStick);
  stick.addEventListener('touchcancel', endStick);

  const look = $('#lookzone');
  let lid = null, lx = 0, ly = 0;
  look.addEventListener('touchstart', e => {
    const t = e.changedTouches[0];
    lid = t.identifier; lx = t.clientX; ly = t.clientY;
  }, {passive:true});
  look.addEventListener('touchmove', e => {
    e.preventDefault();
    for(const t of e.changedTouches){
      if(t.identifier !== lid) continue;
      const dx = t.clientX - lx, dy = t.clientY - ly;
      lx = t.clientX; ly = t.clientY;
      camYaw -= dx * 0.005 * S.sens;
      camPitch = clamp(camPitch - dy * 0.004 * S.sens, -1.25, 1.25);
    }
  }, {passive:false});
  look.addEventListener('touchend', e => {
    for(const t of e.changedTouches) if(t.identifier === lid) lid = null;
  });

  $('#tAct').addEventListener('touchstart', e => { e.preventDefault(); interact(); }, {passive:false});
  $('#tOpen').addEventListener('touchstart', e => { e.preventDefault(); if(!panelOpen) openOrder(); }, {passive:false});
  $('#tDrop').addEventListener('touchstart', e => { e.preventDefault(); if(player.held && player.held.kind === 'crate') dropCrate(); }, {passive:false});
}

/* ==========================================================
   Spielablauf
   ========================================================== */
function setPause(on){
  if(on){
    gameState = 'paused';
    panelOpen = true;
    $('#pause').classList.add('show');
    document.exitPointerLock && document.exitPointerLock();
  } else {
    gameState = 'play';
    panelOpen = false;
    $('#pause').classList.remove('show');
    requestLock();
  }
}

function newGame(){
  state.money = 620;
  state.day = 1;
  state.minutes = 8*60;
  state.open = true;
  state.revenue = 0;
  state.expenses = 0;
  state.custToday = 0;
  state.soldToday = 0;
  state.disappointed = 0;
  state.dayEvents = [];
  PRODUCTS.forEach(p => state.prices[p.id] = p.sell);
  localStorage.removeItem(GKEY);
}

function startGame(){
  $('#menu').classList.remove('show');
  $('#hud').classList.remove('hidden');
  if(player.view) player.view.visible = true;
  if(ceiling) ceiling.visible = true;
  camPitch = -0.04;
  gameState = 'play';
  panelOpen = false;
  AU.init();
  const touch = isMobile();
  document.body.classList.toggle('touch', touch);
  if(touch) $('#touch').classList.remove('hidden');
  updateHUD();
  requestLock();
}

function starterStock(){
  for(const s of shelves){
    const pool = PRODUCTS.filter(p => state.unlocked[p.cat] && s.accepts(p.cat));
    for(const p of pool){
      let n = 2;
      while(n-- > 0){
        const slot = s.firstEmpty(p.cat);
        if(!slot) break;
        s.addProduct(slot, p.id);
      }
    }
  }
}

function updateGame(dt){
  updatePlayer(dt);
  updateCamera(dt);
  updateCrates(dt);
  updateRegisters(dt);
  updateShoppers(dt);
  updateEmployees(dt);
  updateTime(dt);
  updateSpawns(dt);
  updateDoor(dt);
  updateTarget();
  hudTimer -= dt;
  if(hudTimer <= 0){ hudTimer = 0.25; updateHUD(); }
}

/* ==========================================================
   Hauptschleife
   ========================================================== */
let lastT = performance.now();
let renderAcc = 0;
let lastHudTime = 0;

function frame(now){
  requestAnimationFrame(frame);
  let dt = (now - lastT)/1000;
  lastT = now;
  if(dt > 0.1) dt = 0.1;

  if(gameState === 'play' && !panelOpen) updateGame(dt);
  else if(gameState === 'summary' || gameState === 'paused' || gameState === 'panel'){
    updateCamera(Math.min(dt, 0.05));
  }

  renderAcc += dt;
  const lim = S.fps > 0 ? 1/S.fps : 0;
  if(lim && renderAcc < lim) return;
  renderAcc = 0;
  renderer.render(scene, camera);
}

/* ==========================================================
   Start
   ========================================================== */
buildWorld();
buildPlayer();
buildRegister(7.4, 3.0);
starterStock();
navReset();
initUI();
initTouch();
applyGraphics();
onResize();

$('#loading').style.display = 'none';
if(hasSave()) $('#btnContinue').classList.remove('hidden');
updateHUD();

/* Kamerablick fürs Hauptmenü */
camera.position.set(9.5, 6.6, 15.5);
camera.lookAt(0, 1.2, 0);
scene.background.setHSL(0.56, 0.62, 0.6);

requestAnimationFrame(frame);
