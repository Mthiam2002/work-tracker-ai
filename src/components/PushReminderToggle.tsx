"use client";

import { useEffect, useState, useTransition } from "react";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushReminderToggle() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const ok =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;
      setSupported(ok);
      if (!ok) return;
      setPermission(Notification.permission);
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setSubscribed(Boolean(sub)))
        .catch(() => undefined);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (!supported) {
    return <p className="text-xs text-zinc-500">Notifications push non supportées par ce navigateur.</p>;
  }

  function handleToggle() {
    setMessage(null);
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: existing.endpoint }),
          });
          await existing.unsubscribe();
          setSubscribed(false);
          setMessage("Notifications désactivées sur cet appareil.");
          return;
        }
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") {
          setMessage("Permission refusée : autorise les notifications pour activer les rappels.");
          return;
        }
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) throw new Error("Clé VAPID publique manquante (NEXT_PUBLIC_VAPID_PUBLIC_KEY).");
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        const keys = sub.toJSON().keys;
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint, p256dh: keys?.p256dh, auth: keys?.auth }),
        });
        if (!res.ok) throw new Error("Enregistrement impossible.");
        setSubscribed(true);
        setMessage("Notifications activées : tu recevras les rappels d'oubli sur cet appareil.");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Échec de l'activation.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={subscribed}
          disabled={isPending}
          onClick={handleToggle}
          className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition disabled:opacity-50 ${
            subscribed ? "justify-end bg-blue-600" : "justify-start bg-zinc-300 dark:bg-zinc-700"
          }`}
        >
          <span className="h-5 w-5 rounded-full bg-white" />
        </button>
        <span className="text-sm font-medium">
          {subscribed ? "Rappels push activés sur cet appareil" : "Activer les rappels push sur cet appareil"}
        </span>
      </label>
      {permission === "denied" && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Notifications bloquées : autorise-les dans les réglages du navigateur, puis réessaie.
        </p>
      )}
      {message && <p className="text-xs text-zinc-500">{message}</p>}
    </div>
  );
}
