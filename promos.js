// ============================================================
//  MOTOR DE PROMOCIONES (compartido por catálogo y admin)
//  4 tipos administrables desde el panel:
//   - producto : % de descuento a productos/tallas elegidos
//   - cantidad : llevando N o más, precio fijo o % (con upsell)
//   - combo    : N a elección por un precio total fijo (con upsell)
//   - general  : % a todo el catálogo o a una categoría
//  Además calcula el mensaje de "próxima promo" (upsell estilo DDS).
// ============================================================

// ---------- Helpers de fecha / vigencia ----------
function _hoyISO() { return new Date().toISOString().slice(0, 10); }

function promosVigentes(promos) {
  const hoy = _hoyISO();
  return (promos || []).filter(p =>
    p.activo &&
    (!p.desde || hoy >= p.desde) &&
    (!p.hasta || hoy <= p.hasta)
  );
}

// ¿La presentación (ml) entra en la promo? mls vacío = todas
function _mlOk(cfg, ml) {
  const mls = cfg.mls || cfg.tallas || [];
  return !mls.length || mls.map(String).includes(String(ml));
}
// ¿El producto entra en la promo? productos vacío = todos
function _prodOk(cfg, prodId) {
  const ids = cfg.productos || [];
  return !ids.length || ids.includes(prodId);
}
// ¿La categoría entra en la promo? categoria vacía/"todas" = todas
function _catOk(cfg, prod) {
  const cat = cfg.categoria;
  return !cat || cat === 'todas' || (prod && prod.categoria === cat);
}
// Elegibilidad completa para producto/cantidad/combo
function _elegible(cfg, prod, ml) {
  return _prodOk(cfg, prod.id) && _catOk(cfg, prod) && _mlOk(cfg, ml);
}

// ============================================================
//  PRECIO UNITARIO con promos de tipo "producto" y "general"
//  (toma el MEJOR descuento aplicable). base = precio de lista.
// ============================================================
function precioUnit(prod, ml, base, promos) {
  let mejor = base, promoNombre = null;
  promosVigentes(promos).forEach(pr => {
    const c = pr.config || {};
    let pct = 0, ok = false;
    if (pr.tipo === 'producto') {
      ok = _elegible(c, prod, ml);
      pct = Number(c.pct) || 0;
    } else if (pr.tipo === 'general') {
      ok = (c.alcance === 'todo') ||
           (c.alcance === 'categoria' && prod.categoria === c.categoria);
      pct = Number(c.pct) || 0;
    }
    if (ok && pct > 0) {
      const np = base * (1 - pct / 100);
      if (np < mejor) { mejor = np; promoNombre = pr.nombre; }
    }
  });
  return { precio: Math.round(mejor * 100) / 100, original: base, promo: promoNombre };
}

// ============================================================
//  CÁLCULO DEL CARRITO con promos de "cantidad" y "combo".
//  cart: [{ id, nombre, marca, categoria, ml, precio, qty, img }]
//  Devuelve líneas, descuentos, totales y mensajes de upsell.
// ============================================================
function computeCart(cart, prodById, promos) {
  const vig = promosVigentes(promos);

  // 1) Precio efectivo por línea (aplica producto/general)
  const lines = cart.map(it => {
    const prod = prodById[it.id] || { id: it.id, nombre: it.nombre, categoria: it.categoria };
    const base = Number(it.precio);
    const { precio: unit, promo } = precioUnit(prod, it.ml, base, vig);
    return { ...it, unit, unitOrig: base, promo, lineTotal: Math.round(unit * it.qty * 100) / 100 };
  });

  // 2) Promos de "cantidad": agrupa por promo y por talla
  const upsells = [];
  vig.filter(p => p.tipo === 'cantidad').forEach(pr => {
    const c = pr.config || {};
    const grupos = {};
    lines.forEach(l => {
      const prod = prodById[l.id] || { id: l.id, categoria: l.categoria };
      if (_elegible(c, prod, l.ml)) {
        (grupos[l.ml] ||= []).push(l);
      }
    });
    Object.entries(grupos).forEach(([ml, ls]) => {
      const totalQty = ls.reduce((s, l) => s + l.qty, 0);
      const min = Number(c.min) || 0;
      if (min > 0 && totalQty >= min) {
        // Aplica: precio_fijo (por unidad) o pct sobre el subgrupo
        ls.forEach(l => {
          let nuevo = l.unit;
          if (c.modo === 'precio_fijo') nuevo = Number(c.valor) || l.unit;
          else if (c.modo === 'pct')    nuevo = l.unitOrig * (1 - (Number(c.valor) || 0) / 100);
          if (nuevo < l.unit) { l.unit = Math.round(nuevo * 100) / 100; l.promo = pr.nombre; l.lineTotal = Math.round(l.unit * l.qty * 100) / 100; }
        });
      } else if (min > 0 && totalQty > 0) {
        const faltan = min - totalQty;
        upsells.push(`Agrega ${faltan} de ${ml}${isNaN(ml) ? '' : 'ml'} más y activa: ${pr.nombre} 🔥`);
      }
    });
  });

  // 3) Promos de "combo": N a elección por precio fijo total
  const comboDisc = [];
  vig.filter(p => p.tipo === 'combo').forEach(pr => {
    const c = pr.config || {};
    const elegibles = lines.filter(l => {
      const prod = prodById[l.id] || { id: l.id };
      return _elegible(c, prod, l.ml);
    });
    const totalQty = elegibles.reduce((s, l) => s + l.qty, 0);
    const n = Number(c.cantidad) || 0;
    const precioTotal = Number(c.precio_total) || 0;
    if (n > 0 && precioTotal > 0) {
      const combos = Math.floor(totalQty / n);
      if (combos >= 1) {
        // Descuenta las N unidades más caras por cada combo completo
        const unidades = [];
        elegibles.forEach(l => { for (let i = 0; i < l.qty; i++) unidades.push(l.unit); });
        unidades.sort((a, b) => b - a);
        const cubiertas = unidades.slice(0, combos * n);
        const sumaNormal = cubiertas.reduce((s, v) => s + v, 0);
        const sumaCombo = precioTotal * combos;
        const ahorro = Math.round((sumaNormal - sumaCombo) * 100) / 100;
        if (ahorro > 0) comboDisc.push({ nombre: pr.nombre, monto: ahorro });
      } else if (totalQty > 0) {
        const faltan = n - totalQty;
        upsells.push(`Agrega ${faltan} más y arma el combo: ${pr.nombre} 🎁`);
      }
    }
  });

  const subtotal = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
  const totalCombo = Math.round(comboDisc.reduce((s, c) => s + c.monto, 0) * 100) / 100;
  const total = Math.max(0, Math.round((subtotal - totalCombo) * 100) / 100);
  const totalSinDesc = Math.round(lines.reduce((s, l) => s + l.unitOrig * l.qty, 0) * 100) / 100;

  return {
    lines,
    comboDisc,
    subtotal,
    total,
    totalSinDesc,
    ahorro: Math.round((totalSinDesc - total) * 100) / 100,
    upsells: [...new Set(upsells)],
  };
}

// Exponer en window para que index.html y admin.html lo usen sin módulos
window.PROMOS_ENGINE = { promosVigentes, precioUnit, computeCart };
