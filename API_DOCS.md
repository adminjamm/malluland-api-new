# Malluland API - HTTP Reference

Base URL
- Local: http://localhost:8787

Auth
- Most endpoints require a header: x-user-id: <UUID of the acting user>

Conventions
- Pagination parameters: page (default 1)
- Paginated responses: { page, pageSize, items|data }
- Errors: { error: string }

Health
- GET /health
  - 200 { ok: true }

People
- GET /people
  - Headers: x-user-id
  - Query: page (number, default 1), lat (optional), lng (optional)
  - Response: 200 { page, pageSize: 20, items: [{ id, avatar, name, age, bioSnippet }] }
  - Behavior: Returns up to 20 profiles within 30km, balanced 10 male + 10 female (with backfill), ordered by latest approval.
  - Errors: 400 if x-user-id missing or user location not set and lat/lng not provided.

Meetups
- GET /meetups
  - Query: page (default 1)
  - Response: 200 { page, pageSize: 20, items }

- GET /meetups?filter=this-week|this-weekend|upcoming&city&activityId
  - Response: 200 { page, pageSize: 20, items }

- GET /meetups/me
  - Headers: x-user-id
  - Query: page (default 1), includePast (true|false)
  - Response: 200 { page, pageSize: 20, items }

- POST /meetups
  - Headers: x-user-id
  - Body (json): { name, activityId, guests, whoPays, currencyCode, feeAmount, locationText, description, startsAt, endsAt, mapUrl?, city, state, country, lat?, lng? }
  - Response: 201 <created meetup row>
  - Errors: 400 if x-user-id missing or validation fails

- PATCH /meetups/:id
  - Headers: x-user-id
  - Body (json): any subset of the POST fields
  - Response: 200 <updated meetup row>
  - Errors: 400 if header missing; 404 if not found

- DELETE /meetups/:id
  - Headers: x-user-id
  - Response: 200 { ok: true }
  - Errors: 400 if header missing; 404 if not found

- GET /meetups/:id/attendees
  - Response: 200 [ attendees ]

- POST /meetups/:id/requests
  - Headers: x-user-id
  - Body: { message: string (<= 500) }
  - Response: 201 <request row>
  - Errors: 400 on rules (own meetup, closed, daily rate limit, duplicate)

- GET /meetups/me/requests/sent
  - Headers: x-user-id
  - Query: page (default 1)
  - Response: 200 { page, pageSize: 20, items }

- GET /meetups/me/requests/received
  - Headers: x-user-id
  - Query: page (default 1)
  - Response: 200 { page, pageSize: 20, items }

- POST /meetups/requests/:id/approve
  - Headers: x-user-id
  - Response: 200 <updated request row>
  - Errors: 400 with message if not authorized or invalid

- POST /meetups/requests/:id/decline
  - Headers: x-user-id
  - Response: 200 <updated request row>

Bookmarks
- GET /bookmarks
  - Headers: x-user-id
  - Query: page (default 1)
  - Response: 200 { page, pageSize: 20, items: [{ id, user: { id, name, city, state, country, gender, dob, bio } }] }

- POST /bookmarks
  - Headers: x-user-id
  - Body: { bookmarkedUserId: uuid }
  - Response: 201 { ok: true, alreadyBookmarked: true } | 201 <created row>
  - Errors: 400 on self-bookmark or limit reached

- DELETE /bookmarks/:bookmarkedUserId
  - Headers: x-user-id
  - Response: 200 { ok: true }

## Requests

### GET /chats/rooms
List chat rooms for the authenticated user. Includes unread counts, last message metadata, and participant user IDs.

Query params:
- page (integer, default 1)

Response 200:
{
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "uuid",
      "type": "DM" | "meetup",
      "meetup_id": "uuid|null",
      "unread_count": 0,
      "last_message_id": "uuid|null",
      "last_message_kind": "text|system|null",
      "last_message_body": "string|null",
      "last_message_at": "ISO date|null",
      "participant_user_ids": ["uuid", "uuid"]
    }
  ]
}
- GET /requests
  - Headers: x-user-id
  - Query: filter (all|meetups|chats, default all), page (default 1)
  - Response: 200 { page, pageSize: 21, items: [
      { kind: 'meetup', id, created_at, status, sender_user_id, sender_name, meetup_id, meetup_name, message },
      { kind: 'chat', id, created_at, status, sender_user_id, sender_name, from_user_id, to_user_id, message }
    ] }

- POST /requests/chats/:id/accept
  - Headers: x-user-id
  - Response: 200 <updated chat_request row>

- POST /requests/chats/:id/decline
  - Headers: x-user-id
  - Response: 200 <updated chat_request row>

- POST /requests/chats/:id/archive
  - Headers: x-user-id
  - Response: 200 <updated chat_request row>

Storage
- POST /storage/presign/put
  - Body (json, all fields optional): { key?: string, contentType?: string (default: image/jpeg), expiresInSeconds?: number (default: 900), acl?: 'private'|'public-read' (default: 'private') }
  - Behavior: If key is omitted/blank, a random key is generated using <timestamp>-<random>.<ext?> inferred from contentType.
  - Response: 200 { url, bucket, key }

- POST /storage/presign/get
  - Body (json): { key: string, expiresInSeconds?: number (default: 900), responseContentType?: string }
  - Response: 200 { url, bucket, key }

Users
- GET /users/settings
  - Response: 200 { data: { userId, chatAudience, pushEnabled } | null }
- PUT /users/settings
  - Body: { chatAudience?: 'anyone'|'men'|'women'|'others'|null, pushEnabled?: boolean|null }
  - Response: 200 { data: { userId, chatAudience, pushEnabled } }

- GET /users/location
  - Headers: x-user-id
  - Response: 200 { data: { userId, lat, lng, closestAirportCode, createdAt, updatedAt } | null }

- PUT /users/location
  - Headers: x-user-id
  - Body: { lat?: number|null, lng?: number|null, closestAirportCode?: string|null }
  - Behavior: If lat/lng are provided (or present from an existing row) and closestAirportCode is not provided, the server auto-fills closestAirportCode using the nearest airport by coordinates.
  - Response: 200 { data: { userId, lat, lng, closestAirportCode, createdAt, updatedAt } }

- Favorites text (per-category, max 5 entries; positions start at 1)
  - GET /users/user-favorites?category=<optional>
    - Headers: x-user-id
    - Response: 200 { data: [ { userId, category, textValue, position } ] }
  - PUT /users/user-favorites
    - Headers: x-user-id
    - Body: { category: string, values: string[] (max 5) }
    - Behavior: Replace-all strategy. Deletes existing entries for the category and inserts up to 5 items with positions 1..n.
    - Response: 200 { data: [ { userId, category, textValue, position } ] }
  - POST /users/user-favorites (same as PUT)
    - Headers: x-user-id
    - Body: { category: string, values: string[] (max 5) }
    - Response: 200 { data: [ { userId, category, textValue, position } ] }
  - POST /users/user-favorites/add
    - Headers: x-user-id
    - Body: { category: string, value: string }
    - Behavior: Adds a single favorite if total < 5, auto-assigns next position; otherwise returns an error.
    - Response: 200 { data: { userId, category, textValue, position } }

- GET /users/:id
  - Response: 200 <user row> | 404

- PUT /users/:id
  - Body: { name?, gender?, city?, state?, country?, company?, position?, bio? }
  - Response: 200 <updated user>

- Photos
  - POST /users/:id/photos
    - Body: { originalUrl: url, optimizedUrl?: url|null, imageType: string, position: number }
    - Response: 201 <photo row>
  - GET /users/:id/photos
    - Response: 200 [ photos ]

- Selfies
  - POST /users/:id/selfies
    - Body: { selfieUrl: url, status?: string }
    - Response: 201 <selfie row>
  - GET /users/:id/selfies
    - Response: 200 [ selfies ]

- Interests
  - POST /users/:id/interests
    - Body: { interestIds: number[] }
    - Response: 201 [ interests ]
  - GET /users/:id/interests
    - Response: 200 [ interests ]

- Traits
  - POST /users/:id/traits
    - Body: { traitIds: number[] }
    - Response: 201 [ traits ]
  - GET /users/:id/traits
    - Response: 200 [ traits ]

- Favorite actors
  - POST /users/:id/favorite-actors
    - Body: { actorIds: number[] }
    - Response: 201 [ favorite actors ]
  - GET /users/:id/favorite-actors
    - Response: 200 [ favorite actors ]

- Favorite actresses
  - POST /users/:id/favorite-actresses
    - Body: { actressIds: number[] }
    - Response: 201 [ favorite actresses ]
  - GET /users/:id/favorite-actresses
    - Response: 200 [ favorite actresses ]

- Social links
  - POST /users/:id/social-links
    - Body: { links: [{ platform, handle }] }
    - Response: 201 [ links ]
  - GET /users/:id/social-links
    - Response: 200 [ links ]

Actors
- GET /actors?page=1
  - Response: 200 { page, pageSize: 20, data }

Airports
- GET /airports/nearest?lat={lat}&lng={lng}
  - Query: lat (-90..90), lng (-180..180)
  - Response: 200 { data: { iata, airportName, distanceKm } } | 404 if not found

Examples
All endpoints have sample Bruno requests under the bruno/ directory. For example:
- People: bruno/People/GET people.bru
- Meetups: bruno/Meetups/*
- Bookmarks: bruno/Bookmarks/*
- Requests: bruno/Requests/*
- Storage: bruno/Storage/*
- Users: bruno/Users/*

Error responses
- 400 { error: 'x-user-id header required' }
- 404 { error: 'Not found' }
- 400 { error: '<validation or business rule message>' }

