1. **users**
Purpose: Primary user record & profile core.
Key: `id`, `email`, `name`, `dob`, `gender`, `city`, `state`, `country`, `user_state` (applicant | approved\_free | approved\_paid | disapproved | deactivated | banned | shadow\_banned), `created_at`, `updated_at`, `refid` (6-char), `company` (≤50), `position` (≤50), `bio` (≤150), `created_at`,`updated_at`.

1. **auth\_identities**
Purpose: Link a user to Google/Apple identity.
Key: `id`, `user_id`, `provider` (google | apple), `provider_user_id`, `created_at`, `created_at`,`updated_at`.
**devices**
Purpose: Push tokens & platform per device.
Key: `id`, `user_id`, `platform` (ios | android), `push_token`, `app_version`, `last_seen_at`, `created_at`,`updated_at`.

**5\. user\_settings**
Purpose: Per-user app settings (e.g., chat audience).
Key: `user_id` (PK), `chat_audience` (anyone | men | women | others), `push_enabled` (bool), `created_at`,`updated_at`.

**6\. user\_location**
Purpose: Store location for proximity + display.
Key: `user_id` (PK), `lat`, `lng`, `closest_airport_code`, `updated_at`.
Note: Keep `closest_airport_code` pointing to `airports.code` (see Catalog), `created_at`, `updated_at`.

**7\. user\_network\_observations**
*   `id` — PK
*   `user_id` — FK → [users.id](http://users.id)
*   `created_at` — timestamp when IPAPI was called (UTC)
*   `ip` — string; store as text (supports IPv4/IPv6)
*   `ip_version` — enum (`v4`, `v6`)
*   `asn` (integer/string)
*   `isp` (string)
*   `org` (string, if provided)
*   `ipapi_response` (json)
*   `city`, `state`, `country`, `country_code`
*   `created_at`,`updated_at`.

**8\. airports**
*   `id`, `lat`, `lng`, `region_name`, `iata`, `country_code`, `icao`, `airport_name`, `created_at`, `updated_at`.

**9\. user\_photos**
*   `id` , `user_id`, `original_url`, `optimized_url`, `kraken_id`, `photo_type(avatar|album)`, `position`, `is_active`, `optimization_status`, `optimization_attempts`, `optimized_at`, `deactivated_at`, `created_at`, `updated_at`, `kraken_response`

**10\. social\_links**
Purpose: Store social handles/URLs.
Key: `id`, `user_id`, `platform` (instagram | twitter | linkedin | tiktok | other), `handle`, `created_at`,`updated_at`.

**11\. catalog\_activities**
Purpose: Predefined interests list.
Key: `id`, `name`, `is_active`, `slug`.

**12\. catalog\_traits**
Purpose: Predefined traits list.
Key: `id`, `name`, `is_active`, `slug`.

**13\. catalog\_actors**
Purpose: Predefined Malayalam actors.
Key: `id`, `name`, `is_active`, `slug`.

**14\. catalog\_actresses**
Purpose: Predefined Malayalam actresses.
Key: `id`, `name`, `is_active`, `slug`.

**15\. currencies**
Purpose: Curated currency list for fees (ordering by user locale).
Key: `code`, `symbol`, `name`, `priority_order`.

**16\. user\_interests**
Purpose: Exactly 3 selected interests/user.
Key: `user_id`, `interest_id` (PK composite), `position`.

**17\. user\_traits**
Purpose: Exactly 3 selected traits/user.
Key: `user_id`, `trait_id` (PK composite), `position`.

**18\. user\_favorite\_actors**
Purpose: 3 selected from predefined actors.
Key: `user_id`, `actor_id` (PK composite), `position`.

**19\. user\_favorite\_actresses**
Purpose: 3 selected from predefined actresses.
Key: `user_id`, `actress_id` (PK composite), `position`.

**20\. user\_favorites\_text**
Purpose: Free-text favorites (up to 5 each item type).
Key: `id`, `user_id`, `category` (musician | movie | game\_sport | dish), `text` (≤150), `position`, `created_at`.

**21\. bookmarks**
Purpose: Users bookmarked by a user (lifetime cap = 7 enforced in logic).
Key: `id`, `user_id`, `bookmarked_user_id`, `created_at`, `updated_at`.

**22\. block\_and\_report**
Key: `id`, `option_text`, `display_order`, `is_active`, `created_at`, `updated_at`.

**23\. blocked\_user**
Key: `id`, `user_id`, `blocked_user_id`, `created_at`, `updated_at`,`reason_blocked`.

**24\. admin\_logs**
Purpose: Track approvals/rejections (profile, avatar, user state changes).
Key: `id`, `admin_id`, `user_id`, `action_type`, `cms_page`, `created_at`, `updated_at`.

**25\. meetups**
Purpose: Meetup entity.
Key: `id`, `host_id`, `name` (10–35), `activity_id` (FK to `catalog_meetup_activities`), `guests` (1–7), `who_pays` (enum), `currency_code`, `fee_amount`, `location_text` (≤100), `description` (35–150), `starts_at`, `ends_at`, `map_url`, `created_at`, `updated_at`, `meetup_status`, `lat`, `lng`, `city`, `state`, `country`.

**26\. meetup\_requests**
Purpose: Requests to join a meetup (message up to 500).
Key: `id`, `meetup_id`, `sender_user_id`, `message`, `status` (pending | accepted | declined), `created_at`, `updated_at`.

**27\. meetup\_attendees**
Purpose: Requests to join a meetup (message up to 500).
Key: `id`, `meetup_id`, `sender_user_id`, `chat_room_id`, `created_at`, `updated_at`.

**28\. chat\_requests**
Purpose: One-on-one chat requests (message up to 500).
Key: `id`, `from_user_id`, `to_user_id`, `message`, `status` (pending | accepted | archived | declined), `created_at`, `updated_at`.

**29\. chat\_rooms**
Purpose: Conversation container (DM or meetup chat).
Key: `id`, `type` (DM | meetup), `meetup_id` (nullable for DM), `created_at`, `updated_at`.

**30\. chat\_room\_participants**
Purpose: Membership + per-user state (archive, unread).
Key: `chat_room_id`, `user_id` (PK composite), `last_read_message_id` (nullable), `unread_count` (int), `joined_at`, `created_at`, `updated_at`, `status`

**31\. chat\_messages**
Purpose: Messages within chats.
Key: `id`, `chat_id`, `sender_user_id` (nullable for system), `kind` (text | system), `body` (text, up to 1000), `created_at`, `created_at`, `updated_at`.
Notes: System messages cover “Host added X”, “Y left the meetup”, cancellations, etc.

**32\. app\_settings**
Purpose: Global config (badge cap=25, etc.).
Key: `id`, `key`, `value`, `created_at`, `updated_at`.

**33\. user\_selfie**
Key: `id`, `user_id`, `selfie_url`, `status`, `created_at`, `updated_at`.

**34\. user\_firebase\_tokens**
Key: `id`, `user_id`, `token`, `created_at`, `updated_at`.

**35\. finerprint**
Key: `id`, `user_id`, `fingerprint_visitor_id`, `fingerprint_data` (json), `created_at`, `updated_at`.

**36\. admins**
Key: `id`, `first_name`, `email`, `password`, `role`, `last_login`, `is_deleted` , `created_at`, `updated_at` .

**37\. user\_states**
Key: `id`, `name`, `created_at`, `updated_at`