import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  MapPin,
  Star,
  Users,
  Palette,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X
} from 'lucide-react';
import { ProfileCard, ProfileCardSkeleton } from '@/components/profiles/ProfileCard';
import { ProfileWithRelations, Specialty, ProfileSearchFilters } from '@/types/database';
import { ProfilesAPI } from '@/lib/api/profiles';

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'rating' | 'created_at' | 'hourly_rate';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  search: string;
  profileType: string;
  specialties: string[];
  location: string;
  minRating: number;
  maxHourlyRate: number;
  isAvailable: boolean | null;
  isFeatured: boolean | null;
}

const ITEMS_PER_PAGE = 12;
const MAX_HOURLY_RATE = 200;

export function ProfilesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<ProfileWithRelations[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    profileType: searchParams.get('type') || '',
    specialties: searchParams.get('specialties')?.split(',').filter(Boolean) || [],
    location: searchParams.get('location') || '',
    minRating: parseInt(searchParams.get('minRating') || '0'),
    maxHourlyRate: parseInt(searchParams.get('maxRate') || MAX_HOURLY_RATE.toString()),
    isAvailable: searchParams.get('available') === 'true' ? true : searchParams.get('available') === 'false' ? false : null,
    isFeatured: searchParams.get('featured') === 'true' ? true : null
  });

  // Load specialties on component mount
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const data = await ProfilesAPI.getSpecialties();
        setSpecialties(data);
      } catch (error) {
        console.error('Error loading specialties:', error);
        toast.error('Error al cargar las especialidades');
      }
    };

    loadSpecialties();
  }, []);

  // Load profiles when filters or pagination change
  useEffect(() => {
    loadProfiles();
  }, [filters, sortBy, sortOrder, currentPage]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.profileType) params.set('type', filters.profileType);
    if (filters.specialties.length > 0) params.set('specialties', filters.specialties.join(','));
    if (filters.location) params.set('location', filters.location);
    if (filters.minRating > 0) params.set('minRating', filters.minRating.toString());
    if (filters.maxHourlyRate < MAX_HOURLY_RATE) params.set('maxRate', filters.maxHourlyRate.toString());
    if (filters.isAvailable !== null) params.set('available', filters.isAvailable.toString());
    if (filters.isFeatured) params.set('featured', 'true');
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (sortBy !== 'name') params.set('sort', sortBy);
    if (sortOrder !== 'asc') params.set('order', sortOrder);

    setSearchParams(params, { replace: true });
  }, [filters, currentPage, sortBy, sortOrder, setSearchParams]);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const searchFilters: ProfileSearchFilters = {
        search: filters.search || undefined,
        profile_type: filters.profileType || undefined,
        specialties: filters.specialties.length > 0 ? filters.specialties : undefined,
        location: filters.location || undefined,
        min_rating: filters.minRating > 0 ? filters.minRating : undefined,
        max_hourly_rate: filters.maxHourlyRate < MAX_HOURLY_RATE ? filters.maxHourlyRate : undefined,
        is_available: filters.isAvailable,
        is_featured: filters.isFeatured
      };

      const { data, count } = await ProfilesAPI.searchProfiles(searchFilters, {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      setProfiles(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Error al cargar los perfiles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSpecialtyToggle = (specialtyId: string) => {
    const newSpecialties = filters.specialties.includes(specialtyId)
      ? filters.specialties.filter(id => id !== specialtyId)
      : [...filters.specialties, specialtyId];
    
    handleFilterChange('specialties', newSpecialties);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      profileType: '',
      specialties: [],
      location: '',
      minRating: 0,
      maxHourlyRate: MAX_HOURLY_RATE,
      isAvailable: null,
      isFeatured: null
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return filters.search ||
           filters.profileType ||
           filters.specialties.length > 0 ||
           filters.location ||
           filters.minRating > 0 ||
           filters.maxHourlyRate < MAX_HOURLY_RATE ||
           filters.isAvailable !== null ||
           filters.isFeatured !== null;
  }, [filters]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Perfiles Profesionales</h1>
        <p className="text-muted-foreground">
          Descubre tatuadores y estudios profesionales cerca de ti
        </p>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, ubicación o especialidad..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {Object.values(filters).filter(v => 
                  v !== '' && v !== null && v !== 0 && v !== MAX_HOURLY_RATE && 
                  !(Array.isArray(v) && v.length === 0)
                ).length}
              </Badge>
            )}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="sort-by" className="text-sm font-medium">
                Ordenar por:
              </Label>
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="rating">Valoración</SelectItem>
                  <SelectItem value="created_at">Más recientes</SelectItem>
                  <SelectItem value="hourly_rate">Precio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {totalCount} resultado{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <Card className="w-80 h-fit">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Type */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Tipo de Perfil</Label>
                <Select 
                  value={filters.profileType} 
                  onValueChange={(value) => handleFilterChange('profileType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="artist">Tatuadores</SelectItem>
                    <SelectItem value="studio">Estudios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <Label className="text-sm font-medium mb-3 block flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Ubicación
                </Label>
                <Input
                  placeholder="Ciudad o región"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>

              {/* Specialties */}
              <div>
                <Label className="text-sm font-medium mb-3 block flex items-center gap-1">
                  <Palette className="h-4 w-4" />
                  Especialidades
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {specialties.map((specialty) => (
                    <div key={specialty.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-${specialty.id}`}
                        checked={filters.specialties.includes(specialty.id)}
                        onCheckedChange={() => handleSpecialtyToggle(specialty.id)}
                      />
                      <Label htmlFor={`filter-${specialty.id}`} className="text-sm">
                        {specialty.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <Label className="text-sm font-medium mb-3 block flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Valoración mínima
                </Label>
                <div className="space-y-2">
                  <Slider
                    value={[filters.minRating]}
                    onValueChange={([value]) => handleFilterChange('minRating', value)}
                    max={5}
                    min={0}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span className="font-medium">{filters.minRating} estrellas</span>
                    <span>5</span>
                  </div>
                </div>
              </div>

              {/* Hourly Rate */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Precio máximo por hora</Label>
                <div className="space-y-2">
                  <Slider
                    value={[filters.maxHourlyRate]}
                    onValueChange={([value]) => handleFilterChange('maxHourlyRate', value)}
                    max={MAX_HOURLY_RATE}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>€0</span>
                    <span className="font-medium">€{filters.maxHourlyRate}</span>
                    <span>€{MAX_HOURLY_RATE}+</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Availability */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="available"
                    checked={filters.isAvailable === true}
                    onCheckedChange={(checked) => 
                      handleFilterChange('isAvailable', checked ? true : null)
                    }
                  />
                  <Label htmlFor="available" className="text-sm">
                    Solo disponibles
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={filters.isFeatured === true}
                    onCheckedChange={(checked) => 
                      handleFilterChange('isFeatured', checked ? true : null)
                    }
                  />
                  <Label htmlFor="featured" className="text-sm">
                    Solo destacados
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {isLoading ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <ProfileCardSkeleton key={index} />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Users className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No se encontraron perfiles</h3>
                  <p className="text-muted-foreground mb-4">
                    {hasActiveFilters 
                      ? 'Intenta ajustar los filtros para encontrar más resultados'
                      : 'Aún no hay perfiles disponibles'
                    }
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearFilters} variant="outline">
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <>
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {profiles.map((profile) => (
                  <ProfileCard 
                    key={profile.id} 
                    profile={profile}
                    variant={viewMode === 'list' ? 'horizontal' : 'vertical'}
                  />
                ))}
              </div>
              
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}