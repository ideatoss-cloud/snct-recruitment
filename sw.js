// ⚠️ v1.2.87 (2026.08.01): **HTML은 더 이상 캐시하지 않는다.**
//   배포 후 "옛 화면이 보인다"를 의심할 일 자체를 없애기 위해서다.
//   (실제로 그때 겪은 증상은 캐시가 아니라 버튼이 흐려서 못 찾은 것이었지만,
//    캐시 가능성을 배제하느라 시간을 많이 썼다. 앞으로는 그 변수를 지운다.)
//   이 앱은 GAS 서버 없이는 어차피 못 쓰므로 HTML 오프라인 캐시의 실익이 없다.
const CACHE_NAME = 'snct-recruitment-v1.3.0';
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
