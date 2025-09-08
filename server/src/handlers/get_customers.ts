import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer } from '../schema';

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    // Fetch all customers from the database
    const results = await db.select()
      .from(customersTable)
      .execute();

    // Return the customers directly as the schema matches
    return results;
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw error;
  }
};