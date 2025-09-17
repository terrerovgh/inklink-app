'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Zap } from 'lucide-react';
import { SearchFilters, SearchFiltersState } from './SearchFilters';
import { AdvancedSearchFilters, AdvancedSearchFiltersState } from './AdvancedSearchFilters';
import { ProfileType, Specialty } from '@/shared/types/profiles';

// Default state for basic search filters
const DEFAULT_BASIC_FILTERS: SearchFiltersState = {
  query: '',
  profileType: 'all',
  location: '',
  specialties: [],
  minRating: 0,
  maxDistance: 50,
  priceRange: [0, 500],
  experienceRange: [0, 20],
  availability: 'all',
  amenities: [],
  sortBy: 'relevance',
  sortOrder: 'desc'
};

// Default state for advanced search filters
const DEFAULT_ADVANCED_FILTERS: AdvancedSearchFiltersState = {
  // Basic search
  query: '',
  profileType: 'all',
  location: '',
  
  // Advanced filters
  specialties: [],
  specialtyOperator: 'OR',
  minRating: 0,
  maxDistance: 50,
  priceRange: [0, 500],
  experienceRange: [0, 20],
  
  // Availability filters
  availability: 'all',
  availabilityDays: [],
  availabilityTime: 'any',
  
  // Services and amenities
  services: [],
  servicesOperator: 'OR',
  amenities: [],
  amenitiesOperator: 'OR',
  
  // Sorting and display
  sortBy: 'relevance',
  sortOrder: 'desc',
  
  // Advanced options
  includeInactive: false,
  verifiedOnly: false,
  hasPortfolio: false,
  acceptsNewClients: false
};

interface SearchFiltersWrapperProps {
  specialties: Specialty[];
  onFiltersChange: (filters: SearchFiltersState | AdvancedSearchFiltersState, isAdvanced: boolean) => void;
  onSaveSearch?: (name: string, filters: AdvancedSearchFiltersState) => void;
  savedSearches?: Array<{ id: string; name: string; filters: AdvancedSearchFiltersState }>;
  searchHistory?: Array<{ query: string; timestamp: Date }>;
  resultCount?: number;
  isLoading?: boolean;
  className?: string;
  defaultAdvanced?: boolean;
}

export function SearchFiltersWrapper({
  specialties,
  onFiltersChange,
  onSaveSearch,
  savedSearches = [],
  searchHistory = [],
  resultCount,
  isLoading = false,
  className = '',
  defaultAdvanced = false
}: SearchFiltersWrapperProps) {
  const [isAdvancedMode, setIsAdvancedMode] = useState(defaultAdvanced);
  const [basicFilters, setBasicFilters] = useState<SearchFiltersState>(DEFAULT_BASIC_FILTERS);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFiltersState>(DEFAULT_ADVANCED_FILTERS);

  // Convert basic filters to advanced format
  const convertBasicToAdvanced = useCallback((basic: SearchFiltersState): AdvancedSearchFiltersState => {
    return {
      ...DEFAULT_ADVANCED_FILTERS,
      query: basic.query,
      profileType: basic.profileType,
      location: basic.location,
      specialties: basic.specialties,
      minRating: basic.minRating,
      maxDistance: basic.maxDistance,
      priceRange: basic.priceRange,
      experienceRange: basic.experienceRange,
      availability: basic.availability,
      amenities: basic.amenities,
      sortBy: basic.sortBy,
      sortOrder: basic.sortOrder
    };
  }, []);

  // Convert advanced filters to basic format
  const convertAdvancedToBasic = useCallback((advanced: AdvancedSearchFiltersState): SearchFiltersState => {
    return {
      query: advanced.query,
      profileType: advanced.profileType,
      location: advanced.location,
      specialties: advanced.specialties,
      minRating: advanced.minRating,
      maxDistance: advanced.maxDistance,
      priceRange: advanced.priceRange,
      experienceRange: advanced.experienceRange,
      availability: advanced.availability === 'custom' ? 'all' : advanced.availability,
      amenities: advanced.amenities,
      sortBy: advanced.sortBy,
      sortOrder: advanced.sortOrder
    };
  }, []);

  // Handle mode toggle
  const handleModeToggle = useCallback((advanced: boolean) => {
    if (advanced && !isAdvancedMode) {
      // Switching to advanced mode - convert basic to advanced
      const convertedFilters = convertBasicToAdvanced(basicFilters);
      setAdvancedFilters(convertedFilters);
      onFiltersChange(convertedFilters, true);
    } else if (!advanced && isAdvancedMode) {
      // Switching to basic mode - convert advanced to basic
      const convertedFilters = convertAdvancedToBasic(advancedFilters);
      setBasicFilters(convertedFilters);
      onFiltersChange(convertedFilters, false);
    }
    setIsAdvancedMode(advanced);
  }, [isAdvancedMode, basicFilters, advancedFilters, convertBasicToAdvanced, convertAdvancedToBasic, onFiltersChange]);

  // Handle basic filters change
  const handleBasicFiltersChange = useCallback((filters: SearchFiltersState) => {
    setBasicFilters(filters);
    onFiltersChange(filters, false);
  }, [onFiltersChange]);

  // Handle advanced filters change
  const handleAdvancedFiltersChange = useCallback((filters: AdvancedSearchFiltersState) => {
    setAdvancedFilters(filters);
    onFiltersChange(filters, true);
  }, [onFiltersChange]);

  // Reset filters
  const handleReset = useCallback(() => {
    if (isAdvancedMode) {
      setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
      onFiltersChange(DEFAULT_ADVANCED_FILTERS, true);
    } else {
      setBasicFilters(DEFAULT_BASIC_FILTERS);
      onFiltersChange(DEFAULT_BASIC_FILTERS, false);
    }
  }, [isAdvancedMode, onFiltersChange]);

  // Calculate if there are any active filters
  const hasActiveFilters = isAdvancedMode 
    ? Object.entries(advancedFilters).some(([key, value]) => {
        if (key === 'query' || key === 'location') return Boolean(value);
        if (key === 'profileType') return value !== 'all';
        if (key === 'availability') return value !== 'all';
        if (key === 'sortBy') return value !== 'relevance';
        if (key === 'sortOrder') return value !== 'desc';
        if (key === 'minRating') return value > 0;
        if (key === 'maxDistance') return value < 50;
        if (key === 'priceRange') return value[0] > 0 || value[1] < 500;
        if (key === 'experienceRange') return value[0] > 0 || value[1] < 20;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'boolean') return value;
        return false;
      })
    : Object.entries(basicFilters).some(([key, value]) => {
        if (key === 'query' || key === 'location') return Boolean(value);
        if (key === 'profileType') return value !== 'all';
        if (key === 'availability') return value !== 'all';
        if (key === 'sortBy') return value !== 'relevance';
        if (key === 'sortOrder') return value !== 'desc';
        if (key === 'minRating') return value > 0;
        if (key === 'maxDistance') return value < 50;
        if (key === 'priceRange') return value[0] > 0 || value[1] < 500;
        if (key === 'experienceRange') return value[0] > 0 || value[1] < 20;
        if (Array.isArray(value)) return value.length > 0;
        return false;
      });

  return (
    <div className={className}>
      {/* Mode Toggle */}
      <div className="mb-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Label htmlFor="search-mode" className="text-sm font-medium">
              Search Mode
            </Label>
            <div className="flex items-center space-x-2">
              <Zap className={`h-4 w-4 ${!isAdvancedMode ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch
                id="search-mode"
                checked={isAdvancedMode}
                onCheckedChange={handleModeToggle}
                disabled={isLoading}
              />
              <Settings className={`h-4 w-4 ${isAdvancedMode ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isAdvancedMode ? 'default' : 'secondary'} className="text-xs">
              {isAdvancedMode ? 'Advanced' : 'Simple'}
            </Badge>
            {resultCount !== undefined && (
              <Badge variant="outline" className="text-xs">
                {resultCount} results
              </Badge>
            )}
          </div>
        </div>
        
        {/* Mode Description */}
        <p className="text-xs text-muted-foreground mt-2">
          {isAdvancedMode 
            ? 'Advanced mode offers logical operators, custom availability, services filtering, and search history.'
            : 'Simple mode provides basic search and filtering options for quick results.'
          }
        </p>
      </div>

      {/* Render appropriate filter component */}
      {isAdvancedMode ? (
        <AdvancedSearchFilters
          filters={advancedFilters}
          specialties={specialties}
          onFiltersChange={handleAdvancedFiltersChange}
          onReset={handleReset}
          onSaveSearch={onSaveSearch}
          savedSearches={savedSearches}
          searchHistory={searchHistory}
          resultCount={resultCount}
          isLoading={isLoading}
        />
      ) : (
        <SearchFilters
          filters={basicFilters}
          specialties={specialties}
          onFiltersChange={handleBasicFiltersChange}
          onReset={handleReset}
          isLoading={isLoading}
        />
      )}

      {/* Quick Actions */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-between items-center p-3 bg-muted/30 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {isAdvancedMode ? 'Advanced filters' : 'Filters'} applied
          </span>
          <div className="flex space-x-2">
            {isAdvancedMode && onSaveSearch && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const name = prompt('Enter a name for this search:');
                  if (name) {
                    onSaveSearch(name, advancedFilters);
                  }
                }}
              >
                Save Search
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export both filter states for type checking
export type { SearchFiltersState, AdvancedSearchFiltersState };
export { DEFAULT_BASIC_FILTERS, DEFAULT_ADVANCED_FILTERS };