import { db } from '../db';
import { sparePartsTable } from '../db/schema';
import { type CreateSparePartInput, type SparePart } from '../schema';

export const createSparePart = async (input: CreateSparePartInput): Promise<SparePart> => {
  try {
    // Insert spare part record
    const result = await db.insert(sparePartsTable)
      .values({
        name: input.name,
        description: input.description,
        part_number: input.part_number,
        stock_quantity: input.stock_quantity,
        unit_price: input.unit_price.toString(), // Convert number to string for numeric column
        supplier: input.supplier
      })
      .returning()
      .execute();

    // Convert numeric field back to number before returning
    const sparePart = result[0];
    return {
      ...sparePart,
      unit_price: parseFloat(sparePart.unit_price) // Convert string back to number
    };
  } catch (error) {
    console.error('Spare part creation failed:', error);
    throw error;
  }
};