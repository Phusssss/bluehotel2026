# Implementation Plan: Hotel Management System

## Overview

This implementation plan breaks down the hotel management system into incremental, testable steps. The system will be built using React (JSX) + Vite, Ant Design, TypeScript, and Firebase. Each task builds on previous work, with property-based tests and unit tests integrated throughout to ensure correctness.

## Tasks

- [x] 1. Project Setup and Firebase Configuration
  - Initialize Vite + React + TypeScript project with Ant Design
  - Install dependencies: antd, firebase, react-router-dom, react-i18next, fast-check, vitest
  - Create Firebase project and configure Authentication, Firestore, Storage
  - Set up environment variables for Firebase config
  - Configure Firestore security rules for multi-tenancy
  - Set up feature-based folder structure
  - _Requirements: 17.1, 17.2, 18.1, 18.2, 18.3, 18.4_

- [x] 2. Core Context Providers and Authentication
  - [x] 2.1 Implement Firebase initialization and configuration
    - Create firebase config module with initialization
    - Export auth, db, and storage instances
    - _Requirements: 18.1_
  
  - [x] 2.2 Implement AuthContext and useAuth hook
    - Create User interface and AuthContextValue interface
    - Implement signInWithGoogle, signOut, updateUserProfile methods
    - Handle user document creation/retrieval from Firestore
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 2.3 Write property test for user authentication round-trip
    - **Property 1: User Creation and Authentication Round-Trip**
    - **Validates: Requirements 1.2**
  
  - [x] 2.4 Write property test for role-based routing
    - **Property 2: Role-Based Routing**
    - **Validates: Requirements 1.4**
  
  - [x] 2.5 Write unit tests for authentication error handling
    - Test Firebase Auth failure scenarios
    - Test locked user account handling
    - _Requirements: 1.5_

- [x] 3. Hotel Context and Multi-Tenancy
  - [x] 3.1 Implement HotelContext and useHotel hook
    - Create Hotel interface and HotelContextValue interface
    - Implement selectHotel, addHotel, updateHotel methods
    - Implement localStorage persistence for currentHotelId
    - Query hotelUsers collection to get user's hotels
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 3.2 Write property test for hotel selection persistence
    - **Property 10: Hotel Selection Persistence Round-Trip**
    - **Validates: Requirements 4.3**
  
  - [x] 3.3 Write property test for multi-tenancy data isolation
    - **Property 11: Multi-Tenancy Data Isolation**
    - **Validates: Requirements 4.4**
  
  - [x] 3.4 Write property test for hotel access prevention
    - **Property 12: Hotel Access Prevention**
    - **Validates: Requirements 4.7**

- [x] 4. Internationalization (i18n) Setup
  - [x] 4.1 Configure react-i18next with namespaces
    - Create i18n configuration with language detector
    - Set up translation file structure (en, vi)
    - Create common, sidebar, and feature-specific translation files
    - _Requirements: 15.1, 15.5_
  
  - [x] 4.2 Implement I18nContext and LanguageSwitcher component
    - Create language switcher with Ant Design Select
    - Implement language change with Firestore persistence
    - _Requirements: 15.2, 15.3, 15.4_
  
  - [x] 4.3 Write property test for language preference persistence
    - **Property 32: Language Preference Persistence**
    - **Validates: Requirements 15.3, 15.4**

- [x] 5. Protected Routes and Authorization
  - [x] 5.1 Implement ProtectedRoute component
    - Create route wrapper that checks authentication
    - Redirect to login if not authenticated
    - Support role-based access control
    - _Requirements: 16.1, 16.2_
  
  - [x] 5.2 Implement HotelProtectedRoute component
    - Create route wrapper that checks hotel selection
    - Redirect to hotel selection if no hotel selected
    - Support permission-based access control
    - _Requirements: 16.3, 13.3_
  
  - [x] 5.3 Write property tests for route protection
    - **Property 33: Unauthenticated Route Protection**
    - **Property 34: Role-Based Route Protection**
    - **Property 35: Hotel Selection Requirement**
    - **Validates: Requirements 16.1, 16.2, 16.3**

- [x] 6. Main Layout and Navigation
  - [x] 6.1 Implement MainLayout component with Ant Design
    - Create layout with Header, Sider, and Content
    - Implement collapsible sidebar with menu items
    - Display current hotel name in header
    - Integrate LanguageSwitcher and user menu
    - _Requirements: 20.1, 20.2, 20.3, 20.4_
  
  - [x] 6.2 Set up React Router with route configuration
    - Define all application routes
    - Wrap routes with ProtectedRoute and HotelProtectedRoute
    - Implement breadcrumb navigation
    - _Requirements: 20.4_

- [x] 7. Checkpoint - Verify Core Infrastructure
  - Ensure all tests pass, ask the user if questions arise.


- [x] 8. User Registration Flow
  - [x] 8.1 Implement user information form page
    - Create form with fields: name, phone, address, language, timezone
    - Implement form validation with Ant Design Form
    - Save user information to Firestore on submit
    - _Requirements: 2.1, 2.2_
  
  - [x] 8.2 Implement hotel addition form page
    - Create form to add hotel details
    - Support adding multiple hotels
    - Create hotel documents and hotelUsers documents
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [x] 8.3 Write property test for user profile update
    - **Property 3: User Profile Update Round-Trip**
    - **Validates: Requirements 2.2**
  
  - [x] 8.4 Write property test for hotel creation with permissions
    - **Property 4: Hotel Creation with Permissions**
    - **Property 5: Multiple Hotel Creation**
    - **Validates: Requirements 2.4, 2.5, 2.6**

- [x] 9. Hotel Selection Flow
  - [x] 9.1 Implement hotel selection modal
    - Display list of user's hotels
    - Handle hotel selection and context update
    - Redirect to dashboard after selection
    - _Requirements: 4.1, 4.2_
  
  - [x] 9.2 Write property test for hotel access list accuracy
    - **Property 9: Hotel Access List Accuracy**
    - **Validates: Requirements 4.1**

- [x] 10. Data Models and Services Layer
  - [x] 10.1 Define TypeScript interfaces for all data models
    - Create interfaces for User, Hotel, Reservation, Room, RoomType, Customer, Service, etc.
    - Define MultiLanguageText interface for i18n content
    - _Requirements: 17.5_
  
  - [x] 10.2 Implement reservation service
    - Create ReservationService with CRUD operations
    - Implement getReservations with filtering
    - Implement checkIn and checkOut methods
    - Implement room availability checking
    - _Requirements: 6.2, 6.4, 6.5, 7.5, 7.6_
  
  - [x] 10.3 Implement room service
    - Create RoomService with CRUD operations
    - Implement room status updates
    - _Requirements: 8.1, 8.2_
  
  - [x] 10.4 Implement customer service
    - Create CustomerService with CRUD operations
    - Implement customer search functionality
    - _Requirements: 11.1, 11.2, 11.7_
  
  - [x] 10.5 Implement room type and pricing service
    - Create RoomTypeService with CRUD operations
    - Implement pricing calculation logic (weekday, seasonal)
    - _Requirements: 9.1, 9.2, 9.5_

- [ ] 11. Dashboard Feature
  - [x] 11.1 Implement dashboard page with metrics
    - Calculate and display room occupancy (today, this week)
    - Calculate and display revenue (today, this month)
    - Display check-in/check-out counts
    - Display room status counts (dirty, maintenance)
    - Display alerts and notifications
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_
  
  - [ ] 11.2 Write property tests for dashboard calculations
    - **Property 13: Dashboard Occupancy Calculation**
    - **Property 14: Dashboard Revenue Calculation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  
  - [ ] 11.3 Write unit tests for dashboard edge cases
    - Test with no reservations
    - Test with no rooms
    - _Requirements: 5.1-5.9_

- [ ] 12. Reservations Feature
  - [x] 12.1 Implement reservations list page
    - Display reservations in table with filtering
    - Implement date range, status, and source filters
    - Show reservation details on click
    - _Requirements: 6.2, 6.6_
  
  - [x] 12.2 Implement tape chart/room calendar view
    - Create visual calendar showing room occupancy
    - Display reservations by room and date
    - _Requirements: 6.1_
  
  - [x] 12.3 Implement create reservation form
    - Create form with customer, room type, dates, guests, source
    - Implement date validation (checkout after checkin)
    - Check room availability before submission
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [x] 12.4 Implement edit and cancel reservation functionality
    - Allow editing reservations before check-in
    - Implement reservation cancellation with status update
    - _Requirements: 6.7, 6.8_
  
  - [ ] 12.5 Write property tests for reservation operations
    - **Property 15: Reservation Filtering Accuracy**
    - **Property 16: Reservation Creation with Correct Status**
    - **Property 17: Room Availability Validation**
    - **Property 18: Reservation Edit Restriction**
    - **Property 19: Reservation Cancellation Status Update**
    - **Validates: Requirements 6.2, 6.4, 6.5, 6.7, 6.8**
  
  - [ ] 12.6 Write unit tests for reservation edge cases
    - Test same-day check-in/check-out
    - Test long-term reservations
    - Test group bookings (if enabled)
    - _Requirements: 6.9_

- [ ] 13. Checkpoint - Verify Core Features
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Front Desk Feature
  - [x] 14.1 Implement arrivals, in-house, and departures views
    - Display today's arrivals sorted by check-in time
    - Display in-house guests with room numbers
    - Display today's departures sorted by checkout time
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 14.2 Implement guest/folio search
    - Create search by name, room number, confirmation number
    - Display search results with reservation details
    - _Requirements: 7.4_
  
  - [x] 14.3 Implement check-in functionality
    - Update reservation status to checked-in
    - Set checkedInAt timestamp
    - Update room status to occupied
    - _Requirements: 7.5_
  
  - [x] 14.4 Implement check-out functionality
    - Display folio with all charges
    - Process payment and update folio balance
    - Update reservation status to checked-out
    - Mark room as dirty and create housekeeping task
    - _Requirements: 7.6, 7.7, 7.8_
  
  - [ ] 14.5 Write property tests for check-in/check-out
    - **Property 20: Check-In State Transition**
    - **Property 21: Check-Out State Transition**
    - **Validates: Requirements 7.5, 7.6, 7.7, 7.8**

- [ ] 15. Rooms and Housekeeping Feature
  - [x] 15.1 Implement rooms list page
    - Display all rooms with status, type, floor
    - Implement filtering by status, type, floor
    - _Requirements: 8.1, 8.2_
  
  - [x] 15.2 Implement housekeeping board
    - Display rooms requiring cleaning
    - Allow assigning tasks to staff
    - Update room status when task completed
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [ ] 15.3 Implement maintenance ticket system
    - Create maintenance tickets for rooms
    - Mark room as under maintenance
    - Update room status when ticket resolved
    - _Requirements: 8.6, 8.7, 8.8_
  
  - [ ] 15.4 Write property tests for room status transitions
    - **Property 22: Housekeeping Task Completion**
    - **Property 23: Maintenance Ticket Room Status**
    - **Validates: Requirements 8.5, 8.6, 8.7, 8.8**

- [ ] 16. Pricing and Services Feature
  - [ ] 16.1 Implement room types management
    - Create CRUD interface for room types
    - Implement base pricing, weekday pricing, seasonal pricing
    - Validate seasonal pricing non-overlap
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_
  
  - [ ] 16.2 Implement pricing calculator utility
    - Calculate reservation price based on dates and room type
    - Apply seasonal pricing, then weekday pricing, then base price
    - Calculate tax and total
    - _Requirements: 9.5_
  
  - [ ] 16.3 Implement services management
    - Create CRUD interface for services
    - Support multi-language descriptions
    - _Requirements: 10.1, 10.2, 10.7_
  
  - [ ] 16.4 Implement service orders (simple POS)
    - Create service orders for in-house guests
    - Post charges to guest folio
    - _Requirements: 10.3, 10.4_
  
  - [ ] 16.5 Write property tests for pricing and services
    - **Property 24: Pricing Calculation Correctness**
    - **Property 25: Seasonal Pricing Non-Overlap**
    - **Property 26: Service Order Folio Posting**
    - **Validates: Requirements 9.5, 9.6, 10.4**
  
  - [ ] 16.6 Write unit tests for pricing edge cases
    - Test single-night stay
    - Test month-long stay spanning multiple seasons
    - Test pricing on season boundary dates
    - _Requirements: 9.5_

- [ ] 17. Customers Feature
  - [ ] 17.1 Implement customers list page
    - Display all customers with search
    - Implement customer search by name, email, phone
    - _Requirements: 11.1, 11.7_
  
  - [ ] 17.2 Implement customer CRUD operations
    - Create form to add/edit customers
    - Store customer information in Firestore
    - Display customer booking history
    - _Requirements: 11.2, 11.3, 11.6_
  
  - [ ] 17.3 Implement companies/partners management
    - Create CRUD interface for companies
    - Link customers to companies
    - _Requirements: 11.4, 11.5_
  
  - [ ] 17.4 Write property test for customer search
    - **Property 27: Customer Search Accuracy**
    - **Validates: Requirements 11.7**

- [ ] 18. Reports Feature
  - [ ] 18.1 Implement occupancy report
    - Calculate occupancy percentage by date
    - Display report in table format
    - Support date range filtering
    - _Requirements: 12.1_
  
  - [ ] 18.2 Implement revenue report
    - Calculate total revenue, revenue by room type, revenue by service
    - Display summary statistics
    - Support date range filtering
    - _Requirements: 12.2_
  
  - [ ] 18.3 Implement reservation report
    - Show bookings by source
    - Show cancellations and no-shows
    - Support date range filtering
    - _Requirements: 12.3_
  
  - [ ] 18.4 Implement report export functionality
    - Export reports to CSV format
    - Export reports to PDF format
    - _Requirements: 12.6_
  
  - [ ] 18.5 Write property tests for report calculations
    - **Property 28: Occupancy Report Accuracy**
    - **Property 29: Revenue Report Completeness**
    - **Validates: Requirements 12.1, 12.2**

- [ ] 19. System Settings Feature
  - [ ] 19.1 Implement hotel users and permissions management
    - Display users with access to current hotel
    - Allow adding users with permission levels
    - Allow changing user permissions
    - Allow removing users from hotel
    - _Requirements: 13.1, 13.2, 13.4, 13.5_
  
  - [ ] 19.2 Implement hotel information and policies configuration
    - Create form for hotel details (name, address, contact)
    - Configure check-in/check-out times
    - Configure cancellation policies
    - Configure tax rates and fees
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ] 19.3 Implement invoice configuration
    - Configure invoice numbering format
    - Configure invoice prefix and counter
    - _Requirements: 14.6_
  
  - [ ] 19.4 Implement hotel logo and image upload
    - Use Firebase Storage for image uploads
    - Display uploaded logo in header
    - _Requirements: 14.7_
  
  - [x] 19.5 Implement theme switcher
    - Create ThemeContext and useTheme hook
    - Implement light/dark theme toggle in header
    - Persist theme preference to localStorage
    - Apply Ant Design theme configuration
    - _Requirements: 14.9, 14.10, 14.11_
  
  - [ ] 19.6 Write property tests for permissions and configuration
    - **Property 30: Permission-Based Feature Access**
    - **Property 31: Hotel Configuration Application**
    - **Validates: Requirements 13.3, 14.8**

- [ ] 20. Super Admin Feature
  - [ ] 20.1 Implement admin dashboard
    - Display list of all users
    - Show user details (name, email, role, status)
    - _Requirements: 3.1, 3.2_
  
  - [ ] 20.2 Implement user management operations
    - Implement lock/unlock user functionality
    - Implement reset permissions functionality
    - Display user's hotels
    - Prevent super admin from deleting own account
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [ ] 20.3 Write property tests for admin operations
    - **Property 6: Admin User List Completeness**
    - **Property 7: User Lock/Unlock Round-Trip**
    - **Property 8: User Hotel Association**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.6**

- [ ] 21. Error Handling and Validation
  - [ ] 21.1 Implement global error boundary
    - Create ErrorBoundary component
    - Display user-friendly error messages
    - Log errors to console (or error tracking service)
    - _Requirements: 19.6_
  
  - [ ] 21.2 Implement service layer error handling
    - Create AppError class
    - Handle Firestore errors with user-friendly messages
    - Translate error codes to localized messages
    - _Requirements: 18.6_
  
  - [ ] 21.3 Implement form validation
    - Add validation rules to all forms
    - Display validation errors inline
    - Prevent submission with invalid data
    - _Requirements: 19.1, 19.2, 19.3, 19.4_
  
  - [ ] 21.4 Write property test for form validation
    - **Property 37: Form Validation Rejection**
    - **Validates: Requirements 19.1, 19.2, 19.3**

- [ ] 22. Firestore Security Rules
  - [ ] 22.1 Implement comprehensive security rules
    - Enforce multi-tenancy (hotelId filtering)
    - Enforce permission-based access
    - Prevent unauthorized data access
    - _Requirements: 18.5_
  
  - [ ] 22.2 Write property test for security rules enforcement
    - **Property 36: Firestore Security Rules Enforcement**
    - **Validates: Requirements 18.5**

- [ ] 23. Offline Support and Performance
  - [ ] 23.1 Enable Firestore offline persistence
    - Configure IndexedDB persistence
    - Handle offline state in UI
    - Display offline indicator
    - _Requirements: 18.7_
  
  - [ ] 23.2 Implement lazy loading for translations
    - Load translations per route/feature
    - Optimize bundle size
    - _Requirements: 15.6_

- [ ] 24. Final Integration and Polish
  - [ ] 24.1 Implement loading states and spinners
    - Add loading indicators to all async operations
    - Use Ant Design Spin component
    - _Requirements: 19.5, 20.7_
  
  - [ ] 24.2 Implement success/error notifications
    - Use Ant Design message component
    - Display localized success/error messages
    - _Requirements: 19.6_
  
  - [ ] 24.3 Implement responsive design adjustments
    - Test on mobile, tablet, desktop
    - Adjust layout for different screen sizes
    - _Requirements: 20.5_
  
  - [ ] 24.4 Add breadcrumb navigation
    - Display current page hierarchy
    - Enable navigation via breadcrumbs
    - _Requirements: 20.4_

- [ ] 25. Final Checkpoint - Complete System Verification
  - Run all unit tests and property tests
  - Verify all features work end-to-end
  - Test multi-tenancy isolation
  - Test all user roles and permissions
  - Test internationalization with multiple languages
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive system implementation
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation throughout development
- All code should follow TypeScript best practices and feature-based architecture
- All user-facing text must use i18n translations (no hardcoded strings)
