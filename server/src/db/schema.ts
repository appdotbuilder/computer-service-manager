import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Service status enum
export const serviceStatusEnum = pgEnum('service_status', ['in_progress', 'completed', 'cancelled']);

// Customers table
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Services table
export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').notNull().references(() => customersTable.id),
  start_date: timestamp('start_date').notNull(),
  completion_date: timestamp('completion_date'), // Nullable by default
  problem_description: text('problem_description').notNull(),
  repair_description: text('repair_description'), // Nullable by default
  service_cost: numeric('service_cost', { precision: 10, scale: 2 }).notNull(),
  status: serviceStatusEnum('status').notNull().default('in_progress'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Spare parts table
export const sparePartsTable = pgTable('spare_parts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  part_number: text('part_number').notNull(),
  stock_quantity: integer('stock_quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  supplier: text('supplier'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Junction table for services and spare parts
export const serviceSparePartsTable = pgTable('service_spare_parts', {
  id: serial('id').primaryKey(),
  service_id: integer('service_id').notNull().references(() => servicesTable.id),
  spare_part_id: integer('spare_part_id').notNull().references(() => sparePartsTable.id),
  quantity_used: integer('quantity_used').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customersTable, ({ many }) => ({
  services: many(servicesTable),
}));

export const servicesRelations = relations(servicesTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [servicesTable.customer_id],
    references: [customersTable.id],
  }),
  sparePartsUsed: many(serviceSparePartsTable),
}));

export const sparePartsRelations = relations(sparePartsTable, ({ many }) => ({
  usedInServices: many(serviceSparePartsTable),
}));

export const serviceSparePartsRelations = relations(serviceSparePartsTable, ({ one }) => ({
  service: one(servicesTable, {
    fields: [serviceSparePartsTable.service_id],
    references: [servicesTable.id],
  }),
  sparePart: one(sparePartsTable, {
    fields: [serviceSparePartsTable.spare_part_id],
    references: [sparePartsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Customer = typeof customersTable.$inferSelect;
export type NewCustomer = typeof customersTable.$inferInsert;
export type Service = typeof servicesTable.$inferSelect;
export type NewService = typeof servicesTable.$inferInsert;
export type SparePart = typeof sparePartsTable.$inferSelect;
export type NewSparePart = typeof sparePartsTable.$inferInsert;
export type ServiceSparePart = typeof serviceSparePartsTable.$inferSelect;
export type NewServiceSparePart = typeof serviceSparePartsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  customers: customersTable,
  services: servicesTable,
  spareParts: sparePartsTable,
  servicesSpareParts: serviceSparePartsTable,
};