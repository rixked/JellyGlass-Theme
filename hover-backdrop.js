/* JellyGlass — hover backdrop
   Hover a movie / show / episode card and the page background turns into its
   artwork right away; move off the card and it is gone again just as fast.
   Works with the JavaScript Injector plugin (paste this whole file as a new script).
   Detail pages and the player are left alone. */
(function () {
  "use strict";
  if (window.__jgHoverBackdrop) return;
  window.__jgHoverBackdrop = true;

  /* ---- settings ---- */
  var FADE_IN = 450;        // ms — blend-in (soft zoom + focus)
  var FADE_OUT = 160;       // ms — leaving a card stays quick
  var ZOOM = 1.06;          // start size of the zoom-in (1 = no zoom)
  var FOCUS_BLUR = 14;      // px the image starts blurred and sharpens from (0 = off)
  var DIM = 0.42;           // brightness of the artwork (0 = black, 1 = full)
  var BLUR = 0;             // px blur on the artwork (0 = sharp)
  var TYPES = ["Movie", "Series", "Season", "Episode", "BoxSet", "Trailer", "MusicVideo", "Video"];

  if (!window.matchMedia || !window.matchMedia("(hover: hover)").matches) return;

  var base = "brightness(" + DIM + ") saturate(1.15)" + (BLUR ? " blur(" + BLUR + "px)" : "");
  var ease = "cubic-bezier(0.22, 0.8, 0.24, 1)";
  var css = document.createElement("style");
  css.textContent =
    "#jg-hover-backdrop{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0;transition:opacity " + FADE_OUT + "ms ease-out}" +
    "#jg-hover-backdrop.on{opacity:1;transition:opacity " + FADE_IN + "ms " + ease + "}" +
    "#jg-hover-backdrop .jg-layer{position:absolute;inset:-" + Math.max(BLUR, FOCUS_BLUR) * 2 + "px;background-size:cover;background-position:center 20%;" +
    "opacity:0;transform:scale(" + ZOOM + ");filter:" + base + (FOCUS_BLUR ? " blur(" + FOCUS_BLUR + "px)" : "") + ";" +
    "transition:opacity " + FADE_IN + "ms " + ease + ",transform " + (FADE_IN * 2) + "ms " + ease + ",filter " + FADE_IN + "ms " + ease + ";will-change:opacity,transform}" +
    "#jg-hover-backdrop .jg-layer.show{opacity:1;transform:scale(1);filter:" + base + "}" +
    "#jg-hover-backdrop::after{content:'';position:absolute;inset:0;" +
    "background:linear-gradient(180deg,rgba(11,13,18,.35) 0,rgba(11,13,18,.15) 35%,rgba(11,13,18,.75) 100%)}" +
    "@media (prefers-reduced-motion: reduce){#jg-hover-backdrop .jg-layer{transform:none;filter:" + base + "}}";
  document.head.appendChild(css);

  var root = document.createElement("div");
  root.id = "jg-hover-backdrop";
  var layers = [document.createElement("div"), document.createElement("div")];
  layers.forEach(function (l) { l.className = "jg-layer"; root.appendChild(l); });
  var front = 0;

  /* put the new image on the back layer, then crossfade it in */
  function swapTo(url) {
    var next = layers[1 - front], prev = layers[front];
    next.style.transition = "none";            // jump back to the start state …
    next.classList.remove("show");
    next.style.backgroundImage = 'url("' + url + '")';
    void next.offsetWidth;
    next.style.transition = "";                // … then play the blend-in from there
    next.classList.add("show");
    prev.classList.remove("show");
    front = 1 - front;
  }

  function resetLayers() {
    layers.forEach(function (l) { l.classList.remove("show"); });
  }

  function mount() {
    if (root.isConnected) return;
    var bg = document.querySelector(".backgroundContainer");
    if (bg && bg.parentNode) bg.parentNode.insertBefore(root, bg.nextSibling);
    else document.body.insertBefore(root, document.body.firstChild);
  }

  var urls = {};      // card id -> backdrop url (null = none)
  var pending = {};   // card id -> lookup in progress
  var loaded = {};    // url -> true once the image is in the browser cache
  var hoveredId = null;
  var hideTimer = null;

  function api() { return window.ApiClient; }

  function resolveUrl(id) {
    if (urls[id] !== undefined) return Promise.resolve(urls[id]);
    if (pending[id]) return pending[id];
    var client = api();
    if (!client) return Promise.resolve(null);
    var p = client.getItem(client.getCurrentUserId(), id).then(function (item) {
      var opts = { type: "Backdrop", index: 0, maxWidth: 1920, quality: 85 };
      var url = null;
      if (item.BackdropImageTags && item.BackdropImageTags.length) {
        opts.tag = item.BackdropImageTags[0];
        url = client.getScaledImageUrl(item.Id, opts);
      } else if (item.ParentBackdropItemId && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) {
        opts.tag = item.ParentBackdropImageTags[0];
        url = client.getScaledImageUrl(item.ParentBackdropItemId, opts);
      }
      urls[id] = url;
      return url;
    }).catch(function () { urls[id] = null; return null; })
      .then(function (url) { delete pending[id]; return url; });
    pending[id] = p;
    return p;
  }

  function preload(url) {
    if (loaded[url]) return Promise.resolve();
    return new Promise(function (done) {
      var img = new Image();
      img.onload = img.onerror = function () { loaded[url] = true; done(); };
      img.src = url;
    });
  }

  function show(id) {
    resolveUrl(id).then(function (url) {
      if (!url || hoveredId !== id || !allowedPage()) return;
      return preload(url).then(function () {
        if (hoveredId !== id) return;
        mount();
        if (!root.classList.contains("on")) resetLayers();
        swapTo(url);
        root.classList.add("on");
      });
    });
  }

  function hide() {
    hoveredId = null;
    root.classList.remove("on");
  }

  function allowedPage() {
    return !document.querySelector("#itemDetailPage:not(.hide)") &&
           !document.querySelector("#videoOsdPage:not(.hide)");
  }

  function cardOf(el) {
    var card = el && el.closest && el.closest(".card[data-id]");
    return card && TYPES.indexOf(card.getAttribute("data-type")) !== -1 ? card : null;
  }

  document.addEventListener("mouseover", function (e) {
    var card = cardOf(e.target);
    if (!card || !allowedPage()) return;
    clearTimeout(hideTimer);
    var id = card.getAttribute("data-id");
    if (id === hoveredId) return;
    hoveredId = id;
    show(id);
  }, { passive: true });

  document.addEventListener("mouseout", function (e) {
    var from = cardOf(e.target);
    if (!from || from.contains(e.relatedTarget)) return;
    if (cardOf(e.relatedTarget)) return;            // straight onto the next card
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 40);               // tiny grace for the gap between cards
  }, { passive: true });

  window.addEventListener("hashchange", hide);
  window.addEventListener("popstate", hide);
  document.addEventListener("viewshow", hide);
})();
