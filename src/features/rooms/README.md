# Rooms Feature

## Overview
The Rooms feature provides comprehensive room management capabilities with two viewing modes: Table View and Floor Map View.

## Features

### 1. Table View
- **Responsive table** displaying all rooms with:
  - Room Number (fixed left column on mobile)
  - Room Type (hidden on mobile)
  - Floor (hidden on mobile)
  - Status (always visible)
  - Notes (hidden on tablets and below)
- **Sortable columns** for easy organization
- **Pagination** with configurable page size
- **Responsive design** that adapts to different screen sizes

### 2. Floor Map View
- **Visual floor plan** showing rooms organized by floor
- **Color-coded room cards** based on status:
  - Green: Vacant
  - Blue: Occupied
  - Orange: Dirty
  - Red: Maintenance
  - Purple: Reserved
- **Responsive grid layout**:
  - Mobile (xs): 2 rooms per row
  - Small tablets (sm): 3 rooms per row
  - Tablets (md): 4 rooms per row
  - Laptops (lg): 6 rooms per row
  - Desktops (xl): 8 rooms per row
- **Hover tooltips** showing detailed room information
- **Floors sorted** from top to bottom (highest floor first)

### 3. Filtering
- **Search by room number** with instant filtering
- **Filter by status**: vacant, occupied, dirty, maintenance, reserved
- **Filter by room type**: dynamically loaded from database
- **Filter by floor**: dynamically generated from available rooms
- **Reset filters** button to clear all filters

### 4. View Mode Toggle
- **Segmented control** to switch between Table and Floor Map views
- **Persistent selection** during the session
- **Icons** for better visual identification

## Components

### RoomsPage
Main page component that handles:
- View mode switching
- Filter management
- Data fetching via useRooms hook
- Rendering appropriate view based on mode

### FloorMapView
Specialized component for floor map visualization:
- Groups rooms by floor
- Displays rooms in a responsive grid
- Shows room status with color coding
- Provides tooltips with detailed information

### useRooms Hook
Custom hook that manages:
- Room data fetching
- Room type data fetching
- Filter state management
- Room status updates
- Helper functions for data manipulation

## Translations

Supports multiple languages (English and Vietnamese):
- View mode labels
- Filter labels
- Status labels
- Table headers
- Floor map labels

## Responsive Breakpoints

- **xs** (< 576px): Mobile phones
- **sm** (≥ 576px): Small tablets
- **md** (≥ 768px): Tablets
- **lg** (≥ 992px): Laptops
- **xl** (≥ 1200px): Desktops

## Usage

Navigate to `/rooms` to access the Rooms page. Use the view mode toggle to switch between table and floor map views. Apply filters to narrow down the room list.

## Future Enhancements

- Room details modal with edit capabilities
- Drag-and-drop room assignment
- Real-time status updates
- Room availability calendar
- Bulk status updates
