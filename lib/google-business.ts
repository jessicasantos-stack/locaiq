/**
 * Google Business Profile API — Server-side client
 *
 * Uses the Google My Business API (v4) and Business Information API (v1)
 * to fetch real GBP data: profile info, reviews, posts, photos, metrics.
 *
 * Requires OAuth2 tokens stored per agency in Supabase.
 */

// ── Types ────────────────────────────────────────────────────

export interface GBPTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
}

export interface GBPAccount {
  name: string; // accounts/{accountId}
  accountName: string;
  type: string;
  role: string;
}

export interface GBPLocation {
  name: string; // accounts/{accountId}/locations/{locationId}
  title: string;
  storeCode?: string;
  websiteUri?: string;
  phoneNumbers?: { primaryPhone?: string; additionalPhones?: string[] };
  categories?: {
    primaryCategory?: { displayName: string; name: string };
    additionalCategories?: { displayName: string; name: string }[];
  };
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    regionCode?: string;
  };
  regularHours?: {
    periods?: { openDay: string; openTime: string; closeDay: string; closeTime: string }[];
  };
  metadata?: {
    placeId?: string;
    mapsUri?: string;
    hasGoogleUpdated?: boolean;
  };
  profile?: { description?: string };
  labels?: string[];
  languageCode?: string;
}

export interface GBPReview {
  name: string;
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

export interface GBPReviewsResponse {
  reviews: GBPReview[];
  averageRating: number;
  totalReviewCount: number;
  nextPageToken?: string;
}

export interface GBPPost {
  name: string;
  languageCode?: string;
  summary?: string;
  createTime: string;
  updateTime: string;
  topicType?: 'STANDARD' | 'EVENT' | 'OFFER' | 'ALERT';
  state?: string;
  media?: { mediaFormat: string; sourceUrl: string }[];
  callToAction?: { actionType: string; url: string };
}

export interface GBPPhoto {
  name: string;
  mediaFormat: string;
  googleUrl?: string;
  thumbnailUrl?: string;
  createTime?: string;
  dimensions?: { widthPixels: number; heightPixels: number };
  locationAssociation?: { category: string };
}

// ── Constants ────────────────────────────────────────────────

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GBP_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const GBP_ACCOUNT_API = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const GBP_REVIEWS_API = 'https://mybusiness.googleapis.com/v4';
const GBP_POSTS_API = 'https://mybusiness.googleapis.com/v4';

// ── Token Management ─────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<GBPTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local');
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // Google doesn't always return a new one
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
  };
}

async function getValidToken(tokens: GBPTokens): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (tokens.expires_at > now + 60) {
    return tokens.access_token;
  }
  const refreshed = await refreshAccessToken(tokens.refresh_token);
  // Caller should persist refreshed tokens
  tokens.access_token = refreshed.access_token;
  tokens.expires_at = refreshed.expires_at;
  return refreshed.access_token;
}

async function gbpFetch(url: string, token: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GBP API error (${res.status}): ${error}`);
  }
  return res.json();
}

// ── API Methods ──────────────────────────────────────────────

/** List all GBP accounts the user has access to */
export async function listAccounts(tokens: GBPTokens): Promise<GBPAccount[]> {
  const token = await getValidToken(tokens);
  const data = await gbpFetch(`${GBP_ACCOUNT_API}/accounts`, token);
  return data.accounts || [];
}

/** List all locations for an account */
export async function listLocations(tokens: GBPTokens, accountId: string): Promise<GBPLocation[]> {
  const token = await getValidToken(tokens);
  const readMask = 'name,title,websiteUri,phoneNumbers,categories,storefrontAddress,regularHours,metadata,profile,labels';
  const data = await gbpFetch(
    `${GBP_API_BASE}/accounts/${accountId}/locations?readMask=${readMask}&pageSize=100`,
    token
  );
  return data.locations || [];
}

/** Get a single location by resource name */
export async function getLocation(tokens: GBPTokens, locationName: string): Promise<GBPLocation> {
  const token = await getValidToken(tokens);
  const readMask = 'name,title,websiteUri,phoneNumbers,categories,storefrontAddress,regularHours,metadata,profile,labels';
  return gbpFetch(`${GBP_API_BASE}/${locationName}?readMask=${readMask}`, token);
}

/** Fetch reviews for a location */
export async function getReviews(
  tokens: GBPTokens,
  accountId: string,
  locationId: string,
  pageSize = 50,
  pageToken?: string
): Promise<GBPReviewsResponse> {
  const token = await getValidToken(tokens);
  let url = `${GBP_REVIEWS_API}/accounts/${accountId}/locations/${locationId}/reviews?pageSize=${pageSize}`;
  if (pageToken) url += `&pageToken=${pageToken}`;
  return gbpFetch(url, token);
}

/** Fetch all reviews (paginated) */
export async function getAllReviews(
  tokens: GBPTokens,
  accountId: string,
  locationId: string
): Promise<{ reviews: GBPReview[]; averageRating: number; totalReviewCount: number }> {
  const allReviews: GBPReview[] = [];
  let pageToken: string | undefined;
  let avgRating = 0;
  let totalCount = 0;

  do {
    const res = await getReviews(tokens, accountId, locationId, 50, pageToken);
    avgRating = res.averageRating;
    totalCount = res.totalReviewCount;
    if (res.reviews) allReviews.push(...res.reviews);
    pageToken = res.nextPageToken;
  } while (pageToken);

  return { reviews: allReviews, averageRating: avgRating, totalReviewCount: totalCount };
}

/** Fetch posts (local posts) for a location */
export async function getPosts(
  tokens: GBPTokens,
  accountId: string,
  locationId: string
): Promise<GBPPost[]> {
  const token = await getValidToken(tokens);
  const data = await gbpFetch(
    `${GBP_POSTS_API}/accounts/${accountId}/locations/${locationId}/localPosts?pageSize=100`,
    token
  );
  return data.localPosts || [];
}

/** Fetch media (photos) for a location */
export async function getPhotos(
  tokens: GBPTokens,
  accountId: string,
  locationId: string
): Promise<GBPPhoto[]> {
  const token = await getValidToken(tokens);
  const data = await gbpFetch(
    `${GBP_REVIEWS_API}/accounts/${accountId}/locations/${locationId}/media`,
    token
  );
  return data.mediaItems || [];
}

// ── Update Methods ──────────────────────────────────────────

/** Update location description */
export async function updateDescription(
  tokens: GBPTokens,
  locationName: string,
  description: string
): Promise<GBPLocation> {
  const token = await getValidToken(tokens);
  const res = await fetch(`${GBP_API_BASE}/${locationName}?updateMask=profile.description`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profile: { description },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GBP API error (${res.status}): ${error}`);
  }

  return res.json();
}

// ── Data Adapter: GBP → Zenith Client Format ────────────────

const STAR_MAP: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
};

function parseAddress(location: GBPLocation): { address: string; city: string } {
  const addr = location.storefrontAddress;
  if (!addr) return { address: '', city: '' };
  const lines = addr.addressLines?.join(', ') || '';
  const city = addr.locality || '';
  const state = addr.administrativeArea || '';
  const zip = addr.postalCode || '';
  return {
    address: [lines, city, state, zip].filter(Boolean).join(', '),
    city: city ? `${city}, ${state}` : state,
  };
}

function categorizePhoto(photo: GBPPhoto): string {
  const cat = photo.locationAssociation?.category?.toUpperCase() || '';
  if (cat.includes('TEAM') || cat.includes('PEOPLE')) return 'team';
  if (cat.includes('INTERIOR')) return 'interior';
  if (cat.includes('EXTERIOR')) return 'exterior';
  return 'work';
}

/** Convert raw GBP API data into the Zenith client object format */
export function adaptToZenithClient(
  location: GBPLocation,
  reviews: { reviews: GBPReview[]; averageRating: number; totalReviewCount: number },
  posts: GBPPost[],
  photos: GBPPhoto[]
) {
  const { address, city } = parseAddress(location);
  const desc = location.profile?.description || '';
  const primaryCategory = location.categories?.primaryCategory?.displayName || '';
  const secondaryCategories = (location.categories?.additionalCategories || []).map(c => c.displayName);

  // Reviews analysis
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const reviewsWithResponse = reviews.reviews.filter(r => r.reviewReply).length;
  const recentReviews = reviews.reviews.filter(r => new Date(r.createTime) >= thirtyDaysAgo).length;
  const negativeUnanswered = reviews.reviews.filter(r => {
    const stars = STAR_MAP[r.starRating] || 0;
    return stars <= 2 && !r.reviewReply;
  }).length;

  // Review samples (most recent 5)
  const samples = reviews.reviews
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    .slice(0, 5)
    .map(r => ({
      author: r.reviewer.displayName,
      text: r.comment || '(sem texto)',
      rating: STAR_MAP[r.starRating] || 0,
      date: r.createTime,
      hasResponse: !!r.reviewReply,
    }));

  // Photos analysis
  const photoCounts = { work: 0, interior: 0, exterior: 0, team: 0 };
  let lastUpload = '';
  for (const photo of photos) {
    const type = categorizePhoto(photo) as keyof typeof photoCounts;
    photoCounts[type]++;
    if (photo.createTime && photo.createTime > lastUpload) {
      lastUpload = photo.createTime;
    }
  }

  // Posts adaptation
  const adaptedPosts = posts
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    .map(p => ({
      date: p.createTime.split('T')[0],
      type: p.topicType === 'OFFER' ? 'OFFER' : 'UPDATE',
      text: p.summary || '',
    }));

  // Hours check
  const hoursFilled = !!(location.regularHours?.periods && location.regularHours.periods.length > 0);

  // Extract accountId and locationId from resource name (accounts/X/locations/Y)
  const nameParts = location.name?.split('/') || [];
  const _accountId = nameParts[1] || '';
  const _locationId = nameParts[3] || '';

  return {
    id: location.metadata?.placeId || location.name,
    gbpPlaceId: location.metadata?.placeId || '',
    _accountId,
    _locationId,
    name: location.title,
    businessName: location.title,
    category: primaryCategory,
    city,
    address,
    verified: true, // if we can access via API, it's verified
    description: desc,
    descriptionLength: desc.length,
    secondaryCategories,
    services: [], // GBP API doesn't return services in basic read
    website: location.websiteUri || '',
    phone: location.phoneNumbers?.primaryPhone || '',
    hours: { filled: hoursFilled },
    attributes: 0, // fetched separately if needed
    photos: {
      total: photos.length,
      lastUpload: lastUpload ? lastUpload.split('T')[0] : '',
      hasTeam: photoCounts.team > 0,
      hasCoverPhoto: photos.length > 0,
      ...photoCounts,
    },
    posts: adaptedPosts,
    reviews: {
      total: reviews.totalReviewCount,
      average: reviews.averageRating,
      withResponse: reviewsWithResponse,
      last30days: recentReviews,
      negativeUnanswered,
      samples,
    },
    rating: reviews.averageRating,
    pendingTasks: 0,
    tags: location.labels || [],
    score: 0, // will be calculated by calcScores()
    _source: 'gbp_api' as const, // flag to know data is real
    _fetchedAt: new Date().toISOString(),
  };
}
