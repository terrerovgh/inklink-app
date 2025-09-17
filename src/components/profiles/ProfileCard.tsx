import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Clock, Heart } from 'lucide-react';
import { ProfileWithRelations } from '@/types/database';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  profile: ProfileWithRelations;
  onViewProfile?: (profileId: string) => void;
  onBookAppointment?: (profileId: string) => void;
  onToggleFavorite?: (profileId: string) => void;
  isFavorite?: boolean;
  className?: string;
}

export function ProfileCard({
  profile,
  onViewProfile,
  onBookAppointment,
  onToggleFavorite,
  isFavorite = false,
  className
}: ProfileCardProps) {
  const handleViewProfile = () => {
    onViewProfile?.(profile.id);
  };

  const handleBookAppointment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookAppointment?.(profile.id);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(profile.id);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const renderRating = (rating: number, reviewCount: number) => {
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-white text-white" />
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">({reviewCount})</span>
      </div>
    );
  };

  const portfolioImage = profile.portfolio_items?.[0]?.image_url;
  const specialties = profile.profile_specialties?.map(ps => ps.specialties?.name).filter(Boolean) || [];

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
        className
      )}
      onClick={handleViewProfile}
    >
      {/* Header with portfolio image or avatar */}
      <div className="relative h-48 overflow-hidden rounded-t-lg">
        {portfolioImage ? (
          <img
            src={portfolioImage}
            alt={`${profile.name} portfolio`}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        
        {/* Favorite button */}
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white",
              isFavorite && "text-white hover:text-white/80"
            )}
            onClick={handleToggleFavorite}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </Button>
        )}

        {/* Featured badge */}
        {profile.is_featured && (
          <Badge className="absolute top-2 left-2 bg-white text-black hover:bg-white/90">
            Destacado
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        {/* Profile info */}
        <div className="space-y-3">
          {/* Name and rating */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg leading-tight">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.profile_type}</p>
            </div>
            {profile.average_rating > 0 && (
              <div className="flex-shrink-0">
                {renderRating(profile.average_rating, profile.review_count || 0)}
              </div>
            )}
          </div>

          {/* Location */}
          {profile.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{profile.location}</span>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Specialties */}
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {specialties.slice(0, 3).map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {specialties.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{specialties.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Price and availability */}
          <div className="flex items-center justify-between">
            {profile.hourly_rate && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {formatPrice(profile.hourly_rate)}/h
                </span>
              </div>
            )}
            
            {profile.is_available && (
              <Badge variant="outline" className="text-xs text-white border-white">
                Disponible
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleViewProfile}
          >
            Ver Perfil
          </Button>
          {onBookAppointment && profile.is_available && (
            <Button 
              className="flex-1"
              onClick={handleBookAppointment}
            >
              Reservar Cita
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// Skeleton component for loading states
export function ProfileCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <div className="h-48 bg-muted rounded-t-lg" />
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded w-32" />
              <div className="h-4 bg-muted rounded w-20" />
            </div>
            <div className="h-5 bg-muted rounded w-16" />
          </div>
          <div className="h-4 bg-muted rounded w-24" />
          <div className="space-y-1">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
          <div className="flex gap-1">
            <div className="h-6 bg-muted rounded w-16" />
            <div className="h-6 bg-muted rounded w-20" />
            <div className="h-6 bg-muted rounded w-14" />
          </div>
          <div className="flex justify-between">
            <div className="h-5 bg-muted rounded w-20" />
            <div className="h-5 bg-muted rounded w-16" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <div className="h-9 bg-muted rounded flex-1" />
          <div className="h-9 bg-muted rounded flex-1" />
        </div>
      </CardFooter>
    </Card>
  );
}