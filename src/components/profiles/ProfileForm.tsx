import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { 
  Upload, 
  X, 
  Plus, 
  Camera, 
  Loader2,
  MapPin,
  Phone,
  Mail,
  Clock,
  User
} from 'lucide-react';
import { ProfileWithRelations, CreateProfileRequest, UpdateProfileRequest, Specialty } from '@/types/database';
import { ProfilesAPI } from '@/lib/api/profiles';
import { uploadFile } from '@/lib/supabase/client';

const profileFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  bio: z.string().max(500, 'La biografía no puede exceder 500 caracteres').optional(),
  location: z.string().min(2, 'La ubicación es requerida'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  hourly_rate: z.number().min(0, 'La tarifa debe ser mayor a 0').optional(),
  profile_type: z.enum(['artist', 'studio'], {
    required_error: 'Selecciona un tipo de perfil'
  }),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  specialties: z.array(z.string()).min(1, 'Selecciona al menos una especialidad')
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  profile?: ProfileWithRelations;
  onSubmit: (data: CreateProfileRequest | UpdateProfileRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ProfileForm({ profile, onSubmit, onCancel, isLoading }: ProfileFormProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<Array<{
    title: string;
    description: string;
    file?: File;
    preview?: string;
  }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      phone: profile?.phone || '',
      email: profile?.email || '',
      hourly_rate: profile?.hourly_rate || undefined,
      profile_type: profile?.profile_type || 'artist',
      is_available: profile?.is_available ?? true,
      is_featured: profile?.is_featured ?? false,
      specialties: profile?.profile_specialties?.map(ps => ps.specialties?.id).filter(Boolean) || []
    }
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

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('La imagen no puede ser mayor a 5MB');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioAdd = () => {
    setPortfolioItems([...portfolioItems, { title: '', description: '' }]);
  };

  const handlePortfolioRemove = (index: number) => {
    const newItems = portfolioItems.filter((_, i) => i !== index);
    setPortfolioItems(newItems);
  };

  const handlePortfolioChange = (index: number, field: string, value: string) => {
    const newItems = [...portfolioItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setPortfolioItems(newItems);
  };

  const handlePortfolioFileChange = (index: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('La imagen no puede ser mayor a 10MB');
      return;
    }

    const newItems = [...portfolioItems];
    newItems[index] = { ...newItems[index], file };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      newItems[index].preview = e.target?.result as string;
      setPortfolioItems([...newItems]);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    
    try {
      let avatarUrl = profile?.avatar_url;
      
      // Upload avatar if changed
      if (avatarFile) {
        try {
          avatarUrl = await uploadFile(avatarFile, 'avatars');
        } catch (error) {
          console.error('Error uploading avatar:', error);
          toast.error('Error al subir la imagen de perfil');
          return;
        }
      }

      // Upload portfolio images
      const portfolioData = [];
      for (const item of portfolioItems) {
        if (item.file && item.title.trim()) {
          try {
            const imageUrl = await uploadFile(item.file, 'portfolio');
            portfolioData.push({
              title: item.title,
              description: item.description,
              image_url: imageUrl
            });
          } catch (error) {
            console.error('Error uploading portfolio image:', error);
            toast.error(`Error al subir la imagen: ${item.title}`);
          }
        }
      }

      const formData = {
        ...data,
        avatar_url: avatarUrl,
        portfolio_items: portfolioData.length > 0 ? portfolioData : undefined
      };

      await onSubmit(formData);
      toast.success(profile ? 'Perfil actualizado correctamente' : 'Perfil creado correctamente');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error al guardar el perfil');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {profile ? 'Editar Perfil' : 'Crear Perfil'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || undefined} />
                    <AvatarFallback className="text-2xl">
                      {form.watch('name') ? getInitials(form.watch('name')) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Haz clic en el icono para cambiar la foto de perfil
                </p>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del perfil" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profile_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Perfil *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="artist">Tatuador</SelectItem>
                          <SelectItem value="studio">Estudio</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografía</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Cuéntanos sobre ti o tu estudio..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Ubicación *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ciudad, País" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Teléfono
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+34 123 456 789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="email@ejemplo.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hourly_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Tarifa por Hora (€)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="50" 
                          type="number" 
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Specialties */}
              <FormField
                control={form.control}
                name="specialties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidades *</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {specialties.map((specialty) => (
                        <div key={specialty.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={specialty.id}
                            checked={field.value?.includes(specialty.id)}
                            onCheckedChange={(checked) => {
                              const currentValue = field.value || [];
                              if (checked) {
                                field.onChange([...currentValue, specialty.id]);
                              } else {
                                field.onChange(currentValue.filter(id => id !== specialty.id));
                              }
                            }}
                          />
                          <Label htmlFor={specialty.id} className="text-sm">
                            {specialty.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Availability Settings */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_available"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Disponible para citas</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Los usuarios podrán reservar citas contigo
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Perfil destacado</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Tu perfil aparecerá en la sección de destacados
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Portfolio Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Portfolio</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePortfolioAdd}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Añadir Imagen
                  </Button>
                </div>

                {portfolioItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <Input
                            placeholder="Título de la obra"
                            value={item.title}
                            onChange={(e) => handlePortfolioChange(index, 'title', e.target.value)}
                          />
                          <Textarea
                            placeholder="Descripción (opcional)"
                            value={item.description}
                            onChange={(e) => handlePortfolioChange(index, 'description', e.target.value)}
                            rows={2}
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer bg-secondary hover:bg-secondary/80 px-3 py-2 rounded-md text-sm transition-colors">
                              <Upload className="h-4 w-4" />
                              Seleccionar Imagen
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePortfolioFileChange(index, file);
                                }}
                                className="hidden"
                              />
                            </label>
                            {item.file && (
                              <Badge variant="outline">{item.file.name}</Badge>
                            )}
                          </div>
                        </div>
                        
                        {item.preview && (
                          <div className="relative">
                            <img
                              src={item.preview}
                              alt={item.title}
                              className="w-20 h-20 object-cover rounded-md"
                            />
                          </div>
                        )}
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handlePortfolioRemove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                    Cancelar
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isLoading}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    profile ? 'Actualizar Perfil' : 'Crear Perfil'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}