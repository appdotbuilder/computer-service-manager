import { db } from '../db';
import { serviceSparePartsTable, sparePartsTable, servicesTable } from '../db/schema';
import { type UseSparePartInput, type ServiceSparePart } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const useSparePartInService = async (input: UseSparePartInput): Promise<ServiceSparePart> => {
  try {
    // Execute transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // First, verify that the service exists
      const services = await tx.select()
        .from(servicesTable)
        .where(eq(servicesTable.id, input.service_id))
        .execute();

      if (services.length === 0) {
        throw new Error(`Service with id ${input.service_id} not found`);
      }

      // Then, verify spare part exists and has sufficient stock
      const spareParts = await tx.select()
        .from(sparePartsTable)
        .where(eq(sparePartsTable.id, input.spare_part_id))
        .execute();

      if (spareParts.length === 0) {
        throw new Error(`Spare part with id ${input.spare_part_id} not found`);
      }

      const sparePart = spareParts[0];
      if (sparePart.stock_quantity < input.quantity_used) {
        throw new Error(`Insufficient stock. Available: ${sparePart.stock_quantity}, Requested: ${input.quantity_used}`);
      }

      // Record spare part usage
      const usageResult = await tx.insert(serviceSparePartsTable)
        .values({
          service_id: input.service_id,
          spare_part_id: input.spare_part_id,
          quantity_used: input.quantity_used
        })
        .returning()
        .execute();

      // Update spare part stock quantity
      await tx.update(sparePartsTable)
        .set({
          stock_quantity: sql`${sparePartsTable.stock_quantity} - ${input.quantity_used}`
        })
        .where(eq(sparePartsTable.id, input.spare_part_id))
        .execute();

      return usageResult[0];
    });

    return result;
  } catch (error) {
    console.error('Spare part usage failed:', error);
    throw error;
  }
};