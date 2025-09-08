import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { getCustomers } from '../handlers/get_customers';

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all customers when they exist', async () => {
    // Create test customers
    await db.insert(customersTable).values([
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        address: '123 Main St'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '987-654-3210',
        address: null
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '555-123-4567',
        address: '456 Oak Ave'
      }
    ]).execute();

    const result = await getCustomers();

    // Verify we get all customers
    expect(result).toHaveLength(3);
    
    // Verify customer data structure and content
    const johnCustomer = result.find(c => c.name === 'John Doe');
    expect(johnCustomer).toBeDefined();
    expect(johnCustomer?.email).toEqual('john@example.com');
    expect(johnCustomer?.phone).toEqual('123-456-7890');
    expect(johnCustomer?.address).toEqual('123 Main St');
    expect(johnCustomer?.id).toBeDefined();
    expect(johnCustomer?.created_at).toBeInstanceOf(Date);

    const janeCustomer = result.find(c => c.name === 'Jane Smith');
    expect(janeCustomer).toBeDefined();
    expect(janeCustomer?.email).toEqual('jane@example.com');
    expect(janeCustomer?.phone).toEqual('987-654-3210');
    expect(janeCustomer?.address).toBeNull();
    expect(janeCustomer?.id).toBeDefined();
    expect(janeCustomer?.created_at).toBeInstanceOf(Date);

    const bobCustomer = result.find(c => c.name === 'Bob Johnson');
    expect(bobCustomer).toBeDefined();
    expect(bobCustomer?.email).toEqual('bob@example.com');
    expect(bobCustomer?.phone).toEqual('555-123-4567');
    expect(bobCustomer?.address).toEqual('456 Oak Ave');
    expect(bobCustomer?.id).toBeDefined();
    expect(bobCustomer?.created_at).toBeInstanceOf(Date);
  });

  it('should return customers in insertion order', async () => {
    // Create customers in specific order
    const customerData = [
      { name: 'First Customer', email: 'first@example.com', phone: '111-111-1111', address: null },
      { name: 'Second Customer', email: 'second@example.com', phone: '222-222-2222', address: 'Second St' },
      { name: 'Third Customer', email: 'third@example.com', phone: '333-333-3333', address: null }
    ];

    for (const customer of customerData) {
      await db.insert(customersTable).values(customer).execute();
    }

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    // Verify order by checking IDs are ascending (auto-increment)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
    
    // Verify specific order
    expect(result[0].name).toEqual('First Customer');
    expect(result[1].name).toEqual('Second Customer');
    expect(result[2].name).toEqual('Third Customer');
  });

  it('should handle customers with null addresses correctly', async () => {
    // Create customer with null address
    await db.insert(customersTable).values({
      name: 'No Address Customer',
      email: 'noaddress@example.com',
      phone: '000-000-0000',
      address: null
    }).execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    expect(result[0].address).toBeNull();
    expect(result[0].name).toEqual('No Address Customer');
  });

  it('should return customers with all required fields', async () => {
    await db.insert(customersTable).values({
      name: 'Complete Customer',
      email: 'complete@example.com',
      phone: '123-456-7890',
      address: '123 Complete St'
    }).execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    const customer = result[0];
    
    // Verify all required fields are present
    expect(customer.id).toBeDefined();
    expect(typeof customer.id).toBe('number');
    expect(customer.name).toBeDefined();
    expect(typeof customer.name).toBe('string');
    expect(customer.email).toBeDefined();
    expect(typeof customer.email).toBe('string');
    expect(customer.phone).toBeDefined();
    expect(typeof customer.phone).toBe('string');
    expect(customer.created_at).toBeInstanceOf(Date);
    
    // Address can be string or null
    expect(customer.address === null || typeof customer.address === 'string').toBe(true);
  });
});