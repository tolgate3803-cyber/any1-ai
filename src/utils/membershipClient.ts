export interface MembershipInfo {
  active: boolean;
  orderId: string;
  planId: string;
  planName: string;
  depositorName?: string;
  expiresAt: string;
}

export interface TrialStatus {
  freeTrialLimit: number;
  freeUsed: number;
  freeRemaining: number;
  membership: MembershipInfo | null;
}

const VISITOR_ID_KEY = 'any1_visitor_id';
const MEMBERSHIP_ORDER_KEY = 'any1_active_membership_order_id';

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let existing = localStorage.getItem(VISITOR_ID_KEY) || '';
    if (/^[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
      return existing;
    }
    const rand =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/[^a-zA-Z0-9_-]/g, '')
        : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    existing = `v_${rand}`.slice(0, 48);
    localStorage.setItem(VISITOR_ID_KEY, existing);
    return existing;
  } catch {
    return '';
  }
}

export function getStoredMembershipOrderId(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (localStorage.getItem(MEMBERSHIP_ORDER_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function setStoredMembershipOrderId(orderId: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (orderId && orderId.trim()) {
      localStorage.setItem(MEMBERSHIP_ORDER_KEY, orderId.trim());
    } else {
      localStorage.removeItem(MEMBERSHIP_ORDER_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function getMembershipHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const visitorId = getOrCreateVisitorId();
  if (visitorId) {
    headers['x-any1-client-id'] = visitorId;
  }
  const orderId = getStoredMembershipOrderId();
  if (orderId) {
    headers['x-any1-membership-order'] = orderId;
  }
  return headers;
}

export async function fetchMembershipStatus(): Promise<TrialStatus | null> {
  try {
    const orderId = getStoredMembershipOrderId();
    const qs = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
    const res = await fetch(`/api/membership/status${qs}`, {
      headers: getMembershipHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    if (orderId && (!data.membership || !data.membership.active)) {
      setStoredMembershipOrderId(null);
    }
    return {
      freeTrialLimit: Number(data.freeTrialLimit) || 3,
      freeUsed: Number(data.freeUsed) || 0,
      freeRemaining: Number(data.freeRemaining ?? 3),
      membership: data.membership?.active ? data.membership : null
    };
  } catch {
    return null;
  }
}

export function notifyTrialUpdated(trial?: {
  freeTrialLimit?: number;
  freeUsed?: number;
  freeRemaining?: number;
}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('any1:trial-updated', { detail: trial || {} }));
}

export function notifyMembershipChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('any1:membership-changed'));
}

export function openUpgradeCheckout(reason: 'exhausted' | 'voluntary' = 'voluntary', featureTitle?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('any1:open-upgrade', {
      detail: { reason, featureTitle }
    })
  );
}
