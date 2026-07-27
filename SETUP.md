# Jalaliya Juma Masjid App - Setup Guide

## Project Structure Complete ✅

The full application codebase has been created with the following structure:

```
jalaliya-masjid-app/
├── backend/                 # Express + Drizzle + Neon
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.js    # All database tables
│   │   │   ├── seed.js      # Places seeder
│   │   │   └── index.js     # DB connection
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT + role middleware
│   │   └── routes/          # All API routes
│   ├── package.json
│   ├── drizzle.config.js
│   └── .env.example
├── frontend/                # Expo Router + React Native
│   ├── app/
│   │   ├── (tabs)/          # Bottom tab screens
│   │   ├── auth/            # Login/Register
│   │   ├── more/            # Gallery, Fees, Broadcast, etc.
│   │  家族 family/          # Family detail
│   │   ├── _layout.tsx      # Root layout
│   │   └── global.css
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   └── auth-context.tsx # Auth context
│   ├── theme.ts             # Design system
│   ├── package.json
│   ├── app.json
│   └── .env.example
├── package.json             # Root workspace
└── README.md
```

## Next Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Environment Variables

**Backend (backend/.env):**
```env
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/jalaliya-masjid
JWT_SECRET=your-super-secret-jwt-key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
NODE_ENV=development
```

**Frontend (frontend/.env):**
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Set Up Neon PostgreSQL

1. Create a Neon account at https://neon.tech
2. Create a new project: "jalaliya-masjid"
3. Copy the connection string to `backend/.env`

### 4. Set Up Supabase Storage

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Create a storage bucket named "jalaliya-masjid"
4. Copy URL and keys to `backend/.env`

### 5. Run Database Migrations

```bash
cd backend
npm run db:push    # Push schema to Neon
npm run db:seed    # Seed places table
```

### 6. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 7. Test the App

1. Open http://localhost:8081 (Expo web)
2. Register a new family (creates pending status)
3. Login with phone + PIN
4. Navigate through all tabs

## Features Implemented

### ✅ Backend (Express + Drizzle)
- **Auth**: Phone + PIN login with bcrypt, JWT tokens
- **Role Middleware**: Committee vs Member access control
- **Families**: CRUD, approval workflow, role-based visibility
- **Members**: Place-grouped listing, family details
- **Committee**: Directory with contact info
- **Madrasa**: Students, attendance tracking
- **Namaz**: Prayer times with Ramadan support
- **Announcements**: Create/view announcements
- **Events**: Upcoming events calendar
- **Gallery**: Photo upload via Supabase, category filtering
- **Collections**: Zakat, Sadaqah, Eid tracking
- **Expenses**: Expense categories and tracking
- **Fees**: Monthly fee calculation, payment tracking, WhatsApp statements

### ✅ Frontend (Expo Router)
- **Design System**: Centralized theme with colors, typography, shadows
- **Auth Screens**: Login and Register with validation
- **Home**: Banner carousel, prayer countdown, announcements, events
- **Namaz**: 5 daily prayers, Jumma, Ramadan timings
- **Members**: Place-grouped accordion, search, family details
- **Madrasa**: Student list with class filter
- **Committee**: Directory with Call/WhatsApp buttons
- **More Tab**: Gallery, Announcements, Events, Fees, Broadcast, Profile, Settings
- **Broadcast**: Template picker, place filter, WhatsApp integration
- **Fees**: Committee view with summary, member view of own fees

## TypeScript Linting Notes

The TypeScript errors shown in the IDE are expected and will resolve after running `npm install` in the frontend directory. The errors are due to missing type declarations for:
- `react`
- `react-native`
- `expo-router`

These will be installed automatically with the dependencies.

## Deployment

### Backend (Render)
1. Connect GitHub repo to Render
2. Set environment variables in Render dashboard
3. Deploy as a web service

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set `EXPO_PUBLIC_API_URL` to production backend URL
3. Deploy as web export

### Android APK
```bash
cd frontend
eas build --platform android
```

## Database Schema Summary

Tables created:
- users (auth, roles)
- places (seeded locations)
- families (family records with status)
- family_members (family member details)
- committee_members (committee directory)
- madrasa_students (madrasa enrollment)
- madrasa_attendance (attendance tracking)
- namaz_timings (prayer schedules)
- announcements (masjid announcements)
- events (community events)
- gallery_photos (photo storage)
- collections (zakat, sadaqah, etc.)
- expenses (masjid expenses)
- monthly_fees (fee tracking with balance carry-forward)
