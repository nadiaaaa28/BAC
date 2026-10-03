/* Istoria BAC AI — service worker (written by hand, no dependencies).
 * scripts/build-pwa.mjs copies this file to dist/sw.js and replaces VERSION and PRECACHE.
 * - precache: the whole built app shell + assets (list generated from dist/ at build time);
 * - cache-first for same-origin GET requests inside the scope; cross-origin requests are never touched/cached;
 * - versioned cache name (content hash of the build); old caches are deleted on activate;
 * - a new version waits until the user taps „Actualizează” (message SKIP_WAITING). */
const VERSION = "a91b0bb25794";
const PRECACHE = ["assets/AIMessage-D4apcHIs.js","assets/AIQuickAction-DzeTrvNA.js","assets/AITeacherScreen-BtjpCovI.js","assets/AchievementBadge-C-PruKxg.js","assets/AsyncContent-BCx4cbRq.js","assets/BibliographyScreen-Crr2btnb.js","assets/ChapterCard-CcFoS3LE.js","assets/ChapterDetailScreen-N2MtM8Xp.js","assets/ChaptersScreen-Cegr7AfO.js","assets/ComponentGalleryScreen-DNZMycIk.js","assets/Disclaimer-Cs4ZkFqp.js","assets/EmptyState-dJqn5fW1.js","assets/ExamCountdown-CCoyyQAO.js","assets/FloatingAIButton-qDMezc_B.js","assets/HeroCard-CPhQXzi4.js","assets/HistoricalImage-BoSLm3Zx.js","assets/HomeScreen-DLksvkR6.js","assets/LearningPath-ZbK_yQd4.js","assets/LessonScreen-D2KknX7N.js","assets/OnboardingScreen-DL9V_qwq.js","assets/ProfileScreen-CKG7Ua0o.js","assets/ProgramaCodes-_tGCN6KR.js","assets/ProgrammeCoverageScreen-DaR3aBHi.js","assets/ProgressIndicator-KZu5NmI3.js","assets/ProgressScreen-Ch28ES2q.js","assets/QuizHubScreen-CWf7s6JF.js","assets/QuizScreen-o2NHNjEs.js","assets/Screen-BvEOkvSc.js","assets/Segmented-CBnPxWcG.js","assets/SourceList-CPsdWIFY.js","assets/SummaryCard-Bd5BdZYJ.js","assets/Timeline-BF4wGCY6.js","assets/TimelineScreen-BzxPuSli.js","assets/aiStore-CKIVyOLG.js","assets/antichitatea-formarea-poporului-roman-CLpWLlAL.js","assets/book-open-DWLJB_wO.js","assets/calendar-range-CQLdnzaP.js","assets/circle-check-CwT11KN6.js","assets/coverage-B414WnV9.js","assets/epoca-moderna-romania-mare-D9JKl7zJ.js","assets/evul-mediu-inceputurile-modernitatii-XaI8Vtg0.js","assets/ids-DXZlHDZs.js","assets/index-CF7CPJOd.js","assets/index-CuEAc4m_.js","assets/index-DKTYGrsH.css","assets/lock-C-o4HlPO.js","assets/map-Czb_AgPi.js","assets/quizLogic-CRSP8IVq.js","assets/romania-comunista-COGklEmt.js","assets/romania-dupa-1989-CEGuLInH.js","assets/romania-interbelica-al-doilea-razboi-mondial-DfTtIOBX.js","assets/sparkles-nwtNj7MS.js","assets/text-BrEyLwYi.js","assets/triangle-alert-C5-hWcBr.js","assets/useChapterContent-BHaAgifg.js","assets/useFocusOnMount-DW5Qa7oY.js","assets/useOrderedChapters-B6OeI9f_.js","assets/useProgressView-Ta0vXUv5.js","assets/useToday-BAbQlJ8a.js","assets/zap-DGaKvV-w.js","favicon.ico","favicon.svg","icons/apple-touch-icon-180.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest"];
const CACHE_PREFIX = 'istoria-bac-';
const CACHE = `${CACHE_PREFIX}${VERSION}`;
const SCOPE = new URL('./', self.location.href).href;
const INDEX_URL = new URL('./index.html', SCOPE).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((path) => new Request(new URL(path, SCOPE).href, { cache: 'reload' })))),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'GET_VERSION' && event.ports[0]) event.ports[0].postMessage({ version: VERSION, precached: PRECACHE.length });
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function fromCacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
  return response;
}

async function navigation(request) {
  // HashRouter: every navigation inside the scope is the same document (index.html).
  const cached = await caches.match(INDEX_URL, { cacheName: CACHE, ignoreSearch: true });
  if (cached) return cached;
  try {
    return await fetch(request);
  } catch {
    return new Response('<!doctype html><meta charset="utf-8"><title>Istoria BAC AI</title><p>Aplicația nu este încă salvată pe acest dispozitiv. Deschide-o o dată cu internet.</p>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return; // never cache cross-origin (source links)
  if (url.pathname.endsWith('/sw.js')) return;
  if (request.mode === 'navigate') {
    event.respondWith(navigation(request));
    return;
  }
  event.respondWith(fromCacheFirst(request));
});
