import type { Coupon } from '../types';
import { getExpiryInfo } from './dateUtils';

const NOTIFIED_KEY_PREFIX = 'bonpreu_notified_';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.error('Error sol·licitant permisos de notificació:', err);
    return 'denied';
  }
}

export function sendPushNotification(title: string, body: string, tag?: string) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    // Attempt system notification
    const options: any = {
      body,
      tag: tag || 'bonpreu-vales-alert',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options);
      }).catch(() => {
        new Notification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  } catch (e) {
    console.warn('Error enviant notificació push:', e);
  }
}

export interface ExpiryAlert {
  id: string;
  couponId: string;
  title: string;
  body: string;
  daysLeft: number;
  urgency: 'today' | 'tomorrow' | 'twoDays';
  dateStr: string;
}

export function checkExpiringCoupons(coupons: Coupon[]): ExpiryAlert[] {
  const alerts: ExpiryAlert[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  coupons.forEach((coupon) => {
    // Only check active, unredeemed coupons
    if (coupon.isUsed) return;

    const expiry = getExpiryInfo(coupon.expiryDate);

    // Alert if 2 days or less left (0 = today, 1 = tomorrow, 2 = 2 days)
    if (expiry.daysLeft >= 0 && expiry.daysLeft <= 2) {
      let urgency: 'today' | 'tomorrow' | 'twoDays' = 'twoDays';
      let body = '';

      if (expiry.daysLeft === 0) {
        urgency = 'today';
        body = `El val "${coupon.title}" CADUCA AVUI! Recorda passar-lo per caixa si compres al Bonpreu Esclat.`;
      } else if (expiry.daysLeft === 1) {
        urgency = 'tomorrow';
        body = `El val "${coupon.title}" caduca DEMÀ. No el deixis escapar!`;
      } else {
        urgency = 'twoDays';
        body = `El val "${coupon.title}" caduca d'aquí a 2 DIES. Aprofita'l a la teva propera compra!`;
      }

      alerts.push({
        id: `alert-${coupon.id}-${todayStr}-${expiry.daysLeft}`,
        couponId: coupon.id,
        title: expiry.daysLeft === 0 ? '⚠️ Val per caducar AVUI!' : '⏳ Val per caducar en 2 dies',
        body,
        daysLeft: expiry.daysLeft,
        urgency,
        dateStr: todayStr,
      });
    }
  });

  return alerts;
}

export function triggerPushForNewAlerts(alerts: ExpiryAlert[]) {
  if (getNotificationPermission() !== 'granted') return;

  const todayStr = new Date().toISOString().split('T')[0];

  alerts.forEach((alert) => {
    const storageKey = `${NOTIFIED_KEY_PREFIX}${alert.couponId}_${todayStr}`;
    const alreadyNotified = localStorage.getItem(storageKey);

    if (!alreadyNotified) {
      sendPushNotification(alert.title, alert.body, `expiry-${alert.couponId}`);
      localStorage.setItem(storageKey, 'true');
    }
  });
}
