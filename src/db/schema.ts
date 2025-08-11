import { pgTable, uuid, text, integer, boolean, bigint, timestamp, jsonb, doublePrecision, numeric, json, date } from 'drizzle-orm/pg-core';

// Complete schema mirroring model.js (Sequelize) so no fields are skipped.
// Notes:
// - Sequelize "buffer" fields are represented as JSONB.
// - Arrays are represented using .array() on the base type.
// - BIGINT epoch timestamps are represented as bigint(..., { mode: 'number' }).

export const allUsersAuthentications = pgTable('all_users_authentications', {
  userId: uuid('user_id'),
  token: uuid('token'),
  timestamp: bigint('timestamp', { mode: 'number' }),
  platform: text('platform')
});

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
  favMusicians: jsonb('fav_musicians'),
  favMovies: jsonb('fav_movies'),
  lastStep: integer('last_step'),
  favBooks: jsonb('fav_books'),
  favSports: jsonb('fav_sports'),
  favDishes: jsonb('fav_dishes'),
  favPlaces: jsonb('fav_places'),
  bio: text('bio'),
  socialLinkedin: text('social_linkedin'),
  socialInstagram: text('social_instagram'),
  socialTwitter: text('social_twitter'),
  socialTiktok: text('social_tiktok'),
  lastLat: doublePrecision('last_lat'),
  status: text('status'),
  lastLng: doublePrecision('last_lng'),
  city: text('city'),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' }),
  showLinkedin: boolean('show_linkedin').default(false),
  showInstagram: boolean('show_instagram').default(false),
  showTwitter: boolean('show_twitter').default(false),
  showTiktok: boolean('show_tiktok').default(false),
  activitySlugs: text('activity_slugs'),
  traitSlugs: text('trait_slugs'),
  coverPic: text('cover_pic'),
  photos: jsonb('photos'),
  gender: text('gender'),
  signedUpType: text('signed_up_type'),
  whoCanChat: jsonb('who_can_chat'),
  country: text('country'),
  isPremium: boolean('is_premium').default(false),
  fingerprintVerified: boolean('fingerprint_verified').default(false),
  userRefId: text('user_ref_id'),
  displayCityCode: text('display_city_code'),
  dbAge: integer('db_age'),
  favActors: integer('fav_actors').array(),
  favActress: integer('fav_actress').array()
});

export const phoneOtps = pgTable('phone_otps', {
  phone: text('phone'),
  otp: text('otp'),
  timestamp: bigint('timestamp', { mode: 'number' })
});

export const activitiesOfInterest = pgTable('activities_of_interest', {
  id: integer('id').primaryKey(),
  name: text('name'),
  slug: text('slug')
});

export const traits = pgTable('traits', {
  id: integer('id').primaryKey(),
  name: text('name'),
  slug: text('slug')
});

export const circles = pgTable('circles', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  numMembers: integer('num_members'),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' }),
  firstUserId: uuid('first_user_id'),
  name: text('name'),
  isDefault: boolean('is_default')
});

export const jammMembers = pgTable('jamm_members', {
  id: uuid('id').primaryKey(),
  msg: text('msg'),
  userId: uuid('user_id'),
  updatedAt: bigint('updated_at', { mode: 'number' }),
  createdAt: bigint('created_at', { mode: 'number' }),
  jammId: uuid('jamm_id'),
  status: text('status') // requested, accepted, rejected
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
  hiddenCircles: uuid('hidden_circles').array(),
  numGuests: integer('num_guests'),
  city: text('city'),
  activitySlug: text('activity_slug'),
  startTime: bigint('start_time', { mode: 'number' }),
  endTime: bigint('end_time', { mode: 'number' }),
  hiddenUsers: uuid('hidden_users').array(),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' }),
  whosPaying: text('whos_paying'),
  feesCurrency: text('fees_currency'),
  fees: integer('fees'),
  version: integer('version'),
  mapUrl: text('map_url')
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  createdAt: bigint('created_at', { mode: 'number' }),
  reviewerId: uuid('reviewer_id'),
  review: text('review'),
  isDeleted: boolean('is_deleted'),
  selected: boolean('selected')
});

export const circleMembers = pgTable('circle_members', {
  id: uuid('id').primaryKey(),
  circleId: uuid('circle_id'),
  userId: uuid('user_id'),
  createdAt: bigint('created_at', { mode: 'number' })
});

export const userSelfies = pgTable('user_selfies', {
  userId: uuid('user_id'),
  url: text('url'),
  createdAt: bigint('created_at', { mode: 'number' }),
  status: text('status')
});

export const chatSummary = pgTable('chat_summary', {
  id: uuid('id').primaryKey(),
  type: text('type'),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' }),
  lastMsg: text('last_msg'),
  lastMsgTimestamp: bigint('last_msg_timestamp', { mode: 'number' }),
  firstUser: uuid('first_user'),
  status: text('status'),
  isNew: boolean('is_new'),
  secondUser: uuid('second_user'),
  firstUserStatus: text('first_user_status'),
  secondUserStatus: text('second_user_status'),
  firebaseId: text('firebase_id'),
  jammMembers: text('jamm_members'),
  jammId: uuid('jamm_id')
});

export const chatMembers = pgTable('chat_members', {
  id: uuid('id').primaryKey(),
  chatId: uuid('chat_id'),
  userId: uuid('user_id'),
  createdAt: bigint('created_at', { mode: 'number' }),
  lastRead: bigint('last_read', { mode: 'number' })
});

export const chatMsgs = pgTable('chat_msgs', {
  id: uuid('id').primaryKey(),
  chatId: uuid('chat_id'),
  type: text('type'),
  timestampEpoch: bigint('timestamp', { mode: 'number' }),
  msg: text('msg'),
  userId: uuid('user_id')
});

export const jammConfig = pgTable('jamm_config', {
  id: uuid('id').primaryKey(),
  key: text('key'),
  value: text('value')
});

export const userFirebaseTokens = pgTable('user_firebase_tokens', {
  userId: uuid('user_id'),
  token: text('token')
});

export const userDps = pgTable('user_dps', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  url: text('url'),
  createdAt: bigint('created_at', { mode: 'number' }),
  status: text('status')
});

export const userImages = pgTable('user_images', {
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
  updatedAt: timestamp('updated_at')
});

export const jammSeenTimestamps = pgTable('jamm_seen_timestamps', {
  userId: uuid('user_id'),
  timestamp: bigint('timestamp', { mode: 'number' })
});

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  address: json('address')
});

export const blockedAccounts = pgTable('blocked_accounts', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  blockedUserId: uuid('blocked_user_id'),
  createdAt: bigint('created_at', { mode: 'number' })
});

export const userIps = pgTable('user_ips', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  ip: text('ip'),
  createdAt: bigint('created_at', { mode: 'number' })
});

export const userPlatforms = pgTable('user_platforms', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  createdAt: bigint('created_at', { mode: 'number' }),
  platform: text('platform')
});

export const approveTimestamp = pgTable('approve_timestamp', {
  userId: uuid('user_id'),
  timestamp: bigint('timestamp', { mode: 'number' }),
  type: text('type'),
  dpId: uuid('dp_id')
});

export const googleJwtData = pgTable('google_jwt_data', {
  id: uuid('id').primaryKey(),
  credential: text('credential'),
  timestamp: bigint('timestamp', { mode: 'number' }),
  isExpired: boolean('is_expired').default(false)
});

export const userFollowers = pgTable('user_followers', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  followerId: uuid('follower_id'),
  createdAt: bigint('created_at', { mode: 'number' })
});

export const newDmRequests = pgTable('new_dm_requests', {
  fromUser: uuid('from_user'),
  toUser: uuid('to_user'),
  createdAt: bigint('created_at', { mode: 'number' }),
  status: text('status'),
  updatedAt: bigint('updated_at', { mode: 'number' }),
  acceptedAt: bigint('accepted_at', { mode: 'number' })
});

export const fingerprintMapping = pgTable('fingerprint_mapping', {
  id: integer('id').primaryKey(),
  fingerprintVisitorId: text('fingerprint_visitor_id'),
  userId: uuid('user_id'),
  data: json('data'),
  createdAt: bigint('created_at', { mode: 'number' })
});

export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  subscriptionId: text('subscription_id'),
  data: json('data'),
  createdAt: bigint('created_at', { mode: 'number' })
});

export const adminLogs = pgTable('admin_logs', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id'),
  adminId: integer('admin_id'),
  status: text('status'),
  page: text('page'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const cmsAdmins = pgTable('cms_admins', {
  id: integer('id').primaryKey(),
  email: text('email'),
  password: text('password'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').default('admin'),
  status: text('status').default('active'),
  lastLogin: bigint('last_login', { mode: 'number' }),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' })
});

export const paymentAppleReceipts = pgTable('payment_apple_receipts', {
  id: integer('id').primaryKey(),
  receipt: text('receipt'),
  userId: uuid('user_id'),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' })
});

export const paymentAppleSubscriptions = pgTable('payment_apple_subscriptions', {
  id: integer('id').primaryKey(),
  userId: uuid('user_id'),
  productId: text('product_id'),
  originalTransactionId: text('original_transaction_id'),
  expiresDate: bigint('expires_date', { mode: 'number' }),
  currency: text('currency'),
  amount: numeric('amount', { precision: 10, scale: 2 }),
  autoRenewProductId: text('auto_renew_product_id'),
  planId: uuid('plan_id'),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: bigint('updated_at', { mode: 'number' })
});

export const paymentAppleTransactions = pgTable('payment_apple_transactions', {
  id: integer('id').primaryKey(),
  userId: uuid('user_id'),
  productId: text('product_id'),
  transactionId: text('transaction_id'),
  originalTransactionId: text('original_transaction_id'),
  currency: text('currency'),
  amount: numeric('amount', { precision: 10, scale: 2 }),
  paymentId: integer('payment_id'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const paymentUserDetail = pgTable('payment_user_detail', {
  id: integer('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  planId: integer('plan_id'),
  exchangeRate: numeric('exchange_rate', { precision: 10, scale: 4 }),
  refundDate: timestamp('refund_date'),
  refundAmount: numeric('refund_amount', { precision: 10, scale: 2 }),
  adjustedAmount: numeric('adjusted_amount', { precision: 10, scale: 2 }),
  currency: text('currency'),
  amount: numeric('amount', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const paymentExchangeRates = pgTable('payment_exchange_rates', {
  id: integer('id').primaryKey(),
  baseCurrency: text('base_currency').notNull(),
  currency: text('currency').notNull(),
  value: numeric('value'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const paymentAppleWebhookData = pgTable('payment_apple_webhook_data', {
  id: integer('id').primaryKey(),
  notificationUuid: uuid('notification_uuid').notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const paymentGoogleReceipts = pgTable('payment_google_receipts', {
  id: integer('id').primaryKey(),
  userId: uuid('user_id'),
  purchaseToken: text('purchase_token').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const paymentGoogleOrder = pgTable('payment_google_order', {
  id: integer('id').primaryKey(),
  orderId: text('order_id').notNull(),
  productId: text('product_id').notNull(),
  transactionDate: bigint('transaction_date', { mode: 'number' }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull(),
  userId: uuid('user_id').notNull(),
  paymentId: integer('payment_id').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const userBookmarks = pgTable('user_bookmarks', {
  id: integer('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  bookmarkedUserId: uuid('bookmarked_user_id').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const actors = pgTable('actors', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category'),
  imageUrl: text('image_url'),
  originalUrl: text('original_url'),
  useOriginalUrl: boolean('use_original_url').default(false),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

