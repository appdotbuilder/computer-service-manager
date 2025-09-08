import { z } from 'zod';

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

// Input schema for creating customers
export const createCustomerInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Input schema for updating customers
export const updateCustomerInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  address: z.string().nullable().optional()
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

// Service schema
export const serviceSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  start_date: z.coerce.date(),
  completion_date: z.coerce.date().nullable(),
  problem_description: z.string(),
  repair_description: z.string().nullable(),
  service_cost: z.number(),
  status: z.enum(['in_progress', 'completed', 'cancelled']),
  created_at: z.coerce.date()
});

export type Service = z.infer<typeof serviceSchema>;

// Input schema for creating services
export const createServiceInputSchema = z.object({
  customer_id: z.number(),
  start_date: z.coerce.date(),
  problem_description: z.string().min(1),
  service_cost: z.number().nonnegative()
});

export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;

// Input schema for updating services
export const updateServiceInputSchema = z.object({
  id: z.number(),
  completion_date: z.coerce.date().nullable().optional(),
  repair_description: z.string().nullable().optional(),
  service_cost: z.number().nonnegative().optional(),
  status: z.enum(['in_progress', 'completed', 'cancelled']).optional()
});

export type UpdateServiceInput = z.infer<typeof updateServiceInputSchema>;

// Spare part schema
export const sparePartSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  part_number: z.string(),
  stock_quantity: z.number().int(),
  unit_price: z.number(),
  supplier: z.string().nullable(),
  created_at: z.coerce.date()
});

export type SparePart = z.infer<typeof sparePartSchema>;

// Input schema for creating spare parts
export const createSparePartInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  part_number: z.string().min(1),
  stock_quantity: z.number().int().nonnegative(),
  unit_price: z.number().nonnegative(),
  supplier: z.string().nullable()
});

export type CreateSparePartInput = z.infer<typeof createSparePartInputSchema>;

// Input schema for updating spare parts
export const updateSparePartInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  part_number: z.string().min(1).optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  unit_price: z.number().nonnegative().optional(),
  supplier: z.string().nullable().optional()
});

export type UpdateSparePartInput = z.infer<typeof updateSparePartInputSchema>;

// Service spare part usage schema (junction table)
export const serviceSparePartSchema = z.object({
  id: z.number(),
  service_id: z.number(),
  spare_part_id: z.number(),
  quantity_used: z.number().int().positive(),
  created_at: z.coerce.date()
});

export type ServiceSparePart = z.infer<typeof serviceSparePartSchema>;

// Input schema for using spare parts in services
export const useSparePartInputSchema = z.object({
  service_id: z.number(),
  spare_part_id: z.number(),
  quantity_used: z.number().int().positive()
});

export type UseSparePartInput = z.infer<typeof useSparePartInputSchema>;

// Query input schema for service history
export const serviceHistoryInputSchema = z.object({
  customer_id: z.number()
});

export type ServiceHistoryInput = z.infer<typeof serviceHistoryInputSchema>;