import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sparePartsTable } from '../db/schema';
import { type CreateSparePartInput } from '../schema';
import { getOutOfStockParts } from '../handlers/get_out_of_stock_parts';

// Test spare part inputs
const inStockPart: CreateSparePartInput = {
  name: 'In Stock Part',
  description: 'A part that is in stock',
  part_number: 'ISP-001',
  stock_quantity: 50,
  unit_price: 25.99,
  supplier: 'Test Supplier'
};

const outOfStockPart1: CreateSparePartInput = {
  name: 'Out of Stock Part 1',
  description: 'First part that is out of stock',
  part_number: 'OOS-001',
  stock_quantity: 0,
  unit_price: 15.75,
  supplier: 'Test Supplier'
};

const outOfStockPart2: CreateSparePartInput = {
  name: 'Out of Stock Part 2',
  description: null,
  part_number: 'OOS-002',
  stock_quantity: 0,
  unit_price: 99.50,
  supplier: null
};

describe('getOutOfStockParts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no parts are out of stock', async () => {
    // Create only in-stock parts
    await db.insert(sparePartsTable)
      .values({
        ...inStockPart,
        unit_price: inStockPart.unit_price.toString()
      })
      .execute();

    const result = await getOutOfStockParts();

    expect(result).toHaveLength(0);
  });

  it('should return only out of stock parts', async () => {
    // Create mix of in-stock and out-of-stock parts
    await db.insert(sparePartsTable)
      .values([
        {
          ...inStockPart,
          unit_price: inStockPart.unit_price.toString()
        },
        {
          ...outOfStockPart1,
          unit_price: outOfStockPart1.unit_price.toString()
        },
        {
          ...outOfStockPart2,
          unit_price: outOfStockPart2.unit_price.toString()
        }
      ])
      .execute();

    const result = await getOutOfStockParts();

    expect(result).toHaveLength(2);

    // Check first out of stock part
    const part1 = result.find(p => p.part_number === 'OOS-001');
    expect(part1).toBeDefined();
    expect(part1!.name).toBe('Out of Stock Part 1');
    expect(part1!.description).toBe('First part that is out of stock');
    expect(part1!.stock_quantity).toBe(0);
    expect(part1!.unit_price).toBe(15.75);
    expect(typeof part1!.unit_price).toBe('number');
    expect(part1!.supplier).toBe('Test Supplier');

    // Check second out of stock part
    const part2 = result.find(p => p.part_number === 'OOS-002');
    expect(part2).toBeDefined();
    expect(part2!.name).toBe('Out of Stock Part 2');
    expect(part2!.description).toBeNull();
    expect(part2!.stock_quantity).toBe(0);
    expect(part2!.unit_price).toBe(99.50);
    expect(typeof part2!.unit_price).toBe('number');
    expect(part2!.supplier).toBeNull();

    // Ensure in-stock part is not included
    const inStockResult = result.find(p => p.part_number === 'ISP-001');
    expect(inStockResult).toBeUndefined();
  });

  it('should return all fields including timestamps', async () => {
    // Create an out of stock part
    await db.insert(sparePartsTable)
      .values({
        ...outOfStockPart1,
        unit_price: outOfStockPart1.unit_price.toString()
      })
      .execute();

    const result = await getOutOfStockParts();

    expect(result).toHaveLength(1);
    const part = result[0];

    // Verify all schema fields are present
    expect(part.id).toBeDefined();
    expect(part.name).toBeDefined();
    expect(part.description).toBeDefined();
    expect(part.part_number).toBeDefined();
    expect(part.stock_quantity).toBeDefined();
    expect(part.unit_price).toBeDefined();
    expect(part.supplier).toBeDefined();
    expect(part.created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple out of stock parts with same supplier', async () => {
    const part3: CreateSparePartInput = {
      name: 'Out of Stock Part 3',
      description: 'Third part that is out of stock',
      part_number: 'OOS-003',
      stock_quantity: 0,
      unit_price: 45.25,
      supplier: 'Common Supplier'
    };

    const part4: CreateSparePartInput = {
      name: 'Out of Stock Part 4',
      description: 'Fourth part that is out of stock',
      part_number: 'OOS-004',
      stock_quantity: 0,
      unit_price: 30.00,
      supplier: 'Common Supplier'
    };

    await db.insert(sparePartsTable)
      .values([
        {
          ...part3,
          unit_price: part3.unit_price.toString()
        },
        {
          ...part4,
          unit_price: part4.unit_price.toString()
        }
      ])
      .execute();

    const result = await getOutOfStockParts();

    expect(result).toHaveLength(2);
    expect(result.every(p => p.supplier === 'Common Supplier')).toBe(true);
    expect(result.every(p => p.stock_quantity === 0)).toBe(true);
    
    // Check both parts are different
    const partNumbers = result.map(p => p.part_number);
    expect(partNumbers).toContain('OOS-003');
    expect(partNumbers).toContain('OOS-004');
  });

  it('should handle numeric price conversion correctly', async () => {
    const expensivePart: CreateSparePartInput = {
      name: 'Expensive Part',
      description: 'Very expensive out of stock part',
      part_number: 'EXP-001',
      stock_quantity: 0,
      unit_price: 1234.56,
      supplier: 'Premium Supplier'
    };

    await db.insert(sparePartsTable)
      .values({
        ...expensivePart,
        unit_price: expensivePart.unit_price.toString()
      })
      .execute();

    const result = await getOutOfStockParts();

    expect(result).toHaveLength(1);
    expect(result[0].unit_price).toBe(1234.56);
    expect(typeof result[0].unit_price).toBe('number');
    expect(result[0].unit_price).not.toBe('1234.56'); // Ensure it's not a string
  });
});