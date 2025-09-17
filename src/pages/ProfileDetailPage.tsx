import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProfilesAPI } from '@/lib/api/profiles';
import { ProfileWithRelations } from '@/types/database';
import { BookingDialog } from '@/components/appointments/BookingDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  MapPin,
  Phone,
  Mail,
  Star,
  Calendar,
  Clock,
  DollarSign,
  MessageCircle,
  Share2,
  Heart,
  ArrowLeft,
  Camera,
  Award,
  Users,
  Briefcase
} from 'lucide-react';



interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    users: {
      user_profiles: {
        full_name: string;
        avatar_url?: string;
      };
    };
  };
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.users.user_profiles.avatar_url} />
            <AvatarFallback>
              {review.users.user_profiles.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{review.users.user_profiles.full_name}</h4>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-600 mb-2">{review.comment}</p>
            <p className="text-sm text-gray-400">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProfileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await ProfilesAPI.getProfile(id!);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };



  const handleShare = async () => {
    try {
      await navigator.share({
        title: profile?.name,
        text: `Check out ${profile?.name} on InkLink`,
        url: window.location.href
      });
    } catch (error) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600 mb-4">The profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/profiles')}>Back to Profiles</Button>
        </div>
      </div>
    );
  }

  const portfolioImages = profile.portfolio_images || [];
  const reviews = profile.reviews || [];
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/profiles')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Profiles</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Gallery */}
            <Card>
              <CardContent className="p-0">
                {portfolioImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                      <img
                        src={portfolioImages[selectedImageIndex]?.image_url}
                        alt={portfolioImages[selectedImageIndex]?.title || 'Portfolio image'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {portfolioImages.length > 1 && (
                      <div className="px-4 pb-4">
                        <div className="flex space-x-2 overflow-x-auto">
                          {portfolioImages.map((image, index) => (
                            <button
                              key={image.id}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                                index === selectedImageIndex
                                  ? 'border-blue-500'
                                  : 'border-gray-200'
                              }`}
                            >
                              <img
                                src={image.image_url}
                                alt={image.title || 'Portfolio thumbnail'}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Camera className="h-12 w-12 mx-auto mb-2" />
                      <p>No portfolio images available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Details Tabs */}
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="about" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="about" className="mt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-gray-600">
                          {profile.description || 'No description available.'}
                        </p>
                      </div>
                      
                      {profile.specialties && profile.specialties.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Specialties</h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.specialties.map((specialty) => (
                              <Badge key={specialty.id} variant="secondary">
                                {specialty.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Briefcase className="h-4 w-4" />
                          <span>Experience: {profile.years_experience || 'Not specified'} years</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>Profile Type: {profile.profile_type}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="portfolio" className="mt-6">
                    {portfolioImages.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {portfolioImages.map((image) => (
                          <div key={image.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={image.image_url}
                              alt={image.title || 'Portfolio image'}
                              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => {
                                const index = portfolioImages.findIndex(img => img.id === image.id);
                                setSelectedImageIndex(index);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Camera className="h-12 w-12 mx-auto mb-2" />
                        <p>No portfolio images available</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="reviews" className="mt-6">
                    {reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <ReviewCard key={review.id} review={review} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                        <p>No reviews yet</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-2xl">
                      {profile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold mb-2">{profile.name}</h1>
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{averageRating.toFixed(1)}</span>
                    <span className="text-gray-500">({reviews.length} reviews)</span>
                  </div>
                  <Badge variant={profile.profile_type === 'artist' ? 'default' : 'secondary'}>
                    {profile.profile_type === 'artist' ? 'Tattoo Artist' : 'Studio'}
                  </Badge>
                </div>

                <div className="space-y-3 mb-6">
                  {profile.location && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile.hourly_rate && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>${profile.hourly_rate}/hour</span>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <BookingDialog
                    profileName={profile.name}
                    artistId={profile.profile_type === 'artist' ? profile.id : undefined}
                    studioId={profile.profile_type === 'studio' ? profile.id : undefined}
                  >
                    <Button className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Reservar Cita
                    </Button>
                  </BookingDialog>
                  
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar Mensaje
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Reviews</span>
                    <span className="font-medium">{reviews.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Rating</span>
                    <span className="font-medium">{averageRating.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Portfolio Items</span>
                    <span className="font-medium">{portfolioImages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience</span>
                    <span className="font-medium">{profile.years_experience || 0} years</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailPage;