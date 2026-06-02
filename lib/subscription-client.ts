// Create the graphql-ws client only in the browser to avoid pulling server-side modules
let client: any = null;

function getWsUrl() {
  if (process.env.NEXT_PUBLIC_API_WS_URL) return process.env.NEXT_PUBLIC_API_WS_URL;
  if (typeof window === 'undefined') return 'ws://localhost:4000/graphql';
  return window.location.origin.replace(/^http/, 'ws') + '/graphql';
}

export async function subscribeToNotificationCreated(onMessage: (payload: any) => void) {
  if (typeof window === 'undefined') {
    // No-op on server
    return () => {};
  }

  if (!client) {
    try {
      // Import the client-only entry via the package export path
      const mod = await import('graphql-ws/client');
      const { createClient } = mod;
      client = createClient({ url: getWsUrl() });
    } catch (err) {
      console.error('Failed to load graphql-ws client entry, subscription disabled', err);
      return null;
    }
  }

  const query = `subscription NotificationCreated { notificationCreated { _id type title message status priority actionUrl createdAt recipientId } }`;

  const dispose = client.subscribe(
    { query },
    {
      next: (data: any) => {
        try {
          onMessage(data);
        } catch (e) {
          console.error('subscription callback error', e);
        }
      },
      error: (err: any) => console.error('Subscription error', err),
      complete: () => {},
    },
  );

  return () => {
    try {
      dispose();
    } catch (e) {
      // ignore
    }
  };
}

export default null;
