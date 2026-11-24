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
  candy:   {label:'Süßigkeitenregal', build:'rack',  w:2.4, d:1.0, h:1.75, rows:3, cols:4, frame:0xf7eaf4, accent:0xff8fd1, cats:['candy','snacks']},
  fridge:  {label:'Kühlregal',        build:'rack',  w:3.0, d:1.0, h:2.10, rows:3, cols:5, frame:0xd6e4ee, accent:0x7ee0ff, cats:['drinks','food','frozen'], glass:true},
  freezer: {label:'Tiefkühltruhe',    build:'chest', w:2.0, d:1.0, h:0.85, rows:1, cols:4, frame:0xdce8f0, accent:0x9fe8ff, cats:['frozen']},
  produce: {label:'Obststand',        build:'stand', w:2.2, d:1.0, h:0.95, rows:1, cols:5, frame:0xd8a86c, accent:0x39cf9b, cats:['produce']},
  promo:   {label:'Sonderangebot',    build:'rack',  w:2.2, d:1.0, h:1.40, rows:2, cols:4, frame:0xffe9bd, accent:0xffc93c, cats:['food','drinks','candy','snacks','household','care']}
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
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = b; g.fillRect(0,0,256,256);
  for(let ty=0;ty<2;ty++) for(let tx=0;tx<2;tx++){
    if((tx+ty)%2) continue;
    g.fillStyle = a; g.fillRect(tx*128, ty*128, 128, 128);
  }
  /* Fugen */
  g.strokeStyle = 'rgba(90,72,52,.20)'; g.lineWidth = 6;
  g.strokeRect(0,0,256,256);
  g.beginPath();
  g.moveTo(128,0); g.lineTo(128,256);
  g.moveTo(0,128); g.lineTo(256,128);
  g.stroke();
  /* leichte Maserung */
  for(let i=0;i<340;i++){
    g.fillStyle = 'rgba(255,255,255,' + (0.03 + Math.random()*0.05).toFixed(3) + ')';
    g.fillRect(Math.random()*256, Math.random()*256, 2 + Math.random()*4, 2 + Math.random()*4);
  }
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

/* ==========================================================
   3D-Modelle für Produkte — erkennbare Verpackungen
   ========================================================== */
function productMesh(pid){
  const p = PMAP[pid];
  const g = new THREE.Group();
  const base = new THREE.Color(p.color);
  const bodyM = mat(p.color);
  const darkM = mat(base.clone().multiplyScalar(.64).getHex());
  const lightM = mat(base.clone().lerp(new THREE.Color(0xffffff), .68).getHex());
  const paperM = mat(0xfffbf3);
  const metalM = mat(0xdbe3ea);
  const inkM = mat(0x3a2f26);
  const cyl = (rt,rb,h,seg) => new THREE.CylinderGeometry(rt,rb,h,seg||10);
  const add = (m, y) => {
    m.castShadow = true; m.receiveShadow = true;
    if(y !== undefined) m.position.y = y;
    g.add(m); return m;
  };
  let hgt = .24;

  if(pid === 'klopapier'){
    hgt = .19;
    add(new THREE.Mesh(new THREE.BoxGeometry(.25,.19,.15), paperM), .095);
    const band = add(new THREE.Mesh(new THREE.BoxGeometry(.256,.034,.156), mat(0x6fc7e8)), .18);
    band.castShadow = false;
    for(const sx of [-.062,.062]){
      const roll = add(new THREE.Mesh(cyl(.044,.044,.008,10), mat(0xefe9dd)));
      roll.rotation.x = Math.PI/2;
      roll.position.set(sx, .092, .076);
    }
    const tag = add(new THREE.Mesh(new THREE.BoxGeometry(.11,.028,.004), mat(0x6fc7e8)));
    tag.position.set(0, .128, .078);

  } else if(pid === 'banane'){
    hgt = .19;
    for(let i=0;i<3;i++){
      const arc = add(new THREE.Mesh(new THREE.TorusGeometry(.082,.023,4,7,Math.PI), bodyM));
      arc.rotation.set(Math.PI/2 + (i-1)*.12, .25*i, .35 + i*.26);
      arc.position.set(-.02 + i*.03, .08 + i*.008, i*.018);
    }
    const stem = add(new THREE.Mesh(new THREE.CylinderGeometry(.013,.009,.045,5), mat(0x6d5a2c)));
    stem.position.set(.055, .16, .02);
    stem.rotation.z = .3;

  } else if(pid === 'apfel' || pid === 'tomate'){
    hgt = .25;
    const fruit = add(new THREE.Mesh(new THREE.IcosahedronGeometry(.122,1), bodyM), .125);
    fruit.scale.set(1,.93,1);
    const top = add(new THREE.Mesh(new THREE.IcosahedronGeometry(.055,0), bodyM), .222);
    top.scale.set(1,.55,1);
    if(pid === 'apfel'){
      const stem = add(new THREE.Mesh(new THREE.CylinderGeometry(.009,.013,.055,5), mat(0x6b4a2a)));
      stem.position.set(0,.256,0); stem.rotation.z = .18;
      const leaf = add(new THREE.Mesh(new THREE.BoxGeometry(.072,.012,.04), mat(0x63b34a)));
      leaf.position.set(.042,.256,0); leaf.rotation.z = -.38;
    } else {
      for(let i=0;i<5;i++){
        const leaf = add(new THREE.Mesh(new THREE.BoxGeometry(.052,.012,.026), mat(0x5da842)));
        leaf.position.set(Math.cos(i*1.2566)*.044, .232, Math.sin(i*1.2566)*.044);
        leaf.rotation.y = -i*1.2566; leaf.rotation.z = .22;
      }
    }

  } else if(pid === 'pizza'){
    hgt = .1;
    add(new THREE.Mesh(new THREE.BoxGeometry(.26,.052,.26), bodyM), .026);
    add(new THREE.Mesh(new THREE.BoxGeometry(.266,.012,.266), darkM), .056);
    const sticker = add(new THREE.Mesh(new THREE.PlaneGeometry(.11,.075), paperM));
    sticker.rotation.x = -Math.PI/2;
    sticker.position.set(0, .064, 0);

  } else if(pid === 'eis'){
    hgt = .2;
    add(new THREE.Mesh(cyl(.098,.084,.155,12), bodyM), .078);
    const lid = add(new THREE.Mesh(cyl(.103,.103,.03,12), lightM), .163);
    lid.receiveShadow = true;
    add(new THREE.Mesh(cyl(.0995,.0995,.058,12), paperM), .104);
    add(new THREE.Mesh(cyl(.1005,.1005,.02,12), darkM), .138);

  } else if(pid === 'zahn'){
    hgt = .21;
    add(new THREE.Mesh(new THREE.BoxGeometry(.1,.16,.052), bodyM), .08);
    add(new THREE.Mesh(new THREE.BoxGeometry(.052,.055,.052), paperM), .187);
    const stripe = add(new THREE.Mesh(new THREE.BoxGeometry(.102,.038,.056), darkM));
    stripe.position.set(0, .15, 0);

  } else if(p.shape === 'can'){
    hgt = .245;
    add(new THREE.Mesh(cyl(.095,.095,.2,12), bodyM), .115);
    add(new THREE.Mesh(cyl(.099,.099,.016,12), metalM), .012);
    add(new THREE.Mesh(cyl(.099,.099,.016,12), metalM), .218);
    add(new THREE.Mesh(cyl(.097,.097,.082,12), paperM), .118);
    add(new THREE.Mesh(cyl(.0975,.0975,.024,12), darkM), .17);
    add(new THREE.Mesh(cyl(.0975,.0975,.018,12), lightM), .08);
    const tab = add(new THREE.Mesh(new THREE.BoxGeometry(.036,.007,.022), metalM), .228);
    tab.position.z = .028;

  } else if(p.shape === 'bottle'){
    const tall = pid === 'shampoo';
    hgt = tall ? .38 : .35;
    const bh = tall ? .235 : .21;
    add(new THREE.Mesh(cyl(.077,.089,bh,10), bodyM), bh/2);
    add(new THREE.Mesh(cyl(.077,.041,.075,10), bodyM), bh + .03);
    add(new THREE.Mesh(cyl(.036,.036,.05,10), bodyM), bh + .09);
    add(new THREE.Mesh(cyl(.043,.043,.036,8), darkM), bh + .132);
    add(new THREE.Mesh(cyl(.045,.045,.008,8), lightM), bh + .152);
    add(new THREE.Mesh(cyl(.0805,.0805,.1,10), paperM), bh*.48);
    add(new THREE.Mesh(cyl(.0815,.0815,.022,10), lightM), bh*.48 + .045);

  } else if(p.shape === 'bag'){
    hgt = .29;
    add(new THREE.Mesh(new THREE.BoxGeometry(.225,.245,.09), bodyM), .135);
    add(new THREE.Mesh(new THREE.BoxGeometry(.235,.028,.085), darkM), .268);
    add(new THREE.Mesh(new THREE.BoxGeometry(.225,.02,.086), darkM), .012);
    const win = add(new THREE.Mesh(new THREE.PlaneGeometry(.13,.098), paperM));
    win.position.set(0,.142,.0465);
    const logo = add(new THREE.Mesh(new THREE.CircleGeometry(.026,9), darkM));
    logo.position.set(0,.224,.0472);
    const base2 = add(new THREE.Mesh(new THREE.PlaneGeometry(.19,.018), lightM));
    base2.position.set(0,.058,.0472);

  } else {
    hgt = .215;
    add(new THREE.Mesh(new THREE.BoxGeometry(.245,.195,.155), bodyM), .102);
    add(new THREE.Mesh(new THREE.BoxGeometry(.252,.026,.162), darkM), .198);
    const label = add(new THREE.Mesh(new THREE.PlaneGeometry(.2,.125), paperM));
    label.position.set(0,.112,.0795);
    const band = add(new THREE.Mesh(new THREE.PlaneGeometry(.2,.038), lightM));
    band.position.set(0,.052,.0805);
    const badge = add(new THREE.Mesh(new THREE.CircleGeometry(.028,10), darkM));
    badge.position.set(.064,.152,.0808);
    for(let i=0;i<4;i++){
      const bar = add(new THREE.Mesh(new THREE.PlaneGeometry(.004,.042), inkM));
      bar.position.set(-.082 + i*.009,.146,.0812);
    }
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
    const accent = mat(d.accent);
    const accentDark = mat(new THREE.Color(d.accent).clone().multiplyScalar(.74).getHex());
    const frame = mat(d.frame);
    const boardM = mat(0xfdf9f0);
    const metal = mat(0xc6d0da);
    const hex = '#' + d.accent.toString(16).padStart(6,'0');
    let rows = d.rows;

    if(d.build === 'rack'){
      /* Rückwand */
      const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, .08), mat(0xf1e8d7));
      back.position.set(0, H/2, -D/2 + .04);
      back.receiveShadow = true;
      this.group.add(back);
      for(let i=1;i<Math.max(3,d.cols);i++){
        const seam = new THREE.Mesh(new THREE.BoxGeometry(.012, H - .5, .012), mat(0xe4d9c5));
        seam.position.set(-W/2 + i*(W/Math.max(3,d.cols)), H*.52, -D/2 + .082);
        this.group.add(seam);
      }
      /* Seitenwangen mit bedruckter Stirnseite (Endkappe) */
      for(const sx of [-1,1]){
        const side = new THREE.Mesh(new THREE.BoxGeometry(.09, H, D), mat(0xe7edf2));
        side.position.set(sx*(W/2 - .045), H/2, 0);
        side.castShadow = true; side.receiveShadow = true;
        this.group.add(side);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(.105, .13, D + .02), accent);
        cap.position.set(sx*(W/2 - .045), H - .065, 0);
        cap.castShadow = true;
        this.group.add(cap);
        /* Farbband unten */
        const band = new THREE.Mesh(new THREE.BoxGeometry(.012, H*.42, D*.92), accentDark);
        band.position.set(sx*(W/2 + .004), H*.29, 0);
        this.group.add(band);
        const band2 = new THREE.Mesh(new THREE.BoxGeometry(.012, .05, D*.92), mat(0xfffdf6));
        band2.position.set(sx*(W/2 + .012), H*.52, 0);
        this.group.add(band2);
        /* Stirnschild */
        const endSign = new THREE.Mesh(new THREE.PlaneGeometry(D*.78, .28),
          new THREE.MeshLambertMaterial({map: signTexture(d.label, '', hex, '#fffdf6')}));
        endSign.position.set(sx*(W/2 + .014), H*.68, 0);
        endSign.rotation.y = sx*Math.PI/2;
        this.group.add(endSign);
      }
      /* Sockel */
      const base = new THREE.Mesh(new THREE.BoxGeometry(W - .04, .13, D - .02), accentDark);
      base.position.y = .065; base.receiveShadow = true;
      this.group.add(base);
      const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(W - .02, .035, D + .01), mat(0x2f3a42));
      baseTrim.position.y = .017;
      this.group.add(baseTrim);

      const innerB = .24, innerT = H - .34;
      const gap = (innerT - innerB) / Math.max(1, rows - 1);
      const railM = mat(0xfffdf6);
      for(let r=0;r<rows;r++){
        const yb = innerB + r*gap;
        this.rowY.push(yb);
        const board = new THREE.Mesh(new THREE.BoxGeometry(W - .2, .055, D - .14), boardM);
        board.position.set(0, yb - .027, 0);
        board.receiveShadow = true;
        this.group.add(board);
        const lip = new THREE.Mesh(new THREE.BoxGeometry(W - .2, .042, .05), accent);
        lip.position.set(0, yb - .022, D/2 - .07);
        lip.castShadow = true;
        this.group.add(lip);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(W - .24, .05, .022), railM);
        rail.position.set(0, yb + .014, D/2 - .026);
        this.group.add(rail);
        const nTags = Math.max(2, Math.round((W - .3) / .5));
        for(let i=0;i<nTags;i++){
          const tag = new THREE.Mesh(new THREE.BoxGeometry(.1, .034, .012), i%3===1 ? accent : mat(0xffd93d));
          tag.position.set(-W/2 + .3 + i*((W - .6)/Math.max(1,nTags-1)), yb + .014, D/2 - .008);
          this.group.add(tag);
        }
      }
      /* Kopfschild */
      const header = new THREE.Mesh(new THREE.BoxGeometry(W - .12, .28, .05), accent);
      header.position.set(0, H + .12, D/2 - .04);
      header.castShadow = true;
      this.group.add(header);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(W - .24, .2),
        new THREE.MeshLambertMaterial({map: signTexture(d.label, '', hex, '#fffdf6')}));
      label.position.set(0, H + .12, D/2 - .012);
      this.group.add(label);

      if(d.glass){
        const glass = new THREE.Mesh(new THREE.BoxGeometry(W - .2, H - .46, .03),
          new THREE.MeshLambertMaterial({color:0xbfeaff, transparent:true, opacity:.16}));
        glass.position.set(0, H/2 + .02, D/2 - .05);
        this.group.add(glass);
        const doors = Math.max(2, Math.round(W / .9));
        for(let i=0;i<=doors;i++){
          const fr = new THREE.Mesh(new THREE.BoxGeometry(.045, H - .42, .05), accent);
          fr.position.set(-W/2 + .16 + i*((W - .32)/doors), H/2, D/2 - .04);
          this.group.add(fr);
        }
        for(let i=0;i<doors;i++){
          const handle = new THREE.Mesh(new THREE.BoxGeometry(.022, .3, .03), metal);
          handle.position.set(-W/2 + .16 + (i + .82)*((W - .32)/doors), H*.55, D/2 - .02);
          this.group.add(handle);
        }
        const tube = new THREE.Mesh(new THREE.BoxGeometry(W - .4, .05, .07),
          new THREE.MeshLambertMaterial({color:0xffffff, emissive:0xcdf3ff, emissiveIntensity:.95}));
        tube.position.set(0, H - .22, .1);
        this.group.add(tube);
      } else {
        /* obere Werbeleiste */
        const topper = new THREE.Mesh(new THREE.BoxGeometry(W - .3, .12, .04), mat(0xfffdf6));
        topper.position.set(0, H - .3, D/2 - .03);
        this.group.add(topper);
      }

    } else if(d.build === 'chest'){
      const base = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), frame);
      base.position.y = H/2; base.castShadow = true; base.receiveShadow = true;
      this.group.add(base);
      const kick = new THREE.Mesh(new THREE.BoxGeometry(W + .02, .1, D + .02), mat(0xb8c8d4));
      kick.position.y = .05;
      this.group.add(kick);
      const rim = new THREE.Mesh(new THREE.BoxGeometry(W + .06, .09, D + .06), accent);
      rim.position.y = H; rim.castShadow = true;
      this.group.add(rim);
      const inner = new THREE.Mesh(new THREE.BoxGeometry(W - .16, .1, D - .16), mat(0xeaf7ff));
      inner.position.y = H - .05;
      this.group.add(inner);
      /* Schiebe-Scheiben */
      for(const sx of [-1,1]){
        const lid = new THREE.Mesh(new THREE.BoxGeometry(W/2 - .1, .022, D - .1),
          new THREE.MeshLambertMaterial({color:0xd8f4ff, transparent:true, opacity:.34}));
        lid.position.set(sx*(W/4), H + .045, 0);
        this.group.add(lid);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(.16, .03, .04), metal);
        grip.position.set(sx*(W/4 - .18), H + .07, -D/2 + .12);
        this.group.add(grip);
      }
      const frost = new THREE.Mesh(new THREE.BoxGeometry(W - .22, .02, D - .22),
        new THREE.MeshLambertMaterial({color:0xffffff, emissive:0xbfeaff, emissiveIntensity:.4, transparent:true, opacity:.85}));
      frost.position.y = H + .005;
      this.group.add(frost);
      const header = new THREE.Mesh(new THREE.PlaneGeometry(W*.7, .2),
        new THREE.MeshLambertMaterial({map: signTexture('TIEFKÜHL', '', '#9fe8ff', '#12475c')}));
      header.position.set(0, H + .3, -D/2 + .04);
      this.group.add(header);
      this.rowY = [H + .03];

    } else {
      /* Obststand: Holztisch mit Kisten */
      const top = new THREE.Mesh(new THREE.BoxGeometry(W, .09, D), mat(0xe0b47c));
      top.position.y = H - .045; top.castShadow = true; top.receiveShadow = true;
      this.group.add(top);
      for(const sx of [-1,1]) for(const sz of [-1,1]){
        const leg = new THREE.Mesh(new THREE.BoxGeometry(.1, H - .09, .1), mat(0x8d6238));
        leg.position.set(sx*(W/2 - .12), (H - .09)/2, sz*(D/2 - .12));
        leg.castShadow = true;
        this.group.add(leg);
      }
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(W, .3, D*0.98), accent);
      skirt.position.y = H - .26;
      this.group.add(skirt);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(W*.6, .18),
        new THREE.MeshLambertMaterial({map: signTexture('OBST & GEMÜSE', '', '#39cf9b', '#0f3a2c')}));
      sign.position.set(0, H - .26, D/2 * .99);
      this.group.add(sign);
      for(let i=0;i<2;i++){
        const crate = new THREE.Mesh(new THREE.BoxGeometry(W/2 - .12, .12, D - .16), mat(0xb98a5a));
        crate.position.set(-W/4 + i*(W/2), H + .02, 0);
        crate.castShadow = true; crate.receiveShadow = true;
        this.group.add(crate);
        const rim2 = new THREE.Mesh(new THREE.BoxGeometry(W/2 - .1, .03, D - .14), mat(0x8d6238));
        rim2.position.set(-W/4 + i*(W/2), H + .085, 0);
        this.group.add(rim2);
      }
      this.rowY = [H + .06];
    }

    rows = (d.build === 'chest') ? 1 : d.rows;
    const stepX = (W - .38) / d.cols;
    for(let r=0;r<rows;r++){
      const y = this.rowY[r] !== undefined ? this.rowY[r] : this.rowY[0];
      for(let c=0;c<d.cols;c++){
        const node = new THREE.Group();
        node.position.set(-W/2 + .19 + (c + 0.5)*stepX, y, D/2 - 0.24);
        this.group.add(node);
        this.slots.push({pid:null, mesh:null, node:node, world:null, row:r, col:c});
      }
    }
  }
  accepts(cat){ return this.def.cats.indexOf(cat) >= 0; }
  firstEmpty(cat){
    if(!this.accepts(cat)) return null;
    const empties = this.slots.filter(s => !s.pid);
    if(!empties.length) return null;
    /* erst die Reihe auf Augenhöhe auffüllen, dann die anderen – so wirken
       die Regale dicht gefüllt statt über alle Reihen verstreut */
    const perRow = {};
    for(const s of this.slots) perRow[s.row] = (perRow[s.row] || 0) + (s.pid ? 1 : 0);
    let best = null, bestScore = -1e9;
    for(const s of empties){
      const score = (perRow[s.row] || 0) * 10 - Math.abs(s.node.position.y - 1.0) * 6 + rnd(0, .4);
      if(score > bestScore){ bestScore = score; best = s; }
    }
    return best;
  }
  addProduct(slot, pid){
    if(!slot) return false;
    const m = productMesh(pid);
    m.rotation.y = rnd(-.2, .2);
    m.position.x = rnd(-.018, .018);
    m.scale.setScalar(rnd(.95, 1.05));
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

function plant(x, z){
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.26,.2,.34,8), mat(0xd98a5a));
  pot.position.y = .17; pot.castShadow = true; pot.receiveShadow = true;
  g.add(pot);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(.235,.235,.03,8), mat(0x4a3527));
  soil.position.y = .335; g.add(soil);
  for(let i=0;i<7;i++){
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(.11,.62,5), mat(i%2 ? 0x4f9e5c : 0x63b34a));
    leaf.position.set(Math.cos(i*.9)*.11, .62 + (i%3)*.06, Math.sin(i*.9)*.11);
    leaf.rotation.set(Math.cos(i*1.7)*.35, i, Math.sin(i*1.3)*.35);
    leaf.castShadow = true;
    g.add(leaf);
  }
  world.add(g);
  addCollider(x, z, .55, .55);
}

function makeCart(x, z, rot){
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rot || 0;
  const wire = mat(0xb9c4cd);
  const red = mat(0xff6b57);
  const B = (w,h,d,c,y,z2) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), c);
    m.position.set(0, y, z2 || 0);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  B(.52, .02, .78, wire, .52);
  for(const sx of [-1,1]){
    B(.02, .3, .78, wire, .68, 0).position.x = sx*.25;
    B(.5, .3, .02, wire, .68, .38).position.y = .68;
    B(.5, .3, .02, wire, .68, -.38);
  }
  B(.46, .02, .72, wire, .8);
  B(.54, .04, .04, red, .9, -.42);
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.03,8), mat(0x2b2b33));
    wheel.rotation.z = Math.PI/2;
    wheel.position.set(sx*.23, .045, sz*.32);
    g.add(wheel);
  }
  B(.04, .36, .04, wire, .7, -.42).position.x = -.2;
  B(.04, .36, .04, wire, .7, -.42).position.x = .2;
  world.add(g);
  addCollider(x, z, .7, .95);
  return g;
}

function buildWorld(){
  /* Boden im Laden */
  const floorMat = new THREE.MeshLambertMaterial({map: tileTexture('#efe0c8','#e2d0b2',11,8)});
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(22.4, 16.4), floorMat);
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true;
  world.add(floor);

  /* Außengelände + Gehweg */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), new THREE.MeshLambertMaterial({color:0x9aa6ac}));
  ground.rotation.x = -Math.PI/2; ground.position.set(0,-0.04,10); ground.receiveShadow = true;
  world.add(ground);
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(26, 5), new THREE.MeshLambertMaterial({color:0xc9cdc9}));
  walk.rotation.x = -Math.PI/2; walk.position.set(0,-0.02,9.4); walk.receiveShadow = true;
  world.add(walk);
  for(let i=-3;i<=3;i++){
    const line = new THREE.Mesh(new THREE.PlaneGeometry(.12, 4.4), new THREE.MeshLambertMaterial({color:0x8f969c}));
    line.rotation.x = -Math.PI/2; line.position.set(i*2.6, -0.01, 9.4);
    world.add(line);
  }

  /* Wände */
  boxMesh(22.6, 3.7, 0.34, 0xf3e6d0, 0, 1.85, -8.2);
  boxMesh(0.34, 3.7, 16.8, 0xf3e6d0, -11.2, 1.85, 0);
  boxMesh(0.34, 3.7, 16.8, 0xf3e6d0, 11.2, 1.85, 0);
  boxMesh(9.6, 3.7, 0.34, 0xf3e6d0, -6.4, 1.85, 8.2);
  boxMesh(9.6, 3.7, 0.34, 0xf3e6d0, 6.4, 1.85, 8.2);
  boxMesh(22.6, 0.5, 0.4, 0xff6b57, 0, 0.25, -8.2);
  boxMesh(0.4, 0.5, 16.8, 0xffc93c, -11.2, 0.25, 0);
  boxMesh(0.4, 0.5, 16.8, 0x39cf9b, 11.2, 0.25, 0);

  /* Wandschutz + Zierleisten */
  boxMesh(22.3, 0.14, 0.08, 0xd7cbb6, 0, 1.12, -8.02);
  boxMesh(0.08, 0.14, 16.4, 0xd7cbb6, -11.02, 1.12, 0);
  boxMesh(0.08, 0.14, 16.4, 0xd7cbb6, 11.02, 1.12, 0);
  boxMesh(22.3, 0.1, 0.08, 0xefe6d5, 0, 3.35, -8.02);

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
  signBack.castShadow = true;
  world.add(signBack);

  /* Eingangsrahmen + Sensor + Schiebetüren */
  for(const sx of [-1,1]) boxMesh(0.24, 3.4, 0.3, 0xff6b57, sx*1.72, 1.7, 8.2);
  boxMesh(3.7, 0.34, 0.32, 0xff6b57, 0, 3.36, 8.2);
  boxMesh(0.3, 0.12, 0.2, 0x33404b, 0, 3.12, 7.97);
  const glassMat = new THREE.MeshLambertMaterial({color:0xbfeaff, transparent:true, opacity:.35});
  for(const sx of [-1,1]){
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.08), glassMat);
    p.position.set(sx*0.8, 1.5, 8.2);
    world.add(p);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.12), mat(0xc6d0da));
    handle.position.set(sx*0.08, 1.45, 8.14);
    p.add(handle);
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
  ramp.receiveShadow = true;
  world.add(ramp);
  for(let i=0;i<5;i++){
    const st = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.22), new THREE.MeshLambertMaterial({color:0xff6b57}));
    st.rotation.x = -Math.PI/2; st.position.set(-5.6, 0.02, 9.6 + i*0.7);
    world.add(st);
  }
  /* Reservekartons an der Rampe */
  for(let i=0;i<2;i++){
    const cx = -8.2 + i*0.2, cz = 11.6 + i*0.75;
    boxMesh(.72,.5,.72, 0xc99155, cx, .25, cz);
    boxMesh(.3,.06,.74, 0xe3d3ae, cx, .5, cz);
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

  /* Deko: Pflanzen, Einkaufswagen, Körbe */
  plant(-10.35, -6.9);
  plant(10.4, -6.9);
  makeCart(3.3, 10.4, 0.35);
  makeCart(4.4, 10.9, 0.1);
  const basketStack = new THREE.Group();
  basketStack.position.set(1.5, 0, 7.5);
  for(let i=0;i<5;i++){
    const b = new THREE.Mesh(new THREE.BoxGeometry(.46,.075,.32), mat(i===4 ? 0xffc93c : 0xd9dee4));
    b.position.y = .05 + i*.075;
    b.castShadow = true; b.receiveShadow = true;
    basketStack.add(b);
  }
  world.add(basketStack);
  addCollider(1.5, 7.5, .56, .42);

  /* Deckenlampen als Deko */
  for(let i=0;i<4;i++){
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.8,0.08,0.4),
      new THREE.MeshLambertMaterial({color:0xfff6dd, emissive:0xffeec2, emissiveIntensity:0.5}));
    p.position.set(-6 + i*4, 3.5, -1);
    world.add(p);
  }

  /* Decke (nur im Laden sichtbar) */
  ceiling = new THREE.Mesh(new THREE.BoxGeometry(24.4, 0.16, 18.6),
    new THREE.MeshLambertMaterial({color:0xfaf3e6, emissive:0x6f685c}));
  ceiling.position.set(0, 3.78, 0);
  ceiling.receiveShadow = true;
  ceiling.visible = false;
  world.add(ceiling);

  /* Deckenbalken */
  for(const z of [-6.2,-2.8,.6,4,7.2]){
    const beam = new THREE.Mesh(new THREE.BoxGeometry(22.6, .14, .2), mat(0xe9e0ce));
    beam.position.set(0, 3.68, z);
    world.add(beam);
  }

  const panelMat = new THREE.MeshLambertMaterial({color:0xffffff, emissive:0xfff4d6, emissiveIntensity:0.9});
  for(let x=-7.5;x<=7.5;x+=5){
    for(const z of [-5.6,-1.4,2.8,6.2]){
      const p = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.07, 0.42), panelMat);
      p.position.set(x, 3.6, z);
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

  /* Wanduhr */
  const clock = new THREE.Group();
  clock.position.set(4.6, 2.85, -8.0);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.05,14), mat(0xfffbef));
  face.rotation.x = Math.PI/2;
  clock.add(face);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.26,.03,4,14), mat(0xffc93c));
  clock.add(ring);
  for(let i=0;i<12;i++){
    const tick = new THREE.Mesh(new THREE.BoxGeometry(.02,.035,.012), mat(0x5b6670));
    tick.position.set(Math.sin(i*Math.PI/6)*.19, Math.cos(i*Math.PI/6)*.19, .03);
    clock.add(tick);
  }
  const handH = new THREE.Mesh(new THREE.BoxGeometry(.022,.13,.014), mat(0x3a444c));
  handH.position.set(0,.06,.045);
  clock.add(handH);
  const handM = new THREE.Mesh(new THREE.BoxGeometry(.016,.19,.014), mat(0x3a444c));
  handM.position.set(.05,.07,.05); handM.rotation.z = -1.1;
  clock.add(handM);
  world.add(clock);

  /* Bäume draußen (durch die Tür sichtbar) */
  for(const t of [{x:-6,z:20,s:1.1},{x:6.5,z:23,s:1.3},{x:14,z:19,s:.9}]){
    const g = new THREE.Group();
    g.position.set(t.x, 0, t.z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.16,.22,1.5,6), mat(0x8a5a36));
    trunk.position.y = .75; g.add(trunk);
    for(let i=0;i<3;i++){
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5 - i*.38, 1.5, 6), mat(i%2 ? 0x4f9e5c : 0x5fb06a));
      cone.position.y = 1.7 + i*.85;
      cone.castShadow = true;
      g.add(cone);
    }
    g.scale.setScalar(t.s);
    world.add(g);
  }
}
