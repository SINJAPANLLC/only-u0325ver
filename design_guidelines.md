# Only-U Design Guidelines

## Design Approach
**Selected Approach**: Hybrid Reference (Instagram feed patterns + OnlyFans monetization UI + Shopify commerce elements)

**Justification**: Content-driven platform requiring seamless integration of social feed, live streaming, and e-commerce. Mobile-first PWA demands touch-optimized, performance-focused design.

---

## Core Design Principles

### Typography
- **Primary Font**: Inter or DM Sans (Google Fonts)
- **Hierarchy**:
  - Headers: 700 weight, 24-32px
  - Body: 400 weight, 14-16px
  - Labels/Meta: 500 weight, 12-14px
  - CTA Buttons: 600 weight, 16px
- **Line Height**: 1.5 for body, 1.2 for headers

### Layout System (Mobile-First PWA)
**Spacing Units**: Tailwind's 2, 4, 6, 8, 12, 16, 20
- **Container**: max-w-screen-xl with px-4 padding
- **Section Padding**: py-8 to py-12
- **Card Spacing**: gap-4 for grids
- **Safe Areas**: pb-20 for bottom navigation clearance

### Visual Hierarchy
- **Cards**: Rounded corners (rounded-2xl), subtle shadows
- **Elevated Elements**: Floating bottom nav, modals use backdrop-blur
- **Borders**: Minimal, 1px when needed
- **Z-Index Strategy**: Fixed nav (z-50), modals (z-40), dropdowns (z-30)

---

## Component Library

### Navigation & Headers
**Fixed Bottom Navigation** (Mobile Primary):
- 5 icons: Home, Live (with pulse indicator), Shop, Messages (badge counter), Account
- Icons: 24px, centered with labels
- Active state: Icon fill + label emphasis

**Top Header**:
- Left: Logo (120px width)
- Right: Language selector, Notifications (badge), Search icon
- Height: 60px, sticky positioning

### Content Feed (Home)
**Video Grid Layout**:
- 2-column grid (grid-cols-2 gap-3)
- Aspect ratio: 9:16 (vertical videos)
- Overlay: Creator avatar, username, view count, duration badge
- Thumbnail: Tap to open video player overlay

### Live Streaming Section
**Live Grid**:
- Featured: Full-width card with "LIVE" pulse badge
- Grid: 2-column for ongoing streams
- Status Indicators: Viewer count, duration, category tags

### E-Commerce (Shop)
**Product Cards**:
- Grid: 2-column with gap-4
- Image: Square aspect (1:1)
- Info: Product name (2 lines max), price (bold), creator avatar
- Badge: "Digital" label for digital products

### Creator/Account Pages
**Profile Header**:
- Cover image area (aspect 3:1)
- Avatar: Circular, -mt-12 overlap
- Stats row: Followers, Following, Posts (horizontal)
- CTA: Subscribe/Follow button (full-width, prominent)

**Content Tabs**:
- Sticky tab bar: Posts, Shop, About
- Swipeable content areas

### Forms & Inputs
**Input Fields**:
- Height: h-12
- Rounded: rounded-xl
- Focus: Ring style for accessibility
- Labels: Floating or top-aligned

**Buttons**:
- Primary: Full-width on mobile, rounded-xl, h-12
- Secondary: Outlined variant
- Icon Buttons: 40x40px tap targets

### Modals & Overlays
**Age Verification Modal**:
- Full-screen overlay
- Centered card with logo
- Date picker + checkbox + CTA

**Video Player**:
- Full-screen immersive
- Controls: Auto-hide after 3s
- Gestures: Double-tap to like, swipe down to close

### Admin Dashboard (Desktop Optimized)
**Sidebar Navigation**: 240px width, fixed left
**Content Area**: Multi-column layouts for tables and metrics
**Data Tables**: Sortable, filterable, with action dropdowns

---

## Special Features

### PWA Specific
- **Install Prompt**: Dismissible banner at top
- **Offline State**: Friendly message with retry button
- **Loading States**: Skeleton screens matching content structure

### Monetization UI
- **Subscription Tiers**: Card-based comparison (3 tiers max)
- **Pricing**: Large, bold numbers with strikethrough for discounts
- **Paywalls**: Blurred content preview with unlock CTA

### Trust & Safety
- **Verification Badges**: Blue checkmark next to verified creators
- **Report Button**: Three-dot menu in all content cards
- **Age Gates**: Consistent across entry points

---

## Animations
**Use Sparingly**:
- Page transitions: Slide in/out (200ms)
- Like animations: Heart scale + fade (300ms)
- Pull-to-refresh: Native feeling bounce
- NO autoplay carousels, NO parallax effects

---

## Images Strategy
**Required Images**:
1. **Logo**: SVG, adaptive for dark/light contexts
2. **Creator Avatars**: Circular, lazy-loaded
3. **Video Thumbnails**: Auto-generated from video
4. **Product Photos**: User-uploaded, optimized via Bunny CDN
5. **Cover Images**: Profile headers (16:9 aspect)

**NO hero images** on main app screens - content IS the hero. Landing page may use single impactful lifestyle image showcasing platform value.

---

## Accessibility
- Touch targets: Minimum 44x44px
- Contrast: WCAG AA minimum
- Focus indicators: Visible on all interactive elements
- Screen reader: Semantic HTML, ARIA labels on icons