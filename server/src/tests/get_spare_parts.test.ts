import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sparePartsTable } from '../db/schema';
import { getSpareParts } from '../handlers/get_spare_parts';
import { eq } from 'drizzle-orm';

describe('getSpareParts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no spare parts exist', async () => {
    const result = await getSpareParts();
    expect(result).toEqual([]);
  });

  it('should return all spare parts with correct field types', async () => {
    // Create test spare parts
    await db.insert(sparePartsTable)
      .values([
        {
          name: 'Engine Filter',
          description: 'High-quality engine filter',
          part_number: 'EF-001',
          stock_quantity: 25,
          unit_price: '15.99',
          supplier: 'AutoParts Inc'
        },
        {
          name: 'Brake Pad',
          description: 'Ceramic brake pad',
          part_number: 'BP-002',
          stock_quantity: 50,
          unit_price: '45.50',
          supplier: 'BrakeTech Ltd'
        }
      ])
      .execute();

    const result = await getSpareParts();

    expect(result).toHaveLength(2);

    // Verify first spare part
    const engineFilter = result.find(part => part.name === 'Engine Filter');
    expect(engineFilter).toBeDefined();
    expect(engineFilter!.name).toEqual('Engine Filter');
    expect(engineFilter!.description).toEqual('High-quality engine filter');
    expect(engineFilter!.part_number).toEqual('EF-001');
    expect(engineFilter!.stock_quantity).toEqual(25);
    expect(engineFilter!.unit_price).toEqual(15.99);
    expect(typeof engineFilter!.unit_price).toEqual('number');
    expect(engineFilter!.supplier).toEqual('AutoParts Inc');
    expect(engineFilter!.id).toBeDefined();
    expect(engineFilter!.created_at).toBeInstanceOf(Date);

    // Verify second spare part
    const brakePad = result.find(part => part.name === 'Brake Pad');
    expect(brakePad).toBeDefined();
    expect(brakePad!.name).toEqual('Brake Pad');
    expect(brakePad!.description).toEqual('Ceramic brake pad');
    expect(brakePad!.part_number).toEqual('BP-002');
    expect(brakePad!.stock_quantity).toEqual(50);
    expect(brakePad!.unit_price).toEqual(45.50);
    expect(typeof brakePad!.unit_price).toEqual('number');
    expect(brakePad!.supplier).toEqual('BrakeTech Ltd');
  });

  it('should handle spare parts with nullable fields', async () => {
    // Create spare part with minimal required fields
    await db.insert(sparePartsTable)
      .values({
        name: 'Basic Part',
        description: null,
        part_number: 'BP-001',
        stock_quantity: 10,
        unit_price: '5.00',
        supplier: null
      })
      .execute();

    const result = await getSpareParts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Basic Part');
    expect(result[0].description).toBeNull();
    expect(result[0].part_number).toEqual('BP-001');
    expect(result[0].stock_quantity).toEqual(10);
    expect(result[0].unit_price).toEqual(5.00);
    expect(result[0].supplier).toBeNull();
  });

  it('should handle zero stock quantities correctly', async () => {
    // Create spare part with zero stock
    await db.insert(sparePartsTable)
      .values({
        name: 'Out of Stock Part',
        description: 'Currently unavailable',
        part_number: 'OOS-001',
        stock_quantity: 0,
        unit_price: '12.50',
        supplier: 'Supply Co'
      })
      .execute();

    const result = await getSpareParts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Out of Stock Part');
    expect(result[0].stock_quantity).toEqual(0);
    expect(result[0].unit_price).toEqual(12.50);
  });

  it('should handle large stock quantities and high prices', async () => {
    // Create spare part with large values
    await db.insert(sparePartsTable)
      .values({
        name: 'Expensive Part',
        description: 'High-end component',
        part_number: 'EXP-001',
        stock_quantity: 1000,
        unit_price: '999.99',
        supplier: 'Premium Parts'
      })
      .execute();

    const result = await getSpareParts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Expensive Part');
    expect(result[0].stock_quantity).toEqual(1000);
    expect(result[0].unit_price).toEqual(999.99);
    expect(typeof result[0].unit_price).toEqual('number');
  });

  it('should verify data persisted correctly in database', async () => {
    // Create test spare part
    await db.insert(sparePartsTable)
      .values({
        name: 'Test Part',
        description: 'Test description',
        part_number: 'TEST-001',
        stock_quantity: 15,
        unit_price: '25.75',
        supplier: 'Test Supplier'
      })
      .execute();

    const handlerResult = await getSpareParts();
    expect(handlerResult).toHaveLength(1);

    // Verify against direct database query
    const dbResult = await db.select()
      .from(sparePartsTable)
      .where(eq(sparePartsTable.name, 'Test Part'))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].name).toEqual('Test Part');
    expect(dbResult[0].part_number).toEqual('TEST-001');
    expect(dbResult[0].stock_quantity).toEqual(15);
    expect(parseFloat(dbResult[0].unit_price)).toEqual(25.75);

    // Verify handler result matches database
    const handlerPart = handlerResult[0];
    expect(handlerPart.name).toEqual(dbResult[0].name);
    expect(handlerPart.part_number).toEqual(dbResult[0].part_number);
    expect(handlerPart.stock_quantity).toEqual(dbResult[0].stock_quantity);
    expect(handlerPart.unit_price).toEqual(parseFloat(dbResult[0].unit_price));
  });
});