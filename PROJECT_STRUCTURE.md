# Project Structure

This document describes the folder structure and organization of the Hotel Management System.

## Root Directory

```
hotel-management-system/
├── .kiro/                      # Kiro specs and configuration
│   └── specs/
│       └── hotel-management-system/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
├── dist/                       # Production build output
├── node_modules/               # Dependencies
├── src/                        # Source code
├── .env.example                # Environment variables template
├── .eslintrc.cjs              # ESLint configuration
├── .gitignore                 # Git ignore rules
├── firebase.json              # Firebase configuration
├── firestore.indexes.json     # Firestore indexes
├── firestore.rules            # Firestore security rules
├── storage.rules              # Firebase Storage security rules
├── index.html                 # HTML entry point
├── package.json               # Project dependencies and scripts
├── README.md                  # Project overview
├── SETUP.md                   # Setup instructions
├── tsconfig.json              # TypeScript configuration
├── tsconfig.node.json         # TypeScript config for Node
└── vite.config.ts             # Vite build configuration
```

## Source Directory Structure

```
src/
├── components/                 # Shared/reusable components
│   └── .gitkeep
├── config/                     # Configuration files
│   └── firebase.ts            # Firebase initialization
├── contexts/                   # React Context providers
│   └── .gitkeep               # (AuthContext, HotelContext, I18nContext to be added)
├── features/                   # Feature-based modules
│   ├── admin/                 # Super admin features
│   │   ├── components/        # Feature-specific components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # Data access layer
│   │   ├── models/            # TypeScript interfaces
│   │   ├── constants/         # Feature constants
│   │   ├── utils/             # Helper functions
│   │   └── locales/           # Translation files
│   ├── customers/             # Customer management
│   ├── dashboard/             # Dashboard and metrics
│   ├── frontDesk/             # Check-in/check-out operations
│   ├── pricing/               # Room types and pricing
│   ├── reports/               # Reports and analytics
│   ├── reservations/          # Booking management
│   ├── rooms/                 # Room and housekeeping
│   └── settings/              # Hotel settings and configuration
├── locales/                    # i18n translation files
│   ├── en/                    # English translations
│   │   └── common.json
│   ├── vi/                    # Vietnamese translations
│   │   └── common.json
│   └── index.ts               # i18n configuration
├── types/                      # Shared TypeScript types
│   └── .gitkeep
├── utils/                      # Shared utility functions
│   └── .gitkeep
├── App.tsx                     # Root application component
├── App.test.tsx               # App tests
├── index.css                  # Global styles
├── main.tsx                   # Application entry point
└── vite-env.d.ts              # Vite environment types
```

## Feature Module Structure

Each feature follows this consistent structure:

```
features/{featureName}/
├── components/                 # UI components specific to this feature
│   ├── FeatureComponent.tsx
│   └── FeatureComponent.test.tsx
├── pages/                      # Page components (route targets)
│   ├── FeaturePage.tsx
│   └── FeaturePage.test.tsx
├── hooks/                      # Custom hooks for business logic
│   ├── useFeature.ts
│   └── useFeature.test.ts
├── services/                   # Data access layer (Firestore operations)
│   ├── featureService.ts
│   └── featureService.test.ts
├── models/                     # TypeScript interfaces and types
│   └── types.ts
├── constants/                  # Feature-specific constants
│   └── constants.ts
├── utils/                      # Helper functions
│   ├── helpers.ts
│   └── helpers.test.ts
└── locales/                    # Translation files
    ├── en.json
    └── vi.json
```

## Key Design Principles

### 1. Feature-Based Organization
- Code is organized by business feature, not by technical layer
- Each feature is self-contained with its own components, logic, and data access
- Makes it easy to understand and maintain related functionality

### 2. Separation of Concerns
- **Components**: Pure UI components (presentation layer)
- **Hooks**: Business logic and state management
- **Services**: Data access and Firebase operations
- **Utils**: Pure functions and helpers

### 3. Type Safety
- All data models have TypeScript interfaces
- Strict type checking enabled
- Type definitions for environment variables

### 4. Testing
- Tests co-located with source files
- Unit tests for components, hooks, and services
- Property-based tests for critical business logic
- Test files use `.test.tsx` or `.test.ts` extension

### 5. Internationalization
- All user-facing text uses i18n
- Translations organized by namespace
- Lazy-loading support for performance

## Firebase Collections

The application uses the following Firestore collections:

- `users` - User accounts and profiles
- `hotels` - Hotel information and settings
- `hotelUsers` - User-hotel associations with permissions
- `reservations` - Booking records
- `rooms` - Room inventory
- `roomTypes` - Room categories and pricing
- `customers` - Customer database
- `companies` - Corporate partners
- `services` - Additional services offered
- `serviceOrders` - Service order records
- `housekeepingTasks` - Cleaning tasks
- `maintenanceTickets` - Maintenance requests

## Security

### Firestore Security Rules
- All data is scoped by `hotelId` for multi-tenancy
- Permission-based access control enforced at database level
- Super admin has read access to all data
- Regular users can only access hotels they have permissions for

### Storage Security Rules
- Hotel images scoped by `hotelId`
- User profile images scoped by `userId`
- Read access requires authentication and hotel access
- Write access requires authentication and appropriate permissions

## Environment Variables

Required environment variables (see `.env.example`):

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

## Scripts

Available npm scripts:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests with Vitest

## Next Steps

1. Implement core context providers (AuthContext, HotelContext, I18nContext)
2. Set up protected routes and navigation
3. Implement feature modules according to tasks.md
4. Write tests for each feature
5. Deploy to Firebase Hosting

For detailed implementation tasks, see `.kiro/specs/hotel-management-system/tasks.md`
