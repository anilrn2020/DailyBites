import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { stripePromise, isStripeAvailable } from "@/lib/stripe";

const PLAN_DETAILS = {
  basic: { name: "Basic", price: 29, features: ["Post up to 5 deals per month", "Basic analytics dashboard", "Email customer notifications", "Standard support", "Deal scheduling"] },
  professional: { name: "Professional", price: 59, features: ["Post up to 15 deals per month", "Advanced analytics & insights", "Priority customer notifications", "Priority support", "Advanced deal scheduling", "Custom deal categories", "Customer engagement metrics"] },
  enterprise: { name: "Enterprise", price: 99, features: ["Unlimited deals posting", "Advanced analytics suite", "Custom notification campaigns", "Dedicated account manager", "API access", "Multi-location management", "White-label options", "Custom integrations"] }
};

const SubscribeForm = ({ planId }: { planId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      setIsProcessing(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/restaurant-dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "You are now subscribed! Redirecting to your dashboard...",
      });
      setTimeout(() => setLocation("/restaurant-dashboard"), 2000);
    }
    setIsProcessing(false);
  };

  const planDetails = PLAN_DETAILS[planId as keyof typeof PLAN_DETAILS];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/restaurant-dashboard")}
            className="mb-4"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="font-heading text-3xl font-bold mb-2">
            Complete Your Subscription
          </h1>
          <p className="text-muted-foreground">
            You're subscribing to the {planDetails.name} plan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading">{planDetails.name} Plan</CardTitle>
                <Badge variant="secondary">Selected</Badge>
              </div>
              <CardDescription>
                Perfect for your restaurant's needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold">${planDetails.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  7-day free trial included
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">What's included:</h4>
                <ul className="space-y-2">
                  {planDetails.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Enter your payment details to complete subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <PaymentElement />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!stripe || !elements || isProcessing}
                  data-testid="button-subscribe"
                >
                  {isProcessing ? "Processing..." : `Subscribe to ${planDetails.name} Plan`}
                </Button>
                
                <div className="text-xs text-muted-foreground text-center">
                  <p>Your subscription will begin immediately after payment.</p>
                  <p>You can cancel anytime from your dashboard.</p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function SubscriptionPayment() {
  const [clientSecret, setClientSecret] = useState("");
  const [planId, setPlanId] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();

  // Check if user is a restaurant owner
  if (!isLoading && (!user || (user as any)?.userType !== 'restaurant')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only restaurant owners can access subscription features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if Stripe is available
  if (!isStripeAvailable()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Payment Unavailable</CardTitle>
            <CardDescription>
              Payment processing is not available at this time. Please contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/restaurant-dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    // Wait for authentication to complete
    if (isLoading) {
      return;
    }

    // Ensure user is authenticated and is a restaurant owner
    if (!user || (user as any)?.userType !== 'restaurant') {
      return;
    }

    // Get plan ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const selectedPlan = urlParams.get('plan');
    
    if (!selectedPlan || !PLAN_DETAILS[selectedPlan as keyof typeof PLAN_DETAILS]) {
      toast({
        title: "Invalid plan",
        description: "Please select a valid subscription plan",
        variant: "destructive",
      });
      setLocation("/restaurant-dashboard");
      return;
    }
    
    setPlanId(selectedPlan);

    // Create subscription
    apiRequest("POST", "/api/create-subscription", { planId: selectedPlan })
      .then((response: any) => {
        console.log("Subscription response:", response);
        if (response && response.clientSecret) {
          setClientSecret(response.clientSecret);
        } else {
          throw new Error("No client secret received from server");
        }
      })
      .catch((error) => {
        console.error("Subscription creation error:", error);
        toast({
          title: "Subscription Error",
          description: "Failed to initialize subscription. Please try again.",
          variant: "destructive",
        });
        setLocation("/restaurant-dashboard");
      });
  }, [setLocation, toast, isLoading, user]);

  if (!clientSecret || !planId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" aria-label="Loading"/>
          <p className="text-muted-foreground">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <SubscribeForm planId={planId} />
    </Elements>
  );
}