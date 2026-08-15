// ============================================================
//  INSTALAR COMO APP (PWA) — compartido por catálogo y admin
// ============================================================
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
  var deferredPrompt = null;
  var ua = navigator.userAgent || navigator.vendor || '';
  function isIOS(){ return /iphone|ipad|ipod/i.test(ua) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1); }
  function isAndroid(){ return /android/i.test(ua); }
  function isFirefox(){ return /firefox/i.test(ua); }
  function isStandalone(){ return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
  function nombreTienda(){ return (window.CONFIG && CONFIG.TIENDA_NOMBRE) ? CONFIG.TIENDA_NOMBRE : 'la app'; }

  function instrucciones(){
    if (isIOS())     return 'En iPhone o iPad, con <b>Safari</b>:<br>1) Toca el botón <b>Compartir</b> (el cuadro con la flecha ↑, abajo).<br>2) Baja y elige <b>“Añadir a pantalla de inicio”</b>.<br>3) Toca <b>“Añadir”</b>.';
    if (isAndroid()) return 'En Android:<br>1) Abre el menú <b>⋮</b> del navegador (arriba a la derecha).<br>2) Elige <b>“Instalar aplicación”</b> o <b>“Añadir a pantalla de inicio”</b>.';
    if (isFirefox()) return 'Firefox de escritorio no permite instalar apps web. Abre este sitio en <b>Chrome</b> o <b>Edge</b> y verás el botón de instalar en la barra de direcciones.';
    return 'En tu computadora (Chrome o Edge):<br>Haz clic en el ícono <b>Instalar</b> al final de la barra de direcciones, o menú <b>⋮ → Instalar…</b>.';
  }
  function mostrarModal(){
    var ov = document.getElementById('__installOv');
    if (!ov) {
      ov = document.createElement('div'); ov.id='__installOv';
      ov.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(3,10,7,.74);backdrop-filter:blur(6px);display:grid;place-items:center;padding:22px';
      ov.innerHTML='<div style="max-width:370px;width:100%;background:var(--panel,#14141b);border:1px solid var(--gold-deep,#8a6522);border-radius:18px;padding:24px;color:var(--cream,#f2ecdf);font-family:system-ui,-apple-system,sans-serif;box-shadow:0 24px 60px rgba(0,0,0,.55)">'
        +'<div id="__installTitle" style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:1.45rem;color:var(--gold-1,#f4e6b8);margin-bottom:12px"></div>'
        +'<div id="__installTxt" style="font-size:.94rem;line-height:1.7;color:var(--muted,#8f8a7a)"></div>'
        +'<button id="__installClose" style="margin-top:20px;width:100%;padding:12px;border:none;border-radius:10px;background:var(--gold-grad,linear-gradient(135deg,#f4e6b8,#c99a3e));color:var(--bg,#0a0a0d);font-weight:600;font-size:.95rem;cursor:pointer;font-family:inherit">Entendido</button>'
        +'</div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
    }
    ov.querySelector('#__installTitle').textContent = 'Instalar ' + nombreTienda();
    ov.querySelector('#__installTxt').innerHTML = instrucciones();
    ov.querySelector('#__installClose').onclick = function(){ ov.remove(); };
  }
  window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferredPrompt=e; });
  function instalar(){ if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt.userChoice.finally(function(){ deferredPrompt=null; }); } else { mostrarModal(); } }
  function initBtn(){
    var b=document.getElementById('installBtn'); if(!b) return;
    if(isStandalone()){ b.style.display='none'; return; }
    b.style.removeProperty('display'); b.onclick=instalar;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initBtn); else initBtn();
  window.addEventListener('appinstalled', function(){ var b=document.getElementById('installBtn'); if(b) b.style.display='none'; });
})();
