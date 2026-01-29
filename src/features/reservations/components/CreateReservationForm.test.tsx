import { describe, it, expect, beforeEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { calculateReservationPrice } from '../../../utils/pricingCalculator';
import type { RoomType } from '../../../types';

describe('CreateReservationForm - Pricing Calculator Integration', () => {
  let mockRoomType: RoomType;

  beforeEach(() => {
    mockRoomType = {
      id: 'rt-1',
      hotelId: 'hotel-1',
      name: 'Deluxe Room',
      description: { en: 'A deluxe room' },
      basePrice: 100,
      capacity: 2,
      amenities: ['WiFi', 'TV'],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  });

  it('should calculate price correctly using calculateReservationPrice', () => {
    const result = calculateReservationPrice(
      {
        roomType: mockRoomType,
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-03',
      },
      10 // 10% tax
    );

    expect(result.nights).toBe(2);
    expect(result.subtotal).toBe(200); // 2 nights * 100
    expect(result.tax).toBe(20); // 10% of 200
    expect(result.total).toBe(220); // 200 + 20
  });

  it('should calculate price with weekday pricing', () => {
    const roomTypeWithWeekdayPricing: RoomType = {
      ...mockRoomType,
      weekdayPricing: {
        monday: 80,
        tuesday: 80,
        wednesday: 80,
        thursday: 80,
        friday: 120,
        saturday: 150,
        sunday: 150,
      },
    };

    // Jan 1, 2024 is Monday, Jan 2 is Tuesday
    const result = calculateReservationPrice(
      {
        roomType: roomTypeWithWeekdayPricing,
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-03',
      },
      10
    );

    expect(result.nights).toBe(2);
    expect(result.subtotal).toBe(160); // 80 (Mon) + 80 (Tue)
    expect(result.tax).toBe(16);
    expect(result.total).toBe(176);
  });

  it('should calculate price with seasonal pricing', () => {
    const roomTypeWithSeasonalPricing: RoomType = {
      ...mockRoomType,
      seasonalPricing: [
        {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          price: 150,
        },
      ],
    };

    const result = calculateReservationPrice(
      {
        roomType: roomTypeWithSeasonalPricing,
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-03',
      },
      10
    );

    expect(result.nights).toBe(2);
    expect(result.subtotal).toBe(300); // 2 nights * 150 (seasonal price)
    expect(result.tax).toBe(30);
    expect(result.total).toBe(330);
  });

  it('should return breakdown with correct dates and prices', () => {
    const result = calculateReservationPrice(
      {
        roomType: mockRoomType,
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-03',
      },
      10
    );

    expect(result.breakdown).toHaveLength(2);
    expect(result.breakdown[0]).toEqual({ date: '2024-01-01', price: 100 });
    expect(result.breakdown[1]).toEqual({ date: '2024-01-02', price: 100 });
  });
});
