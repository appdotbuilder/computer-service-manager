import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerManagement } from '@/components/CustomerManagement';
import { ServiceManagement } from '@/components/ServiceManagement';
import { SparePartsManagement } from '@/components/SparePartsManagement';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔧 Computer Service Management
          </h1>
          <p className="text-gray-600">
            Manage customers, track services, and monitor spare parts inventory
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              👥 Customers
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              🛠️ Services
            </TabsTrigger>
            <TabsTrigger value="spare-parts" className="flex items-center gap-2">
              📦 Spare Parts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👥 Customer Management
                </CardTitle>
                <CardDescription>
                  Add, edit, and manage customer information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🛠️ Service Management
                </CardTitle>
                <CardDescription>
                  Track service requests, repairs, and completion status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spare-parts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📦 Spare Parts Inventory
                </CardTitle>
                <CardDescription>
                  Manage spare parts stock and track usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SparePartsManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;