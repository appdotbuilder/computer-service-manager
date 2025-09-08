import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type Service } from '../schema';

export const getServices = async (): Promise<Service[]> => {
  try {
    // Fetch all services from the database
    const results = await db.select()
      .from(servicesTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(service => ({
      ...service,
      service_cost: parseFloat(service.service_cost) // Convert string back to number
    }));
  } catch (error) {
    console.error('Get services failed:', error);
    throw error;
  }
};