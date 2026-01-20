# Only-U

## Overview

Only-U is a Japanese creator platform similar to OnlyFans, combining social media feeds, live streaming, and e-commerce functionality. It's a mobile-first Progressive Web App (PWA) that enables creators to share content, go live, sell products, and interact with subscribers through messaging.

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

Admin check is currently email-based (contains "admin") - should be refined for production.

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

## Points System

The platform uses a points-based payment system:
- 1 point = 1 yen (tax excluded)
- Points can be purchased via bank transfer (card payment pending Stripe setup)
- Points are used for all platform services (subscriptions, purchases, tips)

### Point Purchase Flow
1. User selects point package from `/points-purchase` page
2. For bank transfer: System creates a pending transfer request with 7-day deadline
3. Admin confirms transfer at `/admin` → points are credited to user
4. For card payment: Requires Stripe integration (not yet configured)

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

### Pending Integrations
- **Stripe**: Card payment integration dismissed by user. To enable card payments later, set up Stripe integration through Replit's integration system or provide STRIPE_SECRET_KEY manually.
- **Twilio**: SMS verification for creator applications (currently accepts demo codes)