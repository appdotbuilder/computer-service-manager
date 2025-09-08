import { db } from '../db';
import { sparePartsTable } from '../db/schema';
import { type SparePart } from '../schema';

export const getSpareParts = async (): Promise<SparePart[]> => {
  try {
    const results = await db.select()
      .from(sparePartsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(sparePart => ({
      ...sparePart,
      unit_price: parseFloat(sparePart.unit_price)
    }));
  } catch (error) {
    console.error('Failed to fetch spare parts:', error);
    throw error;
  }
};