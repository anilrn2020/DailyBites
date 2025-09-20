import { useState } from "react";
import { RestaurantStats } from "@/components/RestaurantStats";
import { SubscriptionPricing } from "@/components/SubscriptionPricing";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  LogOut, 
  Settings,
  Upload,
  Clock,
  DollarSign,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// todo: remove mock functionality
const mockStats = {
  totalCustomers: {
    value: "2,543",
    change: "+12% from last month",
    trend: "up" as const,
  },
  totalRevenue: {
    value: "$8,234",
    change: "+8% from last month", 
    trend: "up" as const,
  },
  activeDeals: {
    value: "12",
    change: "+3 from last week",
    trend: "up" as const,
  },
  avgOrderTime: {
    value: "18 min",
    change: "-2 min from last month",
    trend: "up" as const,
  },
};

const mockActiveDeals = [
  {
    id: "1",
    title: "Margherita Pizza Special",
    originalPrice: 18.99,
    dealPrice: 12.99,
    timeRemaining: "2h 30m",
    views: 234,
    orders: 18,
  },
  {
    id: "2", 
    title: "Lunch Combo Deal",
    originalPrice: 24.99,
    dealPrice: 16.99,
    timeRemaining: "5h 15m",
    views: 456,
    orders: 32,
  },
];

export default function RestaurantDashboard() {
  const [newDeal, setNewDeal] = useState({
    title: "",
    description: "",
    originalPrice: "",
    dealPrice: "",
    duration: "24",
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating deal:', newDeal);
    // Reset form
    setNewDeal({
      title: "",
      description: "",
      originalPrice: "",
      dealPrice: "",
      duration: "24",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-primary">Today's Special</h1>
            <Badge variant="outline">
              Restaurant Dashboard
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-restaurant-menu">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => console.log('Settings clicked')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Restaurant Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Billing clicked')}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Billing & Subscription
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="font-heading text-3xl font-bold mb-2">
            Welcome back, Mario's Italian Kitchen! 🍕
          </h2>
          <p className="text-muted-foreground">
            Manage your deals and track your restaurant's performance
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <RestaurantStats stats={mockStats} />
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="deals" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="deals" data-testid="tab-my-deals">My Deals</TabsTrigger>
            <TabsTrigger value="create" data-testid="tab-create-deal">Create Deal</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="subscription" data-testid="tab-subscription">Subscription</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deals" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-semibold">
                Active Deals
              </h3>
              <Button data-testid="button-create-new-deal">
                <Plus className="h-4 w-4 mr-2" />
                Create New Deal
              </Button>
            </div>
            
            <div className="grid gap-4">
              {mockActiveDeals.map((deal) => (
                <Card key={deal.id} data-testid={`card-active-deal-${deal.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">{deal.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ${deal.dealPrice} (was ${deal.originalPrice})
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {deal.timeRemaining} left
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {deal.views} views
                          </div>
                          <Badge variant="secondary">
                            {deal.orders} orders
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="create" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Deal</CardTitle>
                <p className="text-muted-foreground">
                  Create an attractive deal to bring in more customers
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDeal} className="space-y-6">
                  <div>
                    <Label htmlFor="deal-title">Deal Title</Label>
                    <Input
                      id="deal-title"
                      placeholder="e.g., Margherita Pizza Special"
                      value={newDeal.title}
                      onChange={(e) => setNewDeal({...newDeal, title: e.target.value})}
                      data-testid="input-deal-title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deal-description">Description</Label>
                    <Textarea
                      id="deal-description"
                      placeholder="Describe your delicious deal..."
                      value={newDeal.description}
                      onChange={(e) => setNewDeal({...newDeal, description: e.target.value})}
                      data-testid="textarea-deal-description"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="original-price">Original Price ($)</Label>
                      <Input
                        id="original-price"
                        type="number"
                        step="0.01"
                        placeholder="18.99"
                        value={newDeal.originalPrice}
                        onChange={(e) => setNewDeal({...newDeal, originalPrice: e.target.value})}
                        data-testid="input-original-price"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="deal-price">Deal Price ($)</Label>
                      <Input
                        id="deal-price"
                        type="number"
                        step="0.01"
                        placeholder="12.99"
                        value={newDeal.dealPrice}
                        onChange={(e) => setNewDeal({...newDeal, dealPrice: e.target.value})}
                        data-testid="input-deal-price"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Deal Duration (hours)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="24"
                      value={newDeal.duration}
                      onChange={(e) => setNewDeal({...newDeal, duration: e.target.value})}
                      data-testid="input-deal-duration"
                    />
                  </div>
                  
                  <div>
                    <Label>Deal Image</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload a mouth-watering photo of your deal
                      </p>
                      <Button variant="outline" type="button" data-testid="button-upload-image">
                        Choose Image
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" data-testid="button-publish-deal">
                    Publish Deal
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="font-heading text-xl font-semibold mb-2">
                Detailed Analytics Coming Soon
              </h3>
              <p className="text-muted-foreground">
                Track customer engagement, conversion rates, and revenue analytics
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="subscription" className="mt-6">
            <SubscriptionPricing 
              onPlanSelect={(planId) => console.log('Plan selected:', planId)}
              currentPlan="basic"
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}