import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertDealSchema, publicUpdateDealSchema, publicUpdateRestaurantSchema, type Deal, type Restaurant, type User } from "@shared/schema";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  LogOut, 
  Settings,
  Upload,
  Clock,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  CreditCard
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const { toast } = useToast();
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [activeTab, setActiveTab] = useState("deals");

  // Get current user and restaurant data
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { data: restaurant } = useQuery<Restaurant>({ queryKey: ["/api/restaurants/my"] });
  const { data: deals = [], isLoading: dealsLoading } = useQuery<Deal[]>({ 
    queryKey: ["/api/deals/my"], 
    enabled: !!restaurant?.id 
  });

  // Get subscription status
  const { data: subscriptionStatus } = useQuery<{
    status: string;
    plan: string | null;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd?: boolean;
  }>({
    queryKey: ["/api/subscription/status"],
    enabled: !!user?.id
  });

  // Deal creation form
  const dealForm = useForm({
    resolver: zodResolver(insertDealSchema),
    defaultValues: {
      title: "",
      description: "",
      originalPrice: "0",
      dealPrice: "0",
      duration: 24, // 24 hours
    },
  });

  // Deal edit form
  const editForm = useForm({
    resolver: zodResolver(publicUpdateDealSchema),
    defaultValues: {
      title: "",
      description: "",
      originalPrice: "0",
      dealPrice: "0",
    },
  });

  // Restaurant settings form
  const restaurantForm = useForm({
    resolver: zodResolver(publicUpdateRestaurantSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
    },
  });

  // Handler for address autocomplete selection in restaurant settings
  const handleAddressSelect = (address: { 
    street?: string; 
    city: string; 
    state: string; 
    zipCode?: string; 
  }) => {
    // Auto-populate city, state, and zip code fields when address is selected
    restaurantForm.setValue("city", address.city);
    restaurantForm.setValue("state", address.state);
    if (address.zipCode) {
      restaurantForm.setValue("zipCode", address.zipCode);
    }
  };

  // Reset form with restaurant data when dialog opens
  useEffect(() => {
    if (showSettings && restaurant) {
      restaurantForm.reset({
        name: restaurant.name,
        description: restaurant.description || "",
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        zipCode: restaurant.zipCode,
        phone: restaurant.phone || "",
      });
    }
  }, [showSettings, restaurant, restaurantForm]);

  const createDealMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/deals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals/my"] });
      dealForm.reset();
      toast({ title: "Deal created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create deal", description: error.message, variant: "destructive" });
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: (dealId: string) => apiRequest("DELETE", `/api/deals/${dealId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals/my"] });
      toast({ title: "Deal deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete deal", description: error.message, variant: "destructive" });
    },
  });

  const editDealMutation = useMutation({
    mutationFn: ({ dealId, data }: { dealId: string; data: any }) => 
      apiRequest(`/api/deals/${dealId}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals/my"] });
      setEditingDeal(null);
      toast({ title: "Deal updated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update deal", description: error.message, variant: "destructive" });
    },
  });

  const updateRestaurantMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/api/restaurants/my", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants/my"] });
      setShowSettings(false);
      toast({ title: "Restaurant settings updated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update restaurant settings", description: error.message, variant: "destructive" });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleCreateDeal = (data: any) => {
    // For now, skip subscription plan limits
    createDealMutation.mutate(data);
  };

  const handleDeleteDeal = (dealId: string) => {
    if (window.confirm("Are you sure you want to delete this deal?")) {
      deleteDealMutation.mutate(dealId);
    }
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    editForm.reset({
      title: deal.title,
      description: deal.description || "",
      originalPrice: deal.originalPrice.toString(),
      dealPrice: deal.dealPrice.toString(),
    });
  };

  const handleSaveEdit = (data: any) => {
    if (editingDeal) {
      editDealMutation.mutate({ dealId: editingDeal.id, data });
    }
  };

  const handleCancelEdit = () => {
    setEditingDeal(null);
    editForm.reset();
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
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Restaurant Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSubscription(true)} data-testid="menu-subscription">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscription
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
            Welcome back, {restaurant?.name || user?.firstName || 'Restaurant Owner'}! 
          </h2>
          <p className="text-muted-foreground">
            Manage your deals and track your restaurant's performance
          </p>
          {restaurant && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {subscriptionStatus?.plan ? 
                  `${subscriptionStatus.plan.charAt(0).toUpperCase() + subscriptionStatus.plan.slice(1)} Plan` : 
                  'No Plan'
                }
              </Badge>
              <Badge variant="secondary">
                {deals.length} deals created
              </Badge>
              {subscriptionStatus?.status === 'active' && (
                <Badge variant="default" className="bg-green-600">
                  Active
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <RestaurantStats stats={mockStats} />
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deals" data-testid="tab-my-deals">My Deals</TabsTrigger>
            <TabsTrigger value="create" data-testid="tab-create-deal">Create Deal</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deals" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-semibold">
                Active Deals
              </h3>
              <Button 
                onClick={() => setActiveTab("create")}
                data-testid="button-create-new-deal"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Deal
              </Button>
            </div>
            
            <div className="grid gap-4">
              {dealsLoading ? (
                <div className="text-center py-8">Loading your deals...</div>
              ) : deals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🍽️</div>
                  <h3 className="font-heading text-xl font-semibold mb-2">
                    No deals yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first deal to start attracting customers
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Deal
                  </Button>
                </div>
              ) : (
                deals.map((deal) => {
                  const now = new Date();
                  const endTime = new Date(deal.endTime);
                  const timeLeft = Math.max(0, endTime.getTime() - now.getTime());
                  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                  const timeRemaining = timeLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : "Expired";
                  
                  return (
                    <Card key={deal.id} data-testid={`card-active-deal-${deal.id}`}>
                      <CardContent className="p-6">
                        {editingDeal?.id === deal.id ? (
                          // Edit mode
                          <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                  control={editForm.control}
                                  name="title"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Deal Title</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Deal title"
                                          data-testid={`input-edit-title-${deal.id}`}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Description"
                                          data-testid={`input-edit-description-${deal.id}`}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                  control={editForm.control}
                                  name="originalPrice"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Original Price ($)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="18.99"
                                          data-testid={`input-edit-original-price-${deal.id}`}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editForm.control}
                                  name="dealPrice"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Deal Price ($)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="12.99"
                                          data-testid={`input-edit-deal-price-${deal.id}`}
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  type="submit" 
                                  size="sm"
                                  disabled={editDealMutation.isPending}
                                  data-testid={`button-save-edit-${deal.id}`}
                                >
                                  {editDealMutation.isPending ? "Saving..." : "Save"}
                                </Button>
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  data-testid={`button-cancel-edit-${deal.id}`}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </Form>
                        ) : (
                          // View mode
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-2">{deal.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{deal.description}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  ${deal.dealPrice} (was ${deal.originalPrice})
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {timeRemaining} left
                                </div>
                                <Badge variant={deal.isActive && timeLeft > 0 ? "default" : "secondary"}>
                                  {deal.isActive && timeLeft > 0 ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditDeal(deal)}
                                data-testid={`button-edit-deal-${deal.id}`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteDeal(deal.id)}
                                disabled={deleteDealMutation.isPending}
                                data-testid={`button-delete-deal-${deal.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="create" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Deal</CardTitle>
                <p className="text-muted-foreground">
                  Create an attractive deal to bring in more customers
                </p>
                {restaurant && (
                  <p className="text-sm text-muted-foreground">
                    Create attractive deals to bring in more customers.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <Form {...dealForm}>
                  <form onSubmit={dealForm.handleSubmit(handleCreateDeal)} className="space-y-6">
                    <FormField
                      control={dealForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deal Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Margherita Pizza Special"
                              data-testid="input-deal-title"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={dealForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your delicious deal..."
                              data-testid="textarea-deal-description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={dealForm.control}
                        name="originalPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Original Price ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="18.99"
                                data-testid="input-original-price"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={dealForm.control}
                        name="dealPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deal Price ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="12.99"
                                data-testid="input-deal-price"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={dealForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deal Duration (hours)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="168"
                              placeholder="24"
                              data-testid="input-deal-duration"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 24)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <Label>Deal Image (Optional)</Label>
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
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      data-testid="button-publish-deal"
                      disabled={createDealMutation.isPending}
                    >
                      {createDealMutation.isPending ? "Creating..." : "Publish Deal"}
                    </Button>
                  </form>
                </Form>
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
          
        </Tabs>
      </main>

      {/* Restaurant Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Restaurant Settings</DialogTitle>
            <DialogDescription>
              Update your restaurant information and preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {restaurant && (
              <Form {...restaurantForm}>
                <form onSubmit={restaurantForm.handleSubmit((data) => updateRestaurantMutation.mutate(data))} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={restaurantForm.control}
                      name="name"
                      defaultValue={restaurant.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-restaurant-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={restaurantForm.control}
                      name="phone"
                      defaultValue={restaurant.phone || ""}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-restaurant-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={restaurantForm.control}
                    name="description"
                    defaultValue={restaurant.description || ""}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="textarea-restaurant-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={restaurantForm.control}
                    name="address"
                    defaultValue={restaurant.address}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <AddressAutocomplete 
                            value={field.value}
                            onChange={field.onChange}
                            onAddressSelect={handleAddressSelect}
                            placeholder="Start typing an address..."
                            data-testid="input-restaurant-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                      control={restaurantForm.control}
                      name="city"
                      defaultValue={restaurant.city}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-restaurant-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={restaurantForm.control}
                      name="state"
                      defaultValue={restaurant.state}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-restaurant-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={restaurantForm.control}
                      name="zipCode"
                      defaultValue={restaurant.zipCode}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-restaurant-zipcode" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowSettings(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateRestaurantMutation.isPending}
                      data-testid="button-save-restaurant-settings"
                    >
                      {updateRestaurantMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={showSubscription} onOpenChange={setShowSubscription}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Choose or change your subscription plan to access premium features
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {subscriptionStatus?.status === 'active' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default" className="bg-green-600">
                    Active Subscription
                  </Badge>
                  <Badge variant="outline">
                    {subscriptionStatus.plan ? 
                      `${subscriptionStatus.plan.charAt(0).toUpperCase() + subscriptionStatus.plan.slice(1)} Plan` : 
                      'Current Plan'
                    }
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your subscription is active and all features are available.
                  {subscriptionStatus.currentPeriodEnd && (
                    ` Next billing: ${new Date(subscriptionStatus.currentPeriodEnd * 1000).toLocaleDateString()}`
                  )}
                </p>
              </div>
            )}
            
            <SubscriptionPricing 
              currentPlan={subscriptionStatus?.plan || undefined}
              onPlanSelect={(planId) => {
                // Close subscription dialog and navigate to payment
                setShowSubscription(false);
                // Navigate to subscription payment with selected plan
                window.location.href = `/subscription-payment?plan=${planId}`;
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}