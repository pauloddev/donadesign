/* ==========================================================================
   DONA DESIGN MADEIRA — Interações
   ========================================================================== */
(function () {
  "use strict";
  var C = window.DONA || {};
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var get = function (o, path) { return path.split(".").reduce(function (a, k) { return a && a[k]; }, o); };

  /* ---------- Dados centralizados ---------- */
  $$("[data-bind]").forEach(function (el) {
    var v = get(C, el.getAttribute("data-bind"));
    if (v) el.textContent = v;
  });
  var hrefs = {
    whatsapp: C.whatsapp && "https://wa.me/" + C.whatsapp,
    email: C.email && "mailto:" + C.email,
    instagram: C.instagram && C.instagram.url,
    maps: C.endereco && C.endereco.mapsUrl
  };
  $$("[data-href]").forEach(function (el) {
    var v = hrefs[el.getAttribute("data-href")];
    if (v) el.setAttribute("href", v);
  });
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Split de títulos ---------- */
  $$("[data-split]").forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="transition-delay:' + (i * 0.055).toFixed(3) + 's">' + w + "</span></span>";
    }).join(" ");
  });

  /* ---------- Intro ---------- */
  var intro = $("#intro");
  var seen = false;
  try { seen = sessionStorage.getItem("dd_intro") === "1"; } catch (e) {}
  function start() {
    body.classList.remove("is-loading");
    body.classList.add("is-ready");
    var h = $(".hero__title"); if (h) h.classList.add("in");
  }
  function closeIntro() {
    if (!intro || intro.classList.contains("done")) return;
    intro.classList.add("done");
    try { sessionStorage.setItem("dd_intro", "1"); } catch (e) {}
    setTimeout(start, 250);
    setTimeout(function () { intro.classList.add("gone"); }, 1400);
  }
  if (!intro || reduce || seen) {
    if (intro) intro.classList.add("gone");
    requestAnimationFrame(start);
  } else {
    requestAnimationFrame(function () { intro.classList.add("play"); });
    var t = setTimeout(closeIntro, 2900);
    intro.addEventListener("click", function () { clearTimeout(t); closeIntro(); });
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  function initLenis() {
    if (reduce || !window.Lenis || lenis) return;
    lenis = new window.Lenis({ duration: 1.25, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    lenis.on("scroll", onScroll);
  }
  window.addEventListener("load", initLenis);
  if (doc.readyState === "complete") initLenis();

  function scrollToId(id) {
    var el = id === "#inicio" ? doc.body : $(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(id === "#inicio" ? 0 : el, { offset: id === "#inicio" ? 0 : -60, duration: 1.6 });
    else window.scrollTo({ top: id === "#inicio" ? 0 : el.getBoundingClientRect().top + window.pageYOffset - 60, behavior: reduce ? "auto" : "smooth" });
  }

  /* ---------- Header / menu ---------- */
  var header = $("#header"), burger = $("#burger"), menu = $("#menu"), waFloat = $(".wa-float");
  var lastY = 0;
  function onScroll() {
    var sy = window.pageYOffset || root.scrollTop;
    header.classList.toggle("solid", sy > 40);
    var goingDown = sy > lastY && sy > window.innerHeight * 0.9;
    header.classList.toggle("hide", goingDown && !body.classList.contains("menu-open"));
    lastY = sy;
    if (waFloat) waFloat.classList.toggle("show", sy > window.innerHeight * 0.8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", String(!open));
    body.classList.toggle("menu-open", open);
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("open")) setMenu(false); });

  /* Âncoras internas */
  doc.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    e.preventDefault();
    if (menu.classList.contains("open")) setMenu(false);
    // Pré-preenchimento do formulário a partir de coleções/peças
    var interest = a.getAttribute("data-interest");
    if (interest && id === "#contato") prefill(interest, a.getAttribute("data-service"));
    setTimeout(function () { scrollToId(id); }, menu.classList.contains("open") ? 0 : 0);
  });

  /* Nav ativa */
  var navLinks = $$(".nav a");
  var sections = ["inicio", "colecoes", "essencia", "projetos", "contato"].map(function (id) { return doc.getElementById(id); });
  if ("IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { if (s) navIO.observe(s); });
  }

  /* ---------- Reveals (IO + verificação por posição, à prova de falhas) ---------- */
  var revealEls = $$("[data-reveal], [data-split], [data-clip]").filter(function (el) { return !el.classList.contains("hero__title"); });
  function showAll() { revealEls.forEach(function (el) { el.classList.add("in"); }); }
  if (reduce) { showAll(); }
  else {
    var pending = revealEls.slice();
    var checkReveal = function () {
      var vh = window.innerHeight || root.clientHeight;
      pending = pending.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.94 && r.bottom > -40) { el.classList.add("in"); return false; }
        return true;
      });
    };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { threshold: 0.01 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
    var rq = false;
    window.addEventListener("scroll", function () { if (!rq) { rq = true; requestAnimationFrame(function () { rq = false; checkReveal(); }); } }, { passive: true });
    window.addEventListener("resize", checkReveal);
    var iv = setInterval(checkReveal, 400);
    setTimeout(function () { clearInterval(iv); }, 20000);
    checkReveal();
    // Garantia final: se a página estiver dentro de um visualizador que não reporta rolagem, revela tudo.
    setTimeout(function () { if (pending.length === revealEls.length) showAll(); }, 6000);
  }

  /* ---------- Transição entre seções ---------- */
  var secs = $$(".section");
  function secCheck() {
    var vh = window.innerHeight || root.clientHeight;
    secs.forEach(function (s) { if (!s.classList.contains("sec-in") && s.getBoundingClientRect().top < vh * 0.88) s.classList.add("sec-in"); });
  }
  if (reduce) secs.forEach(function (s) { s.classList.add("sec-in"); });
  else {
    window.addEventListener("scroll", function () { requestAnimationFrame(secCheck); }, { passive: true });
    setInterval(secCheck, 400); secCheck();
    setTimeout(function () { secs.forEach(function (s) { if (s.getBoundingClientRect().top < (window.innerHeight || 0)) s.classList.add("sec-in"); }); }, 6000);
  }

  /* ---------- Parallax sutil ---------- */
  var px = reduce ? [] : $$("[data-parallax]");
  if (px.length && window.innerWidth > 860) {
    var ticking = false;
    var update = function () {
      var vh = window.innerHeight;
      px.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
        img.style.transform = "translate3d(0," + (p * -6).toFixed(2) + "%,0) scale(1.14)";
      });
      ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Vídeos: tocar só quando visíveis ---------- */
  var autoVids = $$("video[data-autoplay]");
  if ("IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.2 });
    autoVids.forEach(function (v) { v.muted = true; vio.observe(v); });
  }

  /* ---------- Carrosséis ---------- */
  $$("[data-rail]").forEach(function (rail) {
    var id = rail.id;
    var nav = $('[data-rail-nav="' + id + '"]');
    var bar = $('[data-rail-progress="' + id + '"] i');
    var items = Array.prototype.slice.call(rail.children);
    var count = nav && nav.querySelector(".rail-count b");
    var total = nav && nav.querySelector(".rail-count span");
    if (total) total.textContent = String(items.length).padStart(2, "0");
    function step() { return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : rail.clientWidth; }
    function update() {
      var max = rail.scrollWidth - rail.clientWidth;
      var p = max > 0 ? rail.scrollLeft / max : 1;
      if (bar) bar.style.transform = "scaleX(" + Math.max(0.12, Math.min(1, (rail.clientWidth / rail.scrollWidth) + p * (1 - rail.clientWidth / rail.scrollWidth))) + ")";
      var idx = Math.round(rail.scrollLeft / step());
      if (count) count.textContent = String(Math.min(items.length, idx + 1)).padStart(2, "0");
      if (nav) {
        nav.querySelector('[data-dir="-1"]').disabled = rail.scrollLeft < 4;
        nav.querySelector('[data-dir="1"]').disabled = rail.scrollLeft > max - 4;
      }
    }
    if (nav) $$(".rail-btn", nav).forEach(function (b) {
      b.addEventListener("click", function () {
        rail.scrollBy({ left: step() * Number(b.getAttribute("data-dir")), behavior: reduce ? "auto" : "smooth" });
      });
    });
    rail.addEventListener("scroll", function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    rail.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); rail.scrollBy({ left: step(), behavior: "smooth" }); }
      if (e.key === "ArrowLeft") { e.preventDefault(); rail.scrollBy({ left: -step(), behavior: "smooth" }); }
    });
    // Arrastar com o mouse
    if (finePointer) {
      var down = false, sx = 0, sl = 0, moved = false;
      rail.addEventListener("pointerdown", function (e) {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft;
      });
      window.addEventListener("pointermove", function (e) {
        if (!down) return;
        var dx = e.clientX - sx;
        if (Math.abs(dx) > 6) { moved = true; rail.classList.add("dragging"); }
        if (moved) rail.scrollLeft = sl - dx;
      });
      window.addEventListener("pointerup", function () {
        if (!down) return; down = false;
        if (moved) {
          rail.classList.remove("dragging");
          var s = step(); rail.scrollTo({ left: Math.round(rail.scrollLeft / s) * s, behavior: "smooth" });
          rail.addEventListener("click", function stop(ev) { ev.preventDefault(); ev.stopPropagation(); rail.removeEventListener("click", stop, true); }, true);
        }
      });
    }
    update();
  });

  /* ---------- Players com som ---------- */
  var players = $$(".player");
  players.forEach(function (pl) {
    var v = pl.querySelector("video"), btn = pl.querySelector(".player__btn");
    btn.setAttribute("aria-label", "Reproduzir vídeo com som");
    btn.addEventListener("click", function () {
      if (v.paused) {
        players.forEach(function (o) { if (o !== pl) { o.querySelector("video").pause(); o.classList.remove("playing"); } });
        v.muted = false; v.controls = false;
        var p = v.play(); if (p && p.catch) p.catch(function () { v.muted = true; v.play(); });
        pl.classList.add("playing"); btn.setAttribute("aria-label", "Pausar vídeo");
      } else {
        v.pause(); pl.classList.remove("playing"); btn.setAttribute("aria-label", "Reproduzir vídeo com som");
      }
    });
    v.addEventListener("ended", function () { pl.classList.remove("playing"); });
  });

  /* ==========================================================================
     FORMULÁRIO → WHATSAPP
     ========================================================================== */
  var form = $("#form");
  var sel = $("#f-servico");
  (C.servicos || []).forEach(function (s) {
    var o = doc.createElement("option"); o.value = s; o.textContent = s; sel.appendChild(o);
  });
  sel.addEventListener("change", function () { sel.classList.toggle("filled", !!sel.value); });

  function prefill(interest, service) {
    var obs = $("#f-obs");
    var txt = "Gostaria de conhecer " + (/^(a|o|as|os) /i.test(interest) ? interest : "as opções de " + interest.toLowerCase()) + ".";
    if (!obs.value.trim() || obs.dataset.auto === "1") { obs.value = txt; obs.dataset.auto = "1"; }
    var target = service || "Mobiliário residencial";
    if (!sel.value) { sel.value = target; sel.classList.add("filled"); }
  }
  $("#f-obs").addEventListener("input", function () { this.dataset.auto = "0"; });

  // Máscara de telefone: (81) 98145-1557
  var tel = $("#f-tel");
  tel.addEventListener("input", function () {
    var d = tel.value.replace(/\D/g, "");
    if (d.length > 11 && d.indexOf("55") === 0) d = d.slice(2);
    d = d.slice(0, 11);
    var out = d;
    if (d.length > 2) out = "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length > 6) out = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length === 11 ? 7 : 6) + "-" + d.slice(d.length === 11 ? 7 : 6);
    tel.value = out;
  });

  var rules = {
    "f-nome": function (v) {
      v = v.trim();
      if (!v) return "Informe seu nome completo.";
      if (v.length < 3 || v.split(/\s+/).length < 2) return "Por favor, informe nome e sobrenome.";
      return "";
    },
    "f-email": function (v) {
      v = v.trim();
      if (!v) return "Informe seu e-mail.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Verifique o formato do e-mail.";
      return "";
    },
    "f-tel": function (v) {
      var d = v.replace(/\D/g, "");
      if (!d) return "Informe seu WhatsApp com DDD.";
      if (d.length < 10 || d.length > 11) return "Informe o número completo com DDD.";
      var ddd = parseInt(d.slice(0, 2), 10);
      if (ddd < 11 || d.charAt(0) === "0" || d.charAt(1) === "0") return "DDD inválido.";
      if (d.length === 11 && d.charAt(2) !== "9") return "Celulares com 11 dígitos começam com 9 após o DDD.";
      return "";
    },
    "f-servico": function (v) { return v ? "" : "Selecione o serviço de interesse."; },
    "f-obs": function (v) { return v.trim().length >= 10 ? "" : "Conte um pouco sobre o projeto (mínimo de 10 caracteres)."; }
  };
  var errIds = { "f-nome": "e-nome", "f-email": "e-email", "f-tel": "e-tel", "f-servico": "e-servico", "f-obs": "e-obs" };

  function check(id, show) {
    var el = doc.getElementById(id), msg = rules[id](el.value), field = el.closest(".field");
    if (show) {
      doc.getElementById(errIds[id]).textContent = msg;
      field.classList.toggle("invalid", !!msg);
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      el.setAttribute("aria-describedby", errIds[id]);
    }
    field.classList.toggle("valid", !msg && el.value.trim() !== "");
    return !msg;
  }
  Object.keys(rules).forEach(function (id) {
    var el = doc.getElementById(id);
    el.addEventListener("blur", function () { if (el.value) check(id, true); });
    el.addEventListener("input", function () { if (el.closest(".field").classList.contains("invalid")) check(id, true); else check(id, false); });
    el.addEventListener("change", function () { check(id, true); });
  });

  function buildMessage() {
    var v = function (id) { return doc.getElementById(id).value.trim(); };
    return [
      "Olá, Dona Design!",
      "",
      "Gostaria de iniciar um atendimento sobre um projeto.",
      "",
      "*Dados para contato*",
      "",
      "Nome: " + v("f-nome"),
      "E-mail: " + v("f-email"),
      "WhatsApp: " + v("f-tel"),
      "",
      "*Interesse*",
      "",
      "Serviço: " + v("f-servico"),
      "",
      "*Detalhes do projeto*",
      "",
      v("f-obs"),
      "",
      "Aguardo o contato da equipe."
    ].join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(rules).forEach(function (id) {
      if (!check(id, true) && !firstBad) firstBad = doc.getElementById(id);
    });
    if (firstBad) { firstBad.focus(); return; }
    var url = "https://wa.me/" + (C.whatsapp || "5581981451557") + "?text=" + encodeURIComponent(buildMessage());
    var fb = $("#formFallback"), link = $("#fallbackLink");
    link.setAttribute("href", url);
    var w = null;
    try { w = window.open(url, "_blank"); } catch (err) { w = null; }
    if (w) { try { w.opener = null; } catch (err) {} }
    else { fb.hidden = false; link.focus(); }
  });
})();
