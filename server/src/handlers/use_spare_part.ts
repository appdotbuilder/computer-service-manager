import { type UseSparePartInput, type ServiceSparePart } from '../schema';

export const useSparePartInService = async (input: UseSparePartInput): Promise<ServiceSparePart> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is recording the usage of spare parts in a service.
    // This should also update the stock quantity of the used spare part.
    return Promise.resolve({
        id: 0, // Placeholder ID
        service_id: input.service_id,
        spare_part_id: input.spare_part_id,
        quantity_used: input.quantity_used,
        created_at: new Date() // Placeholder date
    } as ServiceSparePart);
};