/**
 * Remove undefined values from an object
 * Firestore doesn't accept undefined values, so we need to remove them
 * before sending data to Firestore
 */
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  
  return result;
}

/**
 * Deep remove undefined values from an object
 * This will recursively remove undefined values from nested objects
 */
export function deepRemoveUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  for (const key in obj) {
    const value = obj[key];
    
    if (value === undefined) {
      continue;
    }
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively clean nested objects
      result[key] = deepRemoveUndefinedFields(value) as any;
    } else {
      result[key] = value;
    }
  }
  
  return result;
}
