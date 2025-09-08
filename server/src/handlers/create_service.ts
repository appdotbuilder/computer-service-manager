import { db } from '../db';
import { servicesTable, customersTable } from '../db/schema';
import { type CreateServiceInput, type Service } from '../schema';
import { eq } from 'drizzle-orm';

export const createService = async (input: CreateServiceInput): Promise<Service> => {
  try {
    // Verify that the customer exists
    const customer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.customer_id))
      .execute();

    if (customer.length === 0) {
      throw new Error(`Customer with ID ${input.customer_id} not found`);
    }

    // Insert service record
    const result = await db.insert(servicesTable)
      .values({
        customer_id: input.customer_id,
        start_date: input.start_date,
        problem_description: input.problem_description,
        service_cost: input.service_cost.toString(), // Convert number to string for numeric column
        status: 'in_progress',
        completion_date: null, // New services are not completed yet
        repair_description: null // Not filled initially
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const service = result[0];
    return {
      ...service,
      service_cost: parseFloat(service.service_cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Service creation failed:', error);
    throw error;
  }
};