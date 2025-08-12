import { pgTable, uuid, text, integer, boolean, bigint, timestamp, jsonb, doublePrecision, numeric, json, date } from 'drizzle-orm/pg-core';

// ========== Authoritative schema from Malluland-Database-Schema.md ==========

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  dob: date('dob'),
  gender: text('gender'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  userState: text('user_state'), // applicant | approved_free | approved_paid | disapproved | deactivated | banned | shadow_banned
  refid: text('refid'), // 6-char
  company: text('company'), // c= 50
  position: text('position'), // c= 50
  bio: text('bio'), // c= 150
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const authIdentities = pgTable('auth_identities', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  provider: text('provider'), // google | apple
  providerUserId: text('provider_user_id'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const devices = pgTable('devices', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  platform: text('platform'), // ios | android
  pushToken: text('push_token'),
  appVersion: text('app_version'),
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').primaryKey(),
  chatAudience: text('chat_audience'), // anyone | men | women | others
  pushEnabled: boolean('push_enabled'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const userLocation = pgTable('user_location', {
  userId: uuid('user_id').primaryKey(),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  closestAirportCode: text('closest_airport_code'), // FK to airports.code (catalog)
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const userNetworkObservations = pgTable('user_network_observations', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  createdAt: timestamp('created_at'), // when IPAPI called
  ip: text('ip'),
  ipVersion: text('ip_version'), // v4 | v6
  asn: text('asn'),
  isp: text('isp'),
  org: text('org'),
  ipapiResponse: jsonb('ipapi_response'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  countryCode: text('country_code'),
  updatedAt: timestamp('updated_at'),
});

export const airports = pgTable('airports', {
  id: uuid('id').primaryKey(),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  regionName: text('region_name'),
  iata: text('iata'),
  countryCode: text('country_code'),
  icao: text('icao'),
  airportName: text('airport_name'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

// user_photos (as per Malluland-Database-Schema.md: "use existing schema")
// We expose the table name as user_photos while keeping the same column structure previously used.
export const userPhotos = pgTable('user_photos', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  originalUrl: text('original_url').notNull(),
  optimizedUrl: text('optimized_url'),
  krakenId: text('kraken_id'),
  krakenResponse: json('kraken_response'),
  imageType: text('image_type').notNull(),
  position: integer('position').notNull(),
  isActive: boolean('is_active').default(true),
  optimizationStatus: text('optimization_status').default('pending'),
  optimizationAttempts: integer('optimization_attempts').default(0),
  optimizedAt: timestamp('optimized_at'),
  deactivatedAt: timestamp('deactivated_at'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const socialLinks = pgTable('social_links', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  platform: text('platform'), // instagram | twitter | linkedin | tiktok | other
  handle: text('handle'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const catalogActivities = pgTable('catalog_activities', {
  id: integer('id').primaryKey(),
  name: text('name'),
  isActive: boolean('is_active'),
  slug: text('slug'),
});

export const catalogTraits = pgTable('catalog_traits', {
  id: integer('id').primaryKey(),
  name: text('name'),
  isActive: boolean('is_active'),
  slug: text('slug'),
});

export const catalogActors = pgTable('catalog_actors', {
  id: integer('id').primaryKey(),
  name: text('name'),
  isActive: boolean('is_active'),
  slug: text('slug'),
  imageUrl: text('image_url'),
  originalUrl: text('original_url'),
});

export const catalogActresses = pgTable('catalog_actresses', {
  id: integer('id').primaryKey(),
  name: text('name'),
  isActive: boolean('is_active'),
  slug: text('slug'),
  imageUrl: text('image_url'),
  originalUrl: text('original_url'),
});

export const currencies = pgTable('currencies', {
  code: text('code').primaryKey(),
  symbol: text('symbol'),
  name: text('name'),
  priorityOrder: integer('priority_order'),
});

export const userInterests = pgTable('user_interests', {
  userId: uuid('user_id'),
  interestId: integer('interest_id'),
  position: integer('position'),
});

export const userTraits = pgTable('user_traits', {
  userId: uuid('user_id'),
  traitId: integer('trait_id'),
  position: integer('position'),
});

export const userFavoriteActors = pgTable('user_favorite_actors', {
  userId: uuid('user_id'),
  actorId: integer('actor_id'),
  position: integer('position'),
});

export const userFavoriteActresses = pgTable('user_favorite_actresses', {
  userId: uuid('user_id'),
  actressId: integer('actress_id'),
  position: integer('position'),
});

export const userFavoritesText = pgTable('user_favorites_text', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  category: text('category'), // musician | movie | game_sport | dish
  textValue: text('text'), // <= 150
  position: integer('position'),
  createdAt: timestamp('created_at'),
});

export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  bookmarkedUserId: uuid('bookmarked_user_id'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

// Per Malluland-Database-Schema.md: user_bookmarks with id, user_id, bookmarked_user_id, created_at, updated_at
export const userBookmarks = pgTable('user_bookmarks', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  bookmarkedUserId: uuid('bookmarked_user_id').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const blockAndReport = pgTable('block_and_report', {
  id: uuid('id').primaryKey(),
  optionText: text('option_text'),
  displayOrder: integer('display_order'),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const blockedUser = pgTable('blocked_user', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  blockedUserId: uuid('blocked_user_id'),
  reasonBlocked: text('reason_blocked'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const adminLogsNew = pgTable('admin_logs', {
  id: uuid('id').primaryKey(),
  adminId: integer('admin_id'),
  userId: uuid('user_id'),
  actionType: text('action_type'),
  cmsPage: text('cms_page'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const meetups = pgTable('meetups', {
  id: uuid('id').primaryKey(),
  hostId: uuid('host_id'),
  name: text('name'), // 10-35
  activityId: integer('activity_id'), // FK to catalog_meetup_activities (mapped here to catalog_activities)
  guests: integer('guests'), // 1-7
  whoPays: text('who_pays'),
  currencyCode: text('currency_code'),
  feeAmount: numeric('fee_amount', { precision: 10, scale: 2 }),
  locationText: text('location_text'), // <= 100
  description: text('description'), // 35-150
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  mapUrl: text('map_url'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
  meetupStatus: text('meetup_status'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
});

export const meetupRequests = pgTable('meetup_requests', {
  id: uuid('id').primaryKey(),
  meetupId: uuid('meetup_id'),
  senderUserId: uuid('sender_user_id'),
  message: text('message'), // <= 500
  status: text('status'), // pending | accepted | declined
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const meetupAttendees = pgTable('meetup_attendees', {
  id: uuid('id').primaryKey(),
  meetupId: uuid('meetup_id'),
  senderUserId: uuid('sender_user_id'),
  chatRoomId: uuid('chat_room_id'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const chatRequests = pgTable('chat_requests', {
  id: uuid('id').primaryKey(),
  fromUserId: uuid('from_user_id'),
  toUserId: uuid('to_user_id'),
  message: text('message'), // <= 500
  status: text('status'), // pending | accepted | archived | declined
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const chatRooms = pgTable('chat_rooms', {
  id: uuid('id').primaryKey(),
  type: text('type'), // DM | meetup
  meetupId: uuid('meetup_id'), // nullable for DM
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const chatRoomParticipants = pgTable('chat_room_participants', {
  chatRoomId: uuid('chat_room_id'),
  userId: uuid('user_id'),
  lastReadMessageId: uuid('last_read_message_id'), // nullable
  unreadCount: integer('unread_count'),
  joinedAt: timestamp('joined_at'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
  status: text('status'),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey(),
  chatId: uuid('chat_id'),
  senderUserId: uuid('sender_user_id'), // nullable for system
  kind: text('kind'), // text | system
  body: text('body'), // up to 1000
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const appSettings = pgTable('app_settings', {
  id: uuid('id').primaryKey(),
  key: text('key'),
  value: text('value'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const userSelfie = pgTable('user_selfie', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  selfieUrl: text('selfie_url'),
  status: text('status'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const userFirebaseTokens = pgTable('user_firebase_tokens', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  token: text('token'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const finerprint = pgTable('finerprint', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  fingerprintVisitorId: text('fingerprint_visitor_id'),
  fingerprintData: jsonb('fingerprint_data'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey(),
  firstName: text('first_name'),
  email: text('email'),
  password: text('password'),
  role: text('role'),
  lastLogin: timestamp('last_login'),
  isDeleted: boolean('is_deleted'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

// New table 37: user_states
export const userStates = pgTable('user_states', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

// ========== Legacy tables from previous model.js mapping (keep for compatibility) ==========

export const allUsers = pgTable('all_users', {
  id: uuid('id').primaryKey(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  emailVerified: boolean('email_verified'),
  state: text('state'),
  phoneVerified: boolean('phone_verified'),
  dateDob: text('date_dob'),
  monthDob: text('month_dob'),
  yearDob: text('year_dob'),
  adminStatus: text('admin_status'),
  profession: text('profession'),
  companyName: text('company_name'),
  avatar: text('avatar'),
  bio: text('bio'),
  socialLinkedin: text('social_linkedin'),
  socialInstagram: text('social_instagram'),
  socialTwitter: text('social_twitter'),
  socialTiktok: text('social_tiktok'),
  lastLat: doublePrecision('last_lat'),
  lastLng: doublePrecision('last_lng'),
  city: text('city'),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' }),
  gender: text('gender'),
  isPremium: boolean('is_premium').default(false),
  dbAge: integer('db_age'),
  activitySlugs: text('activity_slugs'),
  traitSlugs: text('trait_slugs'),
  status: text('status'),
});

export const jamms = pgTable('jamms', {
  id: uuid('id').primaryKey(),
  hostId: uuid('host_id'),
  maxNumGuests: integer('max_num_guests'),
  name: text('name'),
  status: text('status'),
  location: text('location'),
  description: text('description'),
  fromTimestamp: bigint('from_timestamp', { mode: 'number' }),
  toTimestamp: bigint('to_timestamp', { mode: 'number' }),
  numGuests: integer('num_guests'),
  city: text('city'),
  activitySlug: text('activity_slug'),
  startTime: bigint('start_time', { mode: 'number' }),
  endTime: bigint('end_time', { mode: 'number' }),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' }),
  whosPaying: text('whos_paying'),
  feesCurrency: text('fees_currency'),
  fees: integer('fees'),
  mapUrl: text('map_url'),
});

export const userBookmarksLegacy = pgTable('user_bookmarks', {
  id: integer('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  bookmarkedUserId: uuid('bookmarked_user_id').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});
