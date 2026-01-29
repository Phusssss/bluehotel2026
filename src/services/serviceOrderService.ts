import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { deepRemoveUndefinedFields } from '../utils/firestore';
import type { ServiceOrder } from '../types';

/**
 * Input data for creating a service order
 */
export interface CreateServiceOrderInput {
  hotelId: string;
  reservationId: string;
  serviceId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

/**
 * Service class for managing service orders in Firestore
 */
export class ServiceOrderService {
  private collectionName = 'serviceOrders';

  /**
   * Get all service orders for a hotel
   */
  async getServiceOrders(hotelId: string): Promise<ServiceOrder[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId),
        orderBy('orderedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ServiceOrder[];
    } catch (error) {
      console.error('Error getting service orders:', error);
      throw new Error('Failed to fetch service orders');
    }
  }

  /**
   * Get service orders for a specific reservation
   */
  async getServiceOrdersByReservation(
    hotelId: string,
    reservationId: string
  ): Promise<ServiceOrder[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('hotelId', '==', hotelId),
        where('reservationId', '==', reservationId),
        orderBy('orderedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ServiceOrder[];
    } catch (error) {
      console.error('Error getting service orders by reservation:', error);
      throw new Error('Failed to fetch service orders');
    }
  }

  /**
   * Get a single service order by ID
   */
  async getServiceOrderById(id: string): Promise<ServiceOrder | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as ServiceOrder;
    } catch (error) {
      console.error('Error getting service order:', error);
      throw new Error('Failed to fetch service order');
    }
  }

  /**
   * Create a new service order and update reservation total
   */
  async createServiceOrder(data: CreateServiceOrderInput): Promise<string> {
    try {
      // Validate required fields
      if (!data.serviceId || !data.reservationId || data.quantity <= 0) {
        throw new Error('Service, reservation, and valid quantity are required');
      }

      const now = Timestamp.now();
      const totalPrice = data.unitPrice * data.quantity;

      // Use batch write to update both service order and reservation
      const batch = writeBatch(db);

      // Create service order
      const serviceOrderRef = doc(collection(db, this.collectionName));
      const serviceOrderData = deepRemoveUndefinedFields({
        hotelId: data.hotelId,
        reservationId: data.reservationId,
        serviceId: data.serviceId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice,
        status: 'pending',
        orderedAt: now,
        notes: data.notes,
      });

      batch.set(serviceOrderRef, serviceOrderData);

      // Update reservation totalPrice
      const reservationRef = doc(db, 'reservations', data.reservationId);
      const reservationSnap = await getDoc(reservationRef);

      if (!reservationSnap.exists()) {
        throw new Error('Reservation not found');
      }

      const currentTotal = reservationSnap.data().totalPrice || 0;
      const newTotal = currentTotal + totalPrice;

      batch.update(reservationRef, {
        totalPrice: newTotal,
        updatedAt: now,
      });

      await batch.commit();

      return serviceOrderRef.id;
    } catch (error) {
      console.error('Error creating service order:', error);
      throw error;
    }
  }

  /**
   * Update service order status
   */
  async updateServiceOrderStatus(
    id: string,
    status: ServiceOrder['status']
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Service order not found');
      }

      const updateData: any = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (status === 'completed') {
        updateData.completedAt = Timestamp.now();
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating service order status:', error);
      throw error;
    }
  }

  /**
   * Cancel a service order and refund to reservation
   */
  async cancelServiceOrder(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Service order not found');
      }

      const orderData = docSnap.data() as ServiceOrder;

      if (orderData.status === 'cancelled') {
        throw new Error('Service order is already cancelled');
      }

      // Use batch write to update both service order and reservation
      const batch = writeBatch(db);

      // Update service order status
      batch.update(docRef, {
        status: 'cancelled',
        updatedAt: Timestamp.now(),
      });

      // Refund to reservation
      const reservationRef = doc(db, 'reservations', orderData.reservationId);
      const reservationSnap = await getDoc(reservationRef);

      if (reservationSnap.exists()) {
        const currentTotal = reservationSnap.data().totalPrice || 0;
        const newTotal = Math.max(0, currentTotal - orderData.totalPrice);

        batch.update(reservationRef, {
          totalPrice: newTotal,
          updatedAt: Timestamp.now(),
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error cancelling service order:', error);
      throw error;
    }
  }

  /**
   * Calculate total charges for a reservation
   */
  async calculateReservationCharges(
    hotelId: string,
    reservationId: string
  ): Promise<{
    roomCharge: number;
    serviceCharges: number;
    total: number;
  }> {
    try {
      // Get reservation
      const reservationRef = doc(db, 'reservations', reservationId);
      const reservationSnap = await getDoc(reservationRef);

      if (!reservationSnap.exists()) {
        throw new Error('Reservation not found');
      }

      const reservation = reservationSnap.data();
      const roomCharge = reservation.totalPrice || 0;

      // Get service orders
      const serviceOrders = await this.getServiceOrdersByReservation(
        hotelId,
        reservationId
      );

      const serviceCharges = serviceOrders
        .filter((order) => order.status !== 'cancelled')
        .reduce((sum, order) => sum + order.totalPrice, 0);

      return {
        roomCharge,
        serviceCharges,
        total: roomCharge + serviceCharges,
      };
    } catch (error) {
      console.error('Error calculating reservation charges:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const serviceOrderService = new ServiceOrderService();
