// Deens Daily Hub — app.js
// Admin password: deens2026

var RAW = [ 
  ["4-HLXZLZ", "2025-08-12", 3.44, [["1195", "VELVET THROW PILLOW COVERS SQUARE CUSHION", 0.5, 3.43, "Home & Kitchen"]]],
  ["4-HOYXIL", "2025-08-19", 3.44, [["1934", "GZZSCORTD 24V AC DC POWER ADAPTER UV LED NAIL LAMP CHARGER", 0.5, 3.43, "Electronics"]]],
  ["4-HTUS2I", "2025-09-05", 52.7, [["1203", "HOLMES 36IN DIGITAL TOWER OSCILLATING FAN BLACK", 19, 27.66, "Home & Kitchen"], ["1938", "O-CEDAR EASYWRING MICROFIBER SPIN MOP AND BUCKET SYSTEM", 17, 25.04, "Home & Kitchen"]]],
  // ... rest of data follows same pattern
];

// Build items from RAW
var APP_ITEMS=[];
RAW.forEach(function(inv){
  inv[3].forEach(function(it){
    var bid=it[2];
    var tc=Math.round((bid+2.50+bid*0.18)*1.11*100)/100;
    APP_ITEMS.push({uid:inv[0]+'|'+it[0],lot:it[0],inv:inv[0],date:inv[1],desc:it[1],bid:bid,cost:tc,cat:it[4]});
  });
});

// Categories
var CATS=[
  {id:'clothing',    name:'Clothing',       emoji:String.fromCodePoint(0x1F45F), icon:'&#128736;', appCat:'Clothing'},
  {id:'home',        name:'Home & Kitchen', emoji:String.fromCodePoint(0x1F3E0), icon:'&#127968;', appCat:'Home & Kitchen'},
  {id:'health',      name:'Health & Beauty',emoji:String.fromCodePoint(0x1F486), icon:'&#128134;', appCat:'Health & Beauty'},
  {id:'electronics', name:'Electronics',    emoji:String.fromCodePoint(0x1F4F1), icon:'&#128241;', appCat:'Electronics'},
  {id:'baby',        name:'Baby & Kids',    emoji:String.fromCodePoint(0x1F37C), icon:'&#127868;', appCat:'Baby & Kids'},
  {id:'tools',       name:'Tools & Auto',   emoji:String.fromCodePoint(0x1F527), icon:'&#128295;', appCat:'Tools'},
  {id:'other',       name:'Other',          emoji:String.fromCodePoint(0x1F4E6), icon:'&#128230;', appCat:'Other'}
];

var BADGE_BG={'Clothing':'#eef4fb','Home & Kitchen':'#e6f7f2','Health & Beauty':'#f0ecfc','Electronics':'#fdf4e3','Baby & Kids':'#e6f7f2','Tools':'#fceaea','Other':'#f5f5f5'};
var BADGE_TC={'Clothing':'#1a3a5c','Home & Kitchen':'#0c4a37','Health & Beauty':'#2d1f5c','Electronics':'#7a4a00','Baby & Kids':'#0a3d2a','Tools':'#6b1a1a','Other':'#555'};

// Storage
var APP_KEY='ddh9_status';
var WEB_KEY='ddh_web';
function getStatus(){try{return JSON.parse(localStorage.getItem(APP_KEY))||{};}catch(e){return{};}}
function getWeb(){try{return JSON.parse(localStorage.getItem(WEB_KEY))||{};}catch(e){return{};}}
function setWeb(d){try{localStorage.setItem(WEB_KEY,JSON.stringify(d));}catch(e){toast('Storage full');}}
function getInStock(){
  var s=getStatus();
  return APP_ITEMS.filter(function(it){var x=s[it.uid];return !x||!x.st||x.st==='In Stock';});
}
function getItemData(uid){var w=getWeb();return(w.items&&w.items[uid])||{};}
function setItemData(uid,data){var w=getWeb();if(!w.items)w.items={};w.items[uid]=Object.assign(getItemData(uid),data);setWeb(w);}

// Helpers
function fmtPrice(it){
  var d=getItemData(it.uid);
  if(d.price&&d.price.trim())return d.price;
  return '$'+(Math.ceil(it.cost*2.5/5)*5)+'+';
}
function isHot(it){return !!getItemData(it.uid).hot;}
function getPhoto(uid){var w=getWeb();return w.photos&&w.photos[uid]?w.photos[uid]:null;}
function getCatPhoto(cid){var w=getWeb();return w.catPhotos&&w.catPhotos[cid]?w.catPhotos[cid]:null;}
function getHeroPhoto(hid){var w=getWeb();return w.heroPhotos&&w.heroPhotos[hid]?w.heroPhotos[hid]:null;}
function catOf(it){for(var i=0;i<CATS.length;i++){if(CATS[i].appCat===it.cat)return CATS[i];}return CATS[6];}
function waMsg(desc){
  var w=getWeb();var wa=(w.settings&&w.settings.wa)||'14385403074';
  return 'https://wa.me/'+wa+'?text='+encodeURIComponent('Hi! I saw this on your website and am interested: '+desc+'. Is it still available?');
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function safeId(uid){return uid.replace(/[^a-zA-Z0-9]/g,'_');}

// ── RENDER ───────────────────────────────────────────────────────
var activeFilter='All';
var activeCatId=null;

function renderAll(){
  var items=getInStock();
  var el=document.getElementById('statItems');
  if(el)el.textContent=items.length;
  renderCats(items);
  renderHotDeals(items);
  renderItems(items);
  loadHeroPhotos();
}

function renderCats(items){
  var grid=document.getElementById('catsGrid');
  if(!grid)return;
  var html='';
  CATS.forEach(function(cat){
    var ci=items.filter(function(i){return i.cat===cat.appCat;});
    var hasHot=ci.some(isHot);
    var cp=getCatPhoto(cat.id);
    html+='<div class="cat-card sr'+(hasHot?' has-hot':'')+'" data-catid="'+cat.id+'" id="catcard-'+cat.id+'">';
    html+='<span class="cat-hot-flag">&#128293; HOT</span>';
    html+='<div class="cat-img-zone" id="catzone-'+cat.id+'">';
    if(cp)html+='<img src="'+cp+'" alt="">';
    html+='<span class="cat-ph" style="'+(cp?'display:none':'')+'" >'+cat.icon+'</span>';
    html+='<button class="cat-edit-btn" data-catpick="'+cat.id+'">&#128247;</button>';
    html+='</div>';
    html+='<div class="cat-body"><div class="cat-name">'+cat.name+'</div>';
    html+='<div class="cat-count">'+ci.length+' items in stock</div></div></div>';
  });
  grid.innerHTML=html;
  observeNew();
}

function openCatDetail(catId){
  var items=getInStock();
  var cat=CATS.find(function(c){return c.id===catId;});
  if(!cat)return;
  var detail=document.getElementById('catDetail');
  if(activeCatId===catId&&detail.classList.contains('open')){
    detail.classList.remove('open');activeCatId=null;
    document.querySelectorAll('.cat-card').forEach(function(c){c.classList.remove('active');});
    return;
  }
  activeCatId=catId;
  document.querySelectorAll('.cat-card').forEach(function(c){c.classList.remove('active');});
  var ac=document.getElementById('catcard-'+catId);if(ac)ac.classList.add('active');
  var ci=items.filter(function(i){return i.cat===cat.appCat;});
  var html='<div class="cdh">';
  html+='<div><div class="cdh-title">'+cat.icon+' '+cat.name+'</div>';
  html+='<div class="cdh-count">'+ci.length+' items in stock</div></div>';
  html+='<button class="cdh-close" id="catDetailClose">&#215;</button></div>';
  if(!ci.length){html+='<div class="cd-empty">No items in this category right now. Message us!</div>';}
  else{
    html+='<div class="cd-items">';
    ci.forEach(function(it){
      var photo=getPhoto(it.uid);
      var encDesc=encodeURIComponent(it.desc);
      html+='<div class="cd-item" data-wamsg="'+encDesc+'">';
      html+='<div class="cd-img">'+(photo?'<img src="'+photo+'" alt="">':cat.emoji);
      if(isHot(it))html+='<span class="hot-flag">&#128293;</span>';
      html+='</div>';
      html+='<div class="cd-name">'+esc(it.desc.substring(0,55))+(it.desc.length>55?'...':'')+'</div>';
      html+='<div class="cd-lot">Lot '+it.lot+'</div>';
      html+='<div class="cd-foot"><div class="cd-price">'+fmtPrice(it)+'</div>';
      html+='<button class="cd-ask" data-wamsg="'+encDesc+'">&#128172; Ask</button></div></div>';
    });
    html+='</div>';
  }
  detail.innerHTML=html;
  detail.classList.add('open');
  setTimeout(function(){detail.scrollIntoView({behavior:'smooth',block:'nearest'});},80);
}

function renderHotDeals(items){
  var grid=document.getElementById('hotGrid');
  if(!grid)return;
  var hot=items.filter(isHot);
  if(!hot.length){
    grid.innerHTML='<div class="hot-empty"><div style="font-size:32px;margin-bottom:8px">&#128293;</div><b>No hot deals set</b><p style="font-size:11px;margin-top:4px">Open Admin and mark items as Hot Deals</p></div>';
    return;
  }
  var html='';
  hot.forEach(function(it){
    var photo=getPhoto(it.uid);
    var cat=catOf(it);
    html+='<div class="hot-card">';
    html+='<div class="hc-img" data-pick="'+it.uid+'">';
    if(photo)html+='<img src="'+photo+'" alt="">';
    else html+='<span style="position:relative;z-index:1">'+cat.emoji+'</span>';
    html+='<div class="hot-ribbon">&#128293; HOT DEAL</div></div>';
    html+='<div class="hc-body">';
    html+='<div class="hc-name">'+esc(it.desc.substring(0,55))+(it.desc.length>55?'...':'')+'</div>';
    html+='<div class="hc-lot">Lot '+it.lot+'</div>';
    html+='<div class="hc-price">'+fmtPrice(it)+'</div>';
    html+='<a href="'+waMsg(it.desc)+'" target="_blank" class="hc-btn">&#128172; Message to Buy</a>';
    html+='</div></div>';
  });
  grid.innerHTML=html;
}

function renderItems(items){
  var grid=document.getElementById('itemsGrid');
  var fbar=document.getElementById('itemFilter');
  if(!grid)return;
  if(fbar){
    var cats=['All'].concat(CATS.map(function(c){return c.name;}));
    fbar.innerHTML=cats.map(function(c){
      return '<button class="ifilter'+(activeFilter===c?' on':'')+'" data-filter="'+c+'">'+c+'</button>';
    }).join('');
  }
  var filtered=activeFilter==='All'?items:items.filter(function(i){
    var cat=CATS.find(function(c){return c.name===activeFilter;});
    return cat&&i.cat===cat.appCat;
  });
  var html='';
  filtered.forEach(function(it,idx){
    var photo=getPhoto(it.uid);
    var cat=catOf(it);
    var bg=BADGE_BG[it.cat]||'#f0f0f0';
    var tc=BADGE_TC[it.cat]||'#333';
    var delay=['d1','d2','d3','d4'][idx%4];
    html+='<div class="ic sr '+delay+'">';
    html+='<div class="ic-img" data-pick="'+it.uid+'">';
    if(photo)html+='<img src="'+photo+'" alt="">';
    html+='<div class="ic-ph" style="'+(photo?'display:none':'')+'">';
    html+='<span class="ic-ph-icon">'+cat.emoji+'</span>';
    html+='<span class="ic-ph-lbl">&#128247; Tap to upload</span></div>';
    html+='<div class="ic-badge-row">';
    html+='<span class="ic-bdg" style="background:'+bg+';color:'+tc+'">'+esc(it.cat)+'</span>';
    if(isHot(it))html+='<span class="ic-bdg" style="background:var(--hot);color:#fff">&#128293;</span>';
    html+='</div>';
    html+='<span class="ic-avail">In Stock</span>';
    html+='<div class="ic-overlay"><button class="ic-overlay-btn" data-pick="'+it.uid+'">&#128247; Change Photo</button></div>';
    html+='</div>';
    html+='<div class="ic-body">';
    html+='<div class="ic-name">'+esc(it.desc.substring(0,55))+(it.desc.length>55?'...':'')+'</div>';
    html+='<div class="ic-lot">Lot '+it.lot+' &middot; '+it.inv+'</div>';
    html+='<div class="ic-foot">';
    html+='<div><div class="ic-price">'+fmtPrice(it)+'</div><div class="ic-cat-lbl">Cost: $'+it.cost.toFixed(2)+'</div></div>';
    html+='<a href="'+waMsg(it.desc)+'" target="_blank" class="ic-msg">&#128172; Ask</a>';
    html+='</div></div></div>';
  });
  if(!filtered.length){
    html='<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">No items in this category right now.</div>';
  }
  html+='<div class="cta-end">';
  html+='<div style="font-size:34px">&#128230;</div>';
  html+='<div style="font-family:var(--display);font-size:14px;font-weight:800;color:#fff">Don\'t see what you need?</div>';
  html+='<div style="font-size:11px;color:rgba(255,255,255,.45);line-height:1.6">'+items.length+' items total. Message us and we\'ll check for you.</div>';
  html+='<a href="#contact">Message Us &#8594;</a></div>';
  grid.innerHTML=html;
  observeNew();
}

// ── EVENT DELEGATION ──────────────────────────────────────────────
document.addEventListener('click',function(e){
  // Cat card
  var catCard=e.target.closest('.cat-card[data-catid]');
  if(catCard&&!e.target.closest('.cat-edit-btn')){openCatDetail(catCard.getAttribute('data-catid'));return;}
  // Cat edit btn
  var catEdit=e.target.closest('.cat-edit-btn[data-catpick]');
  if(catEdit){e.stopPropagation();pickImg('cat-'+catEdit.getAttribute('data-catpick'));return;}
  // Cat detail close
  if(e.target.id==='catDetailClose'||e.target.closest('#catDetailClose')){
    document.getElementById('catDetail').classList.remove('open');
    activeCatId=null;
    document.querySelectorAll('.cat-card').forEach(function(c){c.classList.remove('active');});
    return;
  }
  // Cat item click
  var cdItem=e.target.closest('.cd-item[data-wamsg]');
  if(cdItem&&!e.target.closest('.cd-ask')){window.open(waMsg(decodeURIComponent(cdItem.getAttribute('data-wamsg'))),'_blank');return;}
  // Cat ask btn
  var cdAsk=e.target.closest('.cd-ask[data-wamsg]');
  if(cdAsk){e.stopPropagation();window.open(waMsg(decodeURIComponent(cdAsk.getAttribute('data-wamsg'))),'_blank');return;}
  // Photo pick
  var pickEl=e.target.closest('[data-pick]');
  if(pickEl&&adminUnlocked){var uid=pickEl.getAttribute('data-pick');if(uid){pickImg(uid);return;}}
  // Hero edit
  var hmEdit=e.target.closest('.hm-edit[data-hmid]');
  if(hmEdit){e.stopPropagation();pickImg(hmEdit.getAttribute('data-hmid'));return;}
  var hm=e.target.closest('.hm[data-hmid]');
  if(hm&&!e.target.closest('.hm-edit')&&adminUnlocked){pickImg(hm.getAttribute('data-hmid'));return;}
  // Filter
  var fBtn=e.target.closest('.ifilter[data-filter]');
  if(fBtn){activeFilter=fBtn.getAttribute('data-filter');renderItems(getInStock());return;}
  // Nav buttons
  if(e.target.id==='btnHot'){document.getElementById('hot').scrollIntoView({behavior:'smooth'});return;}
  if(e.target.id==='btnContact'){document.getElementById('contact').scrollIntoView({behavior:'smooth'});return;}
  // Admin
  if(e.target.id==='adminFabBtn'){openAdmin();return;}
  if(e.target.id==='adminCloseBtn'){closeAdmin();return;}
  var apTab=e.target.closest('.ap-tab[data-tab]');
  if(apTab){
    document.querySelectorAll('.ap-tab').forEach(function(b){b.classList.remove('on');});
    document.querySelectorAll('.ap-section').forEach(function(s){s.classList.remove('on');});
    apTab.classList.add('on');
    var sec=document.getElementById(apTab.getAttribute('data-tab'));if(sec)sec.classList.add('on');
    return;
  }
  if(e.target.id==='pwBtn'){checkPW();return;}
  var prSave=e.target.closest('.pr-save[data-uid]');
  if(prSave){savePrice(prSave.getAttribute('data-uid'));return;}
  var slotPh=e.target.closest('.ap-pslot-ph[data-pick]');
  if(slotPh){pickImg(slotPh.getAttribute('data-pick'));return;}
  var slotDel=e.target.closest('.ap-pslot-del[data-delpick]');
  if(slotDel){delPhoto(slotDel.getAttribute('data-delpick'));return;}
  if(e.target.id==='saveSettingsBtn'){saveSettings();return;}
  if(e.target.id==='resetDataBtn'){if(confirm('Clear all photos and custom data?'))clearCustomData();return;}
  if(e.target.id==='syncBtn'){syncStock();return;}
  if(!e.target.closest('.nav-mid')&&!e.target.closest('.mob-wrap')){
    var nd=document.getElementById('navDrop');var md=document.getElementById('mobDrop');
    if(nd)nd.classList.remove('open');if(md)md.classList.remove('open');
  }
});

document.addEventListener('change',function(e){
  var cb=e.target.closest('.hot-cb[data-uid]');
  if(cb){
    setItemData(cb.getAttribute('data-uid'),{hot:cb.checked});
    var items=getInStock();renderHotDeals(items);renderItems(items);renderCats(items);
    toast(cb.checked?'Added to Hot Deals \uD83D\uDD25':'Removed from Hot Deals');
  }
});

document.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&document.getElementById('pwInput')===document.activeElement)checkPW();
});

// ── PHOTO UPLOAD ─────────────────────────────────────────────────
var adminUnlocked=false;
var pickTarget=null;

var fileInputEl=document.getElementById('fileInput');
if(fileInputEl){
  fileInputEl.addEventListener('change',function(e){
    var file=e.target.files[0];
    if(!file||!pickTarget)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      var url=ev.target.result;
      var w=getWeb();var t=pickTarget;
      if(t.startsWith('hm-')){if(!w.heroPhotos)w.heroPhotos={};w.heroPhotos[t]=url;}
      else if(t.startsWith('cat-')){if(!w.catPhotos)w.catPhotos={};w.catPhotos[t.replace('cat-','')]=url;}
      else{if(!w.photos)w.photos={};w.photos[t]=url;}
      setWeb(w);applyPhoto(t,url);renderAdminPhotos();toast('Photo saved \u2713');
    };
    reader.readAsDataURL(file);this.value='';
  });
}

function pickImg(target){
  if(!adminUnlocked){toast('Enter password first');return;}
  pickTarget=target;document.getElementById('fileInput').click();
}

function applyPhoto(target,url){
  if(target.startsWith('hm-')){
    var el=document.getElementById(target);if(!el)return;
    var ph=el.querySelector('.hm-ph');var old=el.querySelector('img.placed');if(old)old.remove();
    if(url){var img=document.createElement('img');img.src=url;img.className='placed';img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';el.insertBefore(img,el.firstChild);if(ph)ph.style.display='none';}
    else{if(ph)ph.style.display='';}
    return;
  }
  if(target.startsWith('cat-')){
    var cid=target.replace('cat-','');var zone=document.getElementById('catzone-'+cid);if(!zone)return;
    var ph2=zone.querySelector('.cat-ph');var old2=zone.querySelector('img');if(old2)old2.remove();
    if(url){var img2=document.createElement('img');img2.src=url;img2.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';zone.insertBefore(img2,zone.firstChild);if(ph2)ph2.style.display='none';}
    else{if(ph2)ph2.style.display='';}
    return;
  }
  renderAll();
}

function delPhoto(target){
  var w=getWeb();
  if(target.startsWith('hm-')){if(w.heroPhotos)delete w.heroPhotos[target];}
  else if(target.startsWith('cat-')){if(w.catPhotos)delete w.catPhotos[target.replace('cat-','')];}
  else{if(w.photos)delete w.photos[target];}
  setWeb(w);applyPhoto(target,null);renderAdminPhotos();renderAll();toast('Photo removed');
}

function loadHeroPhotos(){
  var w=getWeb();
  Object.keys(w.heroPhotos||{}).forEach(function(k){applyPhoto(k,w.heroPhotos[k]);});
}

document.addEventListener('dragover',function(e){e.preventDefault();});
document.addEventListener('drop',function(e){
  e.preventDefault();if(!adminUnlocked)return;
  var file=e.dataTransfer.files[0];if(!file||!file.type.startsWith('image/'))return;
  var el=e.target.closest('[data-pick]');if(!el)return;
  pickTarget=el.getAttribute('data-pick');
  var reader=new FileReader();
  reader.onload=function(ev){
    var w=getWeb();var t=pickTarget;
    if(t.startsWith('hm-')){if(!w.heroPhotos)w.heroPhotos={};w.heroPhotos[t]=ev.target.result;}
    else if(t.startsWith('cat-')){if(!w.catPhotos)w.catPhotos={};w.catPhotos[t.replace('cat-','')]=ev.target.result;}
    else{if(!w.photos)w.photos={};w.photos[t]=ev.target.result;}
    setWeb(w);applyPhoto(t,ev.target.result);renderAdminPhotos();toast('Photo saved \u2713');
  };
  reader.readAsDataURL(file);
});

// ── SEARCH ────────────────────────────────────────────────────────
function doSearch(q,dropId){
  var drop=document.getElementById(dropId);if(!drop)return;
  q=q.trim().toLowerCase();
  if(q.length<2){drop.classList.remove('open');return;}
  var items=getInStock();
  var catMatches=CATS.filter(function(c){return c.name.toLowerCase().indexOf(q)>=0;});
  var scored=items.map(function(it){
    var s=0,n=it.desc.toLowerCase(),c=it.cat.toLowerCase(),l=it.lot.toLowerCase();
    if(n.indexOf(q)===0)s+=100;else if(n.indexOf(q)>=0)s+=60;
    if(c.indexOf(q)>=0)s+=35;if(l.indexOf(q)>=0)s+=40;
    q.split(' ').forEach(function(w){if(w.length>1&&n.indexOf(w)>=0)s+=8;});
    return{it:it,s:s};
  }).filter(function(x){return x.s>0;}).sort(function(a,b){return b.s-a.s;}).slice(0,8);
  var html='';
  if(catMatches.length){
    html+='<div class="ndrop-sec">Categories</div>';
    catMatches.forEach(function(cat){
      var cnt=items.filter(function(i){return i.cat===cat.appCat;}).length;
      html+='<div class="ndrop-item" data-searchcat="'+cat.id+'">';
      html+='<div class="ndi-thumb">'+cat.icon+'</div>';
      html+='<div><div class="ndi-name">'+cat.name+'</div><div class="ndi-meta">'+cnt+' items</div></div>';
      html+='<div class="ndi-price">View All</div></div>';
    });
  }
  if(scored.length){
    html+='<div class="ndrop-sec">Items</div>';
    scored.forEach(function(x){
      var it=x.it,photo=getPhoto(it.uid),cat=catOf(it);
      html+='<a class="ndrop-item" href="'+waMsg(it.desc)+'" target="_blank">';
      html+='<div class="ndi-thumb">'+(photo?'<img src="'+photo+'" alt="">':cat.emoji)+'</div>';
      html+='<div style="flex:1;min-width:0"><div class="ndi-name">'+esc(it.desc.substring(0,45))+'</div>';
      html+='<div class="ndi-meta">'+esc(it.cat)+' &middot; Lot '+it.lot+'</div></div>';
      html+='<div class="ndi-price">'+fmtPrice(it)+'</div></a>';
    });
  }
  if(!catMatches.length&&!scored.length){
    html='<div class="ndrop-empty">No results for "'+q+'" &mdash; <a href="#contact" style="color:var(--navy2)">message us</a>!</div>';
  }
  drop.innerHTML=html;
  drop.classList.add('open');
  drop.querySelectorAll('[data-searchcat]').forEach(function(el){
    el.addEventListener('click',function(){
      drop.classList.remove('open');
      document.getElementById('categories').scrollIntoView({behavior:'smooth'});
      setTimeout(function(){openCatDetail(el.getAttribute('data-searchcat'));},400);
    });
  });
}

function initSearch(){
  function bind(inpId,dropId){
    var inp=document.getElementById(inpId);if(!inp)return;
    inp.addEventListener('input',function(){doSearch(this.value,dropId);});
    inp.addEventListener('focus',function(){if(this.value.length>=2)doSearch(this.value,dropId);});
    inp.addEventListener('keydown',function(e){if(e.key==='Escape')document.getElementById(dropId).classList.remove('open');});
  }
  bind('navSearch','navDrop');bind('mobSearch','mobDrop');
}

// ── ADMIN ─────────────────────────────────────────────────────────
function openAdmin(){document.getElementById('adminPanel').classList.add('open');document.body.style.overflow='hidden';}
function closeAdmin(){document.getElementById('adminPanel').classList.remove('open');document.body.style.overflow='';}
function checkPW(){
  var w=getWeb();var stored=(w.settings&&w.settings.pw)||'deens2026';
  if(document.getElementById('pwInput').value===stored){
    adminUnlocked=true;
    document.getElementById('pwScreen').style.display='none';
    document.getElementById('adminMain').style.display='block';
    document.body.classList.add('admin-mode');
    renderAdminAll();toast('\u2713 Admin unlocked');
  }else{var err=document.getElementById('pwErr');if(err)err.textContent='Wrong password';}
}

function renderAdminAll(){renderAdminPhotos();renderAdminPrices();renderAdminHot();renderAdminStatus();}

function renderAdminPhotos(){
  var w=getWeb();
  var hg=document.getElementById('apHeroGrid');
  if(hg){
    var hSlots=[{id:'hm-0',lbl:'Boots/Main'},{id:'hm-1',lbl:'Health'},{id:'hm-2',lbl:'Home'}];
    hg.innerHTML=hSlots.map(function(s){
      var p=w.heroPhotos&&w.heroPhotos[s.id];
      return '<div class="ap-pslot">'+(p?'<img src="'+p+'" alt=""><button class="ap-pslot-del" data-delpick="'+s.id+'">&#215;</button>':'<div class="ap-pslot-ph" data-pick="'+s.id+'"><span>+</span><span>'+s.lbl+'</span></div>')+'</div>';
    }).join('');
  }
  var cg=document.getElementById('apCatGrid');
  if(cg){
    cg.innerHTML=CATS.map(function(cat){
      var p=w.catPhotos&&w.catPhotos[cat.id];
      return '<div class="ap-pslot">'+(p?'<img src="'+p+'" alt=""><button class="ap-pslot-del" data-delpick="cat-'+cat.id+'">&#215;</button>':'<div class="ap-pslot-ph" data-pick="cat-'+cat.id+'"><span>'+cat.icon+'</span><span>'+cat.name+'</span></div>')+'</div>';
    }).join('');
  }
  var ig=document.getElementById('apItemGrid');
  if(ig){
    var items=getInStock().slice(0,40);
    ig.innerHTML=items.map(function(it){
      var p=getPhoto(it.uid);var cat=catOf(it);
      return '<div class="ap-pslot" title="'+esc(it.desc)+'">'+(p?'<img src="'+p+'" alt=""><button class="ap-pslot-del" data-delpick="'+it.uid+'">&#215;</button>':'<div class="ap-pslot-ph" data-pick="'+it.uid+'"><span>'+cat.emoji+'</span><span>'+esc(it.desc.substring(0,10))+'</span></div>')+'</div>';
    }).join('');
    if(getInStock().length>40)ig.innerHTML+='<p style="font-size:10px;color:rgba(255,255,255,.3);margin-top:6px;grid-column:1/-1">First 40 shown. Drag & drop photos on item cards in the main page.</p>';
  }
}

function renderAdminPrices(){
  var el=document.getElementById('apPricesList');if(!el)return;
  var items=getInStock();
  el.innerHTML=items.map(function(it){
    var d=getItemData(it.uid);var sid=safeId(it.uid);
    return '<div class="ap-irow">'
      +'<div class="ap-iinfo"><div class="ap-iname">'+esc(it.desc.substring(0,48))+'</div>'
      +'<div class="ap-imeta">Lot '+it.lot+' &middot; Cost: $'+it.cost.toFixed(2)+'</div></div>'
      +'<input class="ap-inp" id="pr_'+sid+'" value="'+(d.price||'')+'" placeholder="e.g. $25-$40" style="width:120px;flex-shrink:0">'
      +'<button class="ap-btn ap-gold pr-save" data-uid="'+it.uid+'" style="margin-left:6px">Save</button>'
      +'</div>';
  }).join('');
}

function savePrice(uid){
  var sid=safeId(uid);var inp=document.getElementById('pr_'+sid);if(!inp)return;
  setItemData(uid,{price:inp.value.trim()});renderItems(getInStock());toast('Price saved \u2713');
}

function renderAdminHot(){
  var el=document.getElementById('apHotList');if(!el)return;
  var items=getInStock();
  el.innerHTML=items.map(function(it){
    var hot=isHot(it);var photo=getPhoto(it.uid);var cat=catOf(it);var sid=safeId(it.uid);
    return '<div class="ap-irow">'
      +'<div class="ap-thumb">'+(photo?'<img src="'+photo+'" alt="">':cat.emoji)+'</div>'
      +'<div class="ap-iinfo"><div class="ap-iname">'+esc(it.desc.substring(0,45))+'</div>'
      +'<div class="ap-imeta">'+fmtPrice(it)+' &middot; '+esc(it.cat)+'</div></div>'
      +'<div class="ap-cb"><input type="checkbox" class="hot-cb" id="hcb_'+sid+'" data-uid="'+it.uid+'"'+(hot?' checked':'')+'>'
      +'<label for="hcb_'+sid+'">Hot &#128293;</label></div>'
      +'</div>';
  }).join('');
}

function renderAdminStatus(){
  var el=document.getElementById('apStatusList');if(!el)return;
  var status=getStatus();var inStock=getInStock();
  var syncEl=document.getElementById('syncStatus');
  if(syncEl)syncEl.textContent=inStock.length+' of '+APP_ITEMS.length+' items in stock';
  el.innerHTML=APP_ITEMS.slice(0,30).map(function(it){
    var s=status[it.uid];var st=(s&&s.st)||'In Stock';
    var stc=st==='In Stock'?'#4ade80':st==='Sold'?'#60a5fa':'#f87171';
    return '<div class="ap-irow">'
      +'<div class="ap-iinfo"><div class="ap-iname">'+esc(it.desc.substring(0,48))+'</div>'
      +'<div class="ap-imeta">Lot '+it.lot+' &middot; $'+it.cost.toFixed(2)+' &middot; '+esc(it.cat)+'</div></div>'
      +'<span style="font-size:10px;font-weight:700;color:'+stc+';white-space:nowrap">'+st+'</span></div>';
  }).join('')+(APP_ITEMS.length>30?'<p style="font-size:10px;color:rgba(255,255,255,.3);margin-top:8px">Showing 30 of '+APP_ITEMS.length+'. Manage status in the stock tracking app.</p>':'');
}

function syncStock(){renderAll();renderAdminAll();toast('Synced! '+getInStock().length+' items \u2713');}

function saveSettings(){
  var w=getWeb();if(!w.settings)w.settings={};
  var wa=(document.getElementById('setWa').value||'').trim().replace(/\D/g,'');
  var fb=(document.getElementById('setFb').value||'').trim();
  var email=(document.getElementById('setEmail').value||'').trim();
  var pw1=(document.getElementById('setPw1').value||'');
  var pw2=(document.getElementById('setPw2').value||'');
  if(wa)w.settings.wa=wa;if(fb)w.settings.fb=fb;if(email)w.settings.email=email;
  if(pw1&&pw1===pw2)w.settings.pw=pw1;else if(pw1&&pw1!==pw2){toast('Passwords do not match');return;}
  setWeb(w);loadSettings();toast('Settings saved \u2713');
}

function clearCustomData(){localStorage.removeItem(WEB_KEY);location.reload();}

function loadSettings(){
  var w=getWeb();
  var wa=(w.settings&&w.settings.wa)||'14385403074';
  var fb=(w.settings&&w.settings.fb)||'https://m.me/your-fb-page';
  var email=(w.settings&&w.settings.email)||'zydtech1@gmail.com';
  var waUrl='https://wa.me/'+wa;
  ['waLink1','waLink2','fabWa'].forEach(function(id){var el=document.getElementById(id);if(el)el.href=waUrl;});
  ['fbLink1','fbLink2'].forEach(function(id){var el=document.getElementById(id);if(el)el.href=fb;});
  var eEl=document.getElementById('emailLink');if(eEl)eEl.href='mailto:'+email;
  var si=document.getElementById('setWa');if(si)si.value='+'+wa;
  var fi=document.getElementById('setFb');if(fi)fi.value=fb;
  var ei=document.getElementById('setEmail');if(ei)ei.value=email;
}

// ── SCROLL REVEAL & TOAST ─────────────────────────────────────────
var revIO=new IntersectionObserver(function(entries){
  entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('show');});
},{threshold:0.07});

function observeNew(){document.querySelectorAll('.sr:not(.show)').forEach(function(el){revIO.observe(el);});}

function toast(msg){
  var t=document.getElementById('apToast');if(!t)return;
  t.innerHTML=msg;t.classList.add('show');
  clearTimeout(t._tid);t._tid=setTimeout(function(){t.classList.remove('show');},2600);
}

// ── INIT ──────────────────────────────────────────────────────────
renderAll();
initSearch();
loadSettings();
document.querySelectorAll('.sr').forEach(function(el){revIO.observe(el);});
