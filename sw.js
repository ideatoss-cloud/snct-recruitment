// 2026.10.11 호스팅 이전: 옛 주소에 남아 있는 서비스 워커를 스스로 지우고 새 주소로 보낸다.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (cs) { cs.forEach(function (c) { c.navigate('https://snct-recruit.netlify.app/'); }); })
  );
});
