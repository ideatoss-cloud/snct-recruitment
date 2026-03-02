const CACHE_NAME = 'snct-recruitment-v0.9.20';
const STATIC_ASSETS = [
  '/snct-recruitment/',
  '/snct-recruitment/index.html',
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// 요청 처리: 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', function(event) {
  // Google API, GAS, OpenAI 등 외부 요청은 캐시 안 함
  if (event.request.url.includes('google') ||
      event.request.url.includes('openai') ||
      event.request.url.includes('script.google') ||
      event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // 정상 응답이면 캐시에도 저장
        if (response && response.status === 200 && response.type === 'basic') {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(event.request);
      })
  );
});
