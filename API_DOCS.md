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

Requests
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

Users
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

Examples
All endpoints have sample Bruno requests under the bruno/ directory. For example:
- People: bruno/People/GET people.bru
- Meetups: bruno/Meetups/*
- Bookmarks: bruno/Bookmarks/*
- Requests: bruno/Requests/*
- Users: bruno/Users/*

Error responses
- 400 { error: 'x-user-id header required' }
- 404 { error: 'Not found' }
- 400 { error: '<validation or business rule message>' }

