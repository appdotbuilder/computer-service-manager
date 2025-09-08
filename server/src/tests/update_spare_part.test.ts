import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sparePartsTable } from '../db/schema';
import { type UpdateSparePartInput, type CreateSparePartInput } from '../schema';
import { updateSparePart } from '../handlers/update_spare_part';
import { eq } from 'drizzle-orm';

// Helper function to create a test spare part
const createTestSparePart = async (): Promise<number> => {
  const testSparePartInput: CreateSparePartInput = {
    name: 'Original Part',
    description: 'Original description',
    part_number: 'ORIG-001',
    stock_quantity: 50,
    unit_price: 25.99,
    supplier: 'Original Supplier'
  };

  const result = await db.insert(sparePartsTable)
    .values({
      ...testSparePartInput,
      unit_price: testSparePartInput.unit_price.toString()
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateSparePart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a spare part', async () => {
    const sparePartId = await createTestSparePart();

    const updateInput: UpdateSparePartInput = {
      id: sparePartId,
      name: 'Updated Part Name',
      description: 'Updated description',
      part_number: 'UPD-002',
      stock_quantity: 100,
      unit_price: 35.50,
      supplier: 'Updated Supplier'
    };

    const result = await updateSparePart(updateInput);

    // Verify all fields are updated correctly
    expect(result.id).toEqual(sparePartId);
    expect(result.name).toEqual('Updated Part Name');
    expect(result.description).toEqual('Updated description');
    expect(result.part_number).toEqual('UPD-002');
    expect(result.stock_quantity).toEqual(100);
    expect(result.unit_price).toEqual(35.50);
    expect(typeof result.unit_price).toEqual('number');
    expect(result.supplier).toEqual('Updated Supplier');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const sparePartId = await createTestSparePart();

    const updateInput: UpdateSparePartInput = {
      id: sparePartId,
      name: 'Partially Updated Name',
      stock_quantity: 75
    };

    const result = await updateSparePart(updateInput);

    // Verify only specified fields are updated
    expect(result.name).toEqual('Partially Updated Name');
    expect(result.stock_quantity).toEqual(75);
    
    // Verify other fields remain unchanged
    expect(result.description).toEqual('Original description');
    expect(result.part_number).toEqual('ORIG-001');
    expect(result.unit_price).toEqual(25.99);
    expect(result.supplier).toEqual('Original Supplier');
  });

  it('should update nullable fields to null', async () => {
    const sparePartId = await createTestSparePart();

    const updateInput: UpdateSparePartInput = {
      id: sparePartId,
      description: null,
      supplier: null
    };

    const result = await updateSparePart(updateInput);

    // Verify nullable fields are set to null
    expect(result.description).toBeNull();
    expect(result.supplier).toBeNull();
    
    // Verify other fields remain unchanged
    expect(result.name).toEqual('Original Part');
    expect(result.part_number).toEqual('ORIG-001');
    expect(result.stock_quantity).toEqual(50);
    expect(result.unit_price).toEqual(25.99);
  });

  it('should save updated spare part to database', async () => {
    const sparePartId = await createTestSparePart();

    const updateInput: UpdateSparePartInput = {
      id: sparePartId,
      name: 'Database Test Part',
      unit_price: 42.75
    };

    await updateSparePart(updateInput);

    // Query database directly to verify update
    const spareParts = await db.select()
      .from(sparePartsTable)
      .where(eq(sparePartsTable.id, sparePartId))
      .execute();

    expect(spareParts).toHaveLength(1);
    expect(spareParts[0].name).toEqual('Database Test Part');
    expect(parseFloat(spareParts[0].unit_price)).toEqual(42.75);
    expect(spareParts[0].description).toEqual('Original description'); // Unchanged
  });

  it('should handle zero values correctly', async () => {
    const sparePartId = await createTestSparePart();

    const updateInput: UpdateSparePartInput = {
      id: sparePartId,
      stock_quantity: 0,
      unit_price: 0
    };

    const result = await updateSparePart(updateInput);

    expect(result.stock_quantity).toEqual(0);
    expect(result.unit_price).toEqual(0);
    expect(typeof result.unit_price).toEqual('number');
  });

  it('should throw error when spare part does not exist', async () => {
    const updateInput: UpdateSparePartInput = {
      id: 99999, // Non-existent ID
      name: 'This should fail'
    };

    await expect(updateSparePart(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update stock quantity independently', async () => {
    const sparePartId = await createTestSparePart();

    const updateInput: UpdateSparePartInput = {
      id: sparePartId,
      stock_quantity: 999
    };

    const result = await updateSparePart(updateInput);

    expect(result.stock_quantity).toEqual(999);
    
    // Verify other fields remain unchanged
    expect(result.name).toEqual('Original Part');
    expect(result.unit_price).toEqual(25.99);
    expect(result.part_number).toEqual('ORIG-001');
  });

  it('should update price with decimal precision', async () => {
    const sparePartId = await createTestSparePart();

    const updateInput: UpdateSparePartInput = {
      id: sparePartId,
      unit_price: 123.456789 // High precision
    };

    const result = await updateSparePart(updateInput);

    expect(result.unit_price).toBeCloseTo(123.46, 2); // Should be rounded to 2 decimal places
    expect(typeof result.unit_price).toEqual('number');
  });
});