# Only-U

## Overview

Only-U is a Japanese creator platform similar to OnlyFans, combining social media feeds, live streaming, and e-commerce functionality. It's a Progressive Web App (PWA) that enables creators to share content, go live, sell products, and interact with subscribers through messaging. The app supports both mobile (phone frame UI) and desktop (sidebar navigation with full-width layout).

The platform supports:
- Video content sharing (free and premium tiers)
- Live streaming with real-time viewer counts
- Digital and physical product sales
- Direct messaging between creators and fans
- Creator profiles with follower/subscription systems
- Multi-language support (Japanese, English, Chinese, Korean)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui components (New York style)
- **Animations**: Framer Motion for UI transitions
- **Build Tool**: Vite with hot module replacement

The frontend follows a mobile-first design with a fixed bottom navigation pattern. Key pages include Home (video feed), Live (streaming), Shop (e-commerce), Messages, and Account.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple

API routes follow RESTful conventions under `/api/*` prefix. The server handles both API requests and serves the built static frontend in production.

### Data Storage
- **Primary Database**: PostgreSQL
- **Schema Location**: `shared/schema.ts` - contains all table definitions
- **Key Tables**: users, sessions, videos, liveStreams, products, creatorProfiles, conversations, messages, notifications, follows, subscriptions, userProfiles, creatorApplications

Content types use PostgreSQL enums for type safety (user_role, content_type, live_status, product_type, message_status, application_status).

### Creator Application System
Users must apply to become creators and be approved by an admin:
1. User submits application with portfolio URL, experience, and reason
2. Admin reviews applications at `/admin` page
3. Approved users get a creatorProfile entry created automatically
4. Only approved creators can access creator features (live streaming, content management)

### Admin System
The platform has a separate admin authentication system:
- **Admin Routes**: `/admin/login` (login page), `/admin/dashboard` (management interface)
- **Authentication**: Session-based with bcrypt password hashing, separate from regular user auth
- **Admin Credentials**: Seeded on startup (info@sinjapan.jp)
- **Features**: 
  - Dashboard with platform statistics
  - Creator application review (approve/reject)
  - Bank transfer confirmation (point crediting)
  - User management with point adjustment
- **Security**: Session regeneration on login, admin session isolated from user session

### Authentication Flow
Uses Replit's OpenID Connect authentication. Sessions are stored in PostgreSQL with a 1-week TTL. The `isAuthenticated` middleware protects private routes. User data is upserted on login via the auth storage layer.

### Build System
- Development: Vite dev server with HMR proxied through Express
- Production: Vite builds static assets, esbuild bundles server code to CommonJS
- Database migrations: Drizzle Kit with `db:push` command

## External Dependencies

### Third-Party Services
- **Replit Auth**: OpenID Connect authentication provider
- **PostgreSQL**: Primary database (provisioned via Replit)
- **SMTP (Hostinger)**: Email sending for contact form submissions

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Server state management
- `framer-motion`: Animation library
- `passport` / `openid-client`: Authentication
- `express-session` / `connect-pg-simple`: Session management
- `shadcn/ui` components: Radix UI primitives with Tailwind styling

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `ISSUER_URL`: OpenID Connect issuer (defaults to Replit)
- `REPL_ID`: Replit environment identifier
- `SMTP_HOST`: SMTP server host (smtp.hostinger.com)
- `SMTP_PORT`: SMTP server port (465)
- `SMTP_USER`: SMTP username (email address)
- `SMTP_PASS`: SMTP password

## Points System

The platform uses a points-based payment system:
- 1 point = 1 yen (tax excluded)
- Points can be purchased via bank transfer or card payment (Stripe)
- Points are used for all platform services (subscriptions, purchases, tips)

### Point Purchase Flow
1. User selects point package from `/points-purchase` page
2. For bank transfer: System creates a pending transfer request with 7-day deadline
3. Admin confirms transfer at `/admin` → points are credited to user
4. For card payment: Requires Stripe integration (not yet configured)

## Subscription System

### Multi-Plan Subscriptions
Users can subscribe to multiple plans from the same creator simultaneously. Each plan has its own tier and pricing.

### Auto-Renewal
- Subscriptions auto-renew by default when they expire
- System checks hourly for expired subscriptions with auto-renew enabled
- If user has sufficient points, subscription is extended by 30 days automatically
- If insufficient points, subscription is marked as expired and user is notified

### Cancellation Flow
- Users can disable auto-renewal from the creator profile page
- Disabling auto-renewal does NOT immediately cancel - user can still view content until expiry
- UI shows "自動更新停止中" badge and expiry date for cancelled subscriptions

### API Endpoints
- `GET /api/subscription/:creatorId` - Get subscription status including autoRenew and expiresAt
- `POST /api/subscription/:creatorId` - Subscribe to a plan
- `DELETE /api/subscription/:creatorId/:planId` - Disable auto-renewal for specific plan

## E-commerce System

### Product Types
- **Digital Products**: Include a `contentUrl` field for download links or external content access. Purchasers can view this URL from `/my-purchases` page.
- **Physical Products**: Require shipping information during purchase. Stock management auto-decrements and hides sold-out items.

### Purchase Flow
- Digital: User purchases → instant access to `contentUrl` via my-purchases page
- Physical: User enters shipping info → order created with "pending" status → creator manages shipping via `/creator-orders`

### Order Management (Creators)
- `/creator-orders`: View all orders with buyer shipping details
- Status updates: pending → shipped → completed
- Shipping info displayed: name, postal code, address, phone

### Key Pages
- `/my-purchases`: User's purchase history with digital content access
- `/creator-orders`: Creator's order management for physical products

### Bunny Stream Integration (実装済み)

#### VOD（動画アップロード）
- **Service**: Bunny.net Stream CDN for video hosting
- **Home page**: `bunnyVideoId` フィールドがあればHLS (.m3u8) ストリームで自動再生
- **Player**: hls.js でHLS再生 (Safariはネイティブ対応)
- **API Routes**:
  - `GET /api/bunny/status` - Bunny設定状態確認
  - `POST /api/bunny/create-video` - Bunny上にビデオを作成してTUSアップロードURLを返す
  - `GET /api/bunny/video/:bunnyVideoId/status` - ビデオエンコード状態確認
  - `PATCH /api/videos/:videoId/bunny` - ビデオにbunnyVideoIdを紐付け

#### ライブ配信（Bunny Stream Channel方式）
- **仕組み**: Bunny APIはライブチャンネルの動的作成をサポートしないため、管理者がBunnyダッシュボードで手動作成したチャンネルを登録するプール方式を採用
- **フロー**:
  1. 管理者が Bunnyダッシュボードでライブチャンネルを作成し、Stream KeyとStream IDをコピー
  2. 管理画面「Bunny Stream」タブからチャンネルを登録
  3. クリエイターがライブ開始時に空きチャンネルが自動割り当て
  4. クリエイター側: WHIP (`https://video.bunnycdn.com/live/{LIBRARY_ID}/{STREAM_KEY}/whip`) でブロードキャスト
  5. 視聴者側: HLS (`https://{CDN_HOSTNAME}/{STREAM_ID}/playlist.m3u8`) で視聴
  6. 配信終了時にチャンネルはプールに返却（再利用可能）
- **Admin Routes**:
  - `GET /api/admin/bunny-channels` - チャンネル一覧
  - `POST /api/admin/bunny-channels` - チャンネル登録 (name, streamKey, streamId)
  - `DELETE /api/admin/bunny-channels/:id` - チャンネル削除
- **Schema**: `bunnyStreamChannels` テーブル (streamKey, streamId, whipUrl, playbackUrl, isAvailable, currentLiveStreamId)
- **自動登録**: `BUNNY_STREAM_KEY`/`BUNNY_STREAM_ID` 環境変数（または番号付き `BUNNY_STREAM_KEY_1`/`BUNNY_STREAM_ID_1` など）が設定されていれば起動時に自動登録
- **Required Env Vars**:
  - `BUNNY_LIBRARY_ID` - ビデオライブラリID (設定済み: 623903)
  - `BUNNY_CDN_HOSTNAME` - CDNホスト名 (設定済み: vz-edb8f34c-88a.b-cdn.net)
  - `VITE_BUNNY_CDN_HOSTNAME` - フロントエンド用CDNホスト名 (同じ値)
  - `BUNNY_STREAM_KEY` - (オプション) デフォルトライブチャンネルのStream Key
  - `BUNNY_STREAM_ID` - (オプション) デフォルトライブチャンネルのStream ID

### Pending Integrations
- **Stripe**: Card payment integration dismissed by user. To enable card payments later, set up Stripe integration through Replit's integration system or provide STRIPE_SECRET_KEY manually.
- **Twilio**: SMS verification for creator applications (currently accepts demo codes)

## AI Content Moderation

The platform uses AI-powered content moderation to detect potentially violating content automatically.

### How It Works
1. When a creator uploads a video or starts a live stream, the system analyzes the thumbnail asynchronously using OpenAI's Vision API (GPT-4o)
2. The AI checks for violations including:
   - Uncensored content (illegal in Japan)
   - Child abuse/pornography
   - Violence/gore
   - Illegal drugs
   - Personal information exposure
3. If potential violations are detected, an admin notification is created with severity level (low/medium/high)
4. Moderation runs asynchronously so it doesn't block the user's upload

### Admin Interface
- **Location**: Admin Dashboard → AI審査 tab
- **Features**:
  - View all moderation alerts with severity badges
  - Unread alert count shown in sidebar
  - Take action: Approve (mark as safe), Reject (mark as violation), or Delete (remove content)
  - Filter shows only content_moderation type alerts

### Database Tables
- `adminNotifications`: Stores moderation alerts with type="content_moderation", contentType (video/live/product), contentId, creatorId, severity, actionTaken

### API Endpoints
- `GET /api/admin/moderation` - Get all moderation alerts (filtered by type=content_moderation)
- `GET /api/admin/moderation/unread-count` - Get unread alert count
- `PATCH /api/admin/moderation/:id/action` - Take action (approved/rejected/deleted)

### Service Location
- `server/services/content-moderation.ts` - Contains moderateImage(), moderateText(), and createModerationNotification() functions

### Cost
- Uses Replit AI Integrations (AI_INTEGRATIONS_OPENAI_API_KEY)
- Charges are billed to the user's Replit credits