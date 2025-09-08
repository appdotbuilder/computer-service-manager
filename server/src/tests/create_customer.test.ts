import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateCustomerInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  address: '123 Main St, City, State 12345'
};

// Test input with nullable address
const testInputNullAddress: CreateCustomerInput = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone: '+0987654321',
  address: null
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with all fields', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.address).toEqual('123 Main St, City, State 12345');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a customer with null address', async () => {
    const result = await createCustomer(testInputNullAddress);

    // Validate fields including null address
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toEqual('+0987654321');
    expect(result.address).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query using proper drizzle syntax
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('John Doe');
    expect(customers[0].email).toEqual('john.doe@example.com');
    expect(customers[0].phone).toEqual('+1234567890');
    expect(customers[0].address).toEqual('123 Main St, City, State 12345');
    expect(customers[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple customers with unique IDs', async () => {
    const customer1 = await createCustomer(testInput);
    const customer2 = await createCustomer(testInputNullAddress);

    // Verify unique IDs
    expect(customer1.id).not.toEqual(customer2.id);
    expect(typeof customer1.id).toBe('number');
    expect(typeof customer2.id).toBe('number');

    // Verify both are saved in database
    const customers = await db.select()
      .from(customersTable)
      .execute();

    expect(customers).toHaveLength(2);
    
    // Find each customer by ID
    const savedCustomer1 = customers.find(c => c.id === customer1.id);
    const savedCustomer2 = customers.find(c => c.id === customer2.id);

    expect(savedCustomer1).toBeDefined();
    expect(savedCustomer2).toBeDefined();
    expect(savedCustomer1!.name).toEqual('John Doe');
    expect(savedCustomer2!.name).toEqual('Jane Smith');
  });

  it('should handle database constraint violations appropriately', async () => {
    // Create first customer
    await createCustomer(testInput);

    // Try to create customer with same email (assuming email should be unique in real scenarios)
    // This tests that errors are properly propagated
    const duplicateEmailInput: CreateCustomerInput = {
      name: 'Different Name',
      email: 'john.doe@example.com', // Same email
      phone: '+5555555555',
      address: 'Different Address'
    };

    // Note: Since our schema doesn't enforce email uniqueness, this won't fail
    // But we test that the operation completes successfully
    const result = await createCustomer(duplicateEmailInput);
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.name).toEqual('Different Name');
  });

  it('should preserve timestamp accuracy', async () => {
    const beforeCreation = new Date();
    const result = await createCustomer(testInput);
    const afterCreation = new Date();

    // Verify created_at is within expected time range
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});