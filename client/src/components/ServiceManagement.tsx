import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { 
  Service, 
  Customer, 
  CreateServiceInput, 
  UpdateServiceInput,
  ServiceHistoryInput 
} from '../../../server/src/schema';

export function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceHistory, setServiceHistory] = useState<Service[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<CreateServiceInput>({
    customer_id: 0,
    start_date: new Date(),
    problem_description: '',
    service_cost: 0
  });

  const loadServices = useCallback(async () => {
    try {
      const result = await trpc.getServices.query();
      setServices(result);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const result = await trpc.getCustomers.query();
      setCustomers(result);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  }, []);

  const loadServiceHistory = useCallback(async (customerId: number) => {
    try {
      const input: ServiceHistoryInput = { customer_id: customerId };
      const result = await trpc.getServiceHistory.query(input);
      setServiceHistory(result);
    } catch (error) {
      console.error('Failed to load service history:', error);
    }
  }, []);

  useEffect(() => {
    loadServices();
    loadCustomers();
  }, [loadServices, loadCustomers]);

  useEffect(() => {
    if (selectedCustomerId) {
      loadServiceHistory(selectedCustomerId);
    }
  }, [selectedCustomerId, loadServiceHistory]);

  const resetForm = () => {
    setFormData({
      customer_id: 0,
      start_date: new Date(),
      problem_description: '',
      service_cost: 0
    });
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingService) {
        // This is an update - we only update certain fields
        const updateData: UpdateServiceInput = {
          id: editingService.id,
          service_cost: formData.service_cost,
          // These would be set via separate update operations in a real app
          completion_date: undefined,
          repair_description: undefined,
          status: undefined
        };
        const updatedService = await trpc.updateService.mutate(updateData);
        setServices((prev: Service[]) => 
          prev.map((s: Service) => s.id === editingService.id ? updatedService : s)
        );
      } else {
        // Create new service
        const newService = await trpc.createService.mutate(formData);
        setServices((prev: Service[]) => [...prev, newService]);
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      customer_id: service.customer_id,
      start_date: service.start_date,
      problem_description: service.problem_description,
      service_cost: service.service_cost
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleCompleteService = async (service: Service) => {
    try {
      const updateData: UpdateServiceInput = {
        id: service.id,
        completion_date: new Date(),
        status: 'completed'
      };
      const updatedService = await trpc.updateService.mutate(updateData);
      setServices((prev: Service[]) => 
        prev.map((s: Service) => s.id === service.id ? updatedService : s)
      );
    } catch (error) {
      console.error('Failed to complete service:', error);
    }
  };

  const getStatusBadge = (status: Service['status']) => {
    const statusConfig = {
      in_progress: { label: '🔄 In Progress', variant: 'default' as const },
      completed: { label: '✅ Completed', variant: 'secondary' as const },
      cancelled: { label: '❌ Cancelled', variant: 'destructive' as const }
    };
    
    return statusConfig[status] || statusConfig.in_progress;
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? customer.name : `Customer #${customerId}`;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all-services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-services">All Services</TabsTrigger>
          <TabsTrigger value="service-history">Service History</TabsTrigger>
        </TabsList>

        <TabsContent value="all-services" className="space-y-6">
          {/* Add Service Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">All Services</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700">
                  ➕ New Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? '✏️ Edit Service' : '🛠️ Create New Service'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingService ? 'Update service information.' : 'Record a new service request.'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer *</Label>
                    <Select
                      value={formData.customer_id.toString()}
                      onValueChange={(value: string) =>
                        setFormData((prev: CreateServiceInput) => ({ 
                          ...prev, 
                          customer_id: parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer: Customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date.toISOString().split('T')[0]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateServiceInput) => ({ 
                          ...prev, 
                          start_date: new Date(e.target.value) 
                        }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="problem_description">Problem Description *</Label>
                    <Textarea
                      id="problem_description"
                      value={formData.problem_description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateServiceInput) => ({ 
                          ...prev, 
                          problem_description: e.target.value 
                        }))
                      }
                      placeholder="Describe the problem..."
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="service_cost">Service Cost ($) *</Label>
                    <Input
                      id="service_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.service_cost}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateServiceInput) => ({ 
                          ...prev, 
                          service_cost: parseFloat(e.target.value) || 0 
                        }))
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : (editingService ? 'Update' : 'Create')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Services List */}
          {services.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">🛠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No services yet</h3>
                <p className="text-gray-500 mb-4">Create your first service record</p>
                <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700">
                  ➕ Create First Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {services.map((service: Service) => {
                const statusBadge = getStatusBadge(service.status);
                return (
                  <Card key={service.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Service #{service.id}
                        </CardTitle>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                      <CardDescription>
                        Customer: {getCustomerName(service.customer_id)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Start Date:</span>
                          <div>{service.start_date.toLocaleDateString()}</div>
                        </div>
                        {service.completion_date && (
                          <div>
                            <span className="font-medium">Completed:</span>
                            <div>{service.completion_date.toLocaleDateString()}</div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <span className="font-medium text-sm">Problem:</span>
                        <p className="text-sm text-gray-600 mt-1">{service.problem_description}</p>
                      </div>
                      
                      {service.repair_description && (
                        <div>
                          <span className="font-medium text-sm">Repair:</span>
                          <p className="text-sm text-gray-600 mt-1">{service.repair_description}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-lg">
                          Cost: ${service.service_cost.toFixed(2)}
                        </span>
                        <div className="space-x-2">
                          {service.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => handleCompleteService(service)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              ✅ Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(service)}
                          >
                            ✏️ Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="service-history" className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-select">Select Customer</Label>
              <Select
                value={selectedCustomerId?.toString() || ''}
                onValueChange={(value: string) => setSelectedCustomerId(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a customer to view history" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: Customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomerId && (
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Service History for {getCustomerName(selectedCustomerId)}
                </h3>
                {serviceHistory.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <div className="text-4xl mb-2">📋</div>
                      <p className="text-gray-500">No service history found for this customer</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {serviceHistory.map((service: Service) => {
                      const statusBadge = getStatusBadge(service.status);
                      return (
                        <Card key={service.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Service #{service.id}</span>
                              <Badge variant={statusBadge.variant} className="text-xs">
                                {statusBadge.label}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Date: {service.start_date.toLocaleDateString()}</p>
                              <p>Problem: {service.problem_description}</p>
                              {service.repair_description && (
                                <p>Repair: {service.repair_description}</p>
                              )}
                              <p>Cost: ${service.service_cost.toFixed(2)}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}