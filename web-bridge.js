// Web version of the native bridge (AppBridge.cs) for iPhone / Safari.
// Same methods, same string-in/string-out contract; data lives in IndexedDB on this device only.
(function () {
  "use strict";
  const DB = "kleine-happen", STORE = "docs";
  let dbp = null;
  function db() {
    return dbp ||= new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function tx(mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction(STORE, mode), s = t.objectStore(STORE);
      const out = fn(s);
      t.oncomplete = () => res(out && "result" in out ? out.result : undefined);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  }
  // Ask Safari to keep the data (granted automatically for apps on the home screen).
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

  function download(name, content) {
    const url = URL.createObjectURL(new Blob([content], { type: "application/octet-stream" }));
    const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  const methods = {
    async LoadAll() {
      const all = {};
      const d = await db();
      await new Promise((res, rej) => {
        const t = d.transaction(STORE, "readonly"), c = t.objectStore(STORE).openCursor();
        c.onsuccess = () => { const cur = c.result; if (cur) { all[cur.key] = JSON.parse(cur.value); cur.continue(); } };
        t.oncomplete = res; t.onerror = () => rej(t.error);
      });
      return JSON.stringify(all);
    },
    async Save(path, json) { await tx("readwrite", s => s.put(json, path)); return "ok"; },
    async Delete(path) { await tx("readwrite", s => s.delete(path)); return "ok"; },
    async DeleteAll() { await tx("readwrite", s => s.clear()); return "ok"; },
    async OpenUrl(url) {
      if (!/^https:\/\//.test(url)) return "invalid";
      window.open(url, "_blank", "noopener");
      return "ok";
    },
    async ShareText(fileName, content, title) {
      const type = /\.csv$/i.test(fileName) ? "text/csv" : "application/json";
      try {
        const file = new File([content], fileName, { type });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title });
          return "ok";
        }
      } catch (e) {
        if (e && e.name === "AbortError") return "ok"; // user closed the share sheet
      }
      download(fileName, content);
      return "ok";
    },
    PickText() {
      return new Promise(resolve => {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = ".json,application/json,text/plain";
        inp.style.display = "none";
        let done = false;
        const finish = v => { if (!done) { done = true; inp.remove(); resolve(v); } };
        inp.addEventListener("change", () => {
          const f = inp.files && inp.files[0];
          if (!f) return finish("");
          const r = new FileReader();
          r.onload = () => finish(String(r.result || ""));
          r.onerror = () => finish("");
          r.readAsText(f);
        });
        inp.addEventListener("cancel", () => finish(""));
        document.body.appendChild(inp);
        inp.click();
      });
    }
  };

  window.HybridWebView = {
    InvokeDotNet(method, args) {
      const fn = methods[method];
      if (!fn) return Promise.reject(new Error("unknown method " + method));
      return Promise.resolve().then(() => fn.apply(null, args || []));
    }
  };

  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
