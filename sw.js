const CACHE_NAME = 'anti-vicio-v9.7';
const urlsToCache = [
  'index.html',
  'manifest.json',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png',
  'alarm_clock.ogg'
];

let alarmeTimeout;

// 1. INSTALAR E SALVAR NO CACHE
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// 2. USAR CACHE QUANDO OFFLINE
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// 3. ATIVAR E LIMPAR CACHE ANTIGO
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

// 4. RECEBER COMANDO DA PWA PRA AGENDAR ALARME
self.addEventListener('message', event => {
  if(event.data.type === 'AGENDAR_ALARME'){
    clearTimeout(alarmeTimeout);
    
    // Só agenda se o tempo for maior que 0
    if(event.data.tempo > 0){
      alarmeTimeout = setTimeout(() => {
        self.registration.showNotification("🚭 Anti-Vício - HORA DO CICLO", {
          body: "Chegou a hora! Você consegue!",
          icon: "android-chrome-192x192.png",
          badge: "android-chrome-192x192.png",
          vibrate: [500,200,500,200,500,500,200,500],
          requireInteraction: true, // Notificação não some sozinha
          tag: "alarme-antivicio"
        });
      }, event.data.tempo);
    }
  }
});

// 5. QUANDO CLICAR NA NOTIFICAÇÃO
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientsArr => {
      // Se já tiver a aba aberta, foca nela
      const client = clientsArr.find(c => c.visibilityState === 'visible');
      if(client) return client.focus();
      // Senão abre nova aba
      return clients.openWindow('/');
    })
  );
});
