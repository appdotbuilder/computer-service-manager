import { db } from '../db';
import { sparePartsTable } from '../db/schema';
import { type SparePart } from '../schema';
import { eq } from 'drizzle-orm';

export const getOutOfStockParts = async (): Promise<SparePart[]> => {
  try {
    // Query spare parts with stock quantity of 0
    const results = await db.select()
      .from(sparePartsTable)
      .where(eq(sparePartsTable.stock_quantity, 0))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(part => ({
      ...part,
      unit_price: parseFloat(part.unit_price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch out of stock parts:', error);
    throw error;
  }
};