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
  Award,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Profile, PortfolioImage } from '@/shared/types/profiles';

interface ArtistPageProps {
  params: { id: string };
}

export default function ArtistPage() {
  const params = useParams();
  const artistId = params.id as string;
  
  const [artist, setArtist] = useState<Profile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const response = await fetch(`/api/profiles/${artistId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch artist');
        }
        const data = await response.json();
        
        if (data.profile.type !== 'artist') {
          throw new Error('Profile is not an artist');
        }
        
        setArtist(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`/api/profiles/${artistId}/portfolio?limit=20`);
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

    if (artistId) {
      fetchArtist();
      fetchPortfolio();
    }
  }, [artistId]);

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

  if (error || !artist) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Artist not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderWorkingHours = () => {
    if (!artist.working_hours) return null;

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Availability
        </h3>
        <div className="space-y-1 text-sm">
          {Object.entries(artist.working_hours).map(([day, hours]) => (
            <div key={day} className="flex justify-between">
              <span className="capitalize font-medium">{day}:</span>
              <span className="text-muted-foreground">
                {hours || 'Not available'}
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
                  <AvatarImage src={artist.avatar_url || ''} alt={artist.display_name} />
                  <AvatarFallback className="text-2xl">
                    {artist.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-3xl font-bold mb-2">{artist.display_name}</h1>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-4">
                    {artist.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{artist.location}</span>
                      </div>
                    )}
                    
                    {artist.years_of_experience && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-sm">{artist.years_of_experience} years experience</span>
                      </div>
                    )}
                    
                    {artist.average_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{artist.average_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground text-sm">
                          ({artist.total_reviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {artist.specialties && artist.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      {artist.specialties.slice(0, 4).map((specialty) => (
                        <Badge key={specialty.id} variant="secondary">
                          {specialty.name}
                        </Badge>
                      ))}
                      {artist.specialties.length > 4 && (
                        <Badge variant="outline">
                          +{artist.specialties.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {artist.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{artist.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Experience & Certifications */}
          {(artist.years_of_experience || artist.certifications) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Experience & Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {artist.years_of_experience && (
                  <div>
                    <h4 className="font-medium mb-2">Experience</h4>
                    <p className="text-muted-foreground">
                      {artist.years_of_experience} years of professional tattooing experience
                    </p>
                  </div>
                )}
                
                {artist.certifications && artist.certifications.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {artist.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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
              {artist.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${artist.phone}`} className="hover:underline">
                    {artist.phone}
                  </a>
                </div>
              )}
              
              {artist.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${artist.email}`} className="hover:underline">
                    {artist.email}
                  </a>
                </div>
              )}
              
              {artist.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={artist.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}
              
              {artist.social_media?.instagram && (
                <div className="flex items-center gap-3">
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`https://instagram.com/${artist.social_media.instagram}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    @{artist.social_media.instagram}
                  </a>
                </div>
              )}
              
              {artist.social_media?.facebook && (
                <div className="flex items-center gap-3">
                  <Facebook className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={artist.social_media.facebook}
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

          {/* Availability */}
          {artist.working_hours && (
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                {renderWorkingHours()}
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          {(artist.hourly_rate || artist.minimum_rate) && (
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {artist.hourly_rate && (
                  <div className="flex justify-between">
                    <span>Hourly Rate:</span>
                    <span className="font-medium">${artist.hourly_rate}</span>
                  </div>
                )}
                {artist.minimum_rate && (
                  <div className="flex justify-between">
                    <span>Minimum:</span>
                    <span className="font-medium">${artist.minimum_rate}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  Final pricing may vary based on design complexity and size
                </div>
              </CardContent>
            </Card>
          )}

          {/* Studio Affiliation */}
          {artist.studio_name && (
            <Card>
              <CardHeader>
                <CardTitle>Studio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{artist.studio_name}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}