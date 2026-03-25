# Only-U

## Overview

Only-U is a Japanese creator platform PWA, similar to OnlyFans, designed for content creators. It integrates social media feeds, live streaming, and e-commerce functionalities, allowing creators to share video content, conduct live broadcasts, sell digital and physical products, and interact with subscribers through direct messaging. The platform supports multi-language capabilities (Japanese, English, Chinese, Korean) and offers both mobile-first and desktop interfaces.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with shadcn/ui components (New York style)
- **Animations**: Framer Motion
- **Build Tool**: Vite
- **Design**: Mobile-first with a fixed bottom navigation; desktop uses sidebar navigation.

### Backend
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth (OpenID Connect) via Passport.js
- **Session Management**: PostgreSQL-backed sessions
- **API**: RESTful, `/api/*` prefix.

### Data Storage
- **Primary Database**: PostgreSQL
- **Schema**: Defined in `shared/schema.ts`, includes tables for users, content, products, subscriptions, and more.

### Key Features
- **Creator Application System**: Users apply to become creators, requiring admin approval. Approved creators gain access to specific features.
- **Admin System**: Separate admin authentication and interface for platform management, including creator application review, point adjustments, and content moderation.
- **Points System**: In-app currency (1 point = 1 yen) for all platform transactions, purchasable via bank transfer or card (Stripe integration pending).
- **Subscription System**: Supports multi-plan, auto-renewing subscriptions with user-controlled cancellation options.
- **E-commerce System**: Handles digital products (with `contentUrl` access) and physical products (with shipping management for creators).
- **Video Content (VOD)**: Integrated with Bunny.net Stream for video hosting and HLS streaming.
- **Live Streaming**: Utilizes LiveKit for low-latency, browser-based live broadcasts, mirroring platforms like TikTok Live.
- **AI Content Moderation**: Uses OpenAI's Vision API (GPT-4o) to asynchronously analyze uploaded content for violations, notifying admins for review.
- **Marketing System**: Admin marketing tab with AI-powered SNS post generation, SEO column article management (published at `/column`), and HTML email template editor with bulk sending capability.
- **Column/Blog**: Public SEO column pages at `/column` (list) and `/column/:slug` (detail), managed from admin marketing tab.
- **Contact Inquiries**: `contactInquiries` table stores user contact form submissions, viewable and manageable from admin dashboard inquiries tab.
- **Automated Email Templates**: DB-managed automated email templates (`type:"automated"`) seeded at startup; CRUD via admin marketing tab.

## External Dependencies

### Third-Party Services
- **Replit Auth**: OpenID Connect provider for user authentication.
- **PostgreSQL**: Primary database.
- **SMTP (Hostinger)**: Email sending.
- **Bunny.net Stream**: Video hosting and CDN for VOD.
- **LiveKit**: WebRTC-based live streaming platform (self-hosted or cloud).
- **OpenAI (GPT-4o)**: AI for content moderation.

### Key NPM Packages
- `drizzle-orm`, `drizzle-kit`: Database ORM.
- `@tanstack/react-query`: Server state management.
- `framer-motion`: Animations.
- `passport`, `openid-client`: Authentication.
- `express-session`, `connect-pg-simple`: Session management.
- `shadcn/ui`: UI components.
- `livekit-server-sdk`, `livekit-client`: Live streaming.

### Environment Variables
- `DATABASE_URL`, `SESSION_SECRET`
- `ISSUER_URL`, `REPL_ID` (for Replit Auth)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `VITE_LIVEKIT_URL`
- `BUNNY_LIBRARY_ID`, `BUNNY_API_KEY`, `BUNNY_CDN_HOSTNAME`, `BUNNY_STORAGE_API_KEY`, `BUNNY_STORAGE_ZONE_NAME`, `BUNNY_STORAGE_HOST`, `BUNNY_STORAGE_CDN_URL`, `VITE_BUNNY_CDN_HOSTNAME`