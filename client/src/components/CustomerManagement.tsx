import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '../../../server/src/schema';

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    email: '',
    phone: '',
    address: null
  });

  const loadCustomers = useCallback(async () => {
    try {
      const result = await trpc.getCustomers.query();
      setCustomers(result);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: null
    });
    setEditingCustomer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingCustomer) {
        // Update existing customer
        const updateData: UpdateCustomerInput = {
          id: editingCustomer.id,
          ...formData
        };
        const updatedCustomer = await trpc.updateCustomer.mutate(updateData);
        setCustomers((prev: Customer[]) => 
          prev.map((c: Customer) => c.id === editingCustomer.id ? updatedCustomer : c)
        );
      } else {
        // Create new customer
        const newCustomer = await trpc.createCustomer.mutate(formData);
        setCustomers((prev: Customer[]) => [...prev, newCustomer]);
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Add Customer Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Customer List</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
              ➕ Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? '✏️ Edit Customer' : '👤 Add New Customer'}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer ? 'Update customer information below.' : 'Enter customer details to create a new record.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCustomerInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Customer name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCustomerInput) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="customer@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCustomerInput) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Phone number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateCustomerInput) => ({ 
                      ...prev, 
                      address: e.target.value || null 
                    }))
                  }
                  placeholder="Customer address (optional)"
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
                  {isLoading ? 'Saving...' : (editingCustomer ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Customer List */}
      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No customers yet</h3>
            <p className="text-gray-500 mb-4">Add your first customer to get started</p>
            <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
              ➕ Add First Customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer: Customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{customer.name}</span>
                  <Badge variant="outline" className="text-xs">
                    ID: {customer.id}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📧</span>
                  {customer.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📱</span>
                  {customer.phone}
                </div>
                {customer.address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🏠</span>
                    {customer.address}
                  </div>
                )}
                <Separator className="my-3" />
                <div className="text-xs text-gray-500">
                  Created: {customer.created_at.toLocaleDateString()}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(customer)}
                  className="w-full mt-3"
                >
                  ✏️ Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}