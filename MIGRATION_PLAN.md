# Taskero: Swift → React Native Migration Plan

## Overview

Migrate the full Taskero iOS SwiftUI app to React Native (Expo), replicating the exact same UI and backend integration. The React Native project (`taskero-rn`) already has the skeleton — navigation, auth flow, Firebase, and API client. This plan fills in every missing screen, service, and feature.

---

## Backend Integration

Both apps share the same backend at `http://localhost:3000` using Firebase ID tokens as Bearer auth. No backend changes needed.

**Stripe Key:** `pk_test_51S2QxE96eNiSTnRGnD4k3JQFFXAhs9YF7So3s4bPTxY9HRxpXDUm4cKb7GYve2gXKud1wtemgasanxUuAcfx3O6P00HLqd8KIl`

---

## Phase 1 — Foundation & Infrastructure

> Estimated effort: 2–3 days

### 1.1 Package Additions

Install missing packages not yet in `package.json`:

```bash
npx expo install \
  @react-native-google-signin/google-signin \
  expo-apple-authentication \
  react-native-maps \
  expo-image-picker \
  expo-location \
  react-native-reanimated \
  react-native-vector-icons \
  @expo/vector-icons \
  react-native-calendars \
  date-fns \
  react-native-phone-number-input \
  react-native-modal \
  react-native-skeleton-placeholder
```

### 1.2 Expand `apiClient.ts`

Add typed methods matching every endpoint in the Swift `APIService.swift`:

| Method | Endpoint | Used By |
|--------|----------|---------|
| `getTasks(customerId)` | `GET /tasks/customer/:id` | BookingsScreen |
| `getWorkerTasks(taskerId)` | `GET /tasks/tasker/:id` | WorkerJobsScreen |
| `createTask(payload)` | `POST /tasks` | BookingFlow |
| `updateTaskStatus(id, status)` | `PUT /tasks/:id/status` | WorkerJobDetail |
| `submitQuote(id, payload)` | `PUT /tasks/:id/quote` | WorkerJobDetail |
| `respondToQuote(id, accepted)` | `PUT /tasks/:id/quote/respond` | AppointmentDetail |
| `rescheduleTask(id, payload)` | `PATCH /tasks/:id` | AppointmentDetail |
| `getGigs()` | `GET /gigs` | HomeScreen |
| `getGigById(id)` | `GET /gigs/:id` | ServiceDetailScreen |
| `getGigsByCategory(cat)` | `GET /gigs/category/:cat` | CategoryServicesScreen |
| `getWorkerGigs(taskerId)` | `GET /gigs/tasker/:id` | WorkerServicesScreen |
| `createGig(payload)` | `POST /gigs` | AddEditServiceScreen |
| `updateGig(id, payload)` | `PUT /gigs/:id` | AddEditServiceScreen |
| `deleteGig(id)` | `DELETE /gigs/:id` | WorkerServicesScreen |
| `getTaskerReviews(id)` | `GET /review/tasker/:id` | ServiceDetailScreen |
| `getGigReviews(id)` | `GET /review/gig/:id` | GigReviewsScreen |
| `createReview(payload)` | `POST /review` | AddReviewScreen |
| `getChatThreads(userId)` | `GET /chat/threads/:userId` | MessagesScreen |
| `getChatMessages(threadId)` | `GET /chat/messages/:threadId` | ChatScreen |
| `sendMessage(payload)` | `POST /chat/messages` | ChatScreen |
| `createThread(payload)` | `POST /chat/thread` | ServiceDetailScreen |
| `getSchedule(taskerId)` | `GET /taskers/:id/schedule` | WorkerScheduleScreen |
| `updateSchedule(id, payload)` | `PUT /taskers/:id/schedule` | WorkerScheduleScreen |
| `getAvailableSlots(id, date)` | `GET /taskers/:id/available-slots` | BookingFlow |
| `createPaymentIntent(payload)` | `POST /payments/create-intent` | BookingFlow |
| `recordPayment(payload)` | `POST /payments/record` | BookingFlow |
| `getTaskPayments(taskId)` | `GET /payments/task/:id` | AppointmentDetail |
| `getWorkerPayments(taskerId)` | `GET /payments/tasker/:id` | WorkerEarningsScreen |
| `searchGigs(query)` | `GET /search/gigs/search?q=` | HomeScreen |
| `registerFCMToken(payload)` | `POST /notifications/register-token` | App startup |
| `getNotifications(userId)` | `GET /notifications/:userId` | NotificationsScreen |
| `markNotificationRead(id)` | `PUT /notifications/:id/read` | NotificationsScreen |

### 1.3 TypeScript Models (`src/types/`)

Create `src/types/index.ts` with all shared types:

```ts
// Match Swift APIService models exactly
export type APITask, Gig, TaskerScheduleEntry, AvailableSlotsResponse,
  Review, ChatThread, APIChatMessage, Payment, APINotification,
  APIUser, WorkerEarning, ServiceType (enum), BookingStatus (enum)
```

### 1.4 Theme System (`src/theme/`)

- `colors.ts` — already exists, expand with all app colors from Swift
- `typography.ts` — font sizes, weights, line heights
- `spacing.ts` — padding/margin scale
- `shadows.ts` — iOS-style shadow presets

### 1.5 Address Search Service

Replace Mapbox with Google Places (already in dependencies):

```ts
// src/services/addressService.ts
// Debounced autocomplete using react-native-google-places-autocomplete
// Returns { placeId, description, lat, lng }
```

---

## Phase 2 — Authentication & Onboarding

> Estimated effort: 1–2 days

### Screens to Complete/Fix

| Screen | File | Status | Notes |
|--------|------|--------|-------|
| OnboardingScreen | `src/screens/OnboardingScreen.tsx` | Skeleton | Add paged intro slides with app branding |
| AuthScreen | `src/screens/AuthScreen.tsx` | Skeleton | Full email/phone/Google/Apple login |
| OTPVerificationScreen | `src/screens/OTPVerificationScreen.tsx` | Missing | New — Firebase phone OTP flow |
| CreateAccountScreen | `src/screens/CreateAccountScreen.tsx` | Skeleton | Full form: name, phone, role picker |

### Auth Features

- **Email/Password** — Firebase `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`
- **Phone OTP** — Firebase `PhoneAuthProvider` + `expo-firebase-recaptcha` (already in deps)
- **Google Sign-In** — `@react-native-google-signin/google-signin`
- **Apple Sign-In** — `expo-apple-authentication` (iOS only, hide on Android)
- **Post-auth** — call `createUser` or `getUserByFirebaseUid`, store in authStore
- **Role selection** — "I need help" (customer) vs "I want to work" (worker) on CreateAccountScreen

---

## Phase 3 — Customer Flow

> Estimated effort: 5–7 days

### 3.1 Home Screen (`src/screens/HomeScreen.tsx`)

**UI Elements (match Swift `HomeView`):**
- Location picker bar at top (city/address display, tap to change)
- Search bar → navigates to search results
- Category icon grid (11 categories with icons)
- "Near You" horizontal scroll list of gig cards
- Gig card: image, title, worker name, rating, price

**Backend calls:**
- `getGigs()` on mount
- `searchGigs(query)` on search input

### 3.2 Categories Screen (`src/screens/CategoriesScreen.tsx`)

- Grid of all 11 service categories with icon + label
- Tap → `CategoryServicesScreen` with category filter

### 3.3 Category Services Screen (`src/screens/CategoryServicesScreen.tsx`) — NEW

- Header with category name
- Filtered gig list cards
- Calls `getGigsByCategory(category)`

### 3.4 Service Detail Screen (`src/screens/ServiceDetailScreen.tsx`) — NEW

**Matches Swift `ServiceDetailView`:**
- Hero image carousel (gallery)
- Service title, category badge
- Worker info: avatar, name, rating, review count
- Description text
- Price display (base price)
- "Reviews" section (first 3, "See all" link)
- "Book Now" button → BookingFlow
- "Message" button → creates chat thread → ChatScreen

**Backend calls:** `getGigById`, `getGigReviews`, `createThread`

### 3.5 Gig Reviews Screen (`src/screens/GigReviewsScreen.tsx`) — NEW

- Full list of reviews for a gig
- Star rating display, review text, reviewer name, date
- Calls `getGigReviews(gigId)`

### 3.6 Bookings Screen (`src/screens/BookingsScreen.tsx`)

**Matches Swift `BookingsView`:**
- Tab switcher: Active | Past
- Booking cards with status badge, service name, worker name, date/time, price
- Tap → `AppointmentDetailScreen`
- Status badges: Pending / Review Quote / Upcoming / Ongoing / Completed / Cancelled

**Backend calls:** `getTasks(customerId)`

### 3.7 Appointment Detail Screen (`src/screens/bookings/AppointmentDetailScreen.tsx`) — NEW

**Matches Swift `AppointmentDetailView`:**
- Service info header
- Worker info with avatar
- Status timeline
- Date/time/location details
- If status = "Quoted": show quote amount + Accept/Decline buttons
- Payment info section
- "Reschedule" button (if upcoming)
- "Message Worker" button

**Backend calls:** `respondToQuote`, `rescheduleTask`, `getTaskPayments`

### 3.8 Messages Screen (`src/screens/MessagesScreen.tsx`)

- List of chat threads with last message preview
- Unread indicator
- Calls `getChatThreads(userId)`

### 3.9 Chat Screen (`src/screens/ChatScreen.tsx`) — NEW

- Standard chat bubble UI (sent right, received left)
- Text input + send button
- Calls `getChatMessages(threadId)`, `sendMessage`
- Poll for new messages every 3s (or WebSocket if backend supports it)

### 3.10 Profile Screen (`src/screens/ProfileScreen.tsx`)

**Matches Swift `ProfileView`:**
- Avatar + name + email
- Menu list:
  - Edit Profile → `EditProfileScreen`
  - Payment Methods → `ClientPaymentMethodsScreen`
  - My Reviews → `ReviewsScreen`
  - Notifications → `ClientNotificationsScreen`
  - Help Center → `HelpCenterScreen`
  - Privacy Policy → `PrivacyPolicyScreen`
  - Sign Out

### 3.11 Edit Profile Screen (`src/screens/EditProfileScreen.tsx`) — NEW

- Editable fields: name, phone, address
- Avatar picker (`expo-image-picker`)
- Save → `updateUser(payload)`

### 3.12 Client Payment Methods Screen — NEW

- List Stripe saved cards
- Add card via Stripe SDK
- Default card selector

### 3.13 Reviews Screen (`src/screens/ReviewsScreen.tsx`) — NEW

- List of reviews the customer has left
- Calls `getTaskerReviews(userId)` (reviews by this customer)

### 3.14 Add Review Screen (`src/screens/AddReviewScreen.tsx`) — NEW

- Star rating selector (1–5)
- Text input for review body
- Submit → `createReview(payload)`

### 3.15 Notifications Screen (`src/screens/ClientNotificationsScreen.tsx`) — NEW

- List of in-app notifications
- Unread/read state
- Tap → mark as read (`markNotificationRead`)
- Calls `getNotifications(userId)`

---

## Phase 4 — Booking Flow

> Estimated effort: 3–4 days

The booking flow is a multi-step wizard. Each step is a screen in a Stack navigator.

### Navigator: `BookingFlowStack`

```
GigBookingScreen (entry)
  → LocationSelectionScreen
  → DateTimeSelectionScreen (calls getAvailableSlots)
  → ServiceSpecificBookingScreen (conditional per category)
  → ReviewSummaryScreen
  → PaymentMethodsScreen (Stripe)
  → PaymentSuccessScreen
```

### Step 1 — `GigBookingScreen`

- Shows gig summary (image, title, price)
- Notes/special instructions input
- "Continue" → LocationSelectionScreen

### Step 2 — `LocationSelectionScreen`

- Google Places autocomplete input
- Map preview of selected location
- Confirm button

### Step 3 — `DateTimeSelectionScreen`

- Calendar date picker (`react-native-calendars`)
- After date selected: fetch `getAvailableSlots(taskerId, date)`
- Show available time slots as selectable chips

### Step 4 — Service-Specific Booking Screens

Create 10 screens in `src/screens/BookingFlow/`, one per service category. Each collects service-specific inputs:

| Screen | Category | Extra Fields |
|--------|----------|--------------|
| CleaningBookingScreen | Cleaning | Home size (sqft), # bedrooms, # bathrooms, cleaning type |
| PlumbingBookingScreen | Plumbing | Issue type, urgency level |
| LaundryBookingScreen | Laundry | # loads, pickup/dropoff |
| PaintingBookingScreen | Painting | Room count, surface area, paint supplied? |
| ElectricianBookingScreen | Electrician | Issue description, # fixtures |
| CarpentryBookingScreen | Carpentry | Job type, material preference |
| AssemblyBookingScreen | Assembly | Item type, # items |
| GardeningBookingScreen | Gardening | Garden size, job type |
| MovingBookingScreen | Moving | # rooms, distance, floor level |
| RepairBookingScreen | Repairing | Item type, description |

### Step 5 — `ReviewSummaryScreen`

- Summary of all booking details
- Total price estimate
- "Confirm & Pay" → PaymentMethodsScreen

### Step 6 — `PaymentMethodsScreen`

- Stripe card picker or add new card
- `createPaymentIntent` → confirm with Stripe SDK
- On success → `recordPayment` → `createTask` → PaymentSuccessScreen

### Step 7 — `PaymentSuccessScreen`

- Confirmation animation
- Task ID / booking reference
- "View Booking" button → BookingsScreen

---

## Phase 5 — Worker Flow

> Estimated effort: 4–5 days

### 5.1 Worker Dashboard Screen (`src/screens/worker/WorkerDashboardScreen.tsx`)

**Matches Swift `WorkerDashboardView`:**
- Greeting + today's date
- Stats cards: Active Jobs, Pending Requests, This Month Earnings
- "Active Jobs" section — list of in-progress tasks
- Quick actions: View Jobs, Manage Schedule

**Backend calls:** `getWorkerTasks`, `getWorkerPayments`

### 5.2 Worker Jobs Screen (`src/screens/worker/WorkerJobsScreen.tsx`)

**Matches Swift `WorkerJobsView`:**
- Tab filter: Pending | Active | Completed
- Job cards: customer name, service, date, status badge
- Tap → `WorkerJobDetailScreen`

**Backend calls:** `getWorkerTasks(taskerId)`

### 5.3 Worker Job Detail Screen (`src/screens/worker/WorkerJobDetailScreen.tsx`) — NEW

**Matches Swift `WorkerJobDetailView`:**
- Customer info + service details
- Location display
- Status actions:
  - If Pending: "Send Quote" form (price input) + "Decline" button
  - If Accepted: "Start Job" button
  - If In Progress: "Mark Complete" button
- Attachments / photos (if any)
- "Message Customer" button

**Backend calls:** `submitQuote`, `updateTaskStatus`

### 5.4 Worker Schedule Screen (`src/screens/worker/WorkerScheduleScreen.tsx`)

**Matches Swift `WorkerScheduleView`:**
- Week view calendar
- Toggle availability per day
- Time slot picker (start/end time per day)
- Save → `updateSchedule`

**Backend calls:** `getSchedule`, `updateSchedule`

### 5.5 Worker Messages Screen (`src/screens/worker/WorkerMessagesScreen.tsx`)

- Same as customer MessagesScreen but filtered to worker's threads
- Calls `getChatThreads(userId)`
- Tap → `ChatScreen` (reused component)

### 5.6 Worker Profile Screen (`src/screens/worker/WorkerProfileScreen.tsx`)

**Matches Swift `WorkerProfileView`:**
- Avatar, name, rating, review count
- Menu:
  - My Services → `WorkerServicesScreen`
  - Earnings → `WorkerEarningsScreen`
  - Reviews → `WorkerReviewsScreen`
  - Edit Profile → `WorkerEditProfileScreen`
  - Availability → `TaskerAvailabilityScreen`
  - Notifications → `WorkerNotificationsScreen`
  - Settings → `WorkerSettingsScreen`
  - Sign Out

### 5.7 Worker Services Screen (`src/screens/worker/WorkerServicesScreen.tsx`) — NEW

- List of the worker's gigs
- Status toggle (active/paused)
- "Add New Service" button
- Swipe to delete

**Backend calls:** `getWorkerGigs`, `updateGig` (status), `deleteGig`

### 5.8 Add/Edit Service Screen (`src/screens/worker/AddEditServiceScreen.tsx`) — NEW

**Matches Swift `AddEditServiceView`:**
- Title input
- Category picker (11 options)
- Description textarea
- Base price input
- Service area: map + radius slider
- Photo upload (up to 5 images)
- Active/inactive toggle
- Save → `createGig` or `updateGig`

### 5.9 Worker Earnings Screen (`src/screens/worker/WorkerEarningsScreen.tsx`) — NEW

**Matches Swift `WorkerEarningsView`:**
- Total earnings summary card
- Monthly chart (bar chart)
- Payment history list

**Backend calls:** `getWorkerPayments(taskerId)`

### 5.10 Worker Reviews Screen (`src/screens/worker/WorkerReviewsScreen.tsx`) — NEW

- List of reviews received by this worker
- Average rating display
- Calls `getTaskerReviews(taskerId)`

### 5.11 Tasker Availability Screen (`src/screens/worker/TaskerAvailabilityScreen.tsx`) — NEW

- Set recurring weekly working hours
- Day-of-week toggles + time range pickers

### 5.12 Service Area Picker Screen (`src/screens/worker/ServiceAreaPickerScreen.tsx`) — NEW

- Map centered on worker's location
- Draggable radius circle overlay
- Radius slider (1–50 km)
- Save → updates gig service_area

### 5.13 Worker Edit Profile Screen (`src/screens/worker/WorkerEditProfileScreen.tsx`) — NEW

- Same as customer edit profile
- Additionally: bio, skill tags, certifications

### 5.14 Worker Notifications Screen — NEW

- Same component as customer notifications but for worker userId

### 5.15 Worker Settings Screen (`src/screens/worker/WorkerSettingsScreen.tsx`) — NEW

- Push notification preferences
- Security settings link
- App version info

---

## Phase 6 — Shared/Utility Screens

> Estimated effort: 1 day

| Screen | Notes |
|--------|-------|
| `HelpCenterScreen` | Static FAQ list |
| `PrivacyPolicyScreen` | WebView with privacy policy URL |
| `SecuritySettingsScreen` | Change password (Firebase `updatePassword`) |
| `GalleryScreen` | Full-screen image viewer for service photos |
| `LoadingScreen` | Already exists — polish animation |

---

## Phase 7 — Shared Components

> Estimated effort: 2–3 days

Create a `src/components/` library to avoid duplication:

```
src/components/
├── common/
│   ├── Button.tsx            # Primary, secondary, outline variants
│   ├── Input.tsx             # Text input with label + error state
│   ├── Avatar.tsx            # Circular image with fallback initials
│   ├── Badge.tsx             # Status badge (colored pill)
│   ├── Card.tsx              # Rounded shadow container
│   ├── Divider.tsx           # Horizontal separator
│   ├── LoadingSpinner.tsx    # Activity indicator wrapper
│   ├── EmptyState.tsx        # Empty list illustration + message
│   ├── ErrorState.tsx        # Error + retry button
│   └── SkeletonLoader.tsx    # Loading skeleton rows
├── gigs/
│   ├── GigCard.tsx           # Horizontal gig card (image, title, rating, price)
│   ├── GigListItem.tsx       # List row variant
│   └── StarRating.tsx        # Star display + interactive input
├── bookings/
│   ├── BookingCard.tsx       # Booking list item with status badge
│   └── StatusTimeline.tsx    # Vertical status progress
├── chat/
│   ├── MessageBubble.tsx     # Chat message bubble
│   └── ThreadListItem.tsx    # Chat thread preview row
├── worker/
│   ├── WorkerJobCard.tsx     # Job card for worker job list
│   └── EarningsCard.tsx      # Earnings summary card
└── navigation/
    └── TabBarIcon.tsx        # Custom tab bar icon component
```

---

## Phase 8 — Navigation Updates

> Estimated effort: 1 day

Add all new screens to their respective stacks/tabs:

### Customer Stack additions

```ts
// src/navigation/stacks/CustomerStack.tsx (new)
CategoryServicesScreen
ServiceDetailScreen
GigReviewsScreen
AppointmentDetailScreen
ChatScreen
EditProfileScreen
AddReviewScreen
ClientNotificationsScreen
ClientPaymentMethodsScreen
ReviewsScreen
HelpCenterScreen
PrivacyPolicyScreen
SecuritySettingsScreen
GalleryScreen
BookingFlowStack (nested)
```

### Worker Stack additions

```ts
// src/navigation/stacks/WorkerStack.tsx (new)
WorkerJobDetailScreen
WorkerServicesScreen
AddEditServiceScreen
WorkerEarningsScreen
WorkerReviewsScreen
TaskerAvailabilityScreen
ServiceAreaPickerScreen
WorkerEditProfileScreen
WorkerNotificationsScreen
WorkerSettingsScreen
ChatScreen (shared)
```

### OTP Screen

Add `OTPVerificationScreen` to `AuthStack`

---

## Phase 9 — Push Notifications

> Estimated effort: 1 day

- Use `expo-notifications` for FCM token retrieval
- On app startup (post-auth): `registerFCMToken({ userId, token, platform })`
- Handle foreground notification display
- Deep link from notification to correct screen (booking detail, chat)

---

## Phase 10 — Polish & QA

> Estimated effort: 2–3 days

- [ ] Match Swift color palette exactly (extract hex values from Assets.xcassets)
- [ ] Match Swift typography (SF Pro → System font on RN)
- [ ] Match Swift spacing and corner radius values
- [ ] Add loading skeletons to all list screens
- [ ] Add pull-to-refresh to all list screens
- [ ] Add empty states to all list screens
- [ ] Error handling and retry on all API calls
- [ ] Form validation on all input screens
- [ ] Keyboard avoiding behavior on all forms
- [ ] Image upload with progress indicator
- [ ] Test on both iOS and Android
- [ ] Test all 11 booking flow category paths
- [ ] Test worker quote → customer accept → payment flow end-to-end

---

## File Count Summary

| Category | New Files | Update Existing |
|----------|-----------|-----------------|
| Types/Models | 1 | 0 |
| Services/API | 3 | 1 (apiClient.ts) |
| Theme | 3 | 1 (colors.ts) |
| Customer Screens | 12 | 5 |
| Booking Flow Screens | 17 | 0 |
| Worker Screens | 13 | 4 |
| Shared Screens | 4 | 1 |
| Components | ~20 | 0 |
| Navigation | 3 | 3 |
| **Total** | **~76** | **~15** |

---

## Recommended Build Order

```
Phase 1  →  Phase 2  →  Phase 7 (components)  →  Phase 3  →  Phase 4  →  Phase 5  →  Phase 6  →  Phase 8  →  Phase 9  →  Phase 10
```

Build shared components (Phase 7) before screens so every screen can use them from the start.

---

## Environment Variables Checklist

Ensure `.env` has all of these before starting:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_IOS_BUNDLE_ID=
EXPO_PUBLIC_FIREBASE_ANDROID_PACKAGE_NAME=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S2QxE96eNiSTnRGnD4k3JQFFXAhs9YF7So3s4bPTxY9HRxpXDUm4cKb7GYve2gXKud1wtemgasanxUuAcfx3O6P00HLqd8KIl
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=   # (optional, using Google Places instead)
```
