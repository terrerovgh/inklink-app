'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Plus, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface Artist {
  id: string
  full_name: string
  avatar_url: string
  specialties: string[]
}

interface Studio {
  id: string
  name: string
  avatar_url: string
  services: string[]
}

const TATTOO_STYLES = [
  'Realismo', 'Traditional', 'Neo-traditional', 'Blackwork', 'Dotwork',
  'Watercolor', 'Geometric', 'Minimalist', 'Japanese', 'Tribal',
  'Biomecánico', 'Surrealismo', 'Lettering', 'Ornamental'
]

const TATTOO_SIZES = [
  'Pequeño (< 5cm)', 'Mediano (5-15cm)', 'Grande (15-30cm)', 'Extra Grande (> 30cm)'
]

const BODY_PLACEMENTS = [
  'Brazo', 'Antebrazo', 'Hombro', 'Espalda', 'Pecho', 'Pierna',
  'Muslo', 'Pantorrilla', 'Tobillo', 'Muñeca', 'Cuello', 'Mano',
  'Pie', 'Costillas', 'Abdomen', 'Otro'
]

export default function CreateRequestPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [artists, setArtists] = useState<Artist[]>([])
  const [studios, setStudios] = useState<Studio[]>([])
  const [referenceImages, setReferenceImages] = useState<File[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    style: '',
    size: '',
    placement: '',
    budget_min: '',
    budget_max: '',
    preferred_date: '',
    artist_id: '',
    studio_id: ''
  })

  useEffect(() => {
    fetchArtistsAndStudios()
  }, [])

  const fetchArtistsAndStudios = async () => {
    try {
      // Fetch artists
      const { data: artistsData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, specialties')
        .eq('user_type', 'artist')
        .limit(20)

      // Fetch studios
      const { data: studiosData } = await supabase
        .from('profiles')
        .select('id, full_name as name, avatar_url, services')
        .eq('user_type', 'studio')
        .limit(20)

      setArtists(artistsData || [])
      setStudios(studiosData || [])
    } catch (error) {
      console.error('Error fetching artists and studios:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (referenceImages.length + files.length > 5) {
      toast.error('Máximo 5 imágenes de referencia')
      return
    }
    setReferenceImages(prev => [...prev, ...files])
  }

  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = []
    const { uploadFile } = await import('@/lib/supabase/client')
    
    for (const file of referenceImages) {
      try {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          console.error('File too large:', file.name)
          continue
        }

        const imageUrl = await uploadFile(file, 'images')
        uploadedUrls.push(imageUrl)
      } catch (error) {
        console.error('Error uploading image:', error)
        continue
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.style || !formData.size || !formData.placement) {
      toast.error('Por favor completa todos los campos obligatorios')
      return
    }

    setLoading(true)
    
    try {
      // Upload reference images
      const imageUrls = await uploadImages()

      // Prepare request data
      const requestData = {
        ...formData,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        preferred_date: formData.preferred_date || null,
        artist_id: formData.artist_id || null,
        studio_id: formData.studio_id || null,
        reference_images: imageUrls
      }

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error creating request')
      }

      const { request } = await response.json()
      toast.success('Solicitud creada exitosamente')
      router.push(`/requests/${request.id}`)
    } catch (error) {
      console.error('Error creating request:', error)
      toast.error(error instanceof Error ? error.message : 'Error creating request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear Solicitud de Tatuaje</h1>
        <p className="text-gray-600">Describe tu idea de tatuaje y conecta con artistas y estudios</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título de la solicitud *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ej: Tatuaje de dragón en el brazo"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción detallada *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe tu idea de tatuaje, colores, detalles específicos, etc."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="style">Estilo *</Label>
                <Select value={formData.style} onValueChange={(value) => handleInputChange('style', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TATTOO_STYLES.map((style) => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="size">Tamaño *</Label>
                <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    {TATTOO_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="placement">Ubicación *</Label>
                <Select value={formData.placement} onValueChange={(value) => handleInputChange('placement', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_PLACEMENTS.map((placement) => (
                      <SelectItem key={placement} value={placement}>{placement}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Presupuesto y Fecha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget_min">Presupuesto mínimo (€)</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={formData.budget_min}
                  onChange={(e) => handleInputChange('budget_min', e.target.value)}
                  placeholder="100"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="budget_max">Presupuesto máximo (€)</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) => handleInputChange('budget_max', e.target.value)}
                  placeholder="500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="preferred_date">Fecha preferida</Label>
              <Input
                id="preferred_date"
                type="date"
                value={formData.preferred_date}
                onChange={(e) => handleInputChange('preferred_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Artista o Estudio Específico (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="artist_id">Artista específico</Label>
                <Select value={formData.artist_id} onValueChange={(value) => handleInputChange('artist_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona artista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Cualquier artista</SelectItem>
                    {artists.map((artist) => (
                      <SelectItem key={artist.id} value={artist.id}>
                        {artist.full_name}
                        {artist.specialties && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({artist.specialties.slice(0, 2).join(', ')})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="studio_id">Estudio específico</Label>
                <Select value={formData.studio_id} onValueChange={(value) => handleInputChange('studio_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estudio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Cualquier estudio</SelectItem>
                    {studios.map((studio) => (
                      <SelectItem key={studio.id} value={studio.id}>
                        {studio.name}
                        {studio.services && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({studio.services.slice(0, 2).join(', ')})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imágenes de Referencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG o JPEG (MAX. 5 imágenes)</p>
                  </div>
                  <input
                    id="images"
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              {referenceImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {referenceImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Creando...' : 'Crear Solicitud'}
          </Button>
        </div>
      </form>
    </div>
  )
}