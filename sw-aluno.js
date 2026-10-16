// Portal do Aluno — service worker (escopo ./aluno, separado do aplicativo do professor)
// Página: rede primeiro. Notas publicadas (Gist): rede primeiro, com a última cópia guardada para usar sem internet.
const VERSAO = 'portal-aluno-v1';
const LOCAIS = ['./aluno.html', './aluno.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSAO).then(c => c.addAll(LOCAIS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('portal-aluno-') && k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSAO).then(c => c.put('./aluno.html', cp)); } return r; })
      .catch(() => caches.match('./aluno.html')));
    return;
  }
  if (url.hostname === 'gist.githubusercontent.com') {
    const chave = url.origin + url.pathname;                 // ignora o "?t=" usado para evitar cache do GitHub
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(VERSAO).then(c => c.put(chave, cp)); }
      return r;
    }).catch(() => caches.open(VERSAO).then(c => c.match(chave)).then(m => {
      if (!m) throw new Error('sem cópia salva');
      const h = new Headers(m.headers); h.set('X-Portal-Cache', '1');
      return m.blob().then(b => new Response(b, { status: 200, headers: h }));
    })));
    return;
  }
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(req).then(m => m || fetch(req)));
  }
});
