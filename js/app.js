document.addEventListener("DOMContentLoaded",()=>{
  setupPageOpening();
  setupHeaderMotion();
  updateCartCount();
  const searchBtn=document.getElementById("searchBtn"), searchPanel=document.getElementById("searchPanel");
  if(searchBtn) searchBtn.onclick=()=>searchPanel.classList.toggle("show");
  const searchInput=document.getElementById("searchInput");
  if(searchInput) searchInput.addEventListener("keydown",e=>{if(e.key==="Enter"){location.href="shop.html?search="+encodeURIComponent(searchInput.value)}});
  if(document.getElementById("featuredProducts")) renderProducts(PRODUCTS.slice(0,4),"featuredProducts");
  if(document.getElementById("shopProducts")) initShop();
  if(document.getElementById("productPage")) renderProductPage();
  if(document.getElementById("cartContent")) renderCart();
  if(document.getElementById("checkoutSummary")) renderCheckout();
  setupScrollReveal();
  setupCategoryEffects();
});
function setupPageOpening(){
  const opening=document.createElement("div");
  opening.className="page-opening";
  opening.innerHTML='<div class="opening-kicker">AUTOMOTIVE • CULTURE • LIFESTYLE</div><div class="opening-title">DRIFT<span>&amp;</span>DRAWN</div><div class="opening-line"><i></i></div>';
  document.body.prepend(opening);
  window.setTimeout(()=>opening.classList.add("opening-done"),650);
  window.setTimeout(()=>opening.remove(),1250);
}
function setupHeaderMotion(){
  const headers=document.querySelectorAll(".header");
  if(!headers.length)return;
  requestAnimationFrame(()=>headers.forEach(header=>header.classList.add("header-ready")));
  let ticking=false;
  const update=()=>{
    const scrolled=window.scrollY>24;
    headers.forEach(header=>header.classList.toggle("header-scrolled",scrolled));
    ticking=false;
  };
  window.addEventListener("scroll",()=>{
    if(!ticking){requestAnimationFrame(update);ticking=true}
  },{passive:true});
  update();
}
function setupScrollReveal(){
  const targets=document.querySelectorAll(".section-head,.section-head h2,.category-card,.promo,.about-grid,.shop-title,.shop-toolbar,.product-layout,.cart-items,.cart-summary,.checkout-form,.checkout-summary,footer");
  if(!targets.length)return;
  targets.forEach(el=>el.classList.add("reveal-on-scroll"));
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches||!("IntersectionObserver" in window)){targets.forEach(el=>el.classList.add("is-visible"));return}
  const observer=new IntersectionObserver((entries,instance)=>{
    entries.forEach(entry=>{
      entry.target.classList.toggle("is-visible",entry.isIntersecting);
    });
  },{threshold:.12,rootMargin:"0px 0px -45px"});
  targets.forEach(el=>observer.observe(el));
}
function setupCategoryEffects(){
  document.querySelectorAll(".category-card").forEach(card=>card.addEventListener("click",event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.button===1)return;
    event.preventDefault();
    card.classList.add("is-selected");
    window.setTimeout(()=>{location.href=card.href},430);
  }));
}
function setupGyroPanel(){
  const panel=document.getElementById("categories");
  if(!panel)return;
  panel.classList.add("gyro-panel");
  let currentX=0,currentY=0,targetX=0,targetY=0,frame=0;
  const setTarget=(x,y)=>{targetX=Math.max(-4,Math.min(4,x));targetY=Math.max(-4,Math.min(4,y));panel.classList.add("gyro-active");if(!frame)frame=requestAnimationFrame(animate)};
  const animate=()=>{currentX+=(targetX-currentX)*.12;currentY+=(targetY-currentY)*.12;panel.style.setProperty("--gyro-x",`${currentX}deg`);panel.style.setProperty("--gyro-y",`${currentY}deg`);if(Math.abs(targetX-currentX)>.01||Math.abs(targetY-currentY)>.01)frame=requestAnimationFrame(animate);else frame=0};
  const handleOrientation=event=>setTarget((event.beta-45)*-.045,event.gamma*.055);
  const enableOrientation=()=>{
    if(typeof DeviceOrientationEvent==="undefined")return;
    if(typeof DeviceOrientationEvent.requestPermission==="function")DeviceOrientationEvent.requestPermission().then(result=>{if(result==="granted")window.addEventListener("deviceorientation",handleOrientation,{passive:true})}).catch(()=>{});
    else window.addEventListener("deviceorientation",handleOrientation,{passive:true});
  };
  window.addEventListener("pointermove",event=>{if(event.pointerType!=="touch")setTarget((event.clientY/window.innerHeight-.5)*-3,(event.clientX/window.innerWidth-.5)*3)},{passive:true});
  window.addEventListener("pointerleave",()=>setTarget(0,0),{passive:true});
  window.addEventListener("touchstart",enableOrientation,{once:true,passive:true});
  enableOrientation();
}
function getCart(){return JSON.parse(localStorage.getItem("gearvault_cart")||"[]")}
function saveCart(c){localStorage.setItem("gearvault_cart",JSON.stringify(c));updateCartCount()}
function updateCartCount(){const el=document.getElementById("cartCount");if(el){el.textContent=getCart().reduce((s,x)=>s+x.qty,0)}}
function addToCart(id,qty=1){const c=getCart(),i=c.findIndex(x=>x.id===id);if(i>-1)c[i].qty+=qty;else c.push({id,qty});saveCart(c);showCartCelebration()}
function showCartCelebration(){
  document.querySelector(".cart-celebration")?.remove();
  const celebration=document.createElement("div");
  celebration.className="cart-celebration";
  celebration.innerHTML='<div class="celebration-burst"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><strong>ADDED TO GARAGE</strong><span>Your poster is ready to roll.</span>';
  document.body.append(celebration);
  window.setTimeout(()=>celebration.remove(),1800);
}
function removeFromCart(id){saveCart(getCart().filter(x=>x.id!==id));renderCart()}
function changeQty(id,delta){const c=getCart(),x=c.find(i=>i.id===id);if(x){x.qty+=delta;if(x.qty<=0)return removeFromCart(id)}saveCart(c);renderCart()}
function renderProducts(list,target){const el=document.getElementById(target);el.innerHTML=list.map(p=>`<article class="product-card"><a href="product.html?id=${p.id}"><div class="product-img"><img src="${p.image}" alt="${p.name}" loading="lazy"><span class="tag">${p.tag}</span></div><div class="product-info"><h3>${p.name}</h3><div class="product-meta"><div class="price">${money(p.price)} <span class="old">${money(p.oldPrice)}</span></div></div></div></a><button class="quick-add" onclick="addToCart(${p.id})">+</button></article>`).join("")}
function initShop(){
  const params=new URLSearchParams(location.search), initial=params.get("category")||"All", search=(params.get("search")||"").toLowerCase();
  let current=initial;
  const render=()=>{let list=PRODUCTS.filter(p=>(current==="All"||p.category===current)&&(!search||p.name.toLowerCase().includes(search)||p.category.toLowerCase().includes(search)));const s=document.getElementById("sortSelect").value;if(s==="low")list.sort((a,b)=>a.price-b.price);if(s==="high")list.sort((a,b)=>b.price-a.price);renderProducts(list,"shopProducts")};
  document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");current=b.dataset.category;render()});
  const btn=document.querySelector(`.filter[data-category="${initial}"]`);if(btn){document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));btn.classList.add("active")}
  document.getElementById("sortSelect").onchange=render;render();
}
function renderProductPage(){
  const p=getProduct(new URLSearchParams(location.search).get("id"))||PRODUCTS[0],el=document.getElementById("productPage");
  el.innerHTML=`<div class="product-layout"><div class="product-large"><img src="${p.image}" alt="${p.name}"></div><div class="product-details"><p class="eyebrow">${p.category} • ${p.tag}</p><h1>${p.name}</h1><div class="price-big">${money(p.price)} <span class="old">${money(p.oldPrice)}</span></div><p class="description">${p.desc} Printed and packaged for a premium wall-display experience.</p><div class="qty"><button onclick="productQty(-1)">−</button><span id="productQty">1</span><button onclick="productQty(1)">+</button></div><button class="btn btn-red full" onclick="addToCart(${p.id},Number(document.getElementById('productQty').textContent))">Add to cart</button><div style="margin-top:18px;color:#777;font-size:11px;line-height:1.8">✓ Premium print finish<br>✓ Secure packaging<br>✓ Multiple sizes available</div></div></div>`;
}
function productQty(d){const el=document.getElementById("productQty");el.textContent=Math.max(1,Number(el.textContent)+d)}
function renderCart(){
  const el=document.getElementById("cartContent"),c=getCart();
  if(!c.length){el.innerHTML='<div class="empty">Your garage is empty.<br><br><a class="btn btn-red" href="shop.html">Shop posters</a></div>';return}
  let total=0;const rows=c.map(x=>{const p=getProduct(x.id);total+=p.price*x.qty;return `<div class="cart-item"><img src="${p.image}" alt="${p.name}"><div><h3>${p.name}</h3><p>${money(p.price)} each • Qty ${x.qty}</p><div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><span>${x.qty}</span><button onclick="changeQty(${p.id},1)">+</button></div></div><button class="remove" onclick="removeFromCart(${p.id})">Remove</button></div>`}).join("");
  el.innerHTML=`<div class="cart-items">${rows}</div><div class="cart-summary"><div class="cart-total">Total: ${money(total)}</div><a class="btn btn-red" href="checkout.html">Checkout</a></div>`;
}
function renderCheckout(){const el=document.getElementById("checkoutSummary"),c=getCart();let total=0;el.innerHTML='<h3>ORDER SUMMARY</h3>'+c.map(x=>{const p=getProduct(x.id);total+=p.price*x.qty;return `<div class="summary-row"><span>${p.name} × ${x.qty}</span><span>${money(p.price*x.qty)}</span></div>`}).join("")+`<div class="summary-total"><span>Total</span><span>${money(total)}</span></div>`}
function placeOrder(e){e.preventDefault();alert("Demo order submitted. Connect a real payment/order backend before accepting live orders.");localStorage.removeItem("gearvault_cart");location.href="index.html"}
