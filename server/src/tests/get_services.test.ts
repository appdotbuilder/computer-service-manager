import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable } from '../db/schema';
import { getServices } from '../handlers/get_services';

describe('getServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no services exist', async () => {
    const result = await getServices();
    expect(result).toEqual([]);
  });

  it('should fetch all services from database', async () => {
    // Create test customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create test services
    await db.insert(servicesTable)
      .values([
        {
          customer_id: customerId,
          start_date: new Date('2024-01-01'),
          problem_description: 'First service issue',
          service_cost: '199.99',
          status: 'in_progress'
        },
        {
          customer_id: customerId,
          start_date: new Date('2024-01-15'),
          completion_date: new Date('2024-01-20'),
          problem_description: 'Second service issue',
          repair_description: 'Fixed the problem',
          service_cost: '299.50',
          status: 'completed'
        }
      ])
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(2);

    // Check first service
    const firstService = result.find(s => s.problem_description === 'First service issue');
    expect(firstService).toBeDefined();
    expect(firstService!.customer_id).toEqual(customerId);
    expect(firstService!.service_cost).toEqual(199.99);
    expect(typeof firstService!.service_cost).toEqual('number');
    expect(firstService!.status).toEqual('in_progress');
    expect(firstService!.completion_date).toBeNull();
    expect(firstService!.repair_description).toBeNull();
    expect(firstService!.id).toBeDefined();
    expect(firstService!.created_at).toBeInstanceOf(Date);

    // Check second service
    const secondService = result.find(s => s.problem_description === 'Second service issue');
    expect(secondService).toBeDefined();
    expect(secondService!.customer_id).toEqual(customerId);
    expect(secondService!.service_cost).toEqual(299.50);
    expect(typeof secondService!.service_cost).toEqual('number');
    expect(secondService!.status).toEqual('completed');
    expect(secondService!.completion_date).toBeInstanceOf(Date);
    expect(secondService!.repair_description).toEqual('Fixed the problem');
    expect(secondService!.id).toBeDefined();
    expect(secondService!.created_at).toBeInstanceOf(Date);
  });

  it('should handle services with different statuses', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Multi-Status Customer',
        email: 'multi@example.com',
        phone: '555-0123',
        address: null
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create services with all possible statuses
    await db.insert(servicesTable)
      .values([
        {
          customer_id: customerId,
          start_date: new Date('2024-01-01'),
          problem_description: 'In progress service',
          service_cost: '100.00',
          status: 'in_progress'
        },
        {
          customer_id: customerId,
          start_date: new Date('2024-01-02'),
          completion_date: new Date('2024-01-05'),
          problem_description: 'Completed service',
          repair_description: 'Successfully repaired',
          service_cost: '200.00',
          status: 'completed'
        },
        {
          customer_id: customerId,
          start_date: new Date('2024-01-03'),
          problem_description: 'Cancelled service',
          service_cost: '0.00',
          status: 'cancelled'
        }
      ])
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(3);

    const statuses = result.map(s => s.status);
    expect(statuses).toContain('in_progress');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('cancelled');

    // Verify numeric conversion for all services
    result.forEach(service => {
      expect(typeof service.service_cost).toEqual('number');
      expect(service.service_cost).toBeGreaterThanOrEqual(0);
    });
  });

  it('should handle services from multiple customers', async () => {
    // Create multiple customers
    const customer1Result = await db.insert(customersTable)
      .values({
        name: 'Customer One',
        email: 'customer1@example.com',
        phone: '111-111-1111',
        address: '111 First St'
      })
      .returning()
      .execute();

    const customer2Result = await db.insert(customersTable)
      .values({
        name: 'Customer Two',
        email: 'customer2@example.com',
        phone: '222-222-2222',
        address: '222 Second St'
      })
      .returning()
      .execute();

    const customer1Id = customer1Result[0].id;
    const customer2Id = customer2Result[0].id;

    // Create services for both customers
    await db.insert(servicesTable)
      .values([
        {
          customer_id: customer1Id,
          start_date: new Date('2024-01-01'),
          problem_description: 'Customer 1 service',
          service_cost: '150.00',
          status: 'in_progress'
        },
        {
          customer_id: customer2Id,
          start_date: new Date('2024-01-02'),
          problem_description: 'Customer 2 service',
          service_cost: '250.75',
          status: 'completed',
          completion_date: new Date('2024-01-05'),
          repair_description: 'Fixed for customer 2'
        }
      ])
      .execute();

    const result = await getServices();

    expect(result).toHaveLength(2);

    const customerIds = result.map(s => s.customer_id);
    expect(customerIds).toContain(customer1Id);
    expect(customerIds).toContain(customer2Id);

    // Verify all services have correct structure
    result.forEach(service => {
      expect(service.id).toBeDefined();
      expect(typeof service.customer_id).toEqual('number');
      expect(service.start_date).toBeInstanceOf(Date);
      expect(typeof service.problem_description).toEqual('string');
      expect(typeof service.service_cost).toEqual('number');
      expect(['in_progress', 'completed', 'cancelled']).toContain(service.status);
      expect(service.created_at).toBeInstanceOf(Date);
    });
  });
});