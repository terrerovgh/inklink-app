'use client';

import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { ProfileType, Specialty } from '@/shared/types/profiles';

export interface SearchFiltersState {
  query: string;
  profileType: ProfileType | 'all';
  location: string;
  specialties: string[];
  minRating: number;
  maxDistance: number;
  priceRange: [number, number];
  experienceRange: [number, number];
  availability: 'all' | 'available' | 'busy';
  amenities: string[];
  sortBy: 'relevance' | 'rating' | 'distance' | 'price' | 'newest';
  sortOrder: 'asc' | 'desc';
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  specialties: Specialty[];
  onFiltersChange: (filters: SearchFiltersState) => void;
  onReset: () => void;
  className?: string;
  isLoading?: boolean;
}

const AMENITIES_OPTIONS = [
  'WiFi', 'Parking', 'Air Conditioning', 'Music System', 'Refreshments',
  'Waiting Area', 'Private Rooms', 'Sterilization Equipment', 'Aftercare Products'
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Rating' },
  { value: 'distance', label: 'Distance' },
  { value: 'price', label: 'Price' },
  { value: 'newest', label: 'Newest' }
];

export function SearchFilters({
  filters,
  specialties,
  onFiltersChange,
  onReset,
  className = '',
  isLoading = false
}: SearchFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSpecialtiesOpen, setIsSpecialtiesOpen] = useState(false);
  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false);

  const updateFilters = (updates: Partial<SearchFiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleSpecialty = (specialtyId: string) => {
    const newSpecialties = filters.specialties.includes(specialtyId)
      ? filters.specialties.filter(id => id !== specialtyId)
      : [...filters.specialties, specialtyId];
    updateFilters({ specialties: newSpecialties });
  };

  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    updateFilters({ amenities: newAmenities });
  };

  const getActiveFiltersCount = () => {
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
    if (filters.amenities.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Search & Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Query */}
          <div className="space-y-2">
            <Label htmlFor="search-query">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-query"
                placeholder="Search artists, studios, or styles..."
                value={filters.query}
                onChange={(e) => updateFilters({ query: e.target.value })}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
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
                placeholder="City, State or ZIP code"
                value={filters.location}
                onChange={(e) => updateFilters({ location: e.target.value })}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Sort By */}
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

          <Separator />

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
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Availability</span>
                </Label>
                <Select
                  value={filters.availability}
                  onValueChange={(value: 'all' | 'available' | 'busy') => updateFilters({ availability: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Specialties Filter */}
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
                <CollapsibleContent className="space-y-2 mt-2">
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

              {/* Amenities Filter (for studios) */}
              {(filters.profileType === 'studio' || filters.profileType === 'all') && (
                <Collapsible open={isAmenitiesOpen} onOpenChange={setIsAmenitiesOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <span className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
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
                  <CollapsibleContent className="space-y-2 mt-2">
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
                {filters.amenities.map(amenity => (
                  <Badge key={amenity} variant="secondary" className="flex items-center space-x-1">
                    <span>{amenity}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => toggleAmenity(amenity)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}