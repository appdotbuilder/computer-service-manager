import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type UpdateCustomerInput } from '../schema';
import { updateCustomer } from '../handlers/update_customer';
import { eq } from 'drizzle-orm';

// Test setup data
const testCustomer: CreateCustomerInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  address: '123 Main St'
};

describe('updateCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update customer name only', async () => {
    // Create initial customer
    const [createdCustomer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Jane Doe'
    };

    const result = await updateCustomer(updateInput);

    // Verify updated fields
    expect(result.name).toEqual('Jane Doe');
    // Verify unchanged fields
    expect(result.email).toEqual(testCustomer.email);
    expect(result.phone).toEqual(testCustomer.phone);
    expect(result.address).toEqual(testCustomer.address);
    expect(result.id).toEqual(createdCustomer.id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    // Create initial customer
    const [createdCustomer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '987-654-3210'
    };

    const result = await updateCustomer(updateInput);

    // Verify all updated fields
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toEqual('987-654-3210');
    // Verify unchanged field
    expect(result.address).toEqual(testCustomer.address);
    expect(result.id).toEqual(createdCustomer.id);
  });

  it('should update address to null', async () => {
    // Create initial customer
    const [createdCustomer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      address: null
    };

    const result = await updateCustomer(updateInput);

    expect(result.address).toBeNull();
    // Verify other fields unchanged
    expect(result.name).toEqual(testCustomer.name);
    expect(result.email).toEqual(testCustomer.email);
    expect(result.phone).toEqual(testCustomer.phone);
  });

  it('should update address from null to value', async () => {
    // Create customer with null address
    const customerWithoutAddress = { ...testCustomer, address: null };
    const [createdCustomer] = await db.insert(customersTable)
      .values(customerWithoutAddress)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      address: '456 Oak Street'
    };

    const result = await updateCustomer(updateInput);

    expect(result.address).toEqual('456 Oak Street');
    // Verify other fields unchanged
    expect(result.name).toEqual(testCustomer.name);
    expect(result.email).toEqual(testCustomer.email);
    expect(result.phone).toEqual(testCustomer.phone);
  });

  it('should save updated customer to database', async () => {
    // Create initial customer
    const [createdCustomer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    await updateCustomer(updateInput);

    // Query database directly to verify persistence
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, createdCustomer.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Updated Name');
    expect(customers[0].email).toEqual('updated@example.com');
    expect(customers[0].phone).toEqual(testCustomer.phone);
    expect(customers[0].address).toEqual(testCustomer.address);
  });

  it('should return existing customer when no fields provided', async () => {
    // Create initial customer
    const [createdCustomer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id
    };

    const result = await updateCustomer(updateInput);

    // Should return unchanged customer
    expect(result.name).toEqual(testCustomer.name);
    expect(result.email).toEqual(testCustomer.email);
    expect(result.phone).toEqual(testCustomer.phone);
    expect(result.address).toEqual(testCustomer.address);
    expect(result.id).toEqual(createdCustomer.id);
  });

  it('should throw error when customer does not exist', async () => {
    const updateInput: UpdateCustomerInput = {
      id: 99999,
      name: 'Non-existent Customer'
    };

    await expect(updateCustomer(updateInput))
      .rejects.toThrow(/Customer with id 99999 not found/i);
  });

  it('should update all fields including nullable address', async () => {
    // Create initial customer
    const [createdCustomer] = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Complete Update',
      email: 'complete@example.com',
      phone: '555-000-1111',
      address: 'New Address 789'
    };

    const result = await updateCustomer(updateInput);

    expect(result.name).toEqual('Complete Update');
    expect(result.email).toEqual('complete@example.com');
    expect(result.phone).toEqual('555-000-1111');
    expect(result.address).toEqual('New Address 789');
    expect(result.id).toEqual(createdCustomer.id);
    expect(result.created_at).toBeInstanceOf(Date);
  });
});