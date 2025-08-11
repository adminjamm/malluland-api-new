"use strict";
const { Sequelize, INTEGER } = require("sequelize");
var sequelize = require("sequelize");
var dbConfig = require("../config");

var s = dbConfig.setConnection();

exports.sequelize = s;

exports.directQuery = (query) => {
  return s.query(query, {
    type: sequelize.QueryTypes.SELECT,
    raw: true,
  });
};

exports.directQueryGeneral = (query) => {
  return s.query(query, {});
};

exports.all_users_authentications = s.define(
  "all_users_authentications",
  {
    user_id: sequelize.UUID,
    token: sequelize.UUID,
    timestamp: sequelize.BIGINT,
    platform: sequelize.STRING,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "all_users_authentications",
  }
);

exports.all_users = s.define(
  "all_users",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    first_name: "string",
    last_name: "string",
    email: "string",
    phone: "string",
    email_verified: "boolean",
    state: "string",
    phone_verified: "boolean",
    date_dob: "string",
    month_dob: "string",
    year_dob: "string",
    admin_status: "string",
    profession: "string",
    company_name: "string",
    avatar: "string",
    fav_musicians: "buffer",
    fav_movies: "buffer",
    last_step: "integer",
    fav_books: "buffer",
    fav_sports: "buffer",
    fav_dishes: "buffer",
    fav_places: "buffer",
    bio: "string",
    social_linkedin: "string",
    social_instagram: "string",
    social_twitter: "string",
    social_tiktok: "string",
    // verified: 'boolean',
    last_lat: sequelize.DOUBLE,
    status: "string",
    last_lng: sequelize.DOUBLE,
    city: "string",
    created_at: "bigint",
    updated_at: "bigint",
    show_linkedin: { type: sequelize.BOOLEAN, defaultValue: false },
    show_instagram: { type: sequelize.BOOLEAN, defaultValue: false },
    show_twitter: { type: sequelize.BOOLEAN, defaultValue: false },
    show_tiktok: { type: sequelize.BOOLEAN, defaultValue: false },
    activity_slugs: "text",
    trait_slugs: "text",
    cover_pic: "string",
    photos: "buffer",
    gender: "string",
    signed_up_type: "string",
    who_can_chat: "buffer",
    country: "string",
    is_premium: { type: sequelize.BOOLEAN, defaultValue: false },
    fingerprint_verified: { type: sequelize.BOOLEAN, defaultValue: false },
    user_ref_id: sequelize.TEXT,
    display_city_code: sequelize.TEXT,
    db_age: sequelize.INTEGER,
    fav_actors: sequelize.ARRAY(sequelize.INTEGER),
    fav_actress: sequelize.ARRAY(sequelize.INTEGER),
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "all_users",
  }
);

exports.phone_otps = s.define(
  "phone_otps",
  {
    phone: "string",
    otp: "string",
    timestamp: "bigint",
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "phone_otps",
  }
);

exports.activities_of_interest = s.define(
  "activities_of_interest",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, allowNull: true },
    name: sequelize.STRING,
    slug: sequelize.STRING,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "activities_of_interest",
  }
);

exports.traits = s.define(
  "traits",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, allowNull: true },
    name: sequelize.STRING,
    slug: sequelize.STRING,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "traits",
  }
);

exports.circles = s.define(
  "circles",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    user_id: sequelize.UUID,
    num_members: sequelize.INTEGER,
    created_at: sequelize.BIGINT,
    updated_at: sequelize.BIGINT,
    first_user_id: sequelize.UUID,
    name: sequelize.TEXT,
    is_default: sequelize.BOOLEAN,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "circles",
  }
);

exports.jamm_members = s.define(
  "jamm_members",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    msg: sequelize.TEXT,
    user_id: sequelize.UUID,
    updated_at: sequelize.BIGINT,
    created_at: sequelize.BIGINT,
    jamm_id: sequelize.UUID,
    status: sequelize.TEXT, ////// requested, accepted, rejected
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "jamm_members",
  }
);

exports.jamms = s.define(
  "jamms",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    host_id: sequelize.UUID,
    max_num_guests: sequelize.INTEGER,
    name: sequelize.TEXT,
    status: sequelize.TEXT,
    location: sequelize.TEXT,
    description: sequelize.TEXT,
    from_timestamp: sequelize.BIGINT,
    to_timestamp: sequelize.BIGINT,
    hidden_circles: sequelize.ARRAY(sequelize.UUID),
    num_guests: sequelize.INTEGER,
    city: sequelize.TEXT,
    activity_slug: sequelize.TEXT,
    start_time: sequelize.BIGINT, //// will be use hour of the day
    end_time: sequelize.BIGINT,
    hidden_users: sequelize.ARRAY(sequelize.UUID),
    created_at: sequelize.BIGINT,
    updated_at: sequelize.BIGINT,
    whos_paying: sequelize.TEXT,
    fees_currency: sequelize.TEXT,
    fees: sequelize.INTEGER,
    version: sequelize.INTEGER,
    map_url: sequelize.TEXT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "jamms",
  }
);

exports.reviews = s.define(
  "reviews",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    user_id: sequelize.UUID,
    created_at: sequelize.BIGINT,
    reviewer_id: sequelize.UUID,
    review: sequelize.TEXT,
    is_deleted: sequelize.BOOLEAN,
    selected: sequelize.BOOLEAN,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "reviews",
  }
);
exports.circle_members = s.define(
  "circle_members",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    // id: { type: sequelize.INTEGER, primaryKey: true, allowNull: true },
    circle_id: sequelize.UUID,
    user_id: sequelize.UUID,
    created_at: sequelize.BIGINT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "circle_members",
  }
);

exports.user_selfies = s.define(
  "user_selfies",
  {
    user_id: sequelize.UUID,
    url: sequelize.TEXT,
    created_at: sequelize.BIGINT,
    status: sequelize.TEXT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "user_selfies",
  }
);

exports.chat_summary = s.define(
  "chat_summary",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    type: sequelize.TEXT,
    created_at: sequelize.BIGINT,
    updated_at: sequelize.BIGINT,
    last_msg: sequelize.TEXT,
    last_msg_timestamp: sequelize.BIGINT,
    first_user: sequelize.UUID,
    status: sequelize.TEXT,
    is_new: sequelize.BOOLEAN,
    second_user: sequelize.UUID,
    first_user_status: sequelize.TEXT,
    second_user_status: sequelize.TEXT,
    firebase_id: sequelize.TEXT,
    is_new: sequelize.BOOLEAN,
    jamm_members: sequelize.TEXT,
    jamm_id: sequelize.UUID,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "chat_summary",
  }
);

exports.chat_members = s.define(
  "chat_members",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    chat_id: sequelize.UUID,
    user_id: sequelize.UUID,
    created_at: sequelize.BIGINT,
    last_read: sequelize.BIGINT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "chat_members",
  }
);

exports.chat_msgs = s.define(
  "chat_msgs",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    chat_id: sequelize.UUID,
    type: sequelize.TEXT,
    timestamp: sequelize.BIGINT,
    msg: sequelize.TEXT,
    user_id: sequelize.UUID,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "chat_msgs",
  }
);

exports.jamm_config = s.define(
  "jamm_config",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    key: sequelize.TEXT,
    value: sequelize.TEXT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "jamm_config",
  }
);

exports.user_firebase_tokens = s.define(
  "user_firebase_tokens",
  {
    user_id: sequelize.UUID,
    token: sequelize.TEXT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "user_firebase_tokens",
  }
);

exports.user_dps = s.define(
  "user_dps",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    user_id: sequelize.UUID,
    url: sequelize.TEXT,
    created_at: sequelize.BIGINT,
    status: sequelize.TEXT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "user_dps",
  }
);

exports.user_images = s.define(
  "user_images",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: false },
    user_id: { type: sequelize.UUID, allowNull: false },
    original_url: { type: sequelize.TEXT, allowNull: false },
    optimized_url: sequelize.TEXT,
    kraken_id: sequelize.TEXT,
    kraken_response: { type: sequelize.JSON, allowNull: true },
    image_type: { type: sequelize.TEXT, allowNull: false },
    position: { type: sequelize.INTEGER, allowNull: false },
    is_active: { type: sequelize.BOOLEAN, defaultValue: true },
    optimization_status: { type: sequelize.TEXT, defaultValue: 'pending' },
    optimization_attempts: { type: sequelize.INTEGER, defaultValue: 0 },
    optimized_at: sequelize.DATE,
    deactivated_at: sequelize.DATE,
  },
  {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    tableName: "user_images",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

exports.jamm_seen_timestamps = s.define(
  "jamm_seen_timestamps",
  {
    user_id: sequelize.UUID,
    timestamp: sequelize.BIGINT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "jamm_seen_timestamps",
  }
);

exports.addresses = s.define(
  "addresses",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    user_id: sequelize.UUID,
    address: sequelize.JSON,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "addresses",
  }
);

exports.blocked_accounts = s.define(
  "blocked_accounts",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    user_id: sequelize.UUID,
    blocked_user_id: sequelize.UUID,
    created_at: sequelize.BIGINT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "blocked_accounts",
  }
);

exports.user_ips = s.define(
  "user_ips",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    user_id: sequelize.UUID,
    ip: sequelize.TEXT,
    created_at: sequelize.BIGINT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "user_ips",
  }
);

exports.user_platforms = s.define(
  "user_platforms",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    user_id: sequelize.UUID,
    created_at: sequelize.BIGINT,
    platform: sequelize.TEXT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "user_platforms",
  }
);

exports.approve_timestamp = s.define(
  "approve_timestamp",
  {
    user_id: sequelize.UUID,
    timestamp: sequelize.BIGINT,
    type: sequelize.TEXT,
    dp_id: sequelize.UUID,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "approve_timestamp",
  }
);

exports.google_jwt_data = s.define(
  "google_jwt_data",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    credential: sequelize.TEXT,
    timestamp: sequelize.BIGINT,
    is_expired: { type: sequelize.BOOLEAN, defaultValue: false },
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "google_jwt_data",
  }
);

exports.user_followers = s.define(
  "user_followers",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    user_id: sequelize.UUID,
    follower_id: sequelize.UUID,
    created_at: sequelize.BIGINT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "user_followers",
  }
);

exports.new_dm_requests = s.define(
  "new_dm_requests",
  {
    // id: { type: sequelize.INTEGER, primaryKey: true, allowNull: true },
    from_user: sequelize.UUID,
    to_user: sequelize.UUID,
    created_at: sequelize.BIGINT,
    status: sequelize.TEXT,
    updated_at: sequelize.BIGINT,
    accepted_at: sequelize.BIGINT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "new_dm_requests",
  }
);

exports.fingerprint_mapping = s.define(
  "fingerprint_mapping",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, allowNull: true },
    fingerprint_visitor_id: sequelize.TEXT,
    user_id: sequelize.UUID,
    data: sequelize.JSON,
    created_at: sequelize.BIGINT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "fingerprint_mapping",
  }
);

exports.user_subscriptions = s.define(
  "user_subscriptions",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: true },
    user_id: sequelize.UUID,
    subscription_id: sequelize.TEXT,
    data: sequelize.JSON,
    created_at: sequelize.BIGINT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "user_subscriptions",
  }
);

exports.admin_logs = s.define(
  "admin_logs",
  {
    id: { type: sequelize.UUID, primaryKey: true, allowNull: false },
    user_id: sequelize.UUID,
    admin_id: sequelize.INTEGER,
    status: sequelize.TEXT,
    page: sequelize.TEXT,
    created_at: sequelize.DATE,
    updated_at: sequelize.DATE,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "admin_logs",
  }
);

exports.cms_admins = s.define(
  "cms_admins",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: sequelize.TEXT, unique: true, allowNull: false },
    password: { type: sequelize.TEXT, allowNull: false },
    first_name: sequelize.TEXT,
    last_name: sequelize.TEXT,
    role: { type: sequelize.TEXT, defaultValue: "admin" },
    status: { type: sequelize.TEXT, defaultValue: "active" },
    last_login: sequelize.BIGINT,
    is_deleted: { type: sequelize.BOOLEAN, defaultValue: false },
    created_at: sequelize.BIGINT,
    updated_at: sequelize.BIGINT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "cms_admins",
  }
);

exports.fingerprint_mapping.removeAttribute("id");
// exports.google_jwt_data.removeAttribute("id");

exports.approve_timestamp.removeAttribute("id");
exports.user_selfies.removeAttribute("id");
exports.jamm_seen_timestamps.removeAttribute("id");
exports.user_firebase_tokens.removeAttribute("id");
exports.all_users_authentications.removeAttribute("id");
exports.new_dm_requests.removeAttribute("id");
exports.phone_otps.removeAttribute("id");

exports.payment_apple_receipts = s.define(
  "payment_apple_receipts",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    receipt: sequelize.TEXT,
    user_id: sequelize.UUID,
    created_at: sequelize.BIGINT,
    updated_at: sequelize.BIGINT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "payment_apple_receipts",
  }
);

exports.payment_apple_subscriptions = s.define(
  "payment_apple_subscriptions",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: sequelize.UUID,
    product_id: sequelize.TEXT,
    original_transaction_id: sequelize.TEXT,
    expires_date: sequelize.BIGINT,
    currency: sequelize.TEXT,
    amount: sequelize.DECIMAL(10, 2),
    auto_renew_product_id: sequelize.TEXT,
    plan_id: sequelize.UUID,
    created_at: sequelize.BIGINT,
    updated_at: sequelize.BIGINT,
  },
  {
    timestamps: false,
    freezeTableName: true,
    tableName: "payment_apple_subscriptions",
  }
);

exports.payment_apple_transactions = s.define(
  "payment_apple_transactions",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: sequelize.UUID,
    product_id: sequelize.TEXT,
    transaction_id: sequelize.TEXT,
    original_transaction_id: sequelize.TEXT,
    currency: sequelize.TEXT,
    amount: sequelize.DECIMAL(10, 2),
    payment_id: sequelize.INTEGER, // New field
  },
  {
    timestamps: true,
    freezeTableName: true,
    tableName: "payment_apple_transactions",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Payment User Detail model
exports.payment_user_detail = s.define(
  "payment_user_detail",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: sequelize.UUID, allowNull: false },
    plan_id: sequelize.INTEGER,
    exchange_rate: sequelize.DECIMAL(10, 4),
    refund_date: sequelize.DATE,
    refund_amount: sequelize.DECIMAL(10, 2),
    adjusted_amount: sequelize.DECIMAL(10, 2),
    currency: sequelize.TEXT,
    amount: sequelize.DECIMAL(10, 2),
  },
  {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    tableName: "payment_user_detail",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Plans model (since it exists in the database but not in models)
// exports.plans = s.define(
//   "plans",
//   {
//     id: { type: sequelize.UUID, primaryKey: true, allowNull: false },
//     product_id: { type: sequelize.TEXT, allowNull: false },
//     payment_gateway: { type: sequelize.INTEGER, allowNull: false },
//     amount: { type: sequelize.DOUBLE, allowNull: false },
//     period: { type: sequelize.INTEGER, allowNull: false },
//     created_at: { type: sequelize.BIGINT, defaultValue: 0 },
//     updated_at: { type: sequelize.BIGINT, defaultValue: 0 },
//   },
//   {
//     timestamps: false,
//     freezeTableName: true,
//     tableName: "plans",
//   }
// );

// Set up associations
exports.payment_apple_transactions.belongsTo(exports.payment_user_detail, {
  foreignKey: "payment_id",
  targetKey: "id",
  as: "paymentDetail",
});

// Optionally, set up the reverse association
exports.payment_user_detail.hasMany(exports.payment_apple_transactions, {
  foreignKey: "payment_id",
  sourceKey: "id",
  as: "appleTransactions",
});

// Payment Exchange Rates model
exports.payment_exchange_rates = s.define(
  "payment_exchange_rates",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    base_currency: { type: sequelize.TEXT, allowNull: false },
    currency: { type: sequelize.TEXT, allowNull: false },
    value: { type: sequelize.FLOAT, allowNull: false },
  },
  {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    tableName: "payment_exchange_rates",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Payment Apple Webhook Data model
exports.payment_apple_webhook_data = s.define(
  "payment_apple_webhook_data",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    notification_uuid: { type: sequelize.UUID, allowNull: false },
    data: { type: sequelize.JSONB, allowNull: false },
  },
  {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    tableName: "payment_apple_webhook_data",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Payment Google Receipts model
exports.payment_google_receipts = s.define(
  "payment_google_receipts",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: sequelize.UUID,
    purchase_token: { type: sequelize.TEXT, allowNull: false },
  },
  {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    tableName: "payment_google_receipts",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Payment Google Order model
exports.payment_google_order = s.define(
  "payment_google_order",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    order_id: { type: sequelize.TEXT, allowNull: false },
    product_id: { type: sequelize.TEXT, allowNull: false },
    transaction_date: { type: sequelize.BIGINT, allowNull: false },
    amount: { type: sequelize.DECIMAL(10, 2), allowNull: false },
    currency: { type: sequelize.STRING, allowNull: false },
    user_id: { type: sequelize.UUID, allowNull: false },
    payment_id: {
      type: sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "payment_user_detail",
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    tableName: "payment_google_order",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// User Bookmarks model
exports.user_bookmarks = s.define(
  "user_bookmarks",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: sequelize.UUID, allowNull: false },
    bookmarked_user_id: { type: sequelize.UUID, allowNull: false },
    is_active: { type: sequelize.BOOLEAN, defaultValue: true, allowNull: false },
  },
  {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    tableName: "user_bookmarks",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Actors model
exports.actors = s.define(
  "actors",
  {
    id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: sequelize.TEXT, allowNull: false },
    category: { type: sequelize.TEXT, allowNull: true },
    image_url: { type: sequelize.TEXT, allowNull: true },
    original_url: { type: sequelize.TEXT, allowNull: true },
    use_original_url: { type: sequelize.BOOLEAN, defaultValue: false, allowNull: false },
  },
  {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    tableName: "actors",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
