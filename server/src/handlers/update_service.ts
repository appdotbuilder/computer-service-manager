import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type UpdateServiceInput, type Service } from '../schema';
import { eq } from 'drizzle-orm';

export const updateService = async (input: UpdateServiceInput): Promise<Service> => {
  try {
    // Check if service exists before updating
    const existingService = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, input.id))
      .execute();

    if (existingService.length === 0) {
      throw new Error(`Service with id ${input.id} not found`);
    }

    // Prepare update data - only include fields that are provided
    const updateData: Partial<typeof servicesTable.$inferInsert> = {};

    if (input.completion_date !== undefined) {
      updateData.completion_date = input.completion_date;
    }

    if (input.repair_description !== undefined) {
      updateData.repair_description = input.repair_description;
    }

    if (input.service_cost !== undefined) {
      updateData.service_cost = input.service_cost.toString(); // Convert number to string for numeric column
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update the service record
    const result = await db.update(servicesTable)
      .set(updateData)
      .where(eq(servicesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const service = result[0];
    return {
      ...service,
      service_cost: parseFloat(service.service_cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Service update failed:', error);
    throw error;
  }
};