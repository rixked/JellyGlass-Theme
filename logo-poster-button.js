/* JellyGlass — logo poster button
   Adds a button to movie and series pages (admins only). One click draws the logo
   on a black 2:3 poster in the browser and saves it as the item's real poster,
   so it shows in every app. Paste into the JavaScript Injector plugin.
   Undo: "Edit images" on the item, or "Refresh metadata" with "Replace existing images". */
(function () {
  "use strict";
  if (window.__jgLogoPosterButton) return;
  window.__jgLogoPosterButton = true;

  /* ---- settings ---- */
  var POSTER_W = 1000, POSTER_H = 1500;
  var BACKGROUND = "#000";
  var LOGO_MAX_W = 0.76;     // logo at most 76 % of the poster width …
  var LOGO_MAX_H = 0.33;     // … and 33 % of its height
  var LOGO_Y = 0.5;          // vertical centre of the logo (0.5 = middle)
  var TYPES = ["Series", "Movie", "BoxSet"];

  var BTN_CLASS = "jg-logo-poster-btn";
  var isAdmin = null;
  var busy = false;

  function api() { return window.ApiClient; }

  function currentId() {
    var m = /[?&]id=([0-9a-f]{32}|[0-9a-f-]{36})/i.exec(location.hash || location.href);
    return m ? m[1] : null;
  }

  function checkAdmin() {
    if (isAdmin !== null) return Promise.resolve(isAdmin);
    return api().getCurrentUser().then(function (u) {
      isAdmin = !!(u && u.Policy && u.Policy.IsAdministrator);
      return isAdmin;
    }).catch(function () { return false; });
  }

  function notify(text) {
    if (window.Dashboard && typeof window.Dashboard.alert === "function") window.Dashboard.alert(text);
    else window.alert(text);
  }

  function loadImage(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("logo download failed (" + r.status + ")");
      return r.blob();
    }).then(function (blob) { return createImageBitmap(blob); });
  }

  /* crop away empty transparent edges so every logo is sized by what's actually visible */
  function trimmed(bitmap) {
    var c = document.createElement("canvas");
    c.width = bitmap.width; c.height = bitmap.height;
    var x = c.getContext("2d");
    x.drawImage(bitmap, 0, 0);
    var d = x.getImageData(0, 0, c.width, c.height).data;
    var minX = c.width, minY = c.height, maxX = -1, maxY = -1;
    for (var y = 0; y < c.height; y++) {
      for (var i = 0; i < c.width; i++) {
        if (d[(y * c.width + i) * 4 + 3] > 8) {
          if (i < minX) minX = i; if (i > maxX) maxX = i;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return { src: c, x: 0, y: 0, w: c.width, h: c.height };
    return { src: c, x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  function drawPoster(bitmap) {
    var t = trimmed(bitmap);
    var scale = Math.min(POSTER_W * LOGO_MAX_W / t.w, POSTER_H * LOGO_MAX_H / t.h);
    var w = Math.round(t.w * scale), h = Math.round(t.h * scale);
    var c = document.createElement("canvas");
    c.width = POSTER_W; c.height = POSTER_H;
    var x = c.getContext("2d");
    x.fillStyle = BACKGROUND;
    x.fillRect(0, 0, POSTER_W, POSTER_H);
    x.imageSmoothingQuality = "high";
    x.drawImage(t.src, t.x, t.y, t.w, t.h,
      Math.round((POSTER_W - w) / 2), Math.round(POSTER_H * LOGO_Y - h / 2), w, h);
    return c.toDataURL("image/jpeg", 0.92).split(",")[1];   // base64, which Jellyfin expects
  }

  function upload(itemId, base64) {
    var a = api();
    var auth = 'MediaBrowser Client="JellyGlass", Device="Browser", DeviceId="jellyglass-logo-poster", ' +
               'Version="1.0", Token="' + a.accessToken() + '"';
    return fetch(a.getUrl("Items/" + itemId + "/Images/Primary"), {
      method: "POST",
      headers: { "Content-Type": "image/jpeg", "Authorization": auth },
      body: base64
    }).then(function (r) {
      if (!r.ok) throw new Error("upload failed (" + r.status + ")");
    });
  }

  function makePoster(item) {
    if (busy) return;
    if (!window.confirm('Replace the poster of "' + item.Name + '" with a logo poster?\n\n' +
                        'Undo later via "Edit images" or "Refresh metadata → Replace existing images".')) return;
    busy = true;
    var a = api();
    var logoUrl = a.getScaledImageUrl(item.Id, { type: "Logo", tag: item.ImageTags.Logo, maxWidth: 1600, quality: 100 });
    loadImage(logoUrl)
      .then(function (bmp) { return upload(item.Id, drawPoster(bmp)); })
      .then(function () {
        notify("Logo poster saved for " + item.Name + ".");
        setTimeout(function () { location.reload(); }, 600);
      })
      .catch(function (e) { notify("Logo poster failed: " + e.message); })
      .then(function () { busy = false; });
  }

  function addButton() {
    var page = document.querySelector("#itemDetailPage:not(.hide)");
    var bar = page && page.querySelector(".mainDetailButtons");
    var id = currentId();
    if (!bar || !id) return;

    var existing = bar.querySelector("." + BTN_CLASS);
    if (existing && existing.getAttribute("data-id") === id) return;
    if (existing) existing.remove();

    checkAdmin().then(function (admin) {
      if (!admin || id !== currentId()) return;
      return api().getItem(api().getCurrentUserId(), id).then(function (item) {
        if (TYPES.indexOf(item.Type) === -1 || !item.ImageTags || !item.ImageTags.Logo) return;
        if (bar.querySelector("." + BTN_CLASS)) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "button-flat detailButton " + BTN_CLASS;
        btn.title = "Logo poster";
        btn.setAttribute("data-id", id);
        btn.innerHTML = '<div class="detailButton-content"><span class="material-icons detailButton-icon wallpaper" aria-hidden="true"></span></div>';
        btn.addEventListener("click", function (e) { e.preventDefault(); makePoster(item); });
        var more = bar.querySelector(".btnMoreCommands");
        bar.insertBefore(btn, more || null);
      });
    }).catch(function () {});
  }

  var pending = null;
  new MutationObserver(function () {
    clearTimeout(pending);
    pending = setTimeout(addButton, 250);
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("hashchange", function () { setTimeout(addButton, 400); });
})();
