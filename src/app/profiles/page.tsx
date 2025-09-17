'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ProfileCard } from '@/components/profiles/ProfileCard';
import { SearchFiltersWrapper, SearchFiltersState, AdvancedSearchFiltersState } from '@/components/profiles/SearchFiltersWrapper';
import { Grid, List, MapPin, Users, Palette, AlertCircle } from 'lucide-react';
import { Profile, Specialty, ProfilesResponse } from '@/shared/types/profiles';

const ITEMS_PER_PAGE = 12;

const DEFAULT_FILTERS: SearchFiltersState = {
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

export default function ProfilesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [filters, setFilters] = useState<SearchFiltersState | AdvancedSearchFiltersState>(DEFAULT_FILTERS);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [savedSearches, setSavedSearches] = useState<Array<{ id: string; name: string; filters: AdvancedSearchFiltersState }>>([]);
  const [searchHistory, setSearchHistory] = useState<Array<{ query: string; timestamp: Date }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters = { ...DEFAULT_FILTERS };
    
    if (searchParams.get('q')) urlFilters.query = searchParams.get('q') || '';
    if (searchParams.get('type')) urlFilters.profileType = searchParams.get('type') as any || 'all';
    if (searchParams.get('location')) urlFilters.location = searchParams.get('location') || '';
    if (searchParams.get('specialties')) {
      urlFilters.specialties = searchParams.get('specialties')?.split(',') || [];
    }
    if (searchParams.get('minRating')) {
      urlFilters.minRating = parseFloat(searchParams.get('minRating') || '0');
    }
    if (searchParams.get('sortBy')) {
      urlFilters.sortBy = searchParams.get('sortBy') as any || 'relevance';
    }
    if (searchParams.get('page')) {
      setCurrentPage(parseInt(searchParams.get('page') || '1'));
    }
    
    setFilters(urlFilters);
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: SearchFiltersState | AdvancedSearchFiltersState, page: number = 1) => {
    const params = new URLSearchParams();
    
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.profileType !== 'all') params.set('type', newFilters.profileType);
    if (newFilters.location) params.set('location', newFilters.location);
    if (newFilters.specialties.length > 0) params.set('specialties', newFilters.specialties.join(','));
    if (newFilters.minRating > 0) params.set('rating', newFilters.minRating.toString());
    if (newFilters.maxDistance !== 50) params.set('distance', newFilters.maxDistance.toString());
    if (newFilters.priceRange[0] > 0 || newFilters.priceRange[1] < 500) {
      params.set('price', `${newFilters.priceRange[0]}-${newFilters.priceRange[1]}`);
    }
    if (newFilters.experienceRange[0] > 0 || newFilters.experienceRange[1] < 20) {
      params.set('experience', `${newFilters.experienceRange[0]}-${newFilters.experienceRange[1]}`);
    }
    if (newFilters.availability !== 'all') params.set('availability', newFilters.availability);
    if (newFilters.amenities.length > 0) params.set('amenities', newFilters.amenities.join(','));
    if (newFilters.sortBy !== 'relevance') params.set('sort', newFilters.sortBy);
    if (newFilters.sortOrder !== 'desc') params.set('order', newFilters.sortOrder);
    if (page > 1) params.set('page', page.toString());
    
    // Advanced search parameters
    if (isAdvancedMode) {
      params.set('advanced', 'true');
      const advancedFilters = newFilters as AdvancedSearchFiltersState;
      
      if (advancedFilters.specialtyOperator !== 'OR') {
        params.set('specialty_op', advancedFilters.specialtyOperator);
      }
      if (advancedFilters.services && advancedFilters.services.length > 0) {
        params.set('services', advancedFilters.services.join(','));
      }
      if (advancedFilters.servicesOperator !== 'OR') {
        params.set('services_op', advancedFilters.servicesOperator);
      }
      if (advancedFilters.amenitiesOperator !== 'OR') {
        params.set('amenities_op', advancedFilters.amenitiesOperator);
      }
      if (advancedFilters.availabilityDays && advancedFilters.availabilityDays.length > 0) {
        params.set('availability_days', advancedFilters.availabilityDays.join(','));
      }
      if (advancedFilters.availabilityTime !== 'any') {
        params.set('availability_time', advancedFilters.availabilityTime);
      }
      if (advancedFilters.includeInactive) {
        params.set('include_inactive', 'true');
      }
      if (advancedFilters.verifiedOnly) {
        params.set('verified_only', 'true');
      }
      if (advancedFilters.hasPortfolio) {
        params.set('has_portfolio', 'true');
      }
      if (advancedFilters.acceptsNewClients) {
        params.set('accepts_new_clients', 'true');
      }
    }
    
    const newURL = params.toString() ? `/profiles?${params.toString()}` : '/profiles';
    router.push(newURL, { scroll: false });
  }, [router, isAdvancedMode]);

  // Fetch profiles
  const fetchProfiles = useCallback(async (searchFilters: SearchFiltersState, page: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      // Add search parameters
      if (searchFilters.query) params.set('q', searchFilters.query);
      if (searchFilters.profileType !== 'all') params.set('type', searchFilters.profileType);
      if (searchFilters.location) params.set('location', searchFilters.location);
      if (searchFilters.specialties.length > 0) params.set('specialties', searchFilters.specialties.join(','));
      if (searchFilters.minRating > 0) params.set('minRating', searchFilters.minRating.toString());
      if (searchFilters.maxDistance < 50) params.set('maxDistance', searchFilters.maxDistance.toString());
      if (searchFilters.priceRange[0] > 0 || searchFilters.priceRange[1] < 500) {
        params.set('minPrice', searchFilters.priceRange[0].toString());
        params.set('maxPrice', searchFilters.priceRange[1].toString());
      }
      if (searchFilters.experienceRange[0] > 0 || searchFilters.experienceRange[1] < 20) {
        params.set('minExperience', searchFilters.experienceRange[0].toString());
        params.set('maxExperience', searchFilters.experienceRange[1].toString());
      }
      if (searchFilters.availability !== 'all') params.set('availability', searchFilters.availability);
      if (searchFilters.amenities.length > 0) params.set('amenities', searchFilters.amenities.join(','));
      
      // Add pagination and sorting
      params.set('page', page.toString());
      params.set('limit', ITEMS_PER_PAGE.toString());
      params.set('sortBy', searchFilters.sortBy);
      params.set('sortOrder', searchFilters.sortOrder);
      
      const response = await fetch(`/api/profiles?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profiles: ${response.statusText}`);
      }
      
      const data: ProfilesResponse = await response.json();
      
      setProfiles(data.profiles);
      setTotalCount(data.total);
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
      setProfiles([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch specialties
  const fetchSpecialties = useCallback(async () => {
    try {
      const response = await fetch('/api/specialties');
      if (response.ok) {
        const data = await response.json();
        setSpecialties(data.specialties || []);
      }
    } catch (err) {
      console.error('Error fetching specialties:', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  // Fetch profiles when filters or page change
  useEffect(() => {
    fetchProfiles(filters, currentPage);
  }, [filters, currentPage, fetchProfiles]);

  // Handle save search
  const handleSaveSearch = useCallback((name: string, searchFilters: AdvancedSearchFiltersState) => {
    const newSearch = {
      id: Date.now().toString(),
      name,
      filters: searchFilters
    };
    setSavedSearches(prev => [...prev, newSearch]);
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFiltersState | AdvancedSearchFiltersState, advanced: boolean) => {
    setFilters(newFilters);
    setIsAdvancedMode(advanced);
    setCurrentPage(1);
    
    // Add to search history if there's a query
    if (newFilters.query && newFilters.query.trim()) {
      setSearchHistory(prev => {
        const newHistory = [{ query: newFilters.query, timestamp: new Date() }, ...prev.filter(h => h.query !== newFilters.query)];
        return newHistory.slice(0, 10); // Keep only last 10 searches
      });
    }
    
    updateURL(newFilters, 1);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    router.push('/profiles');
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
              <div className="flex space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-14" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Discover Talent
              </h1>
              <p className="text-lg text-gray-600">
                Find the perfect artist or studio for your next tattoo
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          {!isLoading && (
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{totalCount} profiles found</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Worldwide</span>
              </div>
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <span>{specialties.length} specialties</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <SearchFiltersWrapper
                specialties={specialties}
                onFiltersChange={handleFiltersChange}
                onSaveSearch={handleSaveSearch}
                savedSearches={savedSearches}
                searchHistory={searchHistory}
                resultCount={profiles.length}
                isLoading={isLoading}
                defaultAdvanced={isAdvancedMode}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            {!isLoading && !error && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {totalCount === 0 ? 'No profiles found' : 
                     totalCount === 1 ? '1 profile found' : 
                     `${totalCount} profiles found`}
                  </h2>
                  {currentPage > 1 && (
                    <Badge variant="outline">
                      Page {currentPage} of {totalPages}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  <Button 
                    variant="link" 
                    className="ml-2 p-0 h-auto"
                    onClick={() => fetchProfiles(filters, currentPage)}
                  >
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {isLoading && <LoadingSkeleton />}

            {/* Empty State */}
            {!isLoading && !error && profiles.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No profiles found
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Try adjusting your search criteria or filters to find more results.
                      </p>
                      <Button onClick={handleResetFilters} variant="outline">
                        Clear all filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profiles Grid/List */}
            {!isLoading && !error && profiles.length > 0 && (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {profiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    variant={viewMode === 'list' ? 'default' : 'compact'}
                    showPortfolioPreview={viewMode === 'grid'}
                    className="hover:shadow-lg transition-shadow duration-200"
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !error && totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="cursor-pointer"
                        />
                      </PaginationItem>
                    )}
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (pageNum > totalPages) return null;
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={pageNum === currentPage}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="cursor-pointer"
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}