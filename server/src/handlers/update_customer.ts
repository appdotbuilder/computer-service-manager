import { db } from '../db';
import { customersTable } from '../db/schema';
import { type UpdateCustomerInput, type Customer } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCustomer = async (input: UpdateCustomerInput): Promise<Customer> => {
  try {
    // First check if customer exists
    const existingCustomers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();

    if (existingCustomers.length === 0) {
      throw new Error(`Customer with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<{
      name: string;
      email: string;
      phone: string;
      address: string | null;
    }> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.address !== undefined) {
      updateData.address = input.address;
    }

    // If no fields to update, return existing customer
    if (Object.keys(updateData).length === 0) {
      return existingCustomers[0];
    }

    // Update customer record
    const result = await db.update(customersTable)
      .set(updateData)
      .where(eq(customersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Customer update failed:', error);
    throw error;
  }
};