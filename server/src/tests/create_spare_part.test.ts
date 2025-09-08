import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sparePartsTable } from '../db/schema';
import { type CreateSparePartInput } from '../schema';
import { createSparePart } from '../handlers/create_spare_part';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const testInput: CreateSparePartInput = {
  name: 'Test Spare Part',
  description: 'A spare part for testing',
  part_number: 'TSP-001',
  stock_quantity: 50,
  unit_price: 25.99,
  supplier: 'Test Supplier'
};

// Test input with nullable fields
const testInputWithNulls: CreateSparePartInput = {
  name: 'Minimal Spare Part',
  description: null,
  part_number: 'MIN-001',
  stock_quantity: 10,
  unit_price: 15.50,
  supplier: null
};

describe('createSparePart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a spare part with all fields', async () => {
    const result = await createSparePart(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Spare Part');
    expect(result.description).toEqual('A spare part for testing');
    expect(result.part_number).toEqual('TSP-001');
    expect(result.stock_quantity).toEqual(50);
    expect(result.unit_price).toEqual(25.99);
    expect(typeof result.unit_price).toEqual('number'); // Verify numeric conversion
    expect(result.supplier).toEqual('Test Supplier');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a spare part with nullable fields as null', async () => {
    const result = await createSparePart(testInputWithNulls);

    // Basic field validation
    expect(result.name).toEqual('Minimal Spare Part');
    expect(result.description).toBeNull();
    expect(result.part_number).toEqual('MIN-001');
    expect(result.stock_quantity).toEqual(10);
    expect(result.unit_price).toEqual(15.50);
    expect(typeof result.unit_price).toEqual('number'); // Verify numeric conversion
    expect(result.supplier).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save spare part to database', async () => {
    const result = await createSparePart(testInput);

    // Query using proper drizzle syntax
    const spareParts = await db.select()
      .from(sparePartsTable)
      .where(eq(sparePartsTable.id, result.id))
      .execute();

    expect(spareParts).toHaveLength(1);
    expect(spareParts[0].name).toEqual('Test Spare Part');
    expect(spareParts[0].description).toEqual('A spare part for testing');
    expect(spareParts[0].part_number).toEqual('TSP-001');
    expect(spareParts[0].stock_quantity).toEqual(50);
    expect(parseFloat(spareParts[0].unit_price)).toEqual(25.99); // Database stores as string
    expect(spareParts[0].supplier).toEqual('Test Supplier');
    expect(spareParts[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle zero stock quantity correctly', async () => {
    const zeroStockInput: CreateSparePartInput = {
      name: 'Out of Stock Part',
      description: 'A part with zero stock',
      part_number: 'OOS-001',
      stock_quantity: 0,
      unit_price: 10.00,
      supplier: 'Test Supplier'
    };

    const result = await createSparePart(zeroStockInput);

    expect(result.stock_quantity).toEqual(0);
    expect(result.unit_price).toEqual(10.00);
    expect(typeof result.unit_price).toEqual('number');
  });

  it('should handle decimal prices correctly', async () => {
    const decimalInput: CreateSparePartInput = {
      name: 'Decimal Price Part',
      description: 'A part with decimal price',
      part_number: 'DEC-001',
      stock_quantity: 25,
      unit_price: 12.34, // Use 2 decimal places to match schema precision
      supplier: 'Test Supplier'
    };

    const result = await createSparePart(decimalInput);

    expect(result.unit_price).toEqual(12.34);
    expect(typeof result.unit_price).toEqual('number');

    // Verify in database
    const spareParts = await db.select()
      .from(sparePartsTable)
      .where(eq(sparePartsTable.id, result.id))
      .execute();

    expect(parseFloat(spareParts[0].unit_price)).toEqual(12.34);
  });

  it('should create multiple spare parts with unique IDs', async () => {
    const firstPart = await createSparePart(testInput);
    
    const secondInput: CreateSparePartInput = {
      name: 'Second Test Part',
      description: 'Another test part',
      part_number: 'TSP-002',
      stock_quantity: 30,
      unit_price: 35.99,
      supplier: 'Another Supplier'
    };
    
    const secondPart = await createSparePart(secondInput);

    expect(firstPart.id).not.toEqual(secondPart.id);
    expect(firstPart.part_number).toEqual('TSP-001');
    expect(secondPart.part_number).toEqual('TSP-002');

    // Verify both exist in database
    const allParts = await db.select()
      .from(sparePartsTable)
      .execute();

    expect(allParts).toHaveLength(2);
  });
});