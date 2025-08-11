# **Malluland – Detailed Product Specification**
## **Table of Contents**
1. Onboarding
2. Awaiting Review
3. People Tab
4. Create a Meetup
5. Meetups Tab
6. Requests Tab
7. Chats Tab
8. Chat Window
9. Bookmarks Tab
10. Menu Tab
11. Push Notifications
12. User States
13. Pagination Rules
14. Character Limits
15. Avatar Change Logic
* * *
## **1\. User States**
*   **Applicant** → Pending review.
*   **Approved Member** → Those who are approved from the backend.
    *   **1\. Free approved member**
    *   **2\. Paid approved member**
*   **Disapproved Applicant** → Can edit application or deleted and reapply.
*   **Deactivated Member** → Hidden from others in People tab and Meetups tab until reactivated. Will continue to be visible in other's Requests tab, Chats tab, and Chat window.
*   **Banned Member** → Cannot re-register with same email.
*   **Shadow Banned Member** → Hidden from others in People tab and Meetups tab, but not notified.
*   **Deleted Account** → Can re-register with same email unless banned.

* * *

## **2\. Onboarding**
Onboarding is the initial user registration and profile setup flow. The goal is to collect all necessary profile details while applying our rules and restrictions.
### **Sign-in**
*   Options: **Sign in with Apple** or **Sign in with Google**.
*   Apple sign-in pre-fills **only the Name** field
*   No social media sign-ins other than Apple or Google.
### **Basic Info Screen**
Fields:
*   **Name**: Text input, max length = 50 chars.
*   **Date of Birth**:
    *   User must be at least 18 years old.
    *   DOB picker defaults to earliest date meeting 18+ rule.
    *   Cannot select a past date less than 18 years.
*   **Gender**: Options = Male, Female, Other (single select).
*   **Company Name**: Max 50 chars.
*   **Job Title**: Max 50 chars.
*   **Location**:
    *   Tap to open system permission prompt.
    *   If permission denied → IP-based location is used. Field is hidden in the UI.
### **Avatar Upload**
*   Must crop to a square ratio before upload.
*   Request photo permission; if denied twice, direct to system settings.
*   At least one avatar is required to proceed.
### **Interests**
*   Select exactly **3 activities of interest** from a predefined list.
*   Cannot proceed unless exactly 3 are selected.
### **Traits**
*   Select exactly **3 traits** from a predefined list.
### **Favorites**
*   **Favorite Actors**: 3 minimum, 3 maximum (separate screen).
*   **Favorite Actresses**: 3 minimum, 3 maximum (separate screen).
### **Bio**
*   Max length 500 characters.
### **Social Media Links**
*   Optional: Instagram, Twitter/X, LinkedIn, TikTok (max 50 chars each).
### **Selfie Verification**
*   Request camera permission; if denied twice, direct to system settings.
*   Capture selfie; show preview for retake or continue.
### **Completion**
*   After finishing onboarding → go to **Awaiting Review** page.
* * *
## **3\. Awaiting Review**
The Awaiting Review state applies after a user completes onboarding but before their profile is approved by the backend moderators.
### **Available Actions in Awaiting Review**
User can:
*   Change avatar.
*   Edit basic details (Name, DOB, Gender, Company, Job, Location).
*   Add up to 9 photos in addition to the avatar.
*   Change activities of interest.
*   Change traits.
*   Edit bio.
*   Add/change favorite musicians, movies, games & sports, and dishes.
*   Change social media links.
*   Enable push notifications if disabled.
    *   If disabled → prompt to enable via system settings.
### **Layout**
*   UI is identical to the Menu Tab **except** it does **not** have:
    *   Chat Settings
    *   Invite a Friend
    *   More menu
* * *
## **4\. People Tab**
Displays profiles of **approved active members** only.
### **Rules & Display**
*   **Pagination**: 20 profiles per page.
*   Profiles shown are within a 30km radius.
*   Ordered by most recent approval date/time.
*   Shows a mix of 10 male and 10 female profiles per page.
### **Profile Card**
*   Avatar
*   Name + Age
*   Short Bio snippet (first 100 chars)
### **Profile Details Screen**
Includes:
*   Name, Age
*   Company, Job Title
*   Distance from viewer (km)
*   Social Media links
*   Full Bio
*   Interests & Traits
*   Favorites (actors, actresses, musicians, movies, games/sports, dishes)
*   **Most recent 3 meetups** they hosted or attended
### **Actions from Profile**
*   **Bookmark**:
    *   Max lifetime bookmarks = 7 users.
    *   If user tries to bookmark the 8th → popup to unbookmark someone first.
*   **Block & Report**: Choose 1 of 5 preset reasons. Permanently hides them from People and Meetups tabs of the user who Block & Reported. The blocked and reported user will continue to be visible to other users.
*   **Chat Request**:
    *   Max 3/day for free approved member.
    *   Resets daily at 4:30 AM IST.
    *   Max length = 500 characters.
* * *
## **5\. Create a Meetup**
Meetup creation form includes:
*   **Meetup Name**: 10–35 chars.
*   **Activity**: Choose from curated list.
*   **Guests**: 1–7 (plus host = max 8 attendees).
*   **Who’s Paying**:
    *   One of 6 options.
    *   If “Attendance Fee” selected → choose currency + amount (up to `999999.99`).
*   **Location**: Text field, max 100 chars.
*   **Description**: 35–150 chars.
*   **Start Date/Time**:
    *   Defaults to the next nearest hour (e.g., if now is 12:40 → 1:00).
    *   Cannot be in the past.
*   **End Date/Time**:
    *   Defaults to +1 hour from start time.
    *   Cannot be before start time.
*   **Optional Map URL**: max 500 chars.
* * *
## **6\. Meetups Tab**
*   **Filters**: Upcoming, My Meetups, This Week, This Weekend.
*   Sorting: Soonest start time first.
*   **My Meetups**: Displays meetups created by the user. User can edit or soft-delete.
*   Card shows all creation details + host avatar/name.
*   Tapping on the avatar/name will take the user the host's profile page.
*   “Request to Join” button → send message (max 500 chars).
*   Status: Requested → Attending if approved.
*   Expiry: Meetup is hidden from Upcoming/This Week/This Weekend when **start time** passes (not end time).
*   **Meetup Request**:
    *   Max 3/day for free approved member.
    *   Resets daily at 4:30 AM IST.
    *   Max length = 500 characters.
* * *
## **7\. Requests Tab**
*   **Filters**: All, Meetups, Chats.
*   **Pagination**: 21 per page for each filter.
*   Sorting: Most recent first.
### **Request View**
*   Shows request message at the top.
*   Shows full profile of sender (When viewing past meetups, tapping on the avatar of the host does not direct the user to their profile. ).
*   **Actions**:
    *   Chat request → Accept (becomes chat) or Archive (goes to Archived Chats).
    *   Meetup request → Accept (becomes chat) or Decline (hidden from view).
*   After action, the next request animates into view.
*   If the last request is accepted, declined, or archived, the user is automatically taken back to the Requests tab.
* * *
## **8\. Chats Tab**
*   Lists accepted chat requests and meetup requests.
*   Sort the messages with the most recent unread message first. Each time a new unread message is received, it should surface to the top.
*   Types: One-on-One or Meetup Group Chat.
*   Shows avatar/name or meetup title + host avatar + meetup icon.
*   Shows last chat message or original request if no messages yet.
*   Unread messages indicated with dot + badge count.
*   Archived chats → sending a message moves it back to active chats.
* * *
## **9\. Chat Window**
*   **One-on-One**: Avatar + Name (tap → view profile).
*   **Meetup Chat**: Title, Host Avatar, attendee count/max. (tap → view bottom sheet with View Meetup details, View Members (avatar, name, job title), Remove Participants (host only), Leave Meetup)
### **Features**
*   Messages grouped by Today / Yesterday / This Week / Date.
*   System events: joins, leaves, removed
*   Menu (3 dots): View Meetup details, View Members (avatar, name, job title), Remove Participants (host only), Leave Meetup.
*   Host leaving → Cancels meetup for all, sends notification.
*   Non-host leaving → “X left the meetup” message; meetup continues for others.
*   The host can remove an attendee at any time.
* * *
## **10\. Bookmarks Tab**
*   Lists bookmarked users (20 per page).
*   Actions: Unbookmark or view profile.
*   Limit = 7 bookmarks for free users
* * *
## **11\. Menu Tab**
*   Shows: Avatar, Name, Profile Completion %.
*   Tap avatar → View own profile (no actions; distance = 0.0 km).
*   Has: Chat Settings, Invite a Friend, More.
**Chat Settings**: Filter who can see you (Anyone, Men, Women, Other).
**Invite a Friend**: Opens share sheet with predefined message.
**More Menu**:
*   Terms of Use
*   Privacy Policy
*   Support (with refid: 6-char alphanumeric)
*   Deactivate Account: Hides profile from tabs, shows Reactivate button.
*   Delete Account: Permanently deletes; email reusable unless banned.
*   Log Out
* * *
## **12\. Push Notifications**
Sent when:
1. Profile approved.
2. Chat request received.
3. Meetup request received.
4. Message received in chat.
5. Meetup request you sent is accepted.
6. Chat request you sent is accepted.
7. New avatar added is rejected (approved member only).
* * *
## **13\. Pagination Rules**
*   People: 20/page
*   Meetups: 20/page
*   Bookmarks: 20/page
*   Requests: 21/page
*   Chats: 20/page
*   Archive: 20/page
* * *
## **14\. Character Limits**

| Field | Limit | Notes |
| ---| ---| --- |
| Name | 50 |  |
| Company | 50 |  |
| Job Title | 50 |  |
| Bio | 500 |  |
| Meetup Name | 10–35 |  |
| Meetup Location | 100 |  |
| Meetup Description | 35–150 |  |
| Chat Request Message | 500 |  |
| Chat Message | 2000 |  |
| Request to Join Meetup | 500 |  |
| Social Media Handles | 50 | Each |
| Map URL | 500 |  |

* * *
## **15\. Avatar Change Logic**
**Applicant / Disapproved Applicant:**
*   Upload new avatar → visible to uploader immediately; older versions retained.
*   Public visibility only occurs after approval, until then other users will see old avatar.
*   All photos uploaded as avatars are retained. The most recently uploaded photo will become the new avatar, while the previously uploaded photo will be considered the old avatar. All photos uploaded prior to those will be referred to as past avatars.
**Approved Member:**
*   Upload new avatar → visible to uploader immediately.
*   Others see old avatar until backend approves.
*   If backend rejects → revert to old avatar for uploader + send push notification.

* * *
## 16\. Tab Bar Badge Count Logic
### **1\. Meetups Tab**
*   Displays the **number of Meetups available** in the Meetups tab for Upcoming filter.
*   If the number of Meetups in Upcoming is **greater than 25**, display **"25+"** instead of the exact count.
### **2\. Requests Tab**
*   Displays the **total number of requests** in the **All** filter.
*   If the number of requests is in All is **greater than 25**, display **"25+"** instead of the exact count.
### **3\. Chats Tab**
*   Displays the **number of unread chats** at all times.
*   If the number of unread chats is **greater than 25**, display **"25+"**.
*   **Badge Count Updates:**
    1. **Request Accepted:** When any request (chat or meetup) is accepted, **+1** is added to the Chats tab badge count.
    2. **Unread Chat Read:** When an unread chat is opened and the user returns to the Chats tab, **\-1** is subtracted from the badge count.
    3. **New Message Received:**
        *   If the user is **not in the chat window** for that conversation, the Chats tab badge count is **+1**.
        *   This applies even if the user is in another tab (People, Meetups, Requests, Menu).