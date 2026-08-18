const CACHE_NAME = 'anti-vicio-v9.7';
const urlsToCache = [
  'index.html',
  'manifest.json',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png',
  'alarm_clock.ogg'
];

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

// 4. RECEBER COMANDO DA PWA PRA AGENDAR ALARME (CORRIGIDO)
self.addEventListener('message', async (event) => {
  if (event.data.type === 'AGENDAR_ALARME') {
    
    // 1. Cancela qualquer notificação anterior agendada para evitar duplicidade
    const notifications = await self.registration.getNotifications({ tag: 'alarme-antivicio' });
    notifications.forEach(n => n.close());

    // 2. Transforma o tempo (ms) recebido em um carimbo de hora exato no futuro
    const horarioDisparo = Date.now() + event.data.tempo;

    if (event.data.tempo > 0) {
      const opcoes = {
        body: "Chegou a hora! Você consegue!",
        icon: "android-chrome-192x192.png",
        badge: "android-chrome-192x192.png",
        vibrate:,
        requireInteraction: true, 
        tag: "alarme-antivicio",
        data: { url: self.location.origin },
        // O SEGREDO: Delega o agendamento ao Relógio do Sistema Operacional
        showTrigger: new TimestampTrigger(horarioDisparo)
      };

      try {
        // Tenta agendar de forma nativa no dispositivo
        await self.registration.showNotification("🚭 Anti-Vício - HORA DO CICLO", opcoes);
      } catch (err) {
        // Fallback: Caso o navegador do celular não suporte a API experimental,
        // ele dispara na hora avisando para o usuário reabrir o app.
        await self.registration.showNotification("🚭 Anti-Vício", {
          body: "Por favor, mantenha o app aberto para cronometrar.",
          tag: "alarme-antivicio"
        });
      }
    }
  }
});

// 5. QUANDO CLICAR NA NOTIFICAÇÃO (MELHORADO)
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlParaAbrir = event.notification.data ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      // Procura qualquer aba do seu PWA que já esteja aberta
      for (const client of clientsArr) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Se não tiver nenhuma aba aberta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlParaAbrir);
      }
    })
  );
});
