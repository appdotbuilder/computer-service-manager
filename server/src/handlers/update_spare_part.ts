import { db } from '../db';
import { sparePartsTable } from '../db/schema';
import { type UpdateSparePartInput, type SparePart } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSparePart = async (input: UpdateSparePartInput): Promise<SparePart> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.part_number !== undefined) {
      updateData.part_number = input.part_number;
    }
    if (input.stock_quantity !== undefined) {
      updateData.stock_quantity = input.stock_quantity;
    }
    if (input.unit_price !== undefined) {
      updateData.unit_price = input.unit_price.toString(); // Convert number to string for numeric column
    }
    if (input.supplier !== undefined) {
      updateData.supplier = input.supplier;
    }

    // Update spare part record
    const result = await db.update(sparePartsTable)
      .set(updateData)
      .where(eq(sparePartsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Spare part with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const sparePart = result[0];
    return {
      ...sparePart,
      unit_price: parseFloat(sparePart.unit_price) // Convert string back to number
    };
  } catch (error) {
    console.error('Spare part update failed:', error);
    throw error;
  }
};