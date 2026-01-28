# Hotel Management System

A comprehensive hotel management system built with React, TypeScript, Ant Design, and Firebase.

## Features

- Multi-tenant architecture supporting multiple hotels
- Role-based access control (Super Admin and Regular Users)
- Reservation management
- Front desk operations (check-in/check-out)
- Room and housekeeping management
- Pricing and services management
- Customer relationship management
- Reporting and analytics
- Multi-language support (English, Vietnamese)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Ant Design 5.x
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Routing**: React Router v6
- **Internationalization**: react-i18next
- **Testing**: Vitest + fast-check (Property-Based Testing)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Google Sign-In)
   - Enable Firestore Database
   - Enable Storage

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration values

5. Deploy Firestore security rules and indexes:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   firebase deploy --only storage
   ```

### Development

Start the development server:
```bash
npm run dev
```

### Build

Build for production:
```bash
npm run build
```

### Testing

Run tests:
```bash
npm test
```

### Deployment

Deploy to Firebase Hosting:
```bash
npm run build
firebase deploy --only hosting
```

## Project Structure

```
src/
├── config/           # Firebase and app configuration
├── contexts/         # React Context providers (Auth, Hotel, i18n)
├── components/       # Shared components
├── features/         # Feature-based modules
│   ├── dashboard/
│   ├── reservations/
│   ├── frontDesk/
│   ├── rooms/
│   ├── pricing/
│   ├── customers/
│   ├── reports/
│   ├── settings/
│   └── admin/
├── locales/          # i18n translation files
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Firebase Collections

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

## License

Private - All rights reserved
