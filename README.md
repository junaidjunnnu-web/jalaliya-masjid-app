# Jalaliya Juma Masjid Community Management App

A mobile-first community management app for Jalaliya Juma Masjid committee and local community.

## Tech Stack

- **Frontend**: Expo Router + React Native
- **Backend**: Node.js + Express
- **Database**: Neon (PostgreSQL) with Drizzle ORM
- **Storage**: Supabase Storage for images
- **Deployment**: 
  - Backend: Render
  - Frontend: Vercel (web) + EAS Build (Android APK)

## Project Structure

```
jalaliya-masjid-app/
├── frontend/          # Expo Router app
├── backend/           # Express API server
└── package.json       # Root workspace config
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Neon PostgreSQL account
- Supabase account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see `.env.example` files in frontend/ and backend/)

3. Run database migrations:
```bash
cd backend
npm run db:push
npm run db:seed
```

4. Start development servers:
```bash
npm run dev
```

## Roles

- **committee**: Full access to all features
- **member**: Self-service access, limited visibility of other families

## Authentication

Phone number + PIN login (bcrypt hashed PINs)
