'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Star, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Users,
  Clock,
  Calendar,
  Zap,
  Settings,
  History,
  Bookmark,
  RefreshCw
} from 'lucide-react';
import { ProfileType, Specialty } from '@/shared/types/profiles';
import { useDebounce } from '@/hooks/useDebounce';

export interface AdvancedSearchFiltersState {
  // Basic search
  query: string;
  profileType: ProfileType | 'all';
  location: string;
  
  // Advanced filters
  specialties: string[];
  specialtyOperator: 'AND' | 'OR'; // Logical operator for specialties
  minRating: number;
  maxDistance: number;
  priceRange: [number, number];
  experienceRange: [number, number];
  
  // Availability filters
  availability: 'all' | 'available' | 'busy' | 'custom';
  availabilityDays: string[]; // ['monday', 'tuesday', etc.]
  availabilityTime: 'morning' | 'afternoon' | 'evening' | 'any';
  
  // Services and amenities
  services: string[];
  servicesOperator: 'AND' | 'OR';
  amenities: string[];
  amenitiesOperator: 'AND' | 'OR';
  
  // Sorting and display
  sortBy: 'relevance' | 'rating' | 'distance' | 'price' | 'newest' | 'experience';
  sortOrder: 'asc' | 'desc';
  
  // Advanced options
  includeInactive: boolean;
  verifiedOnly: boolean;
  hasPortfolio: boolean;
  acceptsNewClients: boolean;
}

interface AdvancedSearchFiltersProps {
  filters: AdvancedSearchFiltersState;
  specialties: Specialty[];
  onFiltersChange: (filters: AdvancedSearchFiltersState) => void;
  onReset: () => void;
  onSaveSearch?: (name: string, filters: AdvancedSearchFiltersState) => void;
  savedSearches?: Array<{ id: string; name: string; filters: AdvancedSearchFiltersState }>;
  searchHistory?: Array<{ query: string; timestamp: Date }>;
  resultCount?: number;
  isLoading?: boolean;
  className?: string;
}

const SERVICES_OPTIONS = [
  'Custom Tattoos',
  'Flash Tattoos', 
  'Cover-ups',
  'Touch-ups',
  'Piercings',
  'Consultations',
  'Design Services',
  'Aftercare Support'
];

const AMENITIES_OPTIONS = [
  'WiFi', 'Parking', 'Air Conditioning', 'Music System', 'Refreshments',
  'Waiting Area', 'Private Rooms', 'Sterilization Equipment', 'Aftercare Products',
  'Payment Plans', 'Online Booking', 'Wheelchair Accessible', 'Late Hours'
];

const AVAILABILITY_DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Rating' },
  { value: 'distance', label: 'Distance' },
  { value: 'price', label: 'Price' },
  { value: 'experience', label: 'Experience' },
  { value: 'newest', label: 'Newest' }
];

export function AdvancedSearchFilters({
  filters,
  specialties,
  onFiltersChange,
  onReset,
  onSaveSearch,
  savedSearches = [],
  searchHistory = [],
  resultCount,
  isLoading = false,
  className = ''
}: AdvancedSearchFiltersProps) {
  // Collapsible sections state
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSpecialtiesOpen, setIsSpecialtiesOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [isSavedSearchesOpen, setIsSavedSearchesOpen] = useState(false);
  
  // Search suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  
  // Debounced search query for real-time updates
  const debouncedQuery = useDebounce(filters.query, 300);
  
  // Update filters with debouncing for search query
  const updateFilters = useCallback((updates: Partial<AdvancedSearchFiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);
  
  // Handle search query changes with suggestions
  const handleQueryChange = useCallback((value: string) => {
    updateFilters({ query: value });
    
    // Generate search suggestions based on history and common terms
    if (value.length > 2) {
      const suggestions = searchHistory
        .filter(item => item.query.toLowerCase().includes(value.toLowerCase()))
        .map(item => item.query)
        .slice(0, 5);
      
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [updateFilters, searchHistory]);
  
  // Toggle functions for multi-select filters
  const toggleSpecialty = useCallback((specialtyId: string) => {
    const newSpecialties = filters.specialties.includes(specialtyId)
      ? filters.specialties.filter(id => id !== specialtyId)
      : [...filters.specialties, specialtyId];
    updateFilters({ specialties: newSpecialties });
  }, [filters.specialties, updateFilters]);
  
  const toggleService = useCallback((service: string) => {
    const newServices = filters.services.includes(service)
      ? filters.services.filter(s => s !== service)
      : [...filters.services, service];
    updateFilters({ services: newServices });
  }, [filters.services, updateFilters]);
  
  const toggleAmenity = useCallback((amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    updateFilters({ amenities: newAmenities });
  }, [filters.amenities, updateFilters]);
  
  const toggleAvailabilityDay = useCallback((day: string) => {
    const newDays = filters.availabilityDays.includes(day)
      ? filters.availabilityDays.filter(d => d !== day)
      : [...filters.availabilityDays, day];
    updateFilters({ availabilityDays: newDays });
  }, [filters.availabilityDays, updateFilters]);
  
  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.profileType !== 'all') count++;
    if (filters.location) count++;
    if (filters.specialties.length > 0) count++;
    if (filters.minRating > 0) count++;
    if (filters.maxDistance < 50) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500) count++;
    if (filters.experienceRange[0] > 0 || filters.experienceRange[1] < 20) count++;
    if (filters.availability !== 'all') count++;
    if (filters.services.length > 0) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.includeInactive) count++;
    if (filters.verifiedOnly) count++;
    if (filters.hasPortfolio) count++;
    if (filters.acceptsNewClients) count++;
    return count;
  }, [filters]);
  
  // Load saved search
  const loadSavedSearch = useCallback((savedFilters: AdvancedSearchFiltersState) => {
    onFiltersChange(savedFilters);
  }, [onFiltersChange]);
  
  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Advanced Search</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {resultCount !== undefined && (
                <Badge variant="outline" className="text-xs">
                  {resultCount} results
                </Badge>
              )}
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search Query with Suggestions */}
          <div className="space-y-2 relative">
            <Label htmlFor="search-query">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-query"
                placeholder="Search artists, studios, styles, or techniques..."
                value={filters.query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-10"
                disabled={isLoading}
              />
              {isLoading && (
                <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <Card className="absolute top-full left-0 right-0 z-50 mt-1">
                <CardContent className="p-2">
                  {searchSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-sm h-8"
                      onClick={() => {
                        updateFilters({ query: suggestion });
                        setShowSuggestions(false);
                      }}
                    >
                      <History className="h-3 w-3 mr-2" />
                      {suggestion}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Profile Type */}
          <div className="space-y-2">
            <Label>Profile Type</Label>
            <Select
              value={filters.profileType}
              onValueChange={(value: ProfileType | 'all') => updateFilters({ profileType: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Profiles</SelectItem>
                <SelectItem value="artist">Artists</SelectItem>
                <SelectItem value="studio">Studios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="City, State, ZIP code, or address"
                value={filters.location}
                onChange={(e) => updateFilters({ location: e.target.value })}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-3">
            <Label>Quick Filters</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="verified-only"
                  checked={filters.verifiedOnly}
                  onCheckedChange={(checked) => updateFilters({ verifiedOnly: checked })}
                  disabled={isLoading}
                />
                <Label htmlFor="verified-only" className="text-sm">Verified Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="has-portfolio"
                  checked={filters.hasPortfolio}
                  onCheckedChange={(checked) => updateFilters({ hasPortfolio: checked })}
                  disabled={isLoading}
                />
                <Label htmlFor="has-portfolio" className="text-sm">Has Portfolio</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="accepts-new-clients"
                  checked={filters.acceptsNewClients}
                  onCheckedChange={(checked) => updateFilters({ acceptsNewClients: checked })}
                  disabled={isLoading}
                />
                <Label htmlFor="accepts-new-clients" className="text-sm">Accepting Clients</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-inactive"
                  checked={filters.includeInactive}
                  onCheckedChange={(checked) => updateFilters({ includeInactive: checked })}
                  disabled={isLoading}
                />
                <Label htmlFor="include-inactive" className="text-sm">Include Inactive</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <Collapsible open={isSavedSearchesOpen} onOpenChange={setIsSavedSearchesOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <span className="flex items-center space-x-2">
                    <Bookmark className="h-4 w-4" />
                    <span>Saved Searches</span>
                    <Badge variant="secondary" className="ml-2">
                      {savedSearches.length}
                    </Badge>
                  </span>
                  {isSavedSearchesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {savedSearches.map((saved) => (
                  <Button
                    key={saved.id}
                    variant="outline"
                    className="w-full justify-start text-sm h-8"
                    onClick={() => loadSavedSearch(saved.filters)}
                  >
                    <Bookmark className="h-3 w-3 mr-2" />
                    {saved.name}
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Advanced Filters */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Advanced Filters</span>
                </span>
                {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              {/* Rating Filter */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Minimum Rating: {filters.minRating}</span>
                </Label>
                <Slider
                  value={[filters.minRating]}
                  onValueChange={([value]) => updateFilters({ minRating: value })}
                  max={5}
                  min={0}
                  step={0.5}
                  className="w-full"
                  disabled={isLoading}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0</span>
                  <span>5</span>
                </div>
              </div>

              {/* Distance Filter */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Max Distance: {filters.maxDistance} miles</span>
                </Label>
                <Slider
                  value={[filters.maxDistance]}
                  onValueChange={([value]) => updateFilters({ maxDistance: value })}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                  disabled={isLoading}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1 mile</span>
                  <span>50+ miles</span>
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}</span>
                </Label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value: [number, number]) => updateFilters({ priceRange: value })}
                  max={500}
                  min={0}
                  step={25}
                  className="w-full"
                  disabled={isLoading}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>$0</span>
                  <span>$500+</span>
                </div>
              </div>

              {/* Experience Range Filter */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Experience: {filters.experienceRange[0]} - {filters.experienceRange[1]} years</span>
                </Label>
                <Slider
                  value={filters.experienceRange}
                  onValueChange={(value: [number, number]) => updateFilters({ experienceRange: value })}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                  disabled={isLoading}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0 years</span>
                  <span>20+ years</span>
                </div>
              </div>

              {/* Availability Filter */}
              <Collapsible open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <span className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Availability</span>
                      {filters.availability !== 'all' && (
                        <Badge variant="secondary" className="ml-2">
                          {filters.availability === 'custom' ? filters.availabilityDays.length : filters.availability}
                        </Badge>
                      )}
                    </span>
                    {isAvailabilityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-2">
                  <RadioGroup
                    value={filters.availability}
                    onValueChange={(value: any) => updateFilters({ availability: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="availability-all" />
                      <Label htmlFor="availability-all">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="available" id="availability-available" />
                      <Label htmlFor="availability-available">Available Now</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="busy" id="availability-busy" />
                      <Label htmlFor="availability-busy">Busy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="availability-custom" />
                      <Label htmlFor="availability-custom">Custom Schedule</Label>
                    </div>
                  </RadioGroup>
                  
                  {filters.availability === 'custom' && (
                    <div className="space-y-3 pl-6">
                      <div className="space-y-2">
                        <Label className="text-sm">Available Days</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {AVAILABILITY_DAYS.map((day) => (
                            <div key={day.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`day-${day.value}`}
                                checked={filters.availabilityDays.includes(day.value)}
                                onCheckedChange={() => toggleAvailabilityDay(day.value)}
                                disabled={isLoading}
                              />
                              <Label htmlFor={`day-${day.value}`} className="text-sm">
                                {day.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Preferred Time</Label>
                        <Select
                          value={filters.availabilityTime}
                          onValueChange={(value: any) => updateFilters({ availabilityTime: value })}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Time</SelectItem>
                            <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                            <SelectItem value="afternoon">Afternoon (12PM - 6PM)</SelectItem>
                            <SelectItem value="evening">Evening (6PM - 10PM)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Specialties Filter with Logical Operators */}
              <Collapsible open={isSpecialtiesOpen} onOpenChange={setIsSpecialtiesOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <span className="flex items-center space-x-2">
                      <Star className="h-4 w-4" />
                      <span>Specialties</span>
                      {filters.specialties.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {filters.specialties.length}
                        </Badge>
                      )}
                    </span>
                    {isSpecialtiesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-2">
                  {filters.specialties.length > 1 && (
                    <div className="space-y-2">
                      <Label className="text-sm">Match</Label>
                      <RadioGroup
                        value={filters.specialtyOperator}
                        onValueChange={(value: 'AND' | 'OR') => updateFilters({ specialtyOperator: value })}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="AND" id="specialty-and" />
                          <Label htmlFor="specialty-and" className="text-sm">All selected (AND)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="OR" id="specialty-or" />
                          <Label htmlFor="specialty-or" className="text-sm">Any selected (OR)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {specialties.map(specialty => (
                      <div key={specialty.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`specialty-${specialty.id}`}
                          checked={filters.specialties.includes(specialty.id)}
                          onCheckedChange={() => toggleSpecialty(specialty.id)}
                          disabled={isLoading}
                        />
                        <Label 
                          htmlFor={`specialty-${specialty.id}`} 
                          className="text-sm cursor-pointer"
                        >
                          {specialty.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Services Filter */}
              <Collapsible open={isServicesOpen} onOpenChange={setIsServicesOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <span className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>Services</span>
                      {filters.services.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {filters.services.length}
                        </Badge>
                      )}
                    </span>
                    {isServicesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-2">
                  {filters.services.length > 1 && (
                    <div className="space-y-2">
                      <Label className="text-sm">Match</Label>
                      <RadioGroup
                        value={filters.servicesOperator}
                        onValueChange={(value: 'AND' | 'OR') => updateFilters({ servicesOperator: value })}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="AND" id="services-and" />
                          <Label htmlFor="services-and" className="text-sm">All selected (AND)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="OR" id="services-or" />
                          <Label htmlFor="services-or" className="text-sm">Any selected (OR)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {SERVICES_OPTIONS.map(service => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          id={`service-${service}`}
                          checked={filters.services.includes(service)}
                          onCheckedChange={() => toggleService(service)}
                          disabled={isLoading}
                        />
                        <Label 
                          htmlFor={`service-${service}`} 
                          className="text-sm cursor-pointer"
                        >
                          {service}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Amenities Filter (for studios) */}
              {(filters.profileType === 'studio' || filters.profileType === 'all') && (
                <Collapsible open={isAmenitiesOpen} onOpenChange={setIsAmenitiesOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <span className="flex items-center space-x-2">
                        <Settings className="h-4 w-4" />
                        <span>Amenities</span>
                        {filters.amenities.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {filters.amenities.length}
                          </Badge>
                        )}
                      </span>
                      {isAmenitiesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 mt-2">
                    {filters.amenities.length > 1 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Match</Label>
                        <RadioGroup
                          value={filters.amenitiesOperator}
                          onValueChange={(value: 'AND' | 'OR') => updateFilters({ amenitiesOperator: value })}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="AND" id="amenities-and" />
                            <Label htmlFor="amenities-and" className="text-sm">All selected (AND)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="OR" id="amenities-or" />
                            <Label htmlFor="amenities-or" className="text-sm">Any selected (OR)</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {AMENITIES_OPTIONS.map(amenity => (
                        <div key={amenity} className="flex items-center space-x-2">
                          <Checkbox
                            id={`amenity-${amenity}`}
                            checked={filters.amenities.includes(amenity)}
                            onCheckedChange={() => toggleAmenity(amenity)}
                            disabled={isLoading}
                          />
                          <Label 
                            htmlFor={`amenity-${amenity}`} 
                            className="text-sm cursor-pointer"
                          >
                            {amenity}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Sort Options */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <div className="flex space-x-2">
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value: any) => updateFilters({ sortBy: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value: 'asc' | 'desc') => updateFilters({ sortOrder: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Asc</SelectItem>
                      <SelectItem value="desc">Desc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="space-y-2">
              <Label>Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filters.query && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Search: {filters.query}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilters({ query: '' })}
                    />
                  </Badge>
                )}
                {filters.profileType !== 'all' && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Type: {filters.profileType}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilters({ profileType: 'all' })}
                    />
                  </Badge>
                )}
                {filters.location && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Location: {filters.location}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilters({ location: '' })}
                    />
                  </Badge>
                )}
                {filters.specialties.map(specialtyId => {
                  const specialty = specialties.find(s => s.id === specialtyId);
                  return specialty ? (
                    <Badge key={specialtyId} variant="secondary" className="flex items-center space-x-1">
                      <span>{specialty.name}</span>
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => toggleSpecialty(specialtyId)}
                      />
                    </Badge>
                  ) : null;
                })}
                {filters.services.map(service => (
                  <Badge key={service} variant="secondary" className="flex items-center space-x-1">
                    <span>{service}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => toggleService(service)}
                    />
                  </Badge>
                ))}
                {filters.amenities.map(amenity => (
                  <Badge key={amenity} variant="secondary" className="flex items-center space-x-1">
                    <span>{amenity}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => toggleAmenity(amenity)}
                    />
                  </Badge>
                ))}
                {filters.verifiedOnly && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Verified Only</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilters({ verifiedOnly: false })}
                    />
                  </Badge>
                )}
                {filters.hasPortfolio && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Has Portfolio</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilters({ hasPortfolio: false })}
                    />
                  </Badge>
                )}
                {filters.acceptsNewClients && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>Accepting Clients</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilters({ acceptsNewClients: false })}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Save Search Button */}
          {onSaveSearch && activeFiltersCount > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const name = prompt('Enter a name for this search:');
                if (name) {
                  onSaveSearch(name, filters);
                }
              }}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Save Search
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}