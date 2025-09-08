import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type ServiceHistoryInput, type Service } from '../schema';
import { eq } from 'drizzle-orm';

export const getServiceHistory = async (input: ServiceHistoryInput): Promise<Service[]> => {
  try {
    // Query all services for the specified customer
    const results = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.customer_id, input.customer_id))
      .execute();

    // Convert numeric fields to numbers before returning
    return results.map(service => ({
      ...service,
      service_cost: parseFloat(service.service_cost) // Convert numeric string to number
    }));
  } catch (error) {
    console.error('Service history retrieval failed:', error);
    throw error;
  }
};