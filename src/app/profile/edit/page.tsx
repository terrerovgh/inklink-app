'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileForm } from '@/components/profiles/ProfileForm';
import { AlertCircle, User, Settings, Camera } from 'lucide-react';
import { Profile, CreateProfileRequest, UpdateProfileRequest } from '@/shared/types/profiles';
import { toast } from 'sonner';

export default function ProfileEditPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's profile
      const response = await fetch('/api/profiles/me');
      
      if (response.status === 404) {
        // User doesn't have a profile yet
        setHasProfile(false);
        setProfile(null);
      } else if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setHasProfile(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: CreateProfileRequest | UpdateProfileRequest) => {
    try {
      setSaving(true);
      setError(null);

      const url = hasProfile ? `/api/profiles/${profile?.id}` : '/api/profiles';
      const method = hasProfile ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      const result = await response.json();
      setProfile(result.profile);
      setHasProfile(true);
      
      toast.success(hasProfile ? 'Profile updated successfully!' : 'Profile created successfully!');
      
      // Redirect to profile view after creation
      if (!hasProfile) {
        router.push(`/${result.profile.type}/${result.profile.id}`);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasProfile && profile) {
      router.push(`/${profile.type}/${profile.id}`);
    } else {
      router.push('/profiles');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-6 w-6" />
            <h1 className="text-3xl font-bold">
              {hasProfile ? 'Edit Profile' : 'Create Profile'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {hasProfile 
              ? 'Update your professional profile information and settings.'
              : 'Create your professional profile to start connecting with clients.'
            }
          </p>
        </div>

        {/* Status Badge */}
        {hasProfile && profile && (
          <div className="flex items-center gap-2">
            <Badge variant={profile.is_active ? 'default' : 'secondary'}>
              {profile.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {profile.is_verified && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Verified
              </Badge>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  {hasProfile 
                    ? 'Update your profile details, specialties, and contact information.'
                    : 'Fill in your profile details to get started.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm
                  initialData={profile}
                  onSubmit={handleSave}
                  onCancel={handleCancel}
                  isLoading={saving}
                  mode={hasProfile ? 'edit' : 'create'}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Management</CardTitle>
                <CardDescription>
                  Manage your portfolio images and showcase your work.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasProfile && profile ? (
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Portfolio management will be available here.
                    </p>
                    <Button 
                      onClick={() => router.push('/profile/portfolio')}
                      variant="outline"
                    >
                      Manage Portfolio
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Create your profile first to manage your portfolio.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your profile visibility and notification preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasProfile && profile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Profile Visibility</h4>
                        <p className="text-sm text-muted-foreground">
                          Control whether your profile appears in search results
                        </p>
                      </div>
                      <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                        {profile.is_active ? 'Visible' : 'Hidden'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Verification Status</h4>
                        <p className="text-sm text-muted-foreground">
                          Verified profiles get higher visibility
                        </p>
                      </div>
                      <Badge 
                        variant={profile.is_verified ? 'default' : 'outline'}
                        className={profile.is_verified ? 'text-green-600 border-green-600' : ''}
                      >
                        {profile.is_verified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </div>

                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        More settings will be available here in future updates.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Create your profile first to access settings.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}