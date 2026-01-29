# Requirements Document: Hotel Management System

## Introduction

This document specifies the requirements for a comprehensive hotel management system that enables hotel owners and staff to manage reservations, front desk operations, housekeeping, pricing, and reporting. The system supports multi-tenancy (multiple hotels per user), role-based access control, and internationalization. It is built with React (JSX) + Vite frontend, Ant Design UI framework, and Firebase backend (Authentication, Firestore, Storage, Hosting).

## Glossary

- **System**: The hotel management system application
- **Super_Admin**: A privileged user who can manage all user accounts and view all hotels
- **Regular_User**: A hotel owner or staff member who manages one or more hotels
- **Hotel_Owner**: A Regular_User who owns one or more hotels
- **Hotel_Staff**: A Regular_User who works at a hotel (manager, receptionist, housekeeping)
- **Guest**: A customer who books or stays at a hotel
- **Reservation**: A booking for one or more rooms for specific dates
- **Room**: A physical hotel room with a room number and room type
- **Room_Type**: A category of rooms (e.g., Standard, Deluxe, Suite) with associated pricing
- **Service**: An additional service offered by the hotel (laundry, extra bed, shuttle, etc.)
- **Service_Order**: A request for a service, typically posted to a guest's room folio
- **Folio**: A guest's account showing charges and payments
- **Housekeeping_Task**: A task to clean or prepare a room
- **Maintenance_Ticket**: A request to repair or maintain a room
- **Current_Hotel**: The hotel context currently selected by a Regular_User
- **Firebase_Auth**: Firebase Authentication service
- **Firestore**: Firebase's NoSQL database
- **i18n**: Internationalization (multi-language support)
- **Tape_Chart**: A visual calendar showing room occupancy over time

## Requirements

### Requirement 1: User Authentication with Google

**User Story:** As a Regular_User, I want to sign up and log in using my Google account, so that I can access the system securely without managing passwords.

#### Acceptance Criteria

1. WHEN a user clicks the "Sign in with Google" button, THE System SHALL initiate Firebase_Auth Google sign-in flow
2. WHEN Firebase_Auth successfully authenticates a user, THE System SHALL save the user to the Firestore users collection with a default role of "regular"
3. WHEN a new user completes authentication for the first time, THE System SHALL redirect them to the user information entry screen
4. WHEN an existing user completes authentication, THE System SHALL redirect them based on their role (Super_Admin to admin dashboard, Regular_User to hotel selection)
5. IF Firebase_Auth fails, THEN THE System SHALL display an error message and allow retry

### Requirement 2: First-Time User Registration Flow

**User Story:** As a new Regular_User, I want to complete my profile and add my hotels during first-time registration, so that I can start managing my properties.

#### Acceptance Criteria

1. WHEN a new user is redirected to the user information screen, THE System SHALL display a form requesting name, phone, address, preferred language, and timezone
2. WHEN the user submits valid information, THE System SHALL update the user document in Firestore with the provided data
3. WHEN the user information is saved, THE System SHALL redirect the user to the hotel addition screen
4. WHEN the user adds at least one hotel, THE System SHALL save each hotel to the Firestore hotels collection with a unique hotelId
5. WHEN the user adds a hotel, THE System SHALL create a hotelUsers document linking the user to the hotel with owner permissions
6. THE System SHALL allow users to add multiple hotels during registration
7. WHEN the user completes hotel addition, THE System SHALL redirect them to the hotel selection screen

### Requirement 3: Super Admin User Management

**User Story:** As a Super_Admin, I want to manage all user accounts and view their hotels, so that I can maintain system integrity and assist users.

#### Acceptance Criteria

1. WHEN a Super_Admin logs in, THE System SHALL redirect them to the admin dashboard
2. THE System SHALL display a list of all users with their name, email, role, and account status
3. WHEN a Super_Admin clicks "Lock User", THE System SHALL update the user's status to locked and prevent login
4. WHEN a Super_Admin clicks "Unlock User", THE System SHALL update the user's status to active and allow login
5. WHEN a Super_Admin clicks "Reset Permissions", THE System SHALL reset the user's hotel permissions to default
6. WHEN a Super_Admin views a user's details, THE System SHALL display all hotels associated with that user
7. THE System SHALL prevent Super_Admin from deleting their own account

### Requirement 4: Multi-Tenant Hotel Selection

**User Story:** As a Regular_User with multiple hotels, I want to select which hotel I'm managing, so that I can work with the correct hotel's data.

#### Acceptance Criteria

1. WHEN a Regular_User logs in, THE System SHALL display a hotel selection modal showing all hotels they have access to
2. WHEN the user selects a hotel, THE System SHALL set the currentHotelId in the application context
3. WHEN the currentHotelId is set, THE System SHALL persist it to localStorage for session continuity
4. WHEN the user navigates to any feature, THE System SHALL filter all data by the currentHotelId
5. THE System SHALL display the current hotel name in the application header
6. WHEN the user clicks "Switch Hotel", THE System SHALL display the hotel selection modal again
7. THE System SHALL prevent access to hotel data if no hotel is selected

### Requirement 5: Dashboard Overview

**User Story:** As a Regular_User, I want to see key metrics on the dashboard, so that I can quickly understand my hotel's current status.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE System SHALL display room occupancy percentage for today
2. WHEN the dashboard loads, THE System SHALL display room occupancy percentage for the current week
3. WHEN the dashboard loads, THE System SHALL display total revenue for today
4. WHEN the dashboard loads, THE System SHALL display total revenue for the current month
5. WHEN the dashboard loads, THE System SHALL display the count of check-ins scheduled for today
6. WHEN the dashboard loads, THE System SHALL display the count of check-outs scheduled for today
7. WHEN the dashboard loads, THE System SHALL display the count of rooms marked as dirty
8. WHEN the dashboard loads, THE System SHALL display the count of rooms under maintenance
9. WHEN the dashboard loads, THE System SHALL display any active alerts or notifications
10. THE System SHALL calculate all metrics based on the currentHotelId

### Requirement 6: Reservation Management

**User Story:** As a Regular_User, I want to view, create, and manage reservations, so that I can handle guest bookings efficiently.

#### Acceptance Criteria

1. WHEN the reservations page loads, THE System SHALL display a tape chart showing room occupancy by date
2. THE System SHALL allow filtering reservations by date range, status, and source
3. WHEN the user clicks "Create Reservation", THE System SHALL display a reservation form
4. WHEN the user submits a valid reservation, THE System SHALL save it to Firestore with status "pending"
5. THE System SHALL validate that the selected room is available for the requested dates
6. WHEN the user clicks on a reservation, THE System SHALL display full reservation details
7. THE System SHALL allow editing reservation details before check-in
8. THE System SHALL allow canceling reservations with status update
9. THE System SHALL support group bookings where one customer can book multiple rooms in a single transaction

### Requirement 6.1: Group Booking Support

**User Story:** As a front desk staff member, I want to create group bookings for customers who need multiple rooms, so that I can efficiently handle multi-room reservations and avoid losing customers due to partial availability.

#### Acceptance Criteria

1. WHEN creating a group booking, THE System SHALL allow selecting multiple room types with quantities
2. WHEN room types are selected, THE System SHALL check availability for all requested rooms
3. IF any room type is unavailable, THE System SHALL suggest alternative room types (upgrades) to avoid losing the customer
4. WHEN the user confirms room selection, THE System SHALL display available specific rooms for each room type
5. WHEN the user submits a group booking, THE System SHALL create multiple reservation documents linked by a shared groupId
6. WHEN creating group reservations, THE System SHALL use a batch write transaction to ensure atomicity
7. WHEN displaying reservations, THE System SHALL group linked reservations together with expand/collapse functionality
8. WHEN viewing a group booking, THE System SHALL display all rooms in the group with their individual details
9. WHEN checking in a group booking, THE System SHALL allow checking in all rooms together or individually
10. WHEN checking out a group booking, THE System SHALL display a combined folio showing charges for all rooms
11. WHEN canceling a group booking, THE System SHALL allow canceling all rooms together or individually
12. THE System SHALL calculate total price for group bookings as the sum of all individual room prices
13. THE System SHALL store group metadata (groupId, groupSize, groupIndex, isGroupBooking) in each reservation document

### Requirement 7: Front Desk Operations

**User Story:** As a front desk staff member, I want to manage check-ins, check-outs, and payments, so that I can serve guests efficiently.

#### Acceptance Criteria

1. WHEN the front desk page loads, THE System SHALL display today's arrivals sorted by expected check-in time
2. THE System SHALL display a list of in-house guests with their room numbers and checkout dates
3. THE System SHALL display today's departures sorted by checkout time
4. THE System SHALL provide a search function to find guests or folios by name, room number, or confirmation number
5. WHEN a staff member clicks "Check In" on an arrival, THE System SHALL update the reservation status to "checked-in" and mark the room as occupied
6. WHEN a staff member clicks "Check Out" on a departure, THE System SHALL display the folio with all charges
7. WHEN a staff member processes payment, THE System SHALL update the folio balance and mark the reservation as "checked-out"
8. WHEN check-out is complete, THE System SHALL mark the room as dirty and create a housekeeping task

### Requirement 8: Room and Housekeeping Management

**User Story:** As a housekeeping manager, I want to track room status and assign cleaning tasks, so that rooms are ready for guests.

#### Acceptance Criteria

1. WHEN the rooms page loads, THE System SHALL display all rooms with their current status (vacant, occupied, dirty, maintenance)
2. THE System SHALL allow filtering rooms by status, room type, and floor
3. WHEN the housekeeping board loads, THE System SHALL display all rooms requiring cleaning
4. THE System SHALL allow assigning housekeeping tasks to specific staff members
5. WHEN a housekeeping task is completed, THE System SHALL update the room status to "clean"
6. THE System SHALL allow creating maintenance tickets for rooms requiring repair
7. WHEN a maintenance ticket is created, THE System SHALL mark the room as "under maintenance"
8. WHEN a maintenance ticket is resolved, THE System SHALL update the room status to "clean"

### Requirement 9: Pricing and Room Types

**User Story:** As a Hotel_Owner, I want to configure room types and pricing, so that I can manage rates based on demand and seasonality.

#### Acceptance Criteria

1. THE System SHALL allow creating, reading, updating, and deleting room types
2. WHEN creating a room type, THE System SHALL require a name, description, base price, and capacity
3. THE System SHALL allow setting different prices for each day of the week
4. THE System SHALL allow defining seasonal pricing with start and end dates
5. WHEN calculating reservation price, THE System SHALL apply the appropriate rate based on date and room type
6. THE System SHALL validate that seasonal date ranges do not overlap for the same room type
7. THE System SHALL display all room types with their current pricing on the pricing page

### Requirement 10: Services and Surcharges

**User Story:** As a Regular_User, I want to offer additional services and post charges to guest folios, so that I can generate additional revenue and track all guest expenses.

#### Acceptance Criteria

1. THE System SHALL allow creating, reading, updating, and deleting services
2. WHEN creating a service, THE System SHALL require a name, description, price, and category
3. THE System SHALL allow creating service orders for in-house guests
4. WHEN a service order is created, THE System SHALL post the charge to the guest's folio
5. THE System SHALL display all available services on the services page
6. THE System SHALL allow filtering service orders by date, guest, and service type
7. WHERE multi-language support is needed, THE System SHALL store service descriptions in multiple languages

### Requirement 11: Customer Management

**User Story:** As a Regular_User, I want to maintain a database of customers and corporate partners, so that I can provide personalized service and manage corporate accounts.

#### Acceptance Criteria

1. THE System SHALL allow creating, reading, updating, and deleting customer records
2. WHEN creating a customer, THE System SHALL require name, email, and phone number
3. THE System SHALL allow storing additional customer information (address, preferences, notes)
4. THE System SHALL allow creating company/partner records for corporate guests
5. WHEN creating a reservation, THE System SHALL allow selecting an existing customer or creating a new one
6. THE System SHALL display customer booking history
7. THE System SHALL allow searching customers by name, email, or phone number

### Requirement 12: Reporting

**User Story:** As a Hotel_Owner, I want to generate reports on occupancy, revenue, and reservations, so that I can analyze business performance.

#### Acceptance Criteria

1. THE System SHALL generate room occupancy reports for a specified date range
2. THE System SHALL generate revenue reports showing total revenue, revenue by room type, and revenue by service
3. THE System SHALL generate reservation reports showing bookings by source, cancellations, and no-shows
4. WHEN generating a report, THE System SHALL allow filtering by date range
5. THE System SHALL display reports in a tabular format with summary statistics
6. THE System SHALL allow exporting reports to CSV or PDF format
7. THE System SHALL calculate all report metrics based on the currentHotelId

### Requirement 13: Hotel-Level User Permissions

**User Story:** As a Hotel_Owner, I want to manage user permissions for my hotel, so that I can control who has access to different features.

#### Acceptance Criteria

1. THE System SHALL support four permission levels: owner, manager, receptionist, and housekeeping
2. WHEN a Hotel_Owner adds a user to their hotel, THE System SHALL create a hotelUsers document with the specified permission level
3. THE System SHALL restrict feature access based on permission level (e.g., housekeeping cannot access pricing)
4. THE System SHALL allow Hotel_Owners to change user permissions for their hotel
5. THE System SHALL allow Hotel_Owners to remove users from their hotel
6. THE System SHALL prevent users from accessing hotels they don't have permissions for
7. THE System SHALL display the current user's permission level in the application header

### Requirement 14: Hotel Configuration

**User Story:** As a Hotel_Owner, I want to configure hotel policies and settings, so that the system operates according to my business rules.

#### Acceptance Criteria

1. THE System SHALL allow configuring check-in and check-out times
2. THE System SHALL allow configuring cancellation policies
3. THE System SHALL allow configuring tax rates and fees
4. THE System SHALL allow configuring late checkout fees and early checkin fees
5. THE System SHALL allow configuring hotel information (name, address, contact details)
6. THE System SHALL allow configuring invoice numbering format
7. THE System SHALL allow uploading hotel logo and images
8. WHEN hotel settings are updated, THE System SHALL apply them to all future transactions
9. THE System SHALL allow users to select from multiple theme colors (blue, green, purple, red, orange, cyan)
10. WHEN a user changes theme color, THE System SHALL persist the preference to localStorage and apply it immediately
11. THE System SHALL load the user's saved theme color preference on application startup

### Requirement 15: Internationalization (i18n)

**User Story:** As a Regular_User, I want to use the system in my preferred language, so that I can work efficiently in my native language.

#### Acceptance Criteria

1. THE System SHALL support multiple languages using react-i18next
2. WHEN a user logs in, THE System SHALL load the interface in the user's preferred language from their profile
3. THE System SHALL provide a language switcher component in the application header
4. WHEN the user changes language, THE System SHALL update the interface immediately and save the preference to Firestore
5. THE System SHALL organize translations by namespace (common, sidebar, and per feature)
6. THE System SHALL lazy-load translations per route or feature to optimize performance
7. WHERE multi-language content is stored in Firestore, THE System SHALL use an object structure with language codes as keys

### Requirement 16: Protected Routes and Authorization

**User Story:** As a system architect, I want to implement route protection and role-based access control, so that users can only access features they have permissions for.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access a protected route, THE System SHALL redirect them to the login page
2. WHEN a Regular_User attempts to access Super_Admin routes, THE System SHALL display an access denied message
3. WHEN a user without hotel permissions attempts to access hotel features, THE System SHALL redirect them to hotel selection
4. THE System SHALL verify user authentication status on every route change
5. THE System SHALL verify user permissions before rendering protected components
6. THE System SHALL implement a ProtectedRoute component that wraps protected routes
7. THE System SHALL implement a RoleBasedRoute component that checks user roles

### Requirement 17: Feature-Based Architecture

**User Story:** As a developer, I want the codebase organized by feature, so that the code is maintainable and scalable.

#### Acceptance Criteria

1. THE System SHALL organize code into feature folders (dashboard, reservations, frontDesk, rooms, pricing, customers, reports, settings)
2. WHEN creating a new feature, THE System SHALL include subfolders for components, pages, constants, models, services, hooks, utils, and translations
3. THE System SHALL separate business logic from UI components using custom hooks
4. THE System SHALL implement a services layer for all Firestore operations
5. THE System SHALL define TypeScript types or interfaces for all data models
6. THE System SHALL use meaningful names for all variables, functions, and components
7. THE System SHALL avoid magic strings and numbers by defining constants

### Requirement 18: Firebase Integration

**User Story:** As a developer, I want to integrate Firebase services, so that the system has authentication, database, and storage capabilities.

#### Acceptance Criteria

1. THE System SHALL initialize Firebase with configuration from environment variables
2. THE System SHALL use Firebase_Auth for user authentication
3. THE System SHALL use Firestore for data storage with the following collections: users, hotels, hotelUsers, reservations, rooms, roomTypes, services, serviceOrders, customers, housekeepingTasks, maintenanceTickets
4. THE System SHALL use Firebase Storage for uploading hotel images and documents
5. THE System SHALL implement Firestore security rules to enforce multi-tenancy and permissions
6. THE System SHALL handle Firebase errors gracefully with user-friendly messages
7. THE System SHALL implement offline persistence for Firestore where appropriate

### Requirement 19: Form Handling and Validation

**User Story:** As a Regular_User, I want forms to validate my input and provide clear error messages, so that I can correct mistakes before submission.

#### Acceptance Criteria

1. THE System SHALL validate all form inputs before submission
2. WHEN validation fails, THE System SHALL display error messages next to the relevant fields
3. THE System SHALL prevent form submission if validation fails
4. THE System SHALL use consistent validation rules across all forms (e.g., email format, phone format)
5. THE System SHALL display loading indicators during form submission
6. WHEN form submission succeeds, THE System SHALL display a success message and clear the form or redirect
7. WHEN form submission fails, THE System SHALL display an error message and allow retry

### Requirement 20: Responsive Layout with Ant Design

**User Story:** As a Regular_User, I want a consistent and responsive user interface, so that I can use the system on different devices.

#### Acceptance Criteria

1. THE System SHALL use Ant Design components for all UI elements
2. THE System SHALL implement a layout with header, sidebar, and content area
3. THE System SHALL display a collapsible sidebar with navigation menu
4. THE System SHALL display breadcrumbs showing the current page hierarchy
5. THE System SHALL adapt the layout for mobile, tablet, and desktop screen sizes
6. THE System SHALL use Ant Design's theming system for consistent styling
7. THE System SHALL display loading states using Ant Design Spin component
