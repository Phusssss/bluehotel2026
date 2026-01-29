import { describe, it, expect } from 'vitest';
import { calculateReservationPrice, PricingInput } from './pricingCalculator';
import { RoomType } from '@/types';
import { Timestamp } from 'firebase/firestore';

describe('calculateReservationPrice', () => {
  const baseRoomType: RoomType = {
    id: 'room-type-1',
    hotelId: 'hotel-1',
    name: 'Standard Room',
    description: { en: 'A standard room' },
    basePrice: 100,
    capacity: 2,
    amenities: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  it('should calculate price using base price only', () => {
    const input: PricingInput = {
      roomType: baseRoomType,
      checkInDate: '2024-01-15',
      checkOutDate: '2024-01-18',
    };

    const result = calculateReservationPrice(input, 10);

    expect(result.nights).toBe(3);
    expect(result.breakdown).toHaveLength(3);
    expect(result.breakdown[0].price).toBe(100);
    expect(result.breakdown[1].price).toBe(100);
    expect(result.breakdown[2].price).toBe(100);
    expect(result.subtotal).toBe(300);
    expect(result.tax).toBe(30);
    expect(result.total).toBe(330);
  });

  it('should apply weekday pricing when available', () => {
    const roomTypeWithWeekday: RoomType = {
      ...baseRoomType,
      weekdayPricing: {
        monday: 90,
        tuesday: 90,
        wednesday: 90,
        thursday: 90,
        friday: 120,
        saturday: 150,
        sunday: 150,
      },
    };

    const input: PricingInput = {
      roomType: roomTypeWithWeekday,
      checkInDate: '2024-01-15', // Monday
      checkOutDate: '2024-01-18', // Thursday
    };

    const result = calculateReservationPrice(input, 10);

    expect(result.nights).toBe(3);
    expect(result.breakdown[0].price).toBe(90); // Monday
    expect(result.breakdown[1].price).toBe(90); // Tuesday
    expect(result.breakdown[2].price).toBe(90); // Wednesday
    expect(result.subtotal).toBe(270);
    expect(result.tax).toBe(27);
    expect(result.total).toBe(297);
  });

  it('should apply seasonal pricing over weekday pricing', () => {
    const roomTypeWithSeasonal: RoomType = {
      ...baseRoomType,
      weekdayPricing: {
        monday: 90,
        tuesday: 90,
        wednesday: 90,
        thursday: 90,
        friday: 120,
        saturday: 150,
        sunday: 150,
      },
      seasonalPricing: [
        {
          startDate: '2024-01-16',
          endDate: '2024-01-17',
          price: 200,
        },
      ],
    };

    const input: PricingInput = {
      roomType: roomTypeWithSeasonal,
      checkInDate: '2024-01-15', // Monday
      checkOutDate: '2024-01-18', // Thursday
    };

    const result = calculateReservationPrice(input, 10);

    expect(result.nights).toBe(3);
    expect(result.breakdown[0].price).toBe(90); // Monday - weekday pricing
    expect(result.breakdown[1].price).toBe(200); // Tuesday - seasonal pricing
    expect(result.breakdown[2].price).toBe(200); // Wednesday - seasonal pricing
    expect(result.subtotal).toBe(490);
    expect(result.tax).toBe(49);
    expect(result.total).toBe(539);
  });

  it('should handle single night stay', () => {
    const input: PricingInput = {
      roomType: baseRoomType,
      checkInDate: '2024-01-15',
      checkOutDate: '2024-01-16',
    };

    const result = calculateReservationPrice(input, 10);

    expect(result.nights).toBe(1);
    expect(result.breakdown).toHaveLength(1);
    expect(result.subtotal).toBe(100);
    expect(result.tax).toBe(10);
    expect(result.total).toBe(110);
  });

  it('should handle zero tax rate', () => {
    const input: PricingInput = {
      roomType: baseRoomType,
      checkInDate: '2024-01-15',
      checkOutDate: '2024-01-17',
    };

    const result = calculateReservationPrice(input, 0);

    expect(result.nights).toBe(2);
    expect(result.subtotal).toBe(200);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(200);
  });

  it('should handle multiple seasonal periods', () => {
    const roomTypeWithMultipleSeasonal: RoomType = {
      ...baseRoomType,
      seasonalPricing: [
        {
          startDate: '2024-01-15',
          endDate: '2024-01-16',
          price: 180,
        },
        {
          startDate: '2024-01-18',
          endDate: '2024-01-19',
          price: 220,
        },
      ],
    };

    const input: PricingInput = {
      roomType: roomTypeWithMultipleSeasonal,
      checkInDate: '2024-01-15',
      checkOutDate: '2024-01-20',
    };

    const result = calculateReservationPrice(input, 10);

    expect(result.nights).toBe(5);
    expect(result.breakdown[0].price).toBe(180); // Jan 15 - seasonal
    expect(result.breakdown[1].price).toBe(180); // Jan 16 - seasonal
    expect(result.breakdown[2].price).toBe(100); // Jan 17 - base
    expect(result.breakdown[3].price).toBe(220); // Jan 18 - seasonal
    expect(result.breakdown[4].price).toBe(220); // Jan 19 - seasonal
    expect(result.subtotal).toBe(900);
  });

  it('should handle weekend pricing correctly', () => {
    const roomTypeWithWeekend: RoomType = {
      ...baseRoomType,
      weekdayPricing: {
        friday: 120,
        saturday: 150,
        sunday: 150,
      },
    };

    const input: PricingInput = {
      roomType: roomTypeWithWeekend,
      checkInDate: '2024-01-19', // Friday
      checkOutDate: '2024-01-22', // Monday
    };

    const result = calculateReservationPrice(input, 10);

    expect(result.nights).toBe(3);
    expect(result.breakdown[0].price).toBe(120); // Friday
    expect(result.breakdown[1].price).toBe(150); // Saturday
    expect(result.breakdown[2].price).toBe(150); // Sunday
    expect(result.subtotal).toBe(420);
  });

  it('should format dates correctly in breakdown', () => {
    const input: PricingInput = {
      roomType: baseRoomType,
      checkInDate: '2024-01-15',
      checkOutDate: '2024-01-17',
    };

    const result = calculateReservationPrice(input, 10);

    expect(result.breakdown[0].date).toBe('2024-01-15');
    expect(result.breakdown[1].date).toBe('2024-01-16');
  });
});
