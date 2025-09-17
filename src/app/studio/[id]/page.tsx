'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PortfolioGallery } from '@/components/profiles/PortfolioGallery';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Star,
  Clock,
  Users,
  Calendar,
  Shield,
  Wifi,
  Car,
  Coffee,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { Profile, PortfolioImage } from '@/shared/types/profiles';

interface StudioPageProps {
  params: { id: string };
}

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  refreshments: Coffee,
  card_payment: CreditCard,
  consultation: Users,
  aftercare: Shield
};

export default function StudioPage() {
  const params = useParams();
  const studioId = params.id as string;
  
  const [studio, setStudio] = useState<Profile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  useEffect(() => {
    const fetchStudio = async () => {
      try {
        const response = await fetch(`/api/profiles/${studioId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch studio');
        }
        const data = await response.json();
        
        if (data.profile.type !== 'studio') {
          throw new Error('Profile is not a studio');
        }
        
        setStudio(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`/api/profiles/${studioId}/portfolio?limit=20`);
        if (response.ok) {
          const data = await response.json();
          setPortfolio(data.images || []);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
      } finally {
        setPortfolioLoading(false);
      }
    };

    if (studioId) {
      fetchStudio();
      fetchPortfolio();
    }
  }, [studioId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Studio not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderAmenities = () => {
    if (!studio.amenities || studio.amenities.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Amenities</h3>
        <div className="grid grid-cols-2 gap-2">
          {studio.amenities.map((amenity) => {
            const IconComponent = amenityIcons[amenity] || Shield;
            return (
              <div key={amenity} className="flex items-center gap-2 text-sm">
                <IconComponent className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{amenity.replace('_', ' ')}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWorkingHours = () => {
    if (!studio.working_hours) return null;

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Working Hours
        </h3>
        <div className="space-y-1 text-sm">
          {Object.entries(studio.working_hours).map(([day, hours]) => (
            <div key={day} className="flex justify-between">
              <span className="capitalize font-medium">{day}:</span>
              <span className="text-muted-foreground">
                {hours || 'Closed'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <Avatar className="h-24 w-24 mx-auto sm:mx-0">
                  <AvatarImage src={studio.avatar_url || ''} alt={studio.business_name} />
                  <AvatarFallback className="text-2xl">
                    {studio.business_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-3xl font-bold mb-2">{studio.business_name}</h1>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-4">
                    {studio.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{studio.location}</span>
                      </div>
                    )}
                    
                    {studio.average_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{studio.average_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground text-sm">
                          ({studio.total_reviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {studio.specialties && studio.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      {studio.specialties.slice(0, 4).map((specialty) => (
                        <Badge key={specialty.id} variant="secondary">
                          {specialty.name}
                        </Badge>
                      ))}
                      {studio.specialties.length > 4 && (
                        <Badge variant="outline">
                          +{studio.specialties.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {studio.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{studio.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Portfolio */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              {portfolioLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square" />
                  ))}
                </div>
              ) : portfolio.length > 0 ? (
                <PortfolioGallery
                  images={portfolio}
                  columns={3}
                  showTitle={true}
                  showTags={true}
                />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No portfolio images available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {studio.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${studio.phone}`} className="hover:underline">
                    {studio.phone}
                  </a>
                </div>
              )}
              
              {studio.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${studio.email}`} className="hover:underline">
                    {studio.email}
                  </a>
                </div>
              )}
              
              {studio.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={studio.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}
              
              {studio.social_media?.instagram && (
                <div className="flex items-center gap-3">
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`https://instagram.com/${studio.social_media.instagram}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    @{studio.social_media.instagram}
                  </a>
                </div>
              )}
              
              {studio.social_media?.facebook && (
                <div className="flex items-center gap-3">
                  <Facebook className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={studio.social_media.facebook}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Facebook
                  </a>
                </div>
              )}
              
              <Separator />
              
              <Button className="w-full" size="lg">
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            </CardContent>
          </Card>

          {/* Working Hours */}
          {studio.working_hours && (
            <Card>
              <CardHeader>
                <CardTitle>Hours</CardTitle>
              </CardHeader>
              <CardContent>
                {renderWorkingHours()}
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          {studio.amenities && studio.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                {renderAmenities()}
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          {(studio.hourly_rate || studio.minimum_rate) && (
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {studio.hourly_rate && (
                  <div className="flex justify-between">
                    <span>Hourly Rate:</span>
                    <span className="font-medium">${studio.hourly_rate}</span>
                  </div>
                )}
                {studio.minimum_rate && (
                  <div className="flex justify-between">
                    <span>Minimum:</span>
                    <span className="font-medium">${studio.minimum_rate}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}