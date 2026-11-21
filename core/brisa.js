/* Brisa UI · núcleo común (Elementor, Gutenberg, Astro y HTML) · Licencia MIT · Marina Code
   Arranca solo con cada .brisa[data-brisa] de la página. */
/* Brisa UI · motor común v1
   Cada pieza es un <div class="brisa" data-brisa="nombre">. Las fotos salen del widget de galería
   de Elementor más cercano (debajo o encima) o, si no hay, de las <img> de prueba que lleva dentro. */
(function () {
  var PIEZAS = {};
  var PROP = { mosaico: 4 / 3, marea: 0.55, persianas: 1, baraja: 1.15, abanico: 0.6, ensamblaje: 0.75, cascada: 1.25, rodillo: 1.15, anillo: 0.8, corona: 1 };

  /* ---------- utilidades ---------- */
  function enEditor() { return document.body && document.body.classList.contains('elementor-editor-active'); }
  function original(u) {
    // WordPress guarda los tamaños como foto-150x150.jpg: quitamos el sufijo para usar la original
    return (u || '').replace(/-\d+x\d+(\.(?:jpe?g|png|webp|avif|gif))(\?.*)?$/i, '$1$2');
  }
  function urlDe(im) {
    var a = im.closest('a');
    if (a && /\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(a.getAttribute('href') || '')) return original(a.href);
    var ss = im.getAttribute('srcset') || im.getAttribute('data-srcset') || im.getAttribute('data-lazy-srcset');
    if (ss) {
      var mejor = null, ancho = 0;
      ss.split(',').forEach(function (p) {
        var t = p.trim().split(/\s+/), w = parseInt(t[1], 10) || 0;
        if (t[0] && w >= ancho) { ancho = w; mejor = t[0]; }
      });
      if (mejor) return original(mejor);
    }
    return original(im.getAttribute('data-lazy-src') || im.getAttribute('data-src') || im.currentSrc || im.src);
  }
  function galeria(root) {
    // Cada pieza usa SOLO la galería que tiene entre ella y la pieza siguiente
    var raices = Array.prototype.slice.call(document.querySelectorAll('.brisa[data-brisa]'));
    var i = raices.indexOf(root), sig = raices[i + 1], ant = raices[i - 1];
    // Elementor: cualquier widget de galería (Basic Gallery, Gallery, Image Carousel...)
    // Gutenberg: el bloque Galería (figure.wp-block-gallery)
    var gals = Array.prototype.filter.call(document.querySelectorAll('.elementor-element, [data-widget_type], .wp-block-gallery'), function (el) {
      if (el.querySelector('.brisa') || el.closest('.brisa')) return false;
      if (el.classList.contains('wp-block-gallery')) return !el.parentElement.closest('.wp-block-gallery, .elementor-element');
      var tipo = (el.getAttribute('data-widget_type') || '') + ' ' + el.className;
      return /gallery|galeria|carousel/i.test(tipo) && !el.querySelector('.elementor-element');
    });
    var F = Node.DOCUMENT_POSITION_FOLLOWING, P = Node.DOCUMENT_POSITION_PRECEDING, j, g;
    for (j = 0; j < gals.length; j++) {
      g = gals[j];
      if ((root.compareDocumentPosition(g) & F) && (!sig || (sig.compareDocumentPosition(g) & P))) return g.querySelector('img') ? g : null;
    }
    // Una galería pertenece a la pieza que tiene encima. Solo la primera pieza puede usar una galería colocada antes que ella.
    if (!ant) for (j = gals.length - 1; j >= 0; j--) {
      g = gals[j];
      if (root.compareDocumentPosition(g) & P) return g.querySelector('img') ? g : null;
    }
    return null;
  }
  function ocultarGaleria(g, root) {
    g.style.display = 'none';
    if (g.classList.contains('wp-block-gallery')) return;
    var c = g.parentElement && g.parentElement.closest('.e-con, .elementor-section');
    if (c && !c.contains(root) && c.querySelectorAll('.elementor-widget').length === 1) c.style.display = 'none';
  }
  function el(tag, cls, padre) { var e = document.createElement(tag); if (cls) e.className = cls; if (padre) padre.appendChild(e); return e; }
  function foto(f, padre, cls) {
    var caja = el('div', 'b-foto' + (cls ? ' ' + cls : ''), padre);
    var img = el('img', '', caja); img.src = f.src; img.alt = f.alt; img.decoding = 'async';
    if (f.posicion) img.style.objectPosition = f.posicion;
    return caja;
  }
  function easeIO(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function num(root, attr, def) { var v = parseFloat(root.getAttribute(attr)); return isNaN(v) ? def : v; }

  /* ---------- arranque de cada pieza ---------- */
  function iniciar(root) {
    if (root.getAttribute('data-brisa-listo')) return;
    var tipo = root.getAttribute('data-brisa');
    if (!PIEZAS[tipo]) return;
    root.setAttribute('data-brisa-listo', '1');
    root._bId = root._bId || ('b' + Math.random().toString(36).slice(2, 8));
    var gen = root._bGen = (root._bGen || 0) + 1;

    var gal = galeria(root);
    var origen = gal ? gal.querySelectorAll('img') : root.querySelectorAll('img');
    var fotos = Array.prototype.slice.call(origen).filter(function (im) { return !im.closest('.b-int'); })
      .map(function (im) { return { src: urlDe(im), alt: im.alt || im.getAttribute('title') || '', etiqueta: im.getAttribute('data-etiqueta'), posicion: im.getAttribute('data-posicion') || '' }; });
    if (gal && !enEditor()) ocultarGaleria(gal, root);

    Array.prototype.slice.call(root.querySelectorAll('.b-int, .b-aviso')).forEach(function (n) { n.remove(); });
    if (enEditor()) {
      var av = el('div', 'b-aviso', root);
      av.textContent = gal ? ('Brisa UI · ' + fotos.length + ' fotos de la galería') : 'Brisa UI · fotos de prueba: añade un widget de galería debajo';
    }
    if (!fotos.length) return;

    var int = el('div', 'b-int', root);
    var ctx = {
      root: root, int: int, fotos: fotos, visible: true,
      reducido: !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches),
      vivo: function () { return root.isConnected && root._bGen === gen; },
      activo: function () { return ctx.vivo() && ctx.visible && !ctx.reducido; },
      num: function (a, d) { return num(root, a, d); }
    };
    // Altura fija en px según el ancho real (en contenedores flex de Elementor aspect-ratio no reserva hueco)
    var prop = num(root, 'data-proporcion', PROP[tipo] || 1);
    ctx.medir = function () {
      if (!ctx.vivo()) return;
      var w = root.getBoundingClientRect().width;
      if (w > 0) {
        var h = Math.ceil(w * prop);
        // Alto máximo opcional, en fracción de la pantalla (data-alto-max="0.85")
        var altoMax = parseFloat(root.getAttribute('data-alto-max'));
        if (altoMax > 0) h = Math.min(h, Math.round(window.innerHeight * altoMax));
        if (Math.abs(root.offsetHeight - h) > 1) root.style.height = h + 'px';
        var p = root.parentElement;
        if (p && p.closest('.elementor-element') && p.getBoundingClientRect().height < h - 1) p.style.minHeight = h + 'px';
      }
      if (ctx.alRedimensionar) ctx.alRedimensionar();
    };
    ctx.medir();
    if ('ResizeObserver' in window) new ResizeObserver(ctx.medir).observe(root.parentElement || root);
    window.addEventListener('resize', ctx.medir);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { ctx.visible = e[0].isIntersecting; }).observe(root);
    PIEZAS[tipo](ctx);
  }
  function reiniciar(root) { root.removeAttribute('data-brisa-listo'); iniciar(root); }
  function todos() { Array.prototype.forEach.call(document.querySelectorAll('.brisa[data-brisa]'), iniciar); }
  // Bucle por fotogramas que se para solo cuando la pieza desaparece o se reinicia
  function bucle(ctx, paso) {
    var ult = null;
    (function f(t) {
      if (!ctx.vivo()) return;
      // el primer fotograma puede llegar con una marca de tiempo anterior: nunca restamos tiempo
      var dt = ult === null ? 0 : Math.max(0, Math.min(t - ult, 100)); ult = t;
      paso(ctx.activo() ? dt : 0);
      requestAnimationFrame(f);
    })(performance.now());
  }

  /* ---------- CM-001 Mosaico ---------- */
  PIEZAS.mosaico = function (ctx) {
    var propios = ctx.root.getAttribute('data-repartos');
    var R = propios ? JSON.parse(propios) : [
      [[0,0,0,.5,.5],[2,.5,0,.5,.5],[1,0,.5,1,.5]],
      [[0,0,0,1,.5],[1,0,.5,.5,.5],[4,.5,.5,.5,.25],[7,.5,.75,.5,.25]],
      [[0,0,0,1,.5],[3,0,.5,1,.5]],
      [[3,0,0,.5,1],[5,.5,0,.5,.5],[6,.5,.5,.5,.5]],
      [[6,0,0,1,.55],[8,0,.55,.5,.45],[10,.5,.55,.5,.45]],
      [[10,0,0,.4,.5],[9,.4,0,.6,.5],[2,0,.5,.6,.5],[8,.6,.5,.4,.5]]
    ];
    var SLOTS = 0;
    R = R.map(function (l) { var m = {}; l.forEach(function (c) { m[c[0]] = { x: c[1], y: c[2], w: c[3], h: c[4] }; SLOTS = Math.max(SLOTS, c[0] + 1); }); return m; });
    var etiquetas = ctx.root.hasAttribute('data-etiquetas');
    var pausa = ctx.num('data-pausa', 2) * 1000, cambio = ctx.num('data-cambio', 2.4) * 1000, paso = pausa + cambio, total = paso * R.length;
    var celdas = [];
    for (var i = 0; i < SLOTS; i++) {
      var c = el('div', 'b-celda', ctx.int), f = ctx.fotos[i % ctx.fotos.length];
      foto(f, c);
      // data-etiqueta manda (vacío = sin etiqueta); si no lo lleva, se usa el texto alternativo
      var txt = f.etiqueta != null ? f.etiqueta : f.alt;
      if (etiquetas && txt) el('span', 'b-pie', c).textContent = txt;
      celdas.push(c);
    }
    function fuera(r) {
      var cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      var d = [[cx,'l'],[1-cx,'r'],[cy,'t'],[1-cy,'b']].sort(function (a, b) { return a[0] - b[0]; })[0][1];
      return { x: d === 'l' ? -r.w - .02 : d === 'r' ? 1.02 : r.x, y: d === 't' ? -r.h - .02 : d === 'b' ? 1.02 : r.y };
    }
    var t = 0;
    bucle(ctx, function (dt) {
      t += dt;
      var tt = t % total, n = Math.floor(tt / paso), loc = tt - n * paso;
      var A = R[n], B = R[(n + 1) % R.length], k = loc < pausa ? 0 : easeIO((loc - pausa) / cambio);
      var W = ctx.int.clientWidth, H = ctx.int.clientHeight;
      for (var id = 0; id < SLOTS; id++) {
        var a = A[id], b = B[id], e = celdas[id], r = null, o;
        if (a && b) r = { x: lerp(a.x,b.x,k), y: lerp(a.y,b.y,k), w: lerp(a.w,b.w,k), h: lerp(a.h,b.h,k) };
        else if (a) { o = fuera(a); r = { x: lerp(a.x,o.x,k), y: lerp(a.y,o.y,k), w: a.w, h: a.h }; }
        else if (b && k > 0) { o = fuera(b); r = { x: lerp(o.x,b.x,k), y: lerp(o.y,b.y,k), w: b.w, h: b.h }; }
        if (!r) { e.style.visibility = 'hidden'; continue; }
        e.style.visibility = 'visible';
        e.style.zIndex = (a && b) ? 3 : b ? 2 : 1;
        e.style.opacity = (a && b) ? 1 : a ? 1 - k * .6 : .4 + k * .6;
        e.style.width = (r.w * W) + 'px'; e.style.height = (r.h * H) + 'px';
        e.style.transform = 'translate3d(' + (r.x * W) + 'px,' + (r.y * H) + 'px,0)';
      }
    });
  };

  /* ---------- CM-002 Marea: dos filas en sentidos opuestos ---------- */
  PIEZAS.marea = function (ctx) {
    var vel = ctx.num('data-velocidad', 40); // px por segundo
    var filas = [], lista = ctx.fotos.slice();
    while (lista.length < 8) lista = lista.concat(ctx.fotos);
    [0, 1].forEach(function (n) {
      var fila = el('div', 'b-fila', ctx.int), pista = el('div', 'b-pista', fila);
      var orden = n ? lista.slice().reverse() : lista;
      for (var r = 0; r < 2; r++) orden.forEach(function (f) { foto(f, pista); });
      filas.push({ pista: pista, x: 0, dir: n ? 1 : -1, v: vel * (n ? .8 : 1) });
    });
    bucle(ctx, function (dt) {
      filas.forEach(function (f) {
        var mitad = f.pista.scrollWidth / 2;
        if (!mitad) return;
        f.x += f.dir * f.v * dt / 1000;
        if (f.x <= -mitad) f.x += mitad;
        if (f.x > 0) f.x -= mitad;
        f.pista.style.transform = 'translate3d(' + f.x + 'px,0,0)';
      });
    });
  };

  /* ---------- CM-003 Persianas: tres columnas verticales ---------- */
  PIEZAS.persianas = function (ctx) {
    var vel = ctx.num('data-velocidad', 28);
    var cols = [];
    for (var c = 0; c < 3; c++) {
      var col = el('div', 'b-col', ctx.int), pista = el('div', 'b-pista', col), lista = [];
      for (var i = c; lista.length < 4; i += 3) lista.push(ctx.fotos[i % ctx.fotos.length]);
      for (var r = 0; r < 2; r++) lista.forEach(function (f) { foto(f, pista); });
      cols.push({ pista: pista, y: 0, dir: c === 1 ? 1 : -1, v: vel * [1, .8, .9][c] });
    }
    bucle(ctx, function (dt) {
      cols.forEach(function (k) {
        var mitad = k.pista.scrollHeight / 2;
        if (!mitad) return;
        k.y += k.dir * k.v * dt / 1000;
        if (k.y <= -mitad) k.y += mitad;
        if (k.y > 0) k.y -= mitad;
        k.pista.style.transform = 'translate3d(0,' + k.y + 'px,0)';
      });
    });
  };

  /* ---------- CM-004 Baraja: pila de postales ---------- */
  PIEZAS.baraja = function (ctx) {
    var cada = ctx.num('data-cambio', 3.6) * 1000, dur = 1400;
    var lista = ctx.fotos.slice(); while (lista.length < 4) lista = lista.concat(ctx.fotos);
    var cartas = lista.slice(0, 8).map(function (f) {
      var c = el('div', 'b-carta', ctx.int); foto(f, c);
      if (f.alt) el('span', 'b-pie', c).textContent = f.alt;
      return c;
    });
    var n = cartas.length, frente = 0, saliendo = -1, t = 0, tSalida = 0;
    function colocar() {
      cartas.forEach(function (c, i) {
        var d = (i - frente + n) % n;
        if (i === saliendo) { c.style.transform = 'translate(-115%,-4%) rotate(-14deg)'; c.style.opacity = '0'; c.style.zIndex = 20; return; }
        c.style.transform = 'translateY(' + (-d * 14) + 'px) scale(' + (1 - d * .05) + ') rotate(' + ([0, 3, -3, 5][d] || 0) + 'deg)';
        c.style.opacity = d > 3 ? '0' : '1';
        c.style.zIndex = 10 - d;
      });
    }
    colocar();
    bucle(ctx, function (dt) {
      t += dt;
      if (saliendo >= 0 && t - tSalida >= dur) { saliendo = -1; colocar(); }
      if (t >= cada) { t = 0; tSalida = 0; saliendo = frente; frente = (frente + 1) % n; colocar(); }
    });
  };

  /* ---------- CM-005 Abanico: paneles que se abren ---------- */
  PIEZAS.abanico = function (ctx) {
    var cada = ctx.num('data-cambio', 4) * 1000;
    var lista = ctx.fotos.slice(0, 7); while (lista.length < 4) lista = lista.concat(ctx.fotos).slice(0, 4);
    var total = lista.length, actual = 0, t = 0, espera = 0;
    var paneles = lista.map(function (f, i) {
      var b = el('button', 'b-panel', ctx.int); b.type = 'button'; b.setAttribute('aria-label', f.alt || ('Foto ' + (i + 1)));
      foto(f, b);
      var et = el('span', 'b-etq', b);
      el('small', '', et).textContent = (i + 1 < 10 ? '0' : '') + (i + 1) + ' / ' + (total < 10 ? '0' : '') + total;
      if (f.alt) et.appendChild(document.createTextNode(f.alt));
      function elegir() { abrir(i); espera = cada * 2; }
      b.addEventListener('mouseenter', elegir); b.addEventListener('click', elegir);
      return b;
    });
    function abrir(i) { actual = i; t = 0; paneles.forEach(function (p, j) { p.classList.toggle('b-on', j === i); p.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); }
    abrir(0);
    bucle(ctx, function (dt) {
      if (espera > 0) { espera -= dt; return; }
      t += dt;
      if (t >= cada) abrir((actual + 1) % total);
    });
  };

  /* ---------- CM-006 Ensamblaje: se monta con el scroll ---------- */
  PIEZAS.ensamblaje = function (ctx) {
    var desde = [[-90,-40,-14],[80,-120,10],[40,110,-8],[140,30,16],[-120,90,12],[-20,140,-18],[130,120,9]];
    var tiles = desde.map(function (d, i) { return foto(ctx.fotos[i % ctx.fotos.length], ctx.int, 'b-t' + (i + 1)); });
    ctx.int.classList.add('b-rejilla');
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function clamp(v) { return Math.max(0, Math.min(1, v)); }
    var ultimo = -1;
    bucle(ctx, function () {
      if (!ctx.vivo()) return;
      var r = ctx.root.getBoundingClientRect(), vh = window.innerHeight || 800, p;
      if (ctx.root.hasAttribute('data-auto')) {
        // Modo automático (demos y vídeos): se monta, se queda, se desmonta, en bucle de 7 s
        var c = (performance.now() - (ctx.t0 || (ctx.t0 = performance.now()))) % 7000;
        p = c < 3000 ? ease(c / 3000) : c < 5800 ? 1 : 1 - ease((c - 5800) / 1200);
      } else {
        // 0 cuando el bento asoma por abajo · 1 cuando su centro llega a la mitad de la pantalla
        p = ctx.reducido ? 1 : clamp((vh - r.top) / (vh * .5 + r.height * .5));
      }
      if (Math.abs(p - ultimo) < .001) return; ultimo = p;
      tiles.forEach(function (t, i) {
        var k = ease(clamp((p - i * .06) / .55)), d = desde[i];
        t.style.transform = 'translate(' + d[0] * (1 - k) + '%,' + d[1] * (1 - k) + '%) rotate(' + d[2] * (1 - k) + 'deg) scale(' + (.7 + .3 * k) + ')';
        t.style.opacity = .15 + .85 * k;
      });
    });
  };


  /* ---------- piezas 3D: utilidades comunes ---------- */
  // Repite las fotos hasta tener al menos n (las piezas en círculo necesitan muchas)
  function repetir(fotos, n, max) {
    var l = fotos.slice(); while (l.length < n) l = l.concat(fotos);
    return max ? l.slice(0, Math.max(n, Math.min(l.length, max))) : l;
  }
  function tarjeta(f, padre) {
    var t = el('div', 'b-tarjeta', padre); foto(f, t); t._velo = el('span', 'b-velo', t);
    return t;
  }
  function rad(g) { return g * Math.PI / 180; }

  /* ---------- BR-007 Cascada: columna inclinada de tarjetas sobre un texto gigante ----------
     Movimiento por pasos medido sobre la referencia: amago hacia atrás, tirón, se pasa un poco y se asienta.
     Las tarjetas suben y el texto baja a la vez, a contramovimiento. */
  function bezier(x1, y1, x2, y2) {
    return function (x) {
      var s = x, i, cx, d;
      for (i = 0; i < 6; i++) {
        cx = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s - x;
        d = 3 * (1 - s) * (1 - s) * x1 + 6 * (1 - s) * s * (x2 - x1) + 3 * s * s * (1 - x2);
        if (Math.abs(cx) < 1e-4 || !d) break;
        s = Math.max(0, Math.min(1, s - cx / d));
      }
      return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
    };
  }
  var tiron = bezier(.45, 0, .25, 1);
  function sine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  // u de 0 a 1 dentro de un paso → avance de 0 a 1 (amago 20 %, tirón 47 %, asentarse 33 %)
  function pasoCascada(u) {
    if (u < .2) return -.117 * sine(u / .2);
    if (u < .667) return lerp(-.117, 1.056, tiron((u - .2) / .467));
    return lerp(1.056, 1, sine((u - .667) / .333));
  }
  PIEZAS.cascada = function (ctx) {
    var ciclo = ctx.num('data-cambio', 1.5) * 1000;
    var palabras = (ctx.root.getAttribute('data-texto') || 'Brisa|Dénia').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    if (palabras.length === 1) palabras.push(palabras[0]);
    var capa = el('div', 'b-texto', ctx.int), filas = [], medidas = [];
    var NF = 10; // filas de texto en la capa (sobran para cubrir el alto)
    for (var i = 0; i < NF; i++) filas.push(el('span', '', capa));
    filas.forEach(function (s, i) { s.textContent = palabras[i % palabras.length]; });
    var pila = el('div', 'b-pila', ctx.int);
    var M = 7, pool = [];
    for (var k = 0; k < M; k++) pool.push({ el: tarjeta(ctx.fotos[k % ctx.fotos.length], pila), j: null });
    var anchoMedido = 0, altoFila = 0;
    function medirTexto(W, H) {
      if (W === anchoMedido) return; anchoMedido = W;
      altoFila = H * .2;
      filas.forEach(function (s) { s.style.fontSize = (altoFila * 1.18) + 'px'; s.style.transform = 'none'; });
      medidas = filas.map(function (s) { return s.getBoundingClientRect().width || 1; });
    }
    var t = 0;
    bucle(ctx, function (dt) {
      t += dt;
      var W = ctx.int.clientWidth, H = ctx.int.clientHeight;
      if (!W || !H) return;
      medirTexto(W, H);
      var n = Math.floor(t / ciclo), avance = n + pasoCascada((t - n * ciclo) / ciclo);
      // Texto: baja dos filas por paso
      var bloque = altoFila * palabras.length, off = ((avance * altoFila * 2) % bloque + bloque) % bloque;
      filas.forEach(function (s, i) {
        var y = i * altoFila + off - bloque;
        s.style.transform = 'translate3d(' + (W * .015) + 'px,' + y + 'px,0) scaleX(' + (W * .97 / medidas[i]) + ')';
      });
      // Tarjetas: suben una por paso, en columna inclinada
      var D = H * .34, cw = Math.min(W * .7, H * .62), ch = cw * .66, base = Math.floor(avance) - 2;
      ctx.int.style.perspective = (W * 2.2) + 'px';
      for (var q = 0; q < M; q++) {
        var j = base + q, c = pool[((j % M) + M) % M];
        if (c.j !== j) {
          var f = ctx.fotos[((j % ctx.fotos.length) + ctx.fotos.length) % ctx.fotos.length], img = c.el.querySelector('img');
          if (img.getAttribute('src') !== f.src) img.src = f.src;
          img.alt = f.alt; img.style.objectPosition = f.posicion || '';
          c.j = j;
        }
        var y = H * .5 + (j - avance) * D;
        var e = c.el;
        e.style.width = cw + 'px'; e.style.height = ch + 'px';
        e.style.zIndex = 10 + q;
        e.style.transform = 'translate3d(' + (W * .56 - cw / 2) + 'px,' + (y - ch / 2) + 'px,0) rotateZ(13deg) rotateY(-12deg) rotateX(18deg)';
      }
    });
  };

  /* ---------- BR-008 Rodillo: tambor vertical, la del centro queda plana ---------- */
  PIEZAS.rodillo = function (ctx) {
    var pausa = ctx.num('data-pausa', 1.4) * 1000, cambio = ctx.num('data-cambio', 1) * 1000;
    var lista = repetir(ctx.fotos, 8), N = lista.length, A = 38; // grados entre tarjeta y tarjeta
    var cartas = lista.map(function (f) { return tarjeta(f, ctx.int); });
    var t = 0;
    bucle(ctx, function (dt) {
      t += dt;
      var W = ctx.int.clientWidth, H = ctx.int.clientHeight;
      if (!W || !H) return;
      ctx.int.style.perspective = (H * 2.4) + 'px';
      var n = Math.floor(t / (pausa + cambio)), loc = t - n * (pausa + cambio);
      var pos = n + (loc < pausa ? 0 : easeIO((loc - pausa) / cambio));
      var R = H * .46, ch = 2 * R * Math.tan(rad(A / 2)) * .9, cw = Math.min(W * .74, ch * 1.55);
      cartas.forEach(function (e, i) {
        var d = ((i - pos) % N + N) % N; if (d > N / 2) d -= N;
        var th = d * A;
        if (Math.abs(th) > 100) { e.style.visibility = 'hidden'; return; }
        e.style.visibility = 'visible';
        var c = Math.cos(rad(th));
        e.style.width = cw + 'px'; e.style.height = ch + 'px';
        e.style.zIndex = 50 + Math.round(c * 40);
        e.style.transform = 'translate3d(' + (-cw / 2) + 'px,' + (R * Math.sin(rad(th)) - ch / 2) + 'px,' + (R * c - R) + 'px) rotateX(' + (-th) + 'deg)';
        e._velo.style.opacity = Math.max(0, (1 - c) * .55);
      });
    });
  };

  /* ---------- BR-009 Anillo: aro horizontal de tarjetas visto desde arriba ---------- */
  PIEZAS.anillo = function (ctx) {
    var vel = ctx.num('data-velocidad', 14); // grados por segundo
    var lista = repetir(ctx.fotos, 10, 14), N = lista.length, paso = 360 / N;
    var escena = el('div', 'b-escena', ctx.int);
    var cartas = lista.map(function (f) { return tarjeta(f, escena); });
    var giro = 0;
    bucle(ctx, function (dt) {
      giro += vel * dt / 1000;
      var W = ctx.int.clientWidth, H = ctx.int.clientHeight;
      if (!W || !H) return;
      var R = Math.min(W * .4, H * .55), cw = 2 * R * Math.sin(rad(paso / 2)) * .93, ch = Math.min(cw * 1.25, H * .34);
      ctx.int.style.perspective = (Math.max(W, H) * 1.7) + 'px';
      escena.style.transform = 'translate3d(0,' + (-H * .07) + 'px,' + (-R * .15) + 'px) rotateX(-22deg) rotateZ(5deg) rotateY(' + (-giro) + 'deg)';
      cartas.forEach(function (e, i) {
        var a = i * paso, mira = Math.cos(rad(a - giro)); // 1 = de cara, -1 = de espaldas
        e.style.width = cw + 'px'; e.style.height = ch + 'px';
        e.style.transform = 'translate(-50%,-50%) rotateY(' + a + 'deg) translateZ(' + R + 'px)';
        e._velo.style.opacity = mira < 0 ? .55 - mira * .2 : (1 - mira) * .25;
      });
    });
  };

  /* ---------- BR-010 Corona: aro de fotos que gira y se balancea en 3D ---------- */
  PIEZAS.corona = function (ctx) {
    var vel = ctx.num('data-velocidad', 9);
    var lista = repetir(ctx.fotos, 9, 12), N = lista.length, paso = 360 / N;
    var escena = el('div', 'b-escena', ctx.int);
    var cartas = lista.map(function (f) { return tarjeta(f, escena); });
    var t = 0;
    bucle(ctx, function (dt) {
      t += dt;
      var W = ctx.int.clientWidth, H = ctx.int.clientHeight;
      if (!W || !H) return;
      var s = t / 1000, R = Math.min(W, H) * .3, lado = R * .62;
      ctx.int.style.perspective = (Math.min(W, H) * 2.2) + 'px';
      escena.style.transform = 'rotateX(' + (16 * Math.sin(s * .45)) + 'deg) rotateY(' + (24 * Math.sin(s * .3 + 1)) + 'deg)';
      var giro = s * vel;
      cartas.forEach(function (e, i) {
        var a = rad(i * paso + giro - 90), z = 26 * Math.sin(i * 1.7 + s * .8);
        e.style.width = lado + 'px'; e.style.height = lado + 'px';
        e.style.transform = 'translate3d(' + (R * Math.cos(a) - lado / 2) + 'px,' + (R * Math.sin(a) - lado / 2) + 'px,' + z + 'px) rotateZ(' + (8 * Math.sin(i * 2.3 + s * .6)) + 'deg)';
        e._velo.style.opacity = Math.max(0, -z / 26) * .18;
      });
    });
  };

  /* ---------- arranque y Elementor ---------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', todos); else todos();
  window.addEventListener('load', todos);
  function registrar() {
    if (!(window.elementorFrontend && elementorFrontend.hooks)) return;
    elementorFrontend.hooks.addAction('frontend/element_ready/html.default', function ($s) {
      Array.prototype.forEach.call($s[0].querySelectorAll('.brisa[data-brisa]'), iniciar);
    });
    // Al cambiar las fotos de una galería en el editor, la pieza que la usa se actualiza
    elementorFrontend.hooks.addAction('frontend/element_ready/global', function ($s) {
      var g = $s[0];
      if (!/gallery|carousel/i.test((g.getAttribute('data-widget_type') || '') + ' ' + g.className)) return;
      Array.prototype.forEach.call(document.querySelectorAll('.brisa[data-brisa]'), reiniciar);
    });
  }
  if (window.elementorFrontend && window.elementorFrontend.hooks) registrar();
  else if (window.jQuery) jQuery(window).on('elementor/frontend/init', registrar);
  // Cualquier pieza nueva o repintada (editor de Elementor) se inicia sola, una vez cargada la página
  function vigilar() {
    if (!('MutationObserver' in window)) return;
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var ns = ms[i].addedNodes;
        for (var j = 0; j < ns.length; j++) {
          var n = ns[j];
          if (n.nodeType !== 1 || n.closest('.b-int')) continue;
          if (n.matches('.brisa') || n.querySelector('.brisa')) { todos(); return; }
          if (enEditor() && /gallery|carousel/i.test((n.getAttribute('data-widget_type') || '') + ' ' + n.className + ' ' + (n.querySelector('[class*=gallery]') ? 'gallery' : ''))) {
            Array.prototype.forEach.call(document.querySelectorAll('.brisa[data-brisa]'), reiniciar); return;
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vigilar); else vigilar();
})();
