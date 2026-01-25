export type AnalyticsEventType = 'VIEW' | 'CLICK' | 'CALL';

interface AnalyticsEventPayload {
  eventType: AnalyticsEventType;
  page: string;
  target?: string;
  userId?: string;
  userRole?: string;
}

export const logAnalyticsEvent = async (payload: AnalyticsEventPayload) => {
  try {
    await fetch('http://localhost:8080/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Ignore analytics errors to avoid breaking user flow
  }
};
