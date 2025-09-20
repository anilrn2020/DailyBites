import { SubscriptionPricing } from '../SubscriptionPricing';

export default function SubscriptionPricingExample() {
  return (
    <div className="p-8">
      <SubscriptionPricing
        onPlanSelect={(planId) => console.log('Plan selected:', planId)}
        currentPlan="basic"
      />
    </div>
  );
}