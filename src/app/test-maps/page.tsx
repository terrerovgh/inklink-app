import { MapIntegrationTest } from '@/components/MapIntegrationTest';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Map Integration Test - InkLink',
  description: 'Test suite for MapLibre and Google Maps integration with feature flags',
};

export default function TestMapsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Map Integration Test Suite
          </h1>
          <p className="text-muted-foreground">
            Comprehensive testing for MapLibre + MapTiler integration with feature flags
          </p>
        </div>
        
        <MapIntegrationTest />
      </div>
    </div>
  );
}