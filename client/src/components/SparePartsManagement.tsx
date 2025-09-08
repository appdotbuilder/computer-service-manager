import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { 
  SparePart, 
  Service,
  CreateSparePartInput, 
  UpdateSparePartInput,
  UseSparePartInput
} from '../../../server/src/schema';

export function SparePartsManagement() {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [outOfStockParts, setOutOfStockParts] = useState<SparePart[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUsePartDialogOpen, setIsUsePartDialogOpen] = useState(false);

  
  const [formData, setFormData] = useState<CreateSparePartInput>({
    name: '',
    description: null,
    part_number: '',
    stock_quantity: 0,
    unit_price: 0,
    supplier: null
  });

  const [usePartData, setUsePartData] = useState<UseSparePartInput>({
    service_id: 0,
    spare_part_id: 0,
    quantity_used: 1
  });

  const loadSpareParts = useCallback(async () => {
    try {
      const result = await trpc.getSpareParts.query();
      setSpareParts(result);
    } catch (error) {
      console.error('Failed to load spare parts:', error);
    }
  }, []);

  const loadOutOfStockParts = useCallback(async () => {
    try {
      const result = await trpc.getOutOfStockParts.query();
      setOutOfStockParts(result);
    } catch (error) {
      console.error('Failed to load out of stock parts:', error);
    }
  }, []);

  const loadServices = useCallback(async () => {
    try {
      const result = await trpc.getServices.query();
      setServices(result);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  }, []);

  useEffect(() => {
    loadSpareParts();
    loadOutOfStockParts();
    loadServices();
  }, [loadSpareParts, loadOutOfStockParts, loadServices]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: null,
      part_number: '',
      stock_quantity: 0,
      unit_price: 0,
      supplier: null
    });
    setEditingPart(null);
  };

  const resetUsePartForm = () => {
    setUsePartData({
      service_id: 0,
      spare_part_id: 0,
      quantity_used: 1
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingPart) {
        const updateData: UpdateSparePartInput = {
          id: editingPart.id,
          ...formData
        };
        const updatedPart = await trpc.updateSparePart.mutate(updateData);
        setSpareParts((prev: SparePart[]) => 
          prev.map((p: SparePart) => p.id === editingPart.id ? updatedPart : p)
        );
      } else {
        const newPart = await trpc.createSparePart.mutate(formData);
        setSpareParts((prev: SparePart[]) => [...prev, newPart]);
      }
      
      resetForm();
      setIsDialogOpen(false);
      loadOutOfStockParts();
    } catch (error) {
      console.error('Failed to save spare part:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.useSparePartInService.mutate(usePartData);
      loadSpareParts();
      loadOutOfStockParts();
      resetUsePartForm();
      setIsUsePartDialogOpen(false);
    } catch (error) {
      console.error('Failed to use spare part:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (part: SparePart) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      description: part.description,
      part_number: part.part_number,
      stock_quantity: part.stock_quantity,
      unit_price: part.unit_price,
      supplier: part.supplier
    });
    setIsDialogOpen(true);
  };

  const handleUsePart = (part: SparePart) => {
    setUsePartData({
      service_id: 0,
      spare_part_id: part.id,
      quantity_used: 1
    });
    setIsUsePartDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const };
    } else if (quantity <= 5) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    } else {
      return { label: 'In Stock', variant: 'default' as const };
    }
  };

  const activeServices = services.filter((s: Service) => s.status === 'in_progress');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all-parts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-parts">All Parts</TabsTrigger>
          <TabsTrigger value="out-of-stock">
            Out of Stock
            {outOfStockParts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {outOfStockParts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-parts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Spare Parts Inventory</h3>
            <div className="space-x-2">
              <Dialog open={isUsePartDialogOpen} onOpenChange={setIsUsePartDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetUsePartForm} variant="outline">
                    Use Part in Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Use Spare Part in Service</DialogTitle>
                    <DialogDescription>
                      Record the usage of spare parts in a service.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleUsePartSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="spare_part">Spare Part *</Label>
                      <Select
                        value={usePartData.spare_part_id.toString()}
                        onValueChange={(value: string) =>
                          setUsePartData((prev: UseSparePartInput) => ({ 
                            ...prev, 
                            spare_part_id: parseInt(value) 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a spare part" />
                        </SelectTrigger>
                        <SelectContent>
                          {spareParts.filter((part: SparePart) => part.stock_quantity > 0).map((part: SparePart) => (
                            <SelectItem key={part.id} value={part.id.toString()}>
                              {part.name} (Stock: {part.stock_quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="service">Service *</Label>
                      <Select
                        value={usePartData.service_id.toString()}
                        onValueChange={(value: string) =>
                          setUsePartData((prev: UseSparePartInput) => ({ 
                            ...prev, 
                            service_id: parseInt(value) 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeServices.map((service: Service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              Service #{service.id} - {service.problem_description.substring(0, 30)}...
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quantity_used">Quantity Used *</Label>
                      <Input
                        id="quantity_used"
                        type="number"
                        min="1"
                        value={usePartData.quantity_used}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setUsePartData((prev: UseSparePartInput) => ({ 
                            ...prev, 
                            quantity_used: parseInt(e.target.value) || 1 
                          }))
                        }
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsUsePartDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Recording...' : 'Record Usage'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700">
                    Add Part
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPart ? 'Update spare part information.' : 'Add a new spare part to inventory.'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateSparePartInput) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Part name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="part_number">Part Number *</Label>
                      <Input
                        id="part_number"
                        value={formData.part_number}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateSparePartInput) => ({ ...prev, part_number: e.target.value }))
                        }
                        placeholder="Part number/SKU"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateSparePartInput) => ({ 
                            ...prev, 
                            description: e.target.value || null 
                          }))
                        }
                        placeholder="Part description (optional)"
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          min="0"
                          value={formData.stock_quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateSparePartInput) => ({ 
                              ...prev, 
                              stock_quantity: parseInt(e.target.value) || 0 
                            }))
                          }
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="unit_price">Unit Price ($) *</Label>
                        <Input
                          id="unit_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.unit_price}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateSparePartInput) => ({ 
                              ...prev, 
                              unit_price: parseFloat(e.target.value) || 0 
                            }))
                          }
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateSparePartInput) => ({ 
                            ...prev, 
                            supplier: e.target.value || null 
                          }))
                        }
                        placeholder="Supplier name (optional)"
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
                        {isLoading ? 'Saving...' : (editingPart ? 'Update' : 'Create')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {spareParts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No spare parts yet</h3>
                <p className="text-gray-500 mb-4">Add your first spare part to inventory</p>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700">
                  Add First Part
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {spareParts.map((part: SparePart) => {
                const stockBadge = getStockBadge(part.stock_quantity);
                return (
                  <Card key={part.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{part.name}</CardTitle>
                        <Badge variant={stockBadge.variant} className="text-xs">
                          {stockBadge.label}
                        </Badge>
                      </div>
                      <CardDescription>
                        Part #: {part.part_number}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {part.description && (
                        <p className="text-sm text-gray-600">{part.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Stock:</span>
                          <div className={part.stock_quantity === 0 ? 'text-red-600' : ''}>
                            {part.stock_quantity} units
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Unit Price:</span>
                          <div>${part.unit_price.toFixed(2)}</div>
                        </div>
                      </div>
                      
                      {part.supplier && (
                        <div className="text-sm">
                          <span className="font-medium">Supplier:</span>
                          <div className="text-gray-600">{part.supplier}</div>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="text-xs text-gray-500">
                        Added: {part.created_at.toLocaleDateString()}
                      </div>
                      
                      <div className="flex space-x-2">
                        {part.stock_quantity > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUsePart(part)}
                            className="flex-1"
                          >
                            Use
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(part)}
                          className="flex-1"
                        >
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="out-of-stock" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Out of Stock Parts</h3>
            {outOfStockParts.length > 0 && (
              <Alert className="mb-4">
                <AlertDescription>
                  {outOfStockParts.length} parts are currently out of stock and need restocking.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {outOfStockParts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All parts in stock</h3>
                <p className="text-gray-500">No parts are currently out of stock</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {outOfStockParts.map((part: SparePart) => (
                <Card key={part.id} className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{part.name}</CardTitle>
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
                    </div>
                    <CardDescription>
                      Part #: {part.part_number}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {part.description && (
                      <p className="text-sm text-gray-600">{part.description}</p>
                    )}
                    
                    <div className="text-sm">
                      <span className="font-medium">Unit Price:</span>
                      <div>${part.unit_price.toFixed(2)}</div>
                    </div>
                    
                    {part.supplier && (
                      <div className="text-sm">
                        <span className="font-medium">Supplier:</span>
                        <div className="text-gray-600">{part.supplier}</div>
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      onClick={() => handleEdit(part)}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      Restock
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}