import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable } from '../db/schema';
import { type ServiceHistoryInput } from '../schema';
import { getServiceHistory } from '../handlers/get_service_history';

// Test input
const testInput: ServiceHistoryInput = {
  customer_id: 1
};

describe('getServiceHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when customer has no services', async () => {
    // Create customer without services
    await db.insert(customersTable).values({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      address: '123 Main St'
    }).execute();

    const result = await getServiceHistory(testInput);

    expect(result).toEqual([]);
  });

  it('should return all services for a specific customer', async () => {
    // Create customer
    const customerResult = await db.insert(customersTable).values({
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '987-654-3210',
      address: '456 Oak Ave'
    }).returning().execute();

    const customerId = customerResult[0].id;

    // Create multiple services for this customer
    await db.insert(servicesTable).values([
      {
        customer_id: customerId,
        start_date: new Date('2023-01-15'),
        completion_date: new Date('2023-01-20'),
        problem_description: 'Engine repair',
        repair_description: 'Replaced engine parts',
        service_cost: '150.50',
        status: 'completed'
      },
      {
        customer_id: customerId,
        start_date: new Date('2023-03-10'),
        completion_date: null,
        problem_description: 'Oil change needed',
        repair_description: null,
        service_cost: '75.00',
        status: 'in_progress'
      }
    ]).execute();

    const result = await getServiceHistory({ customer_id: customerId });

    // Verify we got all services
    expect(result).toHaveLength(2);

    // Verify service data
    const completedService = result.find(s => s.status === 'completed');
    const inProgressService = result.find(s => s.status === 'in_progress');

    expect(completedService).toBeDefined();
    expect(completedService?.customer_id).toEqual(customerId);
    expect(completedService?.problem_description).toEqual('Engine repair');
    expect(completedService?.repair_description).toEqual('Replaced engine parts');
    expect(completedService?.service_cost).toEqual(150.50);
    expect(typeof completedService?.service_cost).toEqual('number');
    expect(completedService?.status).toEqual('completed');
    expect(completedService?.completion_date).toBeInstanceOf(Date);

    expect(inProgressService).toBeDefined();
    expect(inProgressService?.customer_id).toEqual(customerId);
    expect(inProgressService?.problem_description).toEqual('Oil change needed');
    expect(inProgressService?.repair_description).toBeNull();
    expect(inProgressService?.service_cost).toEqual(75.00);
    expect(typeof inProgressService?.service_cost).toEqual('number');
    expect(inProgressService?.status).toEqual('in_progress');
    expect(inProgressService?.completion_date).toBeNull();
  });

  it('should only return services for the specified customer', async () => {
    // Create two customers
    const customer1Result = await db.insert(customersTable).values({
      name: 'Customer One',
      email: 'customer1@example.com',
      phone: '111-111-1111',
      address: '111 First St'
    }).returning().execute();

    const customer2Result = await db.insert(customersTable).values({
      name: 'Customer Two',
      email: 'customer2@example.com',
      phone: '222-222-2222',
      address: '222 Second St'
    }).returning().execute();

    const customerId1 = customer1Result[0].id;
    const customerId2 = customer2Result[0].id;

    // Create services for both customers
    await db.insert(servicesTable).values([
      {
        customer_id: customerId1,
        start_date: new Date('2023-01-15'),
        problem_description: 'Service for customer 1',
        service_cost: '100.00',
        status: 'completed'
      },
      {
        customer_id: customerId2,
        start_date: new Date('2023-01-20'),
        problem_description: 'Service for customer 2',
        service_cost: '200.00',
        status: 'in_progress'
      },
      {
        customer_id: customerId1,
        start_date: new Date('2023-02-01'),
        problem_description: 'Another service for customer 1',
        service_cost: '150.00',
        status: 'in_progress'
      }
    ]).execute();

    // Get services for customer 1 only
    const result = await getServiceHistory({ customer_id: customerId1 });

    // Should only return services for customer 1
    expect(result).toHaveLength(2);
    result.forEach(service => {
      expect(service.customer_id).toEqual(customerId1);
    });

    // Verify specific service details
    expect(result.some(s => s.problem_description === 'Service for customer 1')).toBe(true);
    expect(result.some(s => s.problem_description === 'Another service for customer 1')).toBe(true);
    expect(result.some(s => s.problem_description === 'Service for customer 2')).toBe(false);
  });

  it('should handle different service statuses correctly', async () => {
    // Create customer
    const customerResult = await db.insert(customersTable).values({
      name: 'Status Test Customer',
      email: 'status@example.com',
      phone: '555-555-5555',
      address: '555 Status St'
    }).returning().execute();

    const customerId = customerResult[0].id;

    // Create services with all possible statuses
    await db.insert(servicesTable).values([
      {
        customer_id: customerId,
        start_date: new Date('2023-01-01'),
        problem_description: 'In progress service',
        service_cost: '50.25',
        status: 'in_progress'
      },
      {
        customer_id: customerId,
        start_date: new Date('2023-01-02'),
        completion_date: new Date('2023-01-05'),
        problem_description: 'Completed service',
        repair_description: 'Fixed successfully',
        service_cost: '125.75',
        status: 'completed'
      },
      {
        customer_id: customerId,
        start_date: new Date('2023-01-03'),
        problem_description: 'Cancelled service',
        service_cost: '0.00',
        status: 'cancelled'
      }
    ]).execute();

    const result = await getServiceHistory({ customer_id: customerId });

    expect(result).toHaveLength(3);

    const statuses = result.map(s => s.status);
    expect(statuses).toContain('in_progress');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('cancelled');

    // Verify numeric conversion for all services
    result.forEach(service => {
      expect(typeof service.service_cost).toEqual('number');
    });
  });

  it('should return services ordered by database default', async () => {
    // Create customer
    const customerResult = await db.insert(customersTable).values({
      name: 'Order Test Customer',
      email: 'order@example.com',
      phone: '666-666-6666',
      address: '666 Order St'
    }).returning().execute();

    const customerId = customerResult[0].id;

    // Create services at different times
    const service1 = await db.insert(servicesTable).values({
      customer_id: customerId,
      start_date: new Date('2023-01-01'),
      problem_description: 'First service',
      service_cost: '100.00',
      status: 'completed'
    }).returning().execute();

    const service2 = await db.insert(servicesTable).values({
      customer_id: customerId,
      start_date: new Date('2023-01-02'),
      problem_description: 'Second service',
      service_cost: '200.00',
      status: 'in_progress'
    }).returning().execute();

    const result = await getServiceHistory({ customer_id: customerId });

    expect(result).toHaveLength(2);

    // Verify all required fields are present and correctly typed
    result.forEach(service => {
      expect(service.id).toBeDefined();
      expect(service.customer_id).toEqual(customerId);
      expect(service.start_date).toBeInstanceOf(Date);
      expect(service.problem_description).toBeDefined();
      expect(typeof service.service_cost).toEqual('number');
      expect(service.status).toBeDefined();
      expect(service.created_at).toBeInstanceOf(Date);
    });
  });
});