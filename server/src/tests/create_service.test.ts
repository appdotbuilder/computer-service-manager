import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable, customersTable } from '../db/schema';
import { type CreateServiceInput } from '../schema';
import { createService } from '../handlers/create_service';
import { eq } from 'drizzle-orm';

// Test customer data
const testCustomer = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0123',
  address: '123 Main St'
};

// Test service input
const testInput: CreateServiceInput = {
  customer_id: 1, // Will be set after customer creation
  start_date: new Date('2024-01-15'),
  problem_description: 'Computer won\'t start',
  service_cost: 150.50
};

describe('createService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service', async () => {
    // Create a customer first
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    
    const customerId = customerResult[0].id;
    const serviceInput = { ...testInput, customer_id: customerId };

    const result = await createService(serviceInput);

    // Basic field validation
    expect(result.customer_id).toEqual(customerId);
    expect(result.start_date).toEqual(testInput.start_date);
    expect(result.problem_description).toEqual('Computer won\'t start');
    expect(result.service_cost).toEqual(150.50);
    expect(typeof result.service_cost).toBe('number'); // Verify numeric conversion
    expect(result.status).toEqual('in_progress');
    expect(result.completion_date).toBeNull();
    expect(result.repair_description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save service to database', async () => {
    // Create a customer first
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    
    const customerId = customerResult[0].id;
    const serviceInput = { ...testInput, customer_id: customerId };

    const result = await createService(serviceInput);

    // Query using proper drizzle syntax
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(services).toHaveLength(1);
    expect(services[0].customer_id).toEqual(customerId);
    expect(services[0].start_date).toEqual(testInput.start_date);
    expect(services[0].problem_description).toEqual('Computer won\'t start');
    expect(parseFloat(services[0].service_cost)).toEqual(150.50);
    expect(services[0].status).toEqual('in_progress');
    expect(services[0].completion_date).toBeNull();
    expect(services[0].repair_description).toBeNull();
    expect(services[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when customer does not exist', async () => {
    const invalidServiceInput = { ...testInput, customer_id: 999 };

    await expect(createService(invalidServiceInput)).rejects.toThrow(/Customer with ID 999 not found/i);
  });

  it('should handle zero service cost correctly', async () => {
    // Create a customer first
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    
    const customerId = customerResult[0].id;
    const serviceInput = {
      ...testInput,
      customer_id: customerId,
      service_cost: 0
    };

    const result = await createService(serviceInput);

    expect(result.service_cost).toEqual(0);
    expect(typeof result.service_cost).toBe('number');

    // Verify in database
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(parseFloat(services[0].service_cost)).toEqual(0);
  });

  it('should handle large service cost correctly', async () => {
    // Create a customer first
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    
    const customerId = customerResult[0].id;
    const serviceInput = {
      ...testInput,
      customer_id: customerId,
      service_cost: 9999.99
    };

    const result = await createService(serviceInput);

    expect(result.service_cost).toEqual(9999.99);
    expect(typeof result.service_cost).toBe('number');

    // Verify in database
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(parseFloat(services[0].service_cost)).toEqual(9999.99);
  });

  it('should set correct default values for new service', async () => {
    // Create a customer first
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    
    const customerId = customerResult[0].id;
    const serviceInput = { ...testInput, customer_id: customerId };

    const result = await createService(serviceInput);

    // Verify default values for new services
    expect(result.status).toEqual('in_progress');
    expect(result.completion_date).toBeNull();
    expect(result.repair_description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify created_at is recent (within last minute)
    const now = new Date();
    const timeDiff = now.getTime() - result.created_at.getTime();
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
  });
});