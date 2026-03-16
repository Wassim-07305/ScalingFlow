// ─── Push Notification Handler ───────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.type || "default",
      data: { link: data.link || "/" },
      vibrate: [100, 50, 100],
      actions: [
        { action: "open", title: "Voir" },
        { action: "dismiss", title: "Fermer" },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (_) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("ScalingFlow", { body: text }),
    );
  }
});

// ─── Notification Click Handler ──────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const link = (event.notification.data && event.notification.data.link) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            client.navigate(link);
            return;
          }
        }
        return self.clients.openWindow(link);
      }),
  );
});
