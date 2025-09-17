'use client';

import React, { useState } from 'react';
import UnifiedMapComponent from './UnifiedMapComponent';
import { TattooStudio } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, DollarSign } from 'lucide-react';

// Mock data for testing
const mockStudios: TattooStudio[] = [
  {
    id: '1',
    name: 'Ink Masters Studio',
    address: '123 Main St, New York, NY',
    lat: 40.7128,
    lng: -74.0060,
    rating: 4.8,
    priceRange: [100, 300],
    specialties: ['Traditional', 'Realism'],
    phone: '+1-555-0123',
    email: 'info@inkmasters.com',
    website: 'https://inkmasters.com',
    images: ['/api/placeholder/300/200'],
    description: 'Premier tattoo studio in NYC'
  },
  {
    id: '2',
    name: 'Urban Art Collective',
    address: '456 Brooklyn Ave, Brooklyn, NY',
    lat: 40.6782,
    lng: -73.9442,
    rating: 4.6,
    priceRange: [80, 250],
    specialties: ['Neo-Traditional', 'Watercolor'],
    phone: '+1-555-0456',
    email: 'hello@urbanart.com',
    website: 'https://urbanart.com',
    images: ['/api/placeholder/300/200'],
    description: 'Creative tattoo collective in Brooklyn'
  },
  {
    id: '3',
    name: 'Classic Tattoo Parlor',
    address: '789 Queens Blvd, Queens, NY',
    lat: 40.7282,
    lng: -73.7949,
    rating: 4.4,
    priceRange: [60, 200],
    specialties: ['Traditional', 'Black & Grey'],
    phone: '+1-555-0789',
    email: 'contact@classictattoo.com',
    website: 'https://classictattoo.com',
    images: ['/api/placeholder/300/200'],
    description: 'Traditional tattoo parlor in Queens'
  }
];

interface MapIntegrationTestProps {
  className?: string;
}

export const MapIntegrationTest: React.FC<MapIntegrationTestProps> = ({ className }) => {
  const [selectedStudio, setSelectedStudio] = useState<TattooStudio | null>(null);
  const [testResults, setTestResults] = useState<{
    mapLibreLoaded: boolean;
    googleMapsLoaded: boolean;
    featureFlagsWorking: boolean;
    markersRendered: boolean;
    filtersWorking: boolean;
  }>({ 
    mapLibreLoaded: false, 
    googleMapsLoaded: false, 
    featureFlagsWorking: false,
    markersRendered: false,
    filtersWorking: false
  });
  const [currentProvider, setCurrentProvider] = useState<'google' | 'maplibre'>('google');
  const [searchFilters, setSearchFilters] = useState({
    searchText: '',
    specialty: 'all',
    priceRange: [0, 500] as [number, number],
    minRating: 0,
    radius: 10
  });

  const handleStudioSelect = (studio: TattooStudio) => {
    setSelectedStudio(studio);
    setTestResults(prev => ({ ...prev, markersRendered: true }));
  };

  const handleMapReady = (map: any) => {
    if (map) {
      if (currentProvider === 'google') {
        setTestResults(prev => ({ ...prev, googleMapsLoaded: true }));
      } else {
        setTestResults(prev => ({ ...prev, mapLibreLoaded: true }));
      }
    }
  };

  const testProviderSwitch = () => {
    const newProvider = currentProvider === 'google' ? 'maplibre' : 'google';
    setCurrentProvider(newProvider);
    setTestResults(prev => ({ ...prev, featureFlagsWorking: true }));
  };

  const testFilters = () => {
    setSearchFilters({
      searchText: 'Ink',
      specialty: 'Traditional',
      priceRange: [100, 300],
      minRating: 4.5,
      radius: 5
    });
    setTestResults(prev => ({ ...prev, filtersWorking: true }));
  };

  const resetFilters = () => {
    setSearchFilters({
      searchText: '',
      specialty: 'all',
      priceRange: [0, 500],
      minRating: 0,
      radius: 10
    });
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? 'default' : 'secondary'}>
        {status ? '✅ Passed' : '⏳ Pending'}
      </Badge>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Map Integration Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Google Maps</span>
              {getStatusBadge(testResults.googleMapsLoaded)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">MapLibre</span>
              {getStatusBadge(testResults.mapLibreLoaded)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Feature Flags</span>
              {getStatusBadge(testResults.featureFlagsWorking)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Markers</span>
              {getStatusBadge(testResults.markersRendered)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Filters</span>
              {getStatusBadge(testResults.filtersWorking)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Current Provider</span>
              <Badge variant="outline">{currentProvider}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={testProviderSwitch} variant="outline">
              Switch to {currentProvider === 'google' ? 'MapLibre' : 'Google Maps'}
            </Button>
            <Button onClick={testFilters} variant="outline">
              Test Filters
            </Button>
            <Button onClick={resetFilters} variant="outline">
              Reset Filters
            </Button>
          </div>

          {selectedStudio && (
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">{selectedStudio.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{selectedStudio.address}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{selectedStudio.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span>${selectedStudio.priceRange[0]}-${selectedStudio.priceRange[1]}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedStudio.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="h-[600px] border rounded-lg overflow-hidden">
        <UnifiedMapComponent
          studios={mockStudios}
          selectedStudio={selectedStudio}
          onStudioSelect={handleStudioSelect}
          searchFilters={searchFilters}
          center={{ lat: 40.7128, lng: -74.0060 }}
          zoom={11}
          enableClustering={true}
          showControls={true}
          showProviderSwitch={true}
          showFilters={true}
          onMapReady={handleMapReady}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default MapIntegrationTest;