# Implementation Tasks: VigilHealth Community Platform

## Overview

Implementation tasks for the VigilHealth Community Platform — a hyperlocal health intelligence PWA. Tasks are ordered by dependency and priority: MVP core first, revenue features second, B2B third, and CloudPanel migration prep last.

---

## Phase 1: Project Foundation

- [x] 1. Initialize Next.js 14+ project with TypeScript and App Router
  - [x] 1.1 Scaffold Next.js app with `create-next-app` (TypeScript, App Router, Tailwind CSS)
  - [x] 1.2 Configure `tsconfig.json` with strict mode and path aliases (`@/`)
  - [x] 1.3 Install and configure ESLint, Prettier, and Husky pre-commit hooks
  - [x] 1.4 Set up environment variable files (`.env.local`, `.env.example`)
  - [x] 1.5 Configure Vercel project and connect GitHub repository

- [x] 2. Configure Supabase project and database
  - [x] 2.1 Create Supabase project and retrieve connection credentials
  - [x] 2.2 Enable PostGIS extension on Supabase database
  - [x] 2.3 Install Supabase CLI and configure local development environment
  - [x] 2.4 Create database migration files for all tables (users, user_profiles, risk_levels, community_reports, supply_locations, supply_availability, help_requests, volunteers, questions, answers, business_organizations, business_locations, employee_wellness_reports, telehealth_referrals)
  - [x] 2.5 Apply all Row Level Security (RLS) policies from design document
  - [x] 2.6 Create all database indexes including PostGIS spatial indexes
  - [x] 2.7 Seed database with initial supply locations and test data

- [x] 3. Set up PWA configuration
  - [x] 3.1 Install and configure `next-pwa` with Workbox service worker
  - [x] 3.2 Create `manifest.json` with app name, icons, theme colors
  - [x] 3.3 Configure cache strategies (cache-first for assets, network-first for API)
  - [x] 3.4 Implement IndexedDB schema for offline data storage
  - [x] 3.5 Set up background sync queue for offline user actions
  - [x] 3.6 Test PWA installability on iOS and Android

---

## Phase 2: Authentication

- [x] 4. Implement user registration and authentication
  - [x] 4.1 Create registration form with email/password validation (8+ chars, mixed case, numbers)
  - [x] 4.2 Integrate Supabase Auth for user creation and email verification
  - [x] 4.3 Implement login form with rate limiting (5 attempts per 15 minutes)
  - [x] 4.4 Create JWT middleware for Edge Functions (validate token on every request)
  - [x] 4.5 Implement password reset flow via email
  - [x] 4.6 Create auth context provider for client-side session management
  - [x] 4.7 Add protected route wrapper for authenticated pages
  - [x] 4.8 Write property-based tests for JWT token generation/validation cycle

- [x] 5. Implement user profile and preferences
  - [x] 5.1 Create profile setup page (name, primary location, notification preferences)
  - [x] 5.2 Implement location picker with Mapbox geocoding
  - [x] 5.3 Build notification preferences form (push, email, SMS toggles)
  - [x] 5.4 Implement search radius preference (1-50 miles slider)
  - [x] 5.5 Add profile data export as JSON (GDPR compliance)

---

## Phase 3: External Data Integration

- [x] 6. Implement WHO Disease API integration
  - [x] 6.1 Create WHO API client with fetch and error handling
  - [x] 6.2 Build WHO data parser (disease name, regions, countries, case counts)
  - [x] 6.3 Implement WHO-to-internal data mapper (normalize to `InternalRiskData` schema)
  - [x] 6.4 Create Vercel cron job to fetch WHO data every 6 hours (`0 */6 * * *`)
  - [x] 6.5 Implement 6-hour cache with fallback to cached data on API failure
  - [x] 6.6 Write property-based tests for WHO data parser round-trip (parse → format → parse produces equivalent data)

- [x] 7. Implement CDC NNDSS feed integration
  - [x] 7.1 Create CDC NNDSS API client for Socrata data endpoint
  - [x] 7.2 Build CDC data parser (disease, state, county, FIPS codes, case counts)
  - [x] 7.3 Implement FIPS-to-coordinates geocoding for CDC locations
  - [x] 7.4 Create Vercel cron job to fetch CDC data daily at 2 AM (`0 2 * * *`)
  - [x] 7.5 Implement CDC-over-WHO priority logic for US locations
  - [x] 7.6 Write property-based tests for CDC data parser round-trip

- [x] 8. Implement geolocation services
  - [x] 8.1 Create edge-resolved geolocation using Vercel's `geo` request headers
  - [x] 8.2 Implement browser Geolocation API with permission handling
  - [x] 8.3 Build Mapbox geocoding client (address/city/ZIP → coordinates)
  - [x] 8.4 Implement reverse geocoding (coordinates → human-readable address)
  - [x] 8.5 Add geocoding result cache (24-hour TTL)
  - [x] 8.6 Write property-based tests for distance calculations (symmetry: dist(A,B) = dist(B,A), triangle inequality)

---

## Phase 4: Risk Radar

- [x] 9. Build Risk Radar map component
  - [x] 9.1 Install and configure Mapbox GL JS with public token (URL-restricted)
  - [x] 9.2 Create `RiskRadarMap` client component with Mapbox GL canvas
  - [x] 9.3 Implement zoom levels 10-15 (city to neighborhood)
  - [x] 9.4 Add color-coded risk level vector overlays (low=green, moderate=amber, high=red, critical=dark red)
  - [x] 9.5 Implement lazy map loading (only load when scrolled into view) to conserve 50K free tier
  - [x] 9.6 Add map tile caching via service worker for offline support
  - [x] 9.7 Implement Mapbox usage tracking and alert at 40K loads (80% of limit)

- [x] 10. Build Risk Radar API endpoint
  - [x] 10.1 Create Edge Function `GET /api/risk/[location]` returning `RiskResponse`
  - [x] 10.2 Implement risk level query from `risk_levels` table with PostGIS spatial filter
  - [x] 10.3 Add community report aggregation as supplemental risk data
  - [x] 10.4 Implement data source priority (WHO/CDC over community reports)
  - [x] 10.5 Add 6-hour response cache at edge
  - [x] 10.6 Write property-based tests for risk level ordering invariant (low < moderate < high < critical always preserved)

- [x] 11. Implement community report submission
  - [x] 11.1 Create community report form (location, observation type, description)
  - [x] 11.2 Implement profanity/spam filter before storing reports
  - [x] 11.3 Store reports with geographic coordinates via PostGIS
  - [x] 11.4 Add report weighting logic (recent reports within 7 days weighted higher)
  - [x] 11.5 Display report count per geographic area on map

---

## Phase 5: Symptom Checker

- [x] 12. Build Symptom Checker flow
  - [x] 12.1 Create multi-step symptom input form (symptom selection, duration, severity)
  - [x] 12.2 Build outbreak profile matching engine (symptom → disease confidence score 0-100)
  - [x] 12.3 Implement confidence threshold logic (>70 → recommend action)
  - [x] 12.4 Add emergency condition detection (breathing difficulty, chest pain → show emergency contacts prominently)
  - [x] 12.5 Display medical disclaimer and require acknowledgment before use
  - [x] 12.6 Implement privacy-preserving symptom storage (no PII without consent)

- [x] 13. Implement telehealth referral integration
  - [x] 13.1 Create telehealth provider API client (at least one partner)
  - [x] 13.2 Build provider availability and wait time display
  - [x] 13.3 Implement referral booking with symptom summary pass-through (with user consent)
  - [x] 13.4 Generate unique referral tracking code per booking
  - [x] 13.5 Store referral in `telehealth_referrals` table for commission tracking
  - [x] 13.6 Write property-based tests for referral chain preservation (referral-to-completion link maintained across user sessions)

---

## Phase 6: Supply Finder

- [x] 14. Build Supply Finder search
  - [x] 14.1 Create supply search form (item name, radius selector 1-50 miles)
  - [x] 14.2 Create Edge Function `GET /api/supply/search` returning `SupplySearchResponse`
  - [x] 14.3 Implement PostGIS radius query on `supply_locations` table
  - [x] 14.4 Sort results by distance (nearest first) using great-circle formula
  - [x] 14.5 Display availability status (in stock / low stock / out of stock) with timestamp
  - [x] 14.6 Mark data older than 24 hours as potentially outdated
  - [x] 14.7 Add filter options (in stock only, safe badge, premium)

- [x] 15. Implement crowdsourced availability reporting
  - [x] 15.1 Add "Report availability" button on each supply location card
  - [x] 15.2 Create availability update form (item, status)
  - [x] 15.3 Store update in `supply_availability` table within 30 seconds
  - [x] 15.4 Show most recent report timestamp on location card

- [x] 16. Build safe services directory
  - [x] 16.1 Create directory listing for pharmacies, testing sites, telehealth providers
  - [x] 16.2 Display operating hours, contact info, services offered
  - [x] 16.3 Show Safe Badge prominently on verified locations
  - [x] 16.4 Add filter by service criteria (walk-in, insurance, appointment)
  - [x] 16.5 Integrate navigation directions (Google Maps / Apple Maps deep link)

---

## Phase 7: Alert System

- [x] 17. Implement Resend email integration
  - [x] 17.1 Install Resend SDK and configure API key
  - [x] 17.2 Create email templates for: welcome, verification, password reset, daily digest, critical alert
  - [x] 17.3 Implement email delivery status tracking via Resend webhooks
  - [x] 17.4 Add email queue with retry logic (exponential backoff on failure)
  - [x] 17.5 Implement daily limit tracking (alert at 80/100 emails per day)

- [x] 18. Build daily digest system
  - [x] 18.1 Create digest generation function (aggregate risk changes, new outbreaks, supply updates per user location)
  - [x] 18.2 Create Vercel cron job for digest delivery at 7 AM user local time (`0 7 * * *`)
  - [x] 18.3 Implement "no significant changes" fallback message
  - [x] 18.4 Include Verified_Source citations in all digest content
  - [x] 18.5 Add unsubscribe link to all digest emails

- [x] 19. Implement real-time push notifications
  - [x] 19.1 Set up Supabase Realtime WebSocket channel for risk level changes
  - [x] 19.2 Implement client-side WebSocket connection with JWT auth
  - [x] 19.3 Add automatic reconnection with exponential backoff
  - [x] 19.4 Implement 30-second heartbeat ping to keep connection alive
  - [x] 19.5 Add notification rate limiting (max 3 per day per user, bypass for critical)
  - [x] 19.6 Implement browser push notification via Web Push API
  - [x] 19.7 Record notification dismissals to prevent re-sending same alert

---

## Phase 8: Community Network

- [x] 20. Build help request system
  - [x] 20.1 Create help request form (description, task type, location, urgency)
  - [x] 20.2 Display nearby pending requests to volunteers (2-mile radius via PostGIS)
  - [x] 20.3 Implement volunteer accept flow with real-time notification to requester (within 30 seconds)
  - [x] 20.4 Add "Mark as fulfilled" button for requesters
  - [x] 20.5 Implement 24-hour unfulfilled reminder to nearby volunteers via cron job
  - [x] 20.6 Display volunteer completed task count on request cards

- [x] 21. Implement volunteer verification and ratings
  - [x] 21.1 Create volunteer registration flow (email + phone verification)
  - [x] 21.2 Display verification badge on verified volunteer profiles
  - [x] 21.3 Build post-task rating form (1-5 stars)
  - [x] 21.4 Implement account flagging on ratings below 3 stars
  - [x] 21.5 Auto-suspend accounts with multiple flags (pending review)

---

## Phase 9: Community Q&A

- [x] 22. Build Q&A question and answer system
  - [x] 22.1 Create question submission form with spam/health-topic validation
  - [x] 22.2 Implement duplicate question detection (show similar questions before allowing new submission)
  - [x] 22.3 Build answer form requiring at least one Verified_Source citation
  - [x] 22.4 Validate cited sources against authoritative health organization whitelist (WHO, CDC, NHS, etc.)
  - [x] 22.5 Implement upvoting with highest-voted answer shown first
  - [x] 22.6 Display informational disclaimer on all Q&A pages

- [x] 23. Implement misinformation moderation
  - [x] 23.1 Add "Flag as inaccurate" button on each answer
  - [x] 23.2 Auto-hide answers with 3+ flags pending moderator review
  - [x] 23.3 Create moderator review queue (24-hour SLA)
  - [x] 23.4 Implement confirmed misinformation removal with poster notification
  - [x] 23.5 Track misinformation count per user account
  - [x] 23.6 Auto-suspend posting privileges after 3 confirmed misinformation posts

---

## Phase 10: Revenue Features

- [x] 24. Implement premium business listings
  - [x] 24.1 Create business registration and listing creation flow
  - [x] 24.2 Integrate Stripe for monthly recurring billing ($29-79/month tiers)
  - [x] 24.3 Implement premium listing enhanced visibility in Supply Finder (top of results)
  - [x] 24.4 Allow premium listings to include photos, special offers, detailed descriptions
  - [x] 24.5 Auto-revert to standard visibility on subscription expiry
  - [x] 24.6 Send renewal reminder emails 7 days before expiry via Resend

- [x] 25. Implement Verified Safe Badge system
  - [x] 25.1 Create safe badge application form (safety protocol documentation upload)
  - [x] 25.2 Build admin review queue for badge applications (48-hour SLA)
  - [x] 25.3 Issue badge with 30-day validity on approval
  - [x] 25.4 Integrate Stripe for $49/month badge subscription
  - [x] 25.5 Implement monthly re-verification requirement
  - [x] 25.6 Auto-remove badge on expiry or failed re-verification
  - [x] 25.7 Add "Report protocol violation" button for users

- [x] 26. Implement telehealth affiliate commission tracking
  - [x] 26.1 Generate unique referral codes for each booking (stored in `telehealth_referrals`)
  - [x] 26.2 Create webhook endpoint to receive consultation completion from telehealth partners
  - [x] 26.3 Match completion webhook to original referral via referral code
  - [x] 26.4 Calculate commission ($15-40 based on provider rate)
  - [x] 26.5 Generate monthly commission reconciliation reports
  - [x] 26.6 Write property-based tests for referral chain integrity (no orphaned completions, no duplicate commissions)

---

## Phase 11: Business Dashboard (B2B)

- [x] 27. Build employee wellness monitoring
  - [x] 27.1 Create employee symptom reporting form (anonymous identifier, symptoms, severity, absence)
  - [x] 27.2 Require employee consent before collecting health data
  - [x] 27.3 Build aggregated wellness dashboard (charts: sick-day trends daily/weekly/monthly)
  - [x] 27.4 Implement outbreak pattern detection (3+ employees with similar symptoms in 7 days → alert)
  - [x] 27.5 Add multi-location segmentation for businesses with multiple sites
  - [x] 27.6 Allow business admins to send health updates to all employees

- [x] 28. Implement B2B compliance and privacy
  - [x] 28.1 Encrypt all employee health data at rest (Supabase column-level encryption)
  - [x] 28.2 Implement employee data view and deletion (GDPR/HIPAA right to erasure)
  - [x] 28.3 Set 90-day data retention policy with automated cleanup cron job
  - [x] 28.4 Auto-delete employee data within 30 days of offboarding
  - [x] 28.5 Generate audit logs for all access to employee health data
  - [x] 28.6 Add HIPAA compliance disclaimer to Business Dashboard

- [x] 29. Implement B2B subscription management
  - [x] 29.1 Create business onboarding flow (organization setup, location setup)
  - [x] 29.2 Integrate Stripe for B2B subscriptions ($99-299/month tiers)
  - [x] 29.3 Implement tier-based feature gating (basic vs premium dashboard features)
  - [x] 29.4 Build subscription management page (upgrade, downgrade, cancel)

---

## Phase 12: Platform Infrastructure

- [x] 30. Implement content moderation
  - [x] 30.1 Build profanity/spam filter for all user-submitted content
  - [x] 30.2 Create configurable blocked terms list (admin-managed)
  - [x] 30.3 Notify users when content is blocked with reason
  - [x] 30.4 Log all blocked content for moderator review
  - [x] 30.5 Build moderator approval flow for incorrectly blocked content

- [x] 31. Implement analytics tracking
  - [x] 31.1 Set up PostHog or Plausible (free tier) for privacy-friendly analytics
  - [x] 31.2 Track daily active users per geographic area
  - [x] 31.3 Track feature usage (Risk Radar views, Symptom Checker completions, Supply Finder searches)
  - [x] 31.4 Track telehealth referral conversion rate
  - [x] 31.5 Track B2B MRR
  - [x] 31.6 Generate weekly analytics report for admins
  - [x] 31.7 Anonymize all user data in analytics

- [x] 32. Security hardening
  - [x] 32.1 Implement CSRF protection on all state-changing API routes
  - [x] 32.2 Add rate limiting on Edge Functions (5 req/sec per IP)
  - [x] 32.3 Configure security headers (X-Frame-Options, X-Content-Type-Options, CSP)
  - [x] 32.4 Implement TLS 1.3 enforcement (Vercel handles this automatically)
  - [x] 32.5 Set up automated weekly security scans (Snyk or similar)
  - [x] 32.6 Add input sanitization on all user-submitted fields

- [x] 33. Performance optimization
  - [x] 33.1 Implement edge caching for risk and supply API responses
  - [x] 33.2 Add database query optimization (EXPLAIN ANALYZE on slow queries)
  - [x] 33.3 Implement request queuing for traffic spike handling
  - [x] 33.4 Add free-tier usage monitoring dashboard (Supabase, Mapbox, Resend, Vercel)
  - [x] 33.5 Implement graceful degradation when free-tier limits are approached (80% threshold alerts)

---

## Phase 13: CloudPanel Migration Preparation

- [ ] 34. Build deployment-agnostic abstraction layer
  - [x] 34.1 Create database connection abstraction (`lib/db/client.ts`) supporting both Supabase and direct PostgreSQL
  - [x] 34.2 Create auth abstraction (`lib/auth/provider.ts`) supporting both Supabase Auth and custom JWT
  - [x] 34.3 Create realtime abstraction (`lib/realtime/client.ts`) supporting both Supabase Realtime and Socket.io
  - [x] 34.4 Implement environment-based config switching (`DEPLOYMENT_PHASE=phase1|phase2`)
  - [x] 34.5 Document all environment variables needed for Phase 2 in `.env.example`

- [ ] 35. Create CloudPanel migration scripts
  - [x] 35.1 Write database export script (`scripts/export-supabase.sh`)
  - [x] 35.2 Write database import script for CloudPanel PostgreSQL (`scripts/import-cloudpanel.sh`)
  - [x] 35.3 Write data integrity verification script (row count comparison)
  - [x] 35.4 Create Nginx configuration template for CloudPanel (`deploy/nginx.conf`)
  - [x] 35.5 Create PM2 ecosystem config for CloudPanel (`deploy/ecosystem.config.js`)
  - [x] 35.6 Write rollback procedure documentation (`docs/migration-rollback.md`)

---

## Property-Based Tests Summary

The following PBT suites must be implemented alongside their respective features:

- **Task 4.8** — JWT token round-trip: generate → sign → verify → extract userId (identity property)
- **Task 6.6** — WHO data parser round-trip: parse → format → parse produces semantically equivalent data
- **Task 7.6** — CDC data parser round-trip: same as above for CDC format
- **Task 8.6** — Distance symmetry: `dist(A,B) === dist(B,A)` for all coordinate pairs; triangle inequality: `dist(A,C) <= dist(A,B) + dist(B,C)`
- **Task 10.6** — Risk level ordering: aggregation never produces a lower risk level when inputs are equal or higher severity
- **Task 13.6** — Referral chain: every completed consultation maps to exactly one referral; no duplicate commissions
- **Task 26.6** — Commission integrity: referral chain preserved across multi-step user sessions
