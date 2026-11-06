'use client';

import {Bell, BellRing} from 'lucide-react';
import {useEffect, useState} from 'react';

function applicationServerKey(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const bytes = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bytes, character => character.charCodeAt(0));
}

export default function NotificationToggle({notify}: {notify: (message: string) => void}) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [publicKey, setPublicKey] = useState('');
  const [busy, setBusy] = useState(false);
  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  useEffect(() => {
    if (!supported) return;
    Promise.all([
      navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(registration => registration.pushManager.getSubscription()),
      fetch('/api/notifications').then(response => response.json()),
    ]).then(([current, config]) => {
      setSubscription(current);
      if (config.enabled && config.publicKey) setPublicKey(config.publicKey);
    }).catch(() => {});
  }, [supported]);

  async function toggle() {
    if (!supported) { notify('This browser does not support notifications.'); return; }
    if (!publicKey && !subscription) { notify('Notifications are not configured yet.'); return; }
    setBusy(true);
    try {
      if (subscription) {
        await fetch('/api/notifications', {method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({endpoint: subscription.endpoint})});
        await subscription.unsubscribe();
        setSubscription(null);
        notify('Lesson notifications turned off.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { notify('Allow notifications in your browser to get lesson alerts.'); return; }
      const registration = await navigator.serviceWorker.ready;
      const next = await registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: applicationServerKey(publicKey)});
      const response = await fetch('/api/notifications', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(next)});
      if (!response.ok) { await next.unsubscribe(); throw new Error(); }
      setSubscription(next);
      notify('You’ll be notified when new notes are published.');
    } catch { notify('Could not update notifications. Please try again.'); }
    finally { setBusy(false); }
  }

  const active = Boolean(subscription);
  return <button className={active ? 'notification-toggle active' : 'notification-toggle'} onClick={toggle} disabled={busy} aria-pressed={active} title={active ? 'Turn off lesson notifications' : 'Notify me about new notes'}>
    {active ? <BellRing size={17}/> : <Bell size={17}/>}
    <span>{busy ? 'Updating…' : active ? 'Alerts on' : 'Notify me'}</span>
  </button>;
}
