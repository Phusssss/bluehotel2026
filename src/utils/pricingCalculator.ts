import dayjs from 'dayjs';
import { RoomType } from '@/types';

/**
 * Input for pricing calculation
 */
export interface PricingInput {
  roomType: RoomType;
  checkInDate: string;
  checkOutDate: string;
}

/**
 * Result of pricing calculation
 */
export interface PricingResult {
  nights: number;
  breakdown: Array<{ date: string; price: number }>;
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Calculate reservation price based on dates and room type
 * 
 * Pricing priority:
 * 1. Seasonal pricing (if date falls within a seasonal period)
 * 2. Weekday pricing (if no seasonal pricing applies)
 * 3. Base price (if neither seasonal nor weekday pricing applies)
 * 
 * @param input - Pricing input containing room type and dates
 * @param taxRate - Tax rate as a percentage (e.g., 10 for 10%)
 * @returns Pricing result with breakdown, subtotal, tax, and total
 */
export function calculateReservationPrice(
  input: PricingInput,
  taxRate: number
): PricingResult {
  const { roomType, checkInDate, checkOutDate } = input;
  const checkIn = dayjs(checkInDate);
  const checkOut = dayjs(checkOutDate);
  const nights = checkOut.diff(checkIn, 'day');
  
  const breakdown: Array<{ date: string; price: number }> = [];
  let subtotal = 0;
  
  for (let i = 0; i < nights; i++) {
    const currentDate = checkIn.add(i, 'day');
    const dateStr = currentDate.format('YYYY-MM-DD');
    const dayOfWeek = currentDate.format('dddd').toLowerCase();
    
    // Start with base price
    let price = roomType.basePrice;
    
    // Check seasonal pricing first (highest priority)
    if (roomType.seasonalPricing && roomType.seasonalPricing.length > 0) {
      const seasonalRate = roomType.seasonalPricing.find(
        (season) => dateStr >= season.startDate && dateStr <= season.endDate
      );
      if (seasonalRate) {
        price = seasonalRate.price;
        breakdown.push({ date: dateStr, price });
        subtotal += price;
        continue;
      }
    }
    
    // Apply weekday pricing if no seasonal pricing (second priority)
    if (roomType.weekdayPricing && roomType.weekdayPricing[dayOfWeek as keyof typeof roomType.weekdayPricing]) {
      const weekdayPrice = roomType.weekdayPricing[dayOfWeek as keyof typeof roomType.weekdayPricing];
      if (weekdayPrice !== undefined && weekdayPrice !== null) {
        price = weekdayPrice;
      }
    }
    
    breakdown.push({ date: dateStr, price });
    subtotal += price;
  }
  
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  
  return { nights, breakdown, subtotal, tax, total };
}
