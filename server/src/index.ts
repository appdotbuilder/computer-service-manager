import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Schema imports
import {
  createCustomerInputSchema,
  updateCustomerInputSchema,
  createServiceInputSchema,
  updateServiceInputSchema,
  serviceHistoryInputSchema,
  createSparePartInputSchema,
  updateSparePartInputSchema,
  useSparePartInputSchema
} from './schema';

// Handler imports
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { updateCustomer } from './handlers/update_customer';
import { createService } from './handlers/create_service';
import { getServices } from './handlers/get_services';
import { updateService } from './handlers/update_service';
import { getServiceHistory } from './handlers/get_service_history';
import { createSparePart } from './handlers/create_spare_part';
import { getSpareParts } from './handlers/get_spare_parts';
import { updateSparePart } from './handlers/update_spare_part';
import { getOutOfStockParts } from './handlers/get_out_of_stock_parts';
import { useSparePartInService } from './handlers/use_spare_part';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Customer routes
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  
  getCustomers: publicProcedure
    .query(() => getCustomers()),
  
  updateCustomer: publicProcedure
    .input(updateCustomerInputSchema)
    .mutation(({ input }) => updateCustomer(input)),

  // Service routes
  createService: publicProcedure
    .input(createServiceInputSchema)
    .mutation(({ input }) => createService(input)),
  
  getServices: publicProcedure
    .query(() => getServices()),
  
  updateService: publicProcedure
    .input(updateServiceInputSchema)
    .mutation(({ input }) => updateService(input)),
  
  getServiceHistory: publicProcedure
    .input(serviceHistoryInputSchema)
    .query(({ input }) => getServiceHistory(input)),

  // Spare parts routes
  createSparePart: publicProcedure
    .input(createSparePartInputSchema)
    .mutation(({ input }) => createSparePart(input)),
  
  getSpareParts: publicProcedure
    .query(() => getSpareParts()),
  
  updateSparePart: publicProcedure
    .input(updateSparePartInputSchema)
    .mutation(({ input }) => updateSparePart(input)),
  
  getOutOfStockParts: publicProcedure
    .query(() => getOutOfStockParts()),
  
  useSparePartInService: publicProcedure
    .input(useSparePartInputSchema)
    .mutation(({ input }) => useSparePartInService(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();