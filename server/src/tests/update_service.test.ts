import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable } from '../db/schema';
import { type UpdateServiceInput } from '../schema';
import { updateService } from '../handlers/update_service';
import { eq } from 'drizzle-orm';

describe('updateService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let customerId: number;
  let serviceId: number;

  beforeEach(async () => {
    // Create a customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0123',
        address: '123 Test St'
      })
      .returning()
      .execute();
    customerId = customerResult[0].id;

    // Create a service to update
    const serviceResult = await db.insert(servicesTable)
      .values({
        customer_id: customerId,
        start_date: new Date('2024-01-01'),
        problem_description: 'Initial problem description',
        service_cost: '100.00',
        status: 'in_progress'
      })
      .returning()
      .execute();
    serviceId = serviceResult[0].id;
  });

  it('should update service completion date', async () => {
    const completionDate = new Date('2024-01-05');
    const input: UpdateServiceInput = {
      id: serviceId,
      completion_date: completionDate
    };

    const result = await updateService(input);

    expect(result.id).toEqual(serviceId);
    expect(result.completion_date).toEqual(completionDate);
    expect(result.status).toEqual('in_progress'); // Should remain unchanged
    expect(result.service_cost).toEqual(100);
  });

  it('should update service status', async () => {
    const input: UpdateServiceInput = {
      id: serviceId,
      status: 'completed'
    };

    const result = await updateService(input);

    expect(result.id).toEqual(serviceId);
    expect(result.status).toEqual('completed');
    expect(result.completion_date).toBeNull(); // Should remain unchanged
  });

  it('should update repair description', async () => {
    const repairDescription = 'Replaced faulty component';
    const input: UpdateServiceInput = {
      id: serviceId,
      repair_description: repairDescription
    };

    const result = await updateService(input);

    expect(result.id).toEqual(serviceId);
    expect(result.repair_description).toEqual(repairDescription);
  });

  it('should update service cost', async () => {
    const newCost = 150.75;
    const input: UpdateServiceInput = {
      id: serviceId,
      service_cost: newCost
    };

    const result = await updateService(input);

    expect(result.id).toEqual(serviceId);
    expect(result.service_cost).toEqual(newCost);
    expect(typeof result.service_cost).toBe('number');
  });

  it('should update multiple fields at once', async () => {
    const completionDate = new Date('2024-01-10');
    const input: UpdateServiceInput = {
      id: serviceId,
      completion_date: completionDate,
      repair_description: 'Complete repair performed',
      service_cost: 250.50,
      status: 'completed'
    };

    const result = await updateService(input);

    expect(result.id).toEqual(serviceId);
    expect(result.completion_date).toEqual(completionDate);
    expect(result.repair_description).toEqual('Complete repair performed');
    expect(result.service_cost).toEqual(250.50);
    expect(result.status).toEqual('completed');
  });

  it('should save updates to database', async () => {
    const input: UpdateServiceInput = {
      id: serviceId,
      status: 'cancelled',
      repair_description: 'Service cancelled by customer'
    };

    await updateService(input);

    // Query database directly to verify update
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, serviceId))
      .execute();

    expect(services).toHaveLength(1);
    expect(services[0].status).toEqual('cancelled');
    expect(services[0].repair_description).toEqual('Service cancelled by customer');
    expect(parseFloat(services[0].service_cost)).toEqual(100); // Should remain unchanged
  });

  it('should handle null completion_date update', async () => {
    // First set a completion date
    await updateService({
      id: serviceId,
      completion_date: new Date('2024-01-05')
    });

    // Then set it back to null
    const input: UpdateServiceInput = {
      id: serviceId,
      completion_date: null
    };

    const result = await updateService(input);

    expect(result.completion_date).toBeNull();
  });

  it('should handle null repair_description update', async () => {
    // First set a repair description
    await updateService({
      id: serviceId,
      repair_description: 'Initial repair'
    });

    // Then set it back to null
    const input: UpdateServiceInput = {
      id: serviceId,
      repair_description: null
    };

    const result = await updateService(input);

    expect(result.repair_description).toBeNull();
  });

  it('should throw error for non-existent service', async () => {
    const input: UpdateServiceInput = {
      id: 99999,
      status: 'completed'
    };

    await expect(updateService(input)).rejects.toThrow(/Service with id 99999 not found/i);
  });

  it('should preserve unchanged fields', async () => {
    const input: UpdateServiceInput = {
      id: serviceId,
      status: 'completed'
    };

    const result = await updateService(input);

    // Verify original fields are preserved
    expect(result.customer_id).toEqual(customerId);
    expect(result.problem_description).toEqual('Initial problem description');
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.service_cost).toEqual(100);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify only status was updated
    expect(result.status).toEqual('completed');
    expect(result.completion_date).toBeNull();
    expect(result.repair_description).toBeNull();
  });
});