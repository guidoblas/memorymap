// Life: permite abrir la app sin internet.
// Para forzar una renovación completa del almacenamiento, cambiá el número de VERSION.
const VERSION = "life-v1";
const TILES = "life-tiles";
const PROPIOS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
const LIBS = [
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/layers.png"
];

self.addEventListener("install", function(e){
  e.waitUntil((async function(){
    const c = await caches.open(VERSION);
    await c.addAll(PROPIOS);
    await Promise.all(LIBS.map(function(u){ return c.add(u).catch(function(){}); }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", function(e){
  e.waitUntil((async function(){
    for(const k of await caches.keys()){
      if(k !== VERSION && k !== TILES) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

async function primeroRed(r){
  try {
    const res = await fetch(r, {cache: "no-store"});
    if(res.ok){ (await caches.open(VERSION)).put(r, res.clone()); }
    return res;
  } catch(err){
    return (await caches.match(r, {ignoreSearch: true})) || (await caches.match("./index.html")) || Response.error();
  }
}
async function primeroCache(r){
  const m = await caches.match(r);
  if(m) return m;
  const res = await fetch(r);
  if(res.ok){ (await caches.open(VERSION)).put(r, res.clone()); }
  return res;
}
async function baldosa(r){
  const c = await caches.open(TILES);
  try {
    const res = await fetch(r);
    if(res.ok){
      c.put(r, res.clone());
      const ks = await c.keys();
      if(ks.length > 400) await Promise.all(ks.slice(0, ks.length - 400).map(function(k){ return c.delete(k); }));
    }
    return res;
  } catch(err){
    return (await c.match(r)) || Response.error();
  }
}

self.addEventListener("fetch", function(e){
  const r = e.request;
  if(r.method !== "GET") return;
  const u = new URL(r.url);
  if(u.hostname === "tile.openstreetmap.org"){ e.respondWith(baldosa(r)); return; }
  if(u.origin === location.origin){ e.respondWith(primeroRed(r)); return; }
  if(u.hostname === "cdnjs.cloudflare.com"){ e.respondWith(primeroCache(r)); return; }
});
