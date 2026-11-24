/* ==========================================================
   Kasse
   ========================================================== */
function buildRegister(x, z){
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  world.add(g);
  const bodyMat = mat(0xf6efe3), dark = mat(0x2e3944), metal = mat(0x9aa7b4);
  const M = m => { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };

  /* Theke */
  M(new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.0, 1.0), bodyMat)).position.set(0, .5, -1.9);
  M(new THREE.Mesh(new THREE.BoxGeometry(1.76, .09, 1.06), mat(0x4fb6ff))).position.set(0, 1.02, -1.9);
  M(new THREE.Mesh(new THREE.BoxGeometry(1.72, .35, 1.02), mat(0xe8ddc9))).position.set(0, .18, -1.9);
  M(new THREE.Mesh(new THREE.BoxGeometry(1.74, .05, 1.04), mat(0x2f3a42))).position.set(0, .03, -1.9);
  for(let i=0;i<4;i++){
    M(new THREE.Mesh(new THREE.BoxGeometry(.05, .28, 1.035), mat(0xdfd3bd))).position.set(-.6 + i*.4, .21, -1.9);
  }
  /* Kassenschublade */
  M(new THREE.Mesh(new THREE.BoxGeometry(1.0, .18, .06), dark)).position.set(0, .28, -2.42);
  M(new THREE.Mesh(new THREE.BoxGeometry(.26, .05, .08), mat(0xffc93c))).position.set(0, .28, -2.46);

  /* Warenband */
  M(new THREE.Mesh(new THREE.BoxGeometry(1.02, .14, 3.0), dark)).position.set(0, .86, 0);
  M(new THREE.Mesh(new THREE.BoxGeometry(.18, .8, 3.0), metal)).position.set(0, .4, 0);
  for(const sx of [-1,1]){
    M(new THREE.Mesh(new THREE.BoxGeometry(.05, .07, 3.02), mat(0xb6c0ca))).position.set(sx*.53, .965, 0);
    M(new THREE.Mesh(new THREE.BoxGeometry(.06, .24, .06), mat(0x9aa7b4))).position.set(sx*.53, .83, 1.44);
    M(new THREE.Mesh(new THREE.BoxGeometry(.06, .24, .06), mat(0x9aa7b4))).position.set(sx*.53, .83, -1.44);
  }
  M(new THREE.Mesh(new THREE.BoxGeometry(1.08, .06, .08), mat(0x39424c))).position.set(0, .99, 1.48);
  M(new THREE.Mesh(new THREE.BoxGeometry(1.08, .06, .08), mat(0x39424c))).position.set(0, .99, -1.48);

  const rollers = [];
  for(let i=0;i<8;i++){
    const r = new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.94,8), mat(0x8d99a4));
    r.rotation.z = Math.PI/2;
    r.position.set(0, .945, -1.4 + i*0.4);
    g.add(r); rollers.push(r);
  }

  /* Scanner */
  M(new THREE.Mesh(new THREE.BoxGeometry(.36, .09, .34), mat(0x3a4550))).position.set(.64, .985, -1.05);
  M(new THREE.Mesh(new THREE.BoxGeometry(.3, .022, .28), mat(0x7fe6c2))).position.set(.64, 1.028, -1.05);
  const laser = new THREE.Mesh(new THREE.BoxGeometry(.26, .01, .01),
    new THREE.MeshBasicMaterial({color:0xff3b3b}));
  laser.position.set(.64, 1.042, -1.05);
  g.add(laser);
  M(new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .1), mat(0xff6b57))).position.set(.64, 1.09, -.87);

  /* Karten-Terminal + Tasten */
  const term = M(new THREE.Mesh(new THREE.BoxGeometry(.24, .07, .17), mat(0x39424c)));
  term.position.set(-.5, 1.1, -1.6); term.rotation.x = -0.35;
  const termScreen = M(new THREE.Mesh(new THREE.PlaneGeometry(.17, .09),
    new THREE.MeshLambertMaterial({color:0x8ef0b8, emissive:0x39cf9b, emissiveIntensity:.6})));
  termScreen.position.set(-.5, 1.135, -1.545); termScreen.rotation.x = -0.35;
  for(let i=0;i<9;i++){
    const key = M(new THREE.Mesh(new THREE.BoxGeometry(.034,.01,.028), mat(0xd7dee4)));
    key.position.set(-.555 + (i%3)*.055, 1.078, -1.628 + Math.floor(i/3)*.042);
    key.rotation.x = -0.35;
  }

  /* Bon-Drucker */
  M(new THREE.Mesh(new THREE.BoxGeometry(.34, .22, .26), mat(0xdad3c6))).position.set(-.68, 1.16, -1.98);
  M(new THREE.Mesh(new THREE.BoxGeometry(.22, .014, .22), mat(0xfffaf0))).position.set(-.68, 1.28, -1.98);
  const paper = M(new THREE.Mesh(new THREE.BoxGeometry(.2, .15, .008), mat(0xfffdf7)));
  paper.position.set(-.68, 1.34, -2.1); paper.rotation.x = -0.12;

  /* Monitor */
  const mon = M(new THREE.Mesh(new THREE.BoxGeometry(.66, .46, .08), mat(0x2b2f36)));
  mon.position.set(-.58, 1.36, -1.55);
  mon.rotation.y = .6;
  M(new THREE.Mesh(new THREE.BoxGeometry(.06, .3, .06), mat(0x2b2f36))).position.set(-.58, 1.06, -1.62);
  const monScreen = new THREE.Mesh(new THREE.PlaneGeometry(.54, .34),
    new THREE.MeshLambertMaterial({map: signTexture('KASSE 1', 'bereit', '#2ad6a5', '#0c3a2e'), emissive:0x1a9c74, emissiveIntensity:.3}));
  monScreen.position.set(-.558, 1.36, -1.512);
  monScreen.rotation.y = .6;
  g.add(monScreen);

  /* Kundendisplay */
  M(new THREE.Mesh(new THREE.CylinderGeometry(.028,.028,.26,6), metal)).position.set(.86, 1.14, 1.15);
  const disp = M(new THREE.Mesh(new THREE.BoxGeometry(.32,.19,.05), mat(0x2b2f36)));
  disp.position.set(.86, 1.33, 1.15); disp.rotation.x = .28;
  const dispScreen = new THREE.Mesh(new THREE.PlaneGeometry(.26,.13),
    new THREE.MeshLambertMaterial({color:0x8ef0b8, emissive:0x39cf9b, emissiveIntensity:.5}));
  dispScreen.position.set(.86, 1.335, 1.176); dispScreen.rotation.x = .28;
  g.add(dispScreen);

  /* Tastatur */
  const kb = M(new THREE.Mesh(new THREE.BoxGeometry(.3,.03,.17), mat(0x39424c)));
  kb.position.set(-.28, 1.08, -1.22); kb.rotation.y = .18;
  for(let i=0;i<12;i++){
    const key = M(new THREE.Mesh(new THREE.BoxGeometry(.036,.012,.03), mat(0xe7dfd0)));
    key.position.set(-.38 + (i%4)*.058, 1.098, -1.27 + Math.floor(i/4)*.042);
    key.rotation.y = .18;
  }

  /* Tütenauslage */
  M(new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .7), metal)).position.set(-1.25, .86, -1.4);
  M(new THREE.Mesh(new THREE.BoxGeometry(.06, .82, .06), metal)).position.set(-1.25, .43, -1.4);
  for(let i=0;i<3;i++){
    const bag = M(new THREE.Mesh(new THREE.BoxGeometry(.24, .38, .1), mat(i===0?0xfffaf0:0xf1ece0)));
    bag.position.set(-1.45 + i*0.19, 1.05, -1.4);
  }

  /* Kassen-Schild */
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .32),
    new THREE.MeshLambertMaterial({map: signTexture('KASSE', 'Bitte hier bezahlen', '#4fb6ff', '#123b52'), side: THREE.DoubleSide}));
  sign.position.set(0, 2.1, -2.25);
  g.add(sign);
  for(const sx of [-1,1]){
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.08), mat(0x39cf9b));
    lamp.position.set(sx*.62, 2.1, -2.2);
    g.add(lamp);
  }

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
  r.lastSale = {scanned: r.scanned.slice(), total: amount, at: performance.now()};
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
  let scanned = r.scanned, total = r.total;
  /* Nach dem Kassieren bleibt der Bon noch kurz sichtbar */
  if(!scanned.length && !(total > 0) && r.lastSale && performance.now() - r.lastSale.at < 8000){
    scanned = r.lastSale.scanned; total = r.lastSale.total;
  }
  const counts = {};
  for(const pid of scanned) counts[pid] = (counts[pid] || 0) + 1;
  for(const pid in counts){
    const d = document.createElement('div');
    d.innerHTML = '<span>' + PMAP[pid].name + (counts[pid] > 1 ? ' ×' + counts[pid] : '') +
      '</span><span>' + eur(state.prices[pid] * counts[pid]) + '</span>';
    lines.appendChild(d);
  }
  $('#receiptTotal').textContent = eur(total);
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
  /* Spielerzelle meiden, damit Kunden nicht durch ihn hindurch laufen */
  if(typeof player !== 'undefined' && player.pos) navBlock(player.pos.x - 0.35, player.pos.z - 0.35, player.pos.x + 0.35, player.pos.z + 0.35);
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

const PANTS = [0x3d4b5e, 0x2f3b4a, 0x5a4636, 0x46586b, 0x6b5a7a, 0x39424c];
const SHOES = [0x2b2b33, 0x3b3028, 0x26323a];

/* ---------- Figur: runder Kopf, Arme mit Händen, Schuhe, Korb ---------- */
function makePerson(opt){
  opt = opt || {};
  const shirtCol = opt.shirt != null ? opt.shirt : pick(SHIRTS);
  const skinCol  = opt.skin  != null ? opt.skin  : pick(SKINS);
  const hairCol  = opt.hair  != null ? opt.hair  : pick(HAIRS);
  const pantCol  = opt.pants != null ? opt.pants : pick(PANTS);
  const shirt = mat(shirtCol), skin = mat(skinCol), pants = mat(pantCol);
  const hairM = mat(hairCol), shoeM = mat(pick(SHOES)), darkM = mat(0x241a12);
  const shade = c => mat(new THREE.Color(c).clone().multiplyScalar(0.82).getHex());

  const g = new THREE.Group();
  const M = m => { m.castShadow = true; return m; };

  /* Beine + Schuhe */
  const legGeo = new THREE.CylinderGeometry(.082, .068, .58, 6);
  legGeo.translate(0, -.29, 0);
  const shoeGeo = new THREE.BoxGeometry(.145, .085, .25);
  shoeGeo.translate(0, 0, .045);
  const soleGeo = new THREE.BoxGeometry(.155, .028, .27);
  function leg(sx){
    const grp = new THREE.Group();
    grp.position.set(sx*.105, .72, 0);
    grp.add(M(new THREE.Mesh(legGeo, pants)));
    const shoe = M(new THREE.Mesh(shoeGeo, shoeM));
    shoe.position.set(0, -.575, 0);
    grp.add(shoe);
    const sole = M(new THREE.Mesh(soleGeo, mat(0xf2efe8)));
    sole.position.set(0, -.605, -.005);
    grp.add(sole);
    g.add(grp);
    return grp;
  }
  const legL = leg(-1), legR = leg(1);

  /* Körper */
  M(new THREE.Mesh(new THREE.CylinderGeometry(.215, .19, .2, 7), pants)).position.y = .77;
  M(new THREE.Mesh(new THREE.CylinderGeometry(.258, .208, .44, 7), shirt)).position.y = 1.07;
  M(new THREE.Mesh(new THREE.CylinderGeometry(.278, .258, .1, 7), shirt)).position.y = 1.315;
  /* Namensschild */
  const badge0 = new THREE.Mesh(new THREE.BoxGeometry(.1, .055, .012), mat(0xfffdf6));
  badge0.position.set(.1, 1.11, .215);
  g.add(badge0);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.105, .135, .06, 7), shade(shirtCol));
  collar.position.y = 1.385; g.add(collar);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.07, .078, .09, 6), skin);
  neck.position.y = 1.41; g.add(neck);

  /* Kopf */
  const head = M(new THREE.Mesh(new THREE.IcosahedronGeometry(.168, 1), skin));
  head.position.y = 1.515;
  head.scale.set(1, 1.06, .97);
  g.add(head);
  for(const sx of [-1,1]){
    const ear = new THREE.Mesh(new THREE.IcosahedronGeometry(.038, 0), skin);
    ear.position.set(sx*.16, 1.512, -.01);
    g.add(ear);
  }
  /* Haarvarianten */
  const hair = new THREE.Group();
  const hairType = opt.hairType != null ? opt.hairType : rndi(0,2);
  const capHair = new THREE.Mesh(new THREE.SphereGeometry(.184, 9, 6, 0, Math.PI*2, 0, Math.PI*.44), hairM);
  capHair.position.y = 1.556;
  capHair.castShadow = true;
  hair.add(capHair);
  if(hairType === 1){
    const bun = new THREE.Mesh(new THREE.IcosahedronGeometry(.062, 0), hairM);
    bun.position.set(0, 1.635, -.128);
    hair.add(bun);
  } else if(hairType === 2){
    const back = new THREE.Mesh(new THREE.BoxGeometry(.235, .2, .1), hairM);
    back.position.set(0, 1.43, -.122);
    back.castShadow = true;
    hair.add(back);
  } else {
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(.25, .055, .09), hairM);
    fringe.position.set(0, 1.598, .132);
    hair.add(fringe);
  }
  g.add(hair);
  for(const sx of [-1,1]){
    const white = new THREE.Mesh(new THREE.IcosahedronGeometry(.032, 1), mat(0xffffff));
    white.position.set(sx*.062, 1.522, .146);
    white.scale.set(1, .82, .55);
    g.add(white);
    const eye = new THREE.Mesh(new THREE.IcosahedronGeometry(.016, 1), darkM);
    eye.position.set(sx*.062, 1.52, .163);
    g.add(eye);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(.05, .012, .012), hairM);
    brow.position.set(sx*.062, 1.572, .152);
    brow.rotation.z = -sx*.1;
    g.add(brow);
  }
  const nose = new THREE.Mesh(new THREE.IcosahedronGeometry(.026, 0), skin);
  nose.position.set(0, 1.487, .168);
  g.add(nose);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.055, .014, .012), mat(0xa8524a));
  mouth.position.set(0, 1.44, .158);
  g.add(mouth);

  /* Arme mit Händen */
  const upGeo = new THREE.CylinderGeometry(.072, .062, .24, 6); upGeo.translate(0, -.12, 0);
  const foreGeo = new THREE.CylinderGeometry(.056, .05, .22, 6); foreGeo.translate(0, -.34, 0);
  const handGeo = new THREE.BoxGeometry(.095, .105, .08); handGeo.translate(0, -.49, 0);
  function arm(sx){
    const grp = new THREE.Group();
    grp.position.set(sx*.28, 1.33, 0);
    grp.add(M(new THREE.Mesh(upGeo, shirt)));
    grp.add(M(new THREE.Mesh(foreGeo, skin)));
    grp.add(M(new THREE.Mesh(handGeo, skin)));
    grp.rotation.z = sx*.05;
    g.add(grp);
    return grp;
  }
  const armL = arm(-1), armR = arm(1);

  /* Einkaufskorb am linken Arm */
  const basket = new THREE.Group();
  basket.position.set(0, -.54, .04);
  const bMat = mat(0xd9dee4), bRim = mat(0xffc93c);
  [[0,-.2,0,.33,.03,.25],[0,-.13,-.12,.33,.13,.02],[0,-.13,.12,.33,.13,.02],
   [-.165,-.13,0,.02,.13,.25],[.165,-.13,0,.02,.13,.25]].forEach(a => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(a[3],a[4],a[5]), bMat);
    m.position.set(a[0],a[1],a[2]); basket.add(m);
  });
  const rimB = new THREE.Mesh(new THREE.BoxGeometry(.36,.03,.28), bRim);
  rimB.position.y = -.065; basket.add(rimB);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.14,.014,4,8,Math.PI), bRim);
  handle.rotation.y = Math.PI/2; handle.position.y = -.06; basket.add(handle);
  armL.add(basket);

  /* Dienstkleidung */
  if(opt.apron){
    const apron = new THREE.Mesh(new THREE.BoxGeometry(.34,.46,.05), mat(opt.apron));
    apron.position.set(0, 1.0, .2);
    g.add(apron);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(.11,.07,.012), mat(0xffffff));
    badge.position.set(.09, 1.17, .228);
    g.add(badge);
  }
  if(opt.cap){
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.178,.188,.075,8), mat(opt.cap));
    cap.position.y = 1.65;
    cap.castShadow = true;
    g.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(.25,.028,.16), mat(opt.cap));
    brim.position.set(0, 1.622, .14);
    g.add(brim);
    const capDot = new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.02,8), mat(0xfffdf6));
    capDot.position.set(0, 1.692, 0);
    g.add(capDot);
    hair.visible = false;
  }

  return {group:g, legL:legL, legR:legR, armL:armL, armR:armR, basket:basket, head:head};
}

function makeShopperMesh(scale, opt){
  const p = makePerson(opt);
  if(scale) p.group.scale.setScalar(scale);
  return p;
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
    this.phase = rnd(0,10); this.scanTimer = 0; this.idle = rnd(0,6);
    /* Gedulds-Anzeige über dem Kopf */
    this.bar = new THREE.Group();
    this.bar.position.set(0, 2.06, 0);
    const barBg = new THREE.Mesh(new THREE.BoxGeometry(.46,.052,.02), mat(0x2b221b));
    this.bar.add(barBg);
    this.barFill = new THREE.Mesh(new THREE.BoxGeometry(.42,.034,.026), mat(0x39cf9b));
    this.barFill.position.z = .005;
    this.bar.add(this.barFill);
    this.bar.visible = false;
    this.group.add(this.bar);
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
    /* nicht durch den Spieler laufen */
    const px = this.pos.x - player.pos.x, pz = this.pos.z - player.pos.z;
    const pd = Math.hypot(px, pz);
    if(pd < 1.15 && pd > 0.0001){
      const push = (1.15 - pd) * 0.85;
      this.pos.x += px/pd*push;
      this.pos.z += pz/pd*push;
    }
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
      case 'wait': {
        this.patience -= dt;
        this.bar.visible = true;
        const f = clamp(this.patience/80, 0, 1);
        this.barFill.scale.x = Math.max(.001, f);
        this.barFill.position.x = -(1 - f)*.21;
        this.barFill.material.color.setHex(f > .55 ? 0x39cf9b : (f > .28 ? 0xffc93c : 0xff6b57));
        if(this.paid){ this.finish(); break; }
        if(this.patience <= 0) this.abandon();
        break;
      }
      case 'leave':
        if(this.walk(dt)) this.destroy();
        break;
    }
    /* ruhige Steh-Animation, wenn der Kunde nicht läuft */
    if(!this.walking && (this.state === 'shop' || this.state === 'queue' || this.state === 'wait')){
      this.idle += dt;
      this.mesh.armL.rotation.x = Math.sin(this.idle*1.7)*.07;
      this.mesh.armR.rotation.x = Math.sin(this.idle*1.7 + 1.3)*.07;
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
        const k = this.basketMeshes.length;
        const m = productMesh(pid);
        m.scale.setScalar(0.52);
        m.position.set(-0.1 + (k%2)*0.2, -0.19, -0.06 + Math.floor(k/2)*0.12);
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
      /* Kunde hat nichts gefunden: nicht die Schlange blockieren */
      const reg = this.register;
      if(reg && !reg.items.length && !reg.total){ this.finish(); return; }
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
    if(this.bar) this.bar.visible = false;
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
    const s = shoppers[i];
    s.update(dt);
    if(s.dead) shoppers.splice(i, 1);
  }
}
