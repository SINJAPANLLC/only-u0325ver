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
- **Key Tables**: users, sessions, videos, liveStreams, products, creatorProfiles, conversations, messages, notifications, follows, subscriptions

Content types use PostgreSQL enums for type safety (user_role, content_type, live_status, product_type, message_status).

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