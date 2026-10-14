import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  collection, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  getDocFromServer,
  query,
  orderBy
} from 'firebase/firestore';
import type { Coupon, Household } from '../types';
import configJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: configJson.apiKey,
  authDomain: configJson.authDomain,
  projectId: configJson.projectId,
  storageBucket: configJson.storageBucket,
  messagingSenderId: configJson.messagingSenderId,
  appId: configJson.appId,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = configJson.firestoreDatabaseId
  ? getFirestore(app, configJson.firestoreDatabaseId)
  : getFirestore(app);

// Validate connection per Firebase skill directive
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or unreachable. Offline cache active.');
    }
  }
}

testConnection();

// Initial demo coupons to populate if monedero is empty
export const SAMPLE_COUPONS: Omit<Coupon, 'householdId'>[] = [
  {
    id: 'sample-1',
    title: '5€ de descompte en compra superior a 50€',
    discountType: 'fixed',
    discountAmount: 5.0,
    minPurchase: 50.0,
    section: 'general',
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // in 2 days
    barcode: '8410294810293',
    notes: 'Vàlid a tots els supermercats Bonpreu i Esclat presentant targeta client.',
    isUsed: false,
    createdBy: 'Familia',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-2',
    title: '6€ de descompte a Carnisseria i Xarcuteria',
    discountType: 'fixed',
    discountAmount: 6.0,
    minPurchase: 30.0,
    section: 'carnisseria',
    expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // tomorrow
    barcode: '8419283740192',
    notes: 'Aplicable en taulell tradicional i safates envasades.',
    isUsed: false,
    createdBy: 'Familia',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-3',
    title: '-20% a Peixateria fresca',
    discountType: 'percentage',
    discountAmount: 20.0,
    minPurchase: 15.0,
    section: 'peixateria',
    expiryDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // in 6 days
    barcode: '8428394857201',
    notes: 'Exclou marisc viu i congelats.',
    isUsed: false,
    createdBy: 'Familia',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-4',
    title: 'EsclatOil: 5 cèntims/litre en benzina o dièsel',
    discountType: 'promo',
    discountAmount: 0.05,
    minPurchase: 20.0,
    section: 'esclatoil',
    expiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    barcode: '8491827364519',
    notes: 'Escanear al sortidor o a la cabina de servei EsclatOil.',
    isUsed: false,
    createdBy: 'Familia',
    createdAt: new Date().toISOString()
  }
];

const LOCAL_STORAGE_KEY_PREFIX = 'bonpreu_vales_household_';

export function getLocalCoupons(householdId: string): Coupon[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${householdId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setLocalCoupons(householdId: string, coupons: Coupon[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${householdId}`, JSON.stringify(coupons));
  } catch (err) {
    console.error('Error guardando en caché local:', err);
  }
}

export function subscribeToCoupons(
  householdId: string,
  onUpdate: (coupons: Coupon[]) => void,
  onError?: (err: Error) => void
) {
  // Immediately provide local cached data so UI is instant and works offline
  const cached = getLocalCoupons(householdId);
  if (cached.length > 0) {
    onUpdate(cached);
  }

  const couponsRef = collection(db, 'households', householdId, 'coupons');
  const q = query(couponsRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const list: Coupon[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Coupon);
      });

      // If online collection is empty and no local cache, initialize with samples
      if (list.length === 0 && cached.length === 0) {
        // seed sample coupons
        SAMPLE_COUPONS.forEach(async (sc) => {
          const newDoc = doc(collection(db, 'households', householdId, 'coupons'));
          const item: Coupon = { ...sc, id: newDoc.id, householdId };
          await setDoc(newDoc, item);
        });
      } else {
        setLocalCoupons(householdId, list);
        onUpdate(list);
      }
    },
    (error) => {
      console.warn('Firestore snapshot error (usando caché offline):', error);
      if (onError) onError(error);
      // Fallback to local
      onUpdate(getLocalCoupons(householdId));
    }
  );

  return unsubscribe;
}

export async function saveCoupon(coupon: Coupon): Promise<void> {
  // Update local cache first
  const current = getLocalCoupons(coupon.householdId);
  const exists = current.some((c) => c.id === coupon.id);
  const updated = exists ? current.map((c) => (c.id === coupon.id ? coupon : c)) : [coupon, ...current];
  setLocalCoupons(coupon.householdId, updated);

  try {
    const couponDoc = doc(db, 'households', coupon.householdId, 'coupons', coupon.id);
    await setDoc(couponDoc, coupon, { merge: true });
  } catch (err) {
    console.warn('Guardado en offline, se sincronizará cuando haya conexión:', err);
  }
}

export async function deleteCoupon(householdId: string, couponId: string): Promise<void> {
  const current = getLocalCoupons(householdId);
  setLocalCoupons(householdId, current.filter((c) => c.id !== couponId));

  try {
    const couponDoc = doc(db, 'households', householdId, 'coupons', couponId);
    await deleteDoc(couponDoc);
  } catch (err) {
    console.warn('Borrado localmente, se sincronizará al conectar:', err);
  }
}

export async function setCouponUsed(
  householdId: string, 
  couponId: string, 
  isUsed: boolean, 
  usedBy?: string
): Promise<void> {
  const current = getLocalCoupons(householdId);
  const updated = current.map((c) => {
    if (c.id === couponId) {
      return {
        ...c,
        isUsed,
        usedAt: isUsed ? new Date().toISOString() : undefined,
        usedBy: isUsed ? (usedBy || 'Aitor/Xènia') : undefined,
      };
    }
    return c;
  });
  setLocalCoupons(householdId, updated);

  try {
    const couponDoc = doc(db, 'households', householdId, 'coupons', couponId);
    await updateDoc(couponDoc, {
      isUsed,
      usedAt: isUsed ? new Date().toISOString() : null,
      usedBy: isUsed ? (usedBy || 'Aitor/Xènia') : null,
    });
  } catch (err) {
    console.warn('Estado actualizado localmente:', err);
  }
}
