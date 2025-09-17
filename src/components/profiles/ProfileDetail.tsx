import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Star, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Calendar, 
  Heart,
  Share2,
  MessageCircle,
  Award,
  Camera,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ProfileWithRelations, Review } from '@/types/database';
import { cn } from '@/lib/utils';

interface ProfileDetailProps {
  profile: ProfileWithRelations;
  onBookAppointment?: (profileId: string) => void;
  onSendMessage?: (profileId: string) => void;
  onToggleFavorite?: (profileId: string) => void;
  isFavorite?: boolean;
  currentUserId?: string;
}

export function ProfileDetail({
  profile,
  onBookAppointment,
  onSendMessage,
  onToggleFavorite,
  isFavorite = false,
  currentUserId
}: ProfileDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  const handleBookAppointment = () => {
    onBookAppointment?.(profile.id);
  };

  const handleSendMessage = () => {
    onSendMessage?.(profile.id);
  };

  const handleToggleFavorite = () => {
    onToggleFavorite?.(profile.id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} - InkLink`,
          text: `Echa un vistazo al perfil de ${profile.name} en InkLink`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
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

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const renderRating = (rating: number, reviewCount: number) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-5 w-5",
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              )}
            />
          ))}
        </div>
        <span className="font-medium">{rating.toFixed(1)}</span>
        <span className="text-muted-foreground">({reviewCount} reseñas)</span>
      </div>
    );
  };

  const portfolioImages = profile.portfolio_items?.flatMap(item => 
    item.portfolio_images?.map(img => ({
      url: img.image_url,
      title: item.title,
      description: item.description
    })) || []
  ) || [];

  const specialties = profile.profile_specialties?.map(ps => ps.specialties?.name).filter(Boolean) || [];
  const reviews = profile.reviews || [];
  const isOwnProfile = currentUserId === profile.user_id;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Avatar and basic info */}
            <div className="flex flex-col items-center lg:items-start space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-4xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              
              {profile.is_available && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  Disponible
                </Badge>
              )}
            </div>

            {/* Profile info */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold">{profile.name}</h1>
                    {profile.is_featured && (
                      <Badge className="bg-yellow-500 text-yellow-900">
                        <Award className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                    )}
                  </div>
                  <p className="text-xl text-muted-foreground mb-2">{profile.profile_type}</p>
                  
                  {profile.location && (
                    <div className="flex items-center gap-1 text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}

                  {profile.average_rating > 0 && (
                    <div className="mb-4">
                      {renderRating(profile.average_rating, profile.review_count || 0)}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {!isOwnProfile && (
                    <>
                      {profile.is_available && onBookAppointment && (
                        <Button onClick={handleBookAppointment} className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Reservar Cita
                        </Button>
                      )}
                      
                      {onSendMessage && (
                        <Button variant="outline" onClick={handleSendMessage} className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Mensaje
                        </Button>
                      )}
                      
                      {onToggleFavorite && (
                        <Button 
                          variant="outline" 
                          onClick={handleToggleFavorite}
                          className={cn(
                            "flex items-center gap-2",
                            isFavorite && "text-red-500 border-red-500 hover:bg-red-50"
                          )}
                        >
                          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                          {isFavorite ? 'Favorito' : 'Añadir'}
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Compartir
                  </Button>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Acerca de</h3>
                  <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Specialties */}
              {specialties.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Especialidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing and contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.hourly_rate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatPrice(profile.hourly_rate)}/hora</span>
                  </div>
                )}
                
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                
                {profile.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="reviews">Reseñas ({reviews.length})</TabsTrigger>
        </TabsList>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-4">
          {portfolioImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolioImages.map((image, index) => (
                <Card key={index} className="overflow-hidden cursor-pointer group" onClick={() => {
                  setSelectedImageIndex(index);
                  setIsImageDialogOpen(true);
                }}>
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.title || `Portfolio ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                  {image.title && (
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm">{image.title}</h4>
                      {image.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {image.description}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No hay imágenes en el portfolio</h3>
                <p className="text-muted-foreground">Este perfil aún no ha subido trabajos a su portfolio.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No hay reseñas</h3>
                <p className="text-muted-foreground">Este perfil aún no tiene reseñas.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Gallery Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {portfolioImages.length > 0 && (
            <div className="relative">
              <img
                src={portfolioImages[selectedImageIndex]?.url}
                alt={portfolioImages[selectedImageIndex]?.title || 'Portfolio image'}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              
              {portfolioImages.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm"
                    onClick={() => setSelectedImageIndex(
                      selectedImageIndex === 0 ? portfolioImages.length - 1 : selectedImageIndex - 1
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm"
                    onClick={() => setSelectedImageIndex(
                      selectedImageIndex === portfolioImages.length - 1 ? 0 : selectedImageIndex + 1
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
                <h4 className="font-medium">{portfolioImages[selectedImageIndex]?.title}</h4>
                {portfolioImages[selectedImageIndex]?.description && (
                  <p className="text-sm opacity-90 mt-1">
                    {portfolioImages[selectedImageIndex]?.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Review Card Component
function ReviewCard({ review }: { review: Review & { user_profiles?: any } }) {
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.user_profiles?.avatar_url} />
            <AvatarFallback>
              {review.user_profiles?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">
                  {review.user_profiles?.full_name || 'Usuario anónimo'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {formatDate(review.created_at)}
                </p>
              </div>
              {renderStars(review.rating)}
            </div>
            
            {review.comment && (
              <p className="text-muted-foreground leading-relaxed">
                {review.comment}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}