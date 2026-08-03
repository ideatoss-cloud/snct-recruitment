// ⚠️ v1.2.87 (2026.08.01): **HTML은 더 이상 캐시하지 않는다.**
//   면접관 기기가 며칠째 옛 버전을 붙들고 있어, 새로 넣은 기능(자가진단 버튼)이 안 보였다.
//   강력 새로고침으로도 안 나았다 — 서비스워커가 캐시본을 먼저 돌려주기 때문.
//   이 앱은 GAS 서버 없이는 어차피 못 쓰므로 HTML 오프라인 캐시의 실익이 없다.
//   앞으로 배포하면 새로고침 한 번으로 반영된다.
const CACHE_NAME = 'snct-recruitment-v1.2.87';
const STATIC_ASSETS = [];

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

  // ⚠️ v1.2.87: HTML(페이지 이동 요청)은 캐시를 아예 거치지 않는다.
  //   캐시에 두면 배포해도 옛 화면이 계속 뜬다 — 실제로 면접관 기기가 그 상태였다.
  var isHtml = event.request.mode === 'navigate'
    || (event.request.headers.get('accept') || '').indexOf('text/html') >= 0;
  if (isHtml) {
    event.respondWith(fetch(event.request).catch(function () {
      return new Response('<h3>연결이 끊겼습니다. 인터넷 확인 후 새로고침해 주세요.</h3>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }));
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
