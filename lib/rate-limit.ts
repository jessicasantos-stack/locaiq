// Simple in-memory rate limiter
// For production, replace with Upstash Redis: @upstash/ratelimit

const requests = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 20; // 20 requests per minute per IP

export function rateLimit(ip: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = requests.get(ip);

  // Clean up expired entries periodically
  if (requests.size > 10000) {
    requests.forEach((val, key) => {
      if (val.resetAt < now) requests.delete(key);
    });
  }

  if (!entry || entry.resetAt < now) {
    requests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: MAX_REQUESTS - entry.count };
}
