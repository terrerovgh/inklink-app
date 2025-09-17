'use client';

import React from 'react';
import { Search, Filter, X, Star, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export interface MapFiltersState {
  searchText: string;
  specialty: string;
  priceRange: string;
  minRating: number;
  radius: number;
}

interface MapFiltersProps {
  filters: MapFiltersState;
  onFiltersChange: (filters: MapFiltersState) => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const MapFilters: React.FC<MapFiltersProps> = ({
  filters,
  onFiltersChange,
  className,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const specialties = [
    'Todos',
    'Realismo',
    'Traditional',
    'Neo-traditional',
    'Blackwork',
    'Watercolor',
    'Geometric',
    'Minimalista',
    'Lettering',
    'Japonés',
    'Tribal',
  ];

  const priceRanges = [
    { value: 'all', label: 'Todos los precios' },
    { value: '$', label: '$ - Económico' },
    { value: '$$', label: '$$ - Moderado' },
    { value: '$$$', label: '$$$ - Premium' },
    { value: '$$$$', label: '$$$$ - Lujo' },
  ];

  const updateFilters = (updates: Partial<MapFiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchText: '',
      specialty: 'Todos',
      priceRange: 'all',
      minRating: 0,
      radius: 10,
    });
  };

  const hasActiveFilters = 
    filters.searchText ||
    filters.specialty !== 'Todos' ||
    filters.priceRange !== 'all' ||
    filters.minRating > 0 ||
    filters.radius !== 10;

  if (isCollapsed) {
    return (
      <div className={cn(
        "absolute top-4 left-4 z-[1000]",
        "max-md:top-auto max-md:bottom-20 max-md:left-4", // Mobile positioning
        className
      )}>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700",
            "touch-manipulation select-none",
            "max-md:h-11 max-md:px-4" // Larger on mobile
          )}
        >
          <Filter className="w-4 h-4 mr-2 max-md:w-5 max-md:h-5" />
          <span className="max-md:text-base">Filtros</span>
          {hasActiveFilters && (
            <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs max-md:text-sm">
              !
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80",
      "max-w-[calc(100vw-2rem)]", // Responsive width
      "max-md:fixed max-md:inset-x-4 max-md:bottom-4 max-md:top-auto max-md:w-auto max-md:max-h-[70vh] max-md:overflow-y-auto", // Mobile full-width modal
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          <h3 className="font-semibold text-sm">Filtros</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs px-2 py-1 h-auto"
            >
              Limpiar
            </Button>
          )}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Búsqueda */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Buscar estudios
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Nombre del estudio..."
              value={filters.searchText}
              onChange={(e) => updateFilters({ searchText: e.target.value })}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {/* Especialidad */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Especialidad
          </label>
          <Select
            value={filters.specialty}
            onValueChange={(value) => updateFilters({ specialty: value })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rango de Precio */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Rango de precio
          </label>
          <Select
            value={filters.priceRange}
            onValueChange={(value) => updateFilters({ priceRange: value })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priceRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Calificación Mínima */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Calificación mínima: {filters.minRating > 0 ? `${filters.minRating}★` : 'Cualquiera'}
          </label>
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <Slider
              value={[filters.minRating]}
              onValueChange={([value]) => updateFilters({ minRating: value })}
              max={5}
              min={0}
              step={0.5}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 w-8">5★</span>
          </div>
        </div>

        {/* Radio de Búsqueda */}
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Radio de búsqueda: {filters.radius} km
          </label>
          <Slider
            value={[filters.radius]}
            onValueChange={([value]) => updateFilters({ radius: value })}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 km</span>
            <span>50 km</span>
          </div>
        </div>
      </div>

      {/* Indicador de filtros activos */}
      {hasActiveFilters && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-1">
            {filters.searchText && (
              <Badge variant="secondary" className="text-xs">
                "{filters.searchText}"
              </Badge>
            )}
            {filters.specialty !== 'Todos' && (
              <Badge variant="secondary" className="text-xs">
                {filters.specialty}
              </Badge>
            )}
            {filters.priceRange !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                {priceRanges.find(r => r.value === filters.priceRange)?.label}
              </Badge>
            )}
            {filters.minRating > 0 && (
              <Badge variant="secondary" className="text-xs">
                ≥{filters.minRating}★
              </Badge>
            )}
            {filters.radius !== 10 && (
              <Badge variant="secondary" className="text-xs">
                {filters.radius}km
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapFilters;