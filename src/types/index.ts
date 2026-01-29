import { Timestamp } from 'firebase/firestore';

/**
 * Multi-language text support for i18n content
 */
export interface MultiLanguageText {
  en?: string;
  vi?: string;
  [key: string]: string | undefined;
}

/**
 * User document stored in Firestore users collection
 */
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'super_admin' | 'regular';
  language: string;
  phone?: string;
  address?: string;
  timezone?: string;
  status: 'active' | 'locked';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Hotel document stored in Firestore hotels collection
 */
export interface Hotel {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  taxRate: number;
  currency: string;
  cancellationPolicy: string;
  lateCheckoutFee: number;
  earlyCheckinFee: number;
  invoicePrefix: string;
  invoiceCounter: number;
  logoUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Hotel user permissions document stored in Firestore hotelUsers collection
 */
export interface HotelUser {
  id: string;
  hotelId: string;
  userId: string;
  permission: 'owner' | 'manager' | 'receptionist' | 'housekeeping';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Weekday pricing configuration
 */
export interface WeekdayPricing {
  monday?: number;
  tuesday?: number;
  wednesday?: number;
  thursday?: number;
  friday?: number;
  saturday?: number;
  sunday?: number;
}

/**
 * Seasonal pricing period
 */
export interface SeasonalPricing {
  startDate: string;
  endDate: string;
  price: number;
}

/**
 * Room type document stored in Firestore roomTypes collection
 */
export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description: MultiLanguageText;
  basePrice: number;
  capacity: number;
  amenities: string[];
  weekdayPricing?: WeekdayPricing;
  seasonalPricing?: SeasonalPricing[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Room document stored in Firestore rooms collection
 */
export interface Room {
  id: string;
  hotelId: string;
  roomNumber: string;
  roomTypeId: string;
  floor: number;
  status: 'vacant' | 'occupied' | 'dirty' | 'maintenance' | 'reserved';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Reservation document stored in Firestore reservations collection
 */
export interface Reservation {
  id: string;
  hotelId: string;
  confirmationNumber: string;
  customerId: string;
  roomId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show';
  source: 'direct' | 'booking.com' | 'airbnb' | 'phone' | 'walk-in' | 'other';
  totalPrice: number;
  paidAmount: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  checkedInAt?: Timestamp;
  checkedOutAt?: Timestamp;
  // Group booking fields
  groupId?: string;
  groupSize?: number;
  groupIndex?: number;
  isGroupBooking: boolean;
}

/**
 * Customer document stored in Firestore customers collection
 */
export interface Customer {
  id: string;
  hotelId: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  nationality?: string;
  idNumber?: string;
  companyId?: string;
  preferences?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Company document stored in Firestore companies collection
 */
export interface Company {
  id: string;
  hotelId: string;
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  contactPerson?: string;
  discountRate?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Service document stored in Firestore services collection
 */
export interface Service {
  id: string;
  hotelId: string;
  name: string;
  description: MultiLanguageText;
  price: number;
  category: 'laundry' | 'food' | 'transport' | 'spa' | 'other';
  taxable: boolean;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Service order document stored in Firestore serviceOrders collection
 */
export interface ServiceOrder {
  id: string;
  hotelId: string;
  reservationId: string;
  serviceId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'completed' | 'cancelled';
  orderedAt: Timestamp;
  completedAt?: Timestamp;
  notes?: string;
}

/**
 * Housekeeping task document stored in Firestore housekeepingTasks collection
 */
export interface HousekeepingTask {
  id: string;
  hotelId: string;
  roomId: string;
  assignedTo?: string;
  taskType: 'clean' | 'deep-clean' | 'turndown' | 'inspection';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  notes?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

/**
 * Maintenance ticket document stored in Firestore maintenanceTickets collection
 */
export interface MaintenanceTicket {
  id: string;
  hotelId: string;
  roomId: string;
  reportedBy: string;
  assignedTo?: string;
  issue: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

/**
 * Filters for querying reservations
 */
export interface ReservationFilters {
  startDate?: string;
  endDate?: string;
  status?: Reservation['status'];
  source?: Reservation['source'];
  customerId?: string;
}

/**
 * Request for checking room type availability in group booking
 */
export interface RoomTypeAvailabilityRequest {
  roomTypeId: string;
  quantity: number;
}

/**
 * Result of room type availability check
 */
export interface RoomTypeAvailabilityResult {
  roomTypeId: string;
  requested: number;
  available: number;
  isAvailable: boolean;
}

/**
 * Alternative room type suggestion
 */
export interface AlternativeRoomType {
  roomTypeId: string;
  roomType: RoomType;
  availableCount: number;
  priceComparison: number; // Percentage difference from original (e.g., 20 means 20% more expensive)
}

/**
 * Input for creating a single reservation in a group booking
 */
export interface GroupReservationInput {
  roomId: string;
  roomTypeId: string;
  numberOfGuests: number;
  totalPrice: number;
}

/**
 * Input for creating a group booking
 */
export interface CreateGroupBookingInput {
  hotelId: string;
  customerId: string;
  checkInDate: string;
  checkOutDate: string;
  source: Reservation['source'];
  reservations: GroupReservationInput[];
  notes?: string;
}

/**
 * Input data for creating a reservation
 */
export type CreateReservationInput = Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'confirmationNumber'>;

/**
 * Input data for creating a room
 */
export type CreateRoomInput = Omit<Room, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input data for creating a customer
 */
export type CreateCustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input data for creating a room type
 */
export type CreateRoomTypeInput = Omit<RoomType, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input data for creating a maintenance ticket
 */
export type CreateMaintenanceTicketInput = Omit<MaintenanceTicket, 'id' | 'createdAt' | 'resolvedAt'>;
