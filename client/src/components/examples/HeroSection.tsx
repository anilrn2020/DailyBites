import { HeroSection } from '../HeroSection';

export default function HeroSectionExample() {
  return (
    <HeroSection
      onLocationSet={(location) => console.log('Location set:', location)}
      onExploreClick={() => console.log('Explore clicked')}
    />
  );
}