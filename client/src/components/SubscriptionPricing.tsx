import { Check, Star, Crown, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  buttonText: string;
  maxDeals: string;
}

interface SubscriptionPricingProps {
  onPlanSelect?: (planId: string) => void;
  currentPlan?: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Perfect for small restaurants getting started",
    price: 29,
    period: "month",
    maxDeals: "5 deals/month",
    icon: <Star className="h-5 w-5" />,
    buttonText: "Start Basic Plan",
    features: [
      "Post up to 5 deals per month",
      "Basic analytics dashboard",
      "Email customer notifications",
      "Standard support",
      "Deal scheduling",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Most popular for growing restaurants",
    price: 59,
    period: "month",
    maxDeals: "15 deals/month",
    popular: true,
    icon: <Crown className="h-5 w-5" />,
    buttonText: "Upgrade to Pro",
    features: [
      "Post up to 15 deals per month",
      "Advanced analytics & insights",
      "Priority customer notifications",
      "Priority support",
      "Advanced deal scheduling",
      "Custom deal categories",
      "Customer engagement metrics",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For restaurant chains and large operations",
    price: 99,
    period: "month",
    maxDeals: "Unlimited deals",
    icon: <Zap className="h-5 w-5" />,
    buttonText: "Go Enterprise",
    features: [
      "Unlimited deals posting",
      "Advanced analytics suite",
      "Custom notification campaigns",
      "Dedicated account manager",
      "API access",
      "Multi-location management",
      "White-label options",
      "Custom integrations",
    ],
  },
];

export function SubscriptionPricing({ onPlanSelect, currentPlan }: SubscriptionPricingProps) {
  const [, setLocation] = useLocation();

  const handlePlanSelect = (planId: string) => {
    onPlanSelect?.(planId);
    console.log(`Plan selected: ${planId}`);
    // Navigate to subscription payment page with selected plan
    setLocation(`/subscription-payment?plan=${planId}`);
  };

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="font-heading text-3xl font-bold mb-4">
          Choose Your Restaurant Plan
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start attracting more customers with daily deals. All plans include a 14-day free trial.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {PRICING_TIERS.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative overflow-hidden hover-elevate ${
              tier.popular ? 'border-primary ring-1 ring-primary' : ''
            }`}
            data-testid={`card-plan-${tier.id}`}
          >
            {tier.popular && (
              <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
                Most Popular
              </div>
            )}
            
            <CardHeader className={tier.popular ? 'pt-12' : ''}>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-primary">{tier.icon}</div>
                <CardTitle className="font-heading">{tier.name}</CardTitle>
                {currentPlan === tier.id && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {tier.description}
              </p>
              
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">${tier.price}</span>
                <span className="text-muted-foreground">/{tier.period}</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {tier.maxDeals}
              </div>
            </CardHeader>
            
            <CardContent>
              <Button 
                className="w-full mb-6" 
                variant={tier.popular ? "default" : "outline"}
                onClick={() => handlePlanSelect(tier.id)}
                disabled={currentPlan === tier.id}
                data-testid={`button-select-${tier.id}`}
              >
                {currentPlan === tier.id ? "Current Plan" : tier.buttonText}
              </Button>
              
              <ul className="space-y-3">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          All plans include a 14-day free trial. Cancel anytime. No setup fees.
        </p>
      </div>
    </div>
  );
}