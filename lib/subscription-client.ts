// Create the graphql-ws client only in the browser to avoid pulling server-side modules.
// Single module-level client singleton — shared across all hook instances.
let client: any = null;

// Track active subscription count so we only open one subscribe() call at a time.
let activeSubscribers = 0;
let disposeShared: (() => void) | null = null;
const listeners = new Set<(payload: any) => void>();

/**
 * Derive the WebSocket URL from NEXT_PUBLIC_API_BASE_URL so it always
 * points to the backend, not the Next.js frontend.
 * Falls back to localhost for local dev when the env var is not set.
 */
function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_API_WS_URL) return process.env.NEXT_PUBLIC_API_WS_URL;

  const httpBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  // Convert http(s):// → ws(s)://
  return httpBase.replace(/^http/, 'ws') + '/graphql';
}

/**
 * Read the JWT from the lendgrid_cookie
 * Falls back to employee_token for employee sessions.
 */
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;

  const parts = value.split(`; lendgrid_cookie=`);
  if (parts.length === 2) {
    const t = decodeURIComponent(parts.pop()!.split(';').shift() || '') || null;
    if (t) return t;
  }

  const empParts = value.split(`; employee_token=`);
  if (empParts.length === 2) {
    return decodeURIComponent(empParts.pop()!.split(';').shift() || '') || null;
  }

  return null;
}

const SUBSCRIPTION_QUERY = `
  subscription NotificationCreated {
    notificationCreated {
      _id
      type
      title
      message
      status
      priority
      actionUrl
      createdAt
      recipientId
    }
  }
`;

/**
 * Subscribe to new notifications.
 *
 * Internally, this maintains a SINGLE WebSocket subscription shared across
 * all callers (e.g. dashboard-layout + notification.tsx). Each caller gets
 * its own listener added to a shared Set, preventing duplicate WS frames
 * and duplicate query invalidations.
 *
 * Returns an unsubscribe function. Call it on component unmount.
 * If the subscription cannot be established, returns null so the caller
 * can fall back to polling.
 */
export async function subscribeToNotificationCreated(
  onMessage: (payload: any) => void,
): Promise<(() => void) | null> {
  if (typeof window === 'undefined') {
    // No-op on server (SSR)
    return () => { };
  }

  // Initialise the client once, with auth token in connectionParams.
  if (!client) {
    try {
      const mod = await import('graphql-ws/client');
      const { createClient } = mod;

      client = createClient({
        url: getWsUrl(),
        // Pass the JWT token so the backend context factory can authenticate
        // the subscription and the filter can read context.req.user.
        connectionParams: () => {
          const token = getAuthToken();
          return token ? { authToken: token } : {};
        },
        // Retry the connection up to 5 times on transient failures.
        retryAttempts: 5,
      });
    } catch (err) {
      console.error(
        '[subscriptions] Failed to load graphql-ws client, subscription disabled',
        err,
      );
      return null;
    }
  }

  // Add this caller's listener to the shared set.
  listeners.add(onMessage);
  activeSubscribers++;

  // Open the actual WS subscription only once (when the first caller arrives).
  if (activeSubscribers === 1) {
    disposeShared = client.subscribe(
      { query: SUBSCRIPTION_QUERY },
      {
        next: (data: any) => {
          // Fan-out to all active listeners.
          listeners.forEach((listener) => {
            try {
              listener(data);
            } catch (e) {
              console.error('[subscriptions] listener error', e);
            }
          });
        },
        error: (err: any) =>
          console.error('[subscriptions] Subscription error', err),
        complete: () => {
          // Connection closed — reset so the next subscriber re-opens it.
          disposeShared = null;
          activeSubscribers = 0;
        },
      },
    );
  }

  // Return an unsubscribe function for this specific caller.
  return () => {
    listeners.delete(onMessage);
    activeSubscribers = Math.max(0, activeSubscribers - 1);

    // Only close the WS subscription when the last caller unsubscribes.
    if (activeSubscribers === 0 && disposeShared) {
      try {
        disposeShared();
      } catch (_) {
        // ignore disposal errors
      }
      disposeShared = null;
    }
  };
}

export default null;
