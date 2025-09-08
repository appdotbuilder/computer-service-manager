import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable, sparePartsTable, serviceSparePartsTable } from '../db/schema';
import { type UseSparePartInput } from '../schema';
import { useSparePartInService } from '../handlers/use_spare_part';
import { eq } from 'drizzle-orm';

describe('useSparePartInService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCustomerId: number;
  let testServiceId: number;
  let testSparePartId: number;

  beforeEach(async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@customer.com',
        phone: '123-456-7890',
        address: '123 Test St'
      })
      .returning()
      .execute();
    testCustomerId = customerResult[0].id;

    // Create test service
    const serviceResult = await db.insert(servicesTable)
      .values({
        customer_id: testCustomerId,
        start_date: new Date(),
        problem_description: 'Test repair',
        service_cost: '100.00'
      })
      .returning()
      .execute();
    testServiceId = serviceResult[0].id;

    // Create test spare part with sufficient stock
    const sparePartResult = await db.insert(sparePartsTable)
      .values({
        name: 'Test Part',
        part_number: 'TP001',
        stock_quantity: 50,
        unit_price: '25.99',
        description: 'A test spare part',
        supplier: 'Test Supplier'
      })
      .returning()
      .execute();
    testSparePartId = sparePartResult[0].id;
  });

  it('should record spare part usage successfully', async () => {
    const input: UseSparePartInput = {
      service_id: testServiceId,
      spare_part_id: testSparePartId,
      quantity_used: 5
    };

    const result = await useSparePartInService(input);

    // Verify return structure
    expect(result.id).toBeDefined();
    expect(result.service_id).toEqual(testServiceId);
    expect(result.spare_part_id).toEqual(testSparePartId);
    expect(result.quantity_used).toEqual(5);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create record in database', async () => {
    const input: UseSparePartInput = {
      service_id: testServiceId,
      spare_part_id: testSparePartId,
      quantity_used: 3
    };

    const result = await useSparePartInService(input);

    // Query database to verify record was created
    const usageRecords = await db.select()
      .from(serviceSparePartsTable)
      .where(eq(serviceSparePartsTable.id, result.id))
      .execute();

    expect(usageRecords).toHaveLength(1);
    expect(usageRecords[0].service_id).toEqual(testServiceId);
    expect(usageRecords[0].spare_part_id).toEqual(testSparePartId);
    expect(usageRecords[0].quantity_used).toEqual(3);
    expect(usageRecords[0].created_at).toBeInstanceOf(Date);
  });

  it('should update spare part stock quantity', async () => {
    const input: UseSparePartInput = {
      service_id: testServiceId,
      spare_part_id: testSparePartId,
      quantity_used: 10
    };

    // Get initial stock quantity
    const initialSpareParts = await db.select()
      .from(sparePartsTable)
      .where(eq(sparePartsTable.id, testSparePartId))
      .execute();
    const initialStock = initialSpareParts[0].stock_quantity;

    await useSparePartInService(input);

    // Verify stock was reduced
    const updatedSpareParts = await db.select()
      .from(sparePartsTable)
      .where(eq(sparePartsTable.id, testSparePartId))
      .execute();
    
    expect(updatedSpareParts[0].stock_quantity).toEqual(initialStock - 10);
  });

  it('should handle multiple spare part usages for same service', async () => {
    // Use parts multiple times
    await useSparePartInService({
      service_id: testServiceId,
      spare_part_id: testSparePartId,
      quantity_used: 5
    });

    await useSparePartInService({
      service_id: testServiceId,
      spare_part_id: testSparePartId,
      quantity_used: 3
    });

    // Verify both records exist
    const usageRecords = await db.select()
      .from(serviceSparePartsTable)
      .where(eq(serviceSparePartsTable.service_id, testServiceId))
      .execute();

    expect(usageRecords).toHaveLength(2);
    
    // Verify total stock reduction
    const spareParts = await db.select()
      .from(sparePartsTable)
      .where(eq(sparePartsTable.id, testSparePartId))
      .execute();
    
    expect(spareParts[0].stock_quantity).toEqual(42); // 50 - 5 - 3
  });

  it('should throw error when service does not exist', async () => {
    const input: UseSparePartInput = {
      service_id: 99999, // Non-existent service
      spare_part_id: testSparePartId,
      quantity_used: 5
    };

    await expect(useSparePartInService(input))
      .rejects.toThrow(/service with id 99999 not found/i);
  });

  it('should throw error when spare part does not exist', async () => {
    const input: UseSparePartInput = {
      service_id: testServiceId,
      spare_part_id: 99999, // Non-existent spare part
      quantity_used: 5
    };

    await expect(useSparePartInService(input))
      .rejects.toThrow(/spare part with id 99999 not found/i);
  });

  it('should throw error when insufficient stock', async () => {
    const input: UseSparePartInput = {
      service_id: testServiceId,
      spare_part_id: testSparePartId,
      quantity_used: 100 // More than available (50)
    };

    await expect(useSparePartInService(input))
      .rejects.toThrow(/insufficient stock/i);
  });

  it('should maintain data consistency on error', async () => {
    // Get initial state
    const initialSpareParts = await db.select()
      .from(sparePartsTable)
      .where(eq(sparePartsTable.id, testSparePartId))
      .execute();
    const initialStock = initialSpareParts[0].stock_quantity;

    const initialUsageRecords = await db.select()
      .from(serviceSparePartsTable)
      .execute();
    const initialRecordCount = initialUsageRecords.length;

    // Attempt operation that should fail
    const input: UseSparePartInput = {
      service_id: testServiceId,
      spare_part_id: testSparePartId,
      quantity_used: 100 // Exceeds stock
    };

    await expect(useSparePartInService(input)).rejects.toThrow();

    // Verify no changes were made due to transaction rollback
    const finalSpareParts = await db.select()
      .from(sparePartsTable)
      .where(eq(sparePartsTable.id, testSparePartId))
      .execute();
    expect(finalSpareParts[0].stock_quantity).toEqual(initialStock);

    const finalUsageRecords = await db.select()
      .from(serviceSparePartsTable)
      .execute();
    expect(finalUsageRecords).toHaveLength(initialRecordCount);
  });
});