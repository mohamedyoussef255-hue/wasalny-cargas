// public/sw.js
const CACHE_NAME = 'cargas-voice-v1';
const AUDIO_ASSETS = [
  '/sounds/route_start.mp3',
  '/sounds/rerouting.mp3',
  '/sounds/destination_arrived.mp3',
  '/sounds/turn_right_now.mp3',
  '/sounds/turn_left_now.mp3',
  '/sounds/u_turn.mp3',
  '/sounds/turn_right_100m.mp3',
  '/sounds/turn_left_100m.mp3',
  '/sounds/turn_right_500m.mp3',
  '/sounds/turn_left_500m.mp3',
  '/sounds/keep_right.mp3',
  '/sounds/keep_left.mp3',
  '/sounds/continue_straight.mp3',
  '/sounds/roundabout_first_exit.mp3',
  '/sounds/cargas_approaching.mp3',
  '/sounds/cargas_nearby.mp3',
  '/sounds/cargas_arrived.mp3'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(AUDIO_ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/sounds/')) {
    e.respondWith(
      caches.match(e.request).then((res) => res || fetch(e.request))
    );
  }
});
