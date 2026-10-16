// DiárioProf — service worker
// Página: rede primeiro (o deploy novo chega sempre que houver internet; o cache só serve sem conexão).
// Arquivos locais e bibliotecas do cdnjs com versão fixa: cache primeiro.
// Demais domínios (API do GitHub, Gist, fontes): direto, sem cache.
const VERSAO = 'diarioprof-v1';
const LOCAIS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(LOCAIS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('diarioprof-') && k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
function guardar(req, resp) {
  if (resp && (resp.ok || resp.type === 'opaque')) { const cp = resp.clone(); caches.open(VERSAO).then(c => c.put(req, cp)); }
  return resp;
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => guardar(req, r)).catch(() =>
      caches.match(req, { ignoreSearch: true })
        .then(m => m || (url.pathname.endsWith('/aluno.html') ? undefined : caches.match('./index.html')))
        .then(m => m || caches.match('./'))
        .then(m => m || new Response('Sem conexão e sem cópia local desta página.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))));
    return;
  }
  if (url.origin === self.location.origin || req.url.startsWith(CDN)) {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => guardar(req, r))));
  }
});
