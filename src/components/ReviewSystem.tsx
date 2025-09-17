'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Star, MessageSquare, ThumbsUp, Flag } from 'lucide-react'
import { toast } from 'sonner'

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  reviewer_id: string
  reviewee_id: string
  reviewer_profile: {
    id: string
    full_name: string
    avatar_url: string
    user_type: string
  }
  helpful_count: number
  is_helpful?: boolean
}

interface ReviewStats {
  average_rating: number
  total_reviews: number
  rating_distribution: {
    [key: number]: number
  }
}

interface ReviewSystemProps {
  profileId: string
  profileType: 'artist' | 'studio'
  currentUserId?: string
  canReview?: boolean
}

export default function ReviewSystem({ 
  profileId, 
  profileType, 
  currentUserId, 
  canReview = false 
}: ReviewSystemProps) {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userReview, setUserReview] = useState<Review | null>(null)

  useEffect(() => {
    fetchReviews()
    fetchStats()
    if (currentUserId) {
      checkUserReview()
    }
  }, [profileId, currentUserId])

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer_profile:profiles!reviews_reviewer_id_fkey (
            id,
            full_name,
            avatar_url,
            user_type
          )
        `)
        .eq('reviewee_id', profileId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reviews:', error)
        return
      }

      // Check if current user found reviews helpful
      if (currentUserId && data) {
        const reviewIds = data.map((r: any) => r.id)
        const { data: helpfulData } = await supabase
          .from('review_helpful')
          .select('review_id')
          .eq('user_id', currentUserId)
          .in('review_id', reviewIds)

        const helpfulReviewIds = new Set(helpfulData?.map((h: any) => h.review_id) || [])
        
        const reviewsWithHelpful = data.map((review: any) => ({
          ...review,
          is_helpful: helpfulReviewIds.has(review.id)
        }))

        setReviews(reviewsWithHelpful)
      } else {
        setReviews(data || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Error al cargar las reseñas')
    }
  }

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', profileId)

      if (error) {
        console.error('Error fetching review stats:', error)
        return
      }

      if (!data || data.length === 0) {
        setStats({
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: {}
        })
        return
      }

      const ratings = data.map((r: any) => r.rating)
      const average = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
      
      const distribution: { [key: number]: number } = {}
      for (let i = 1; i <= 5; i++) {
        distribution[i] = ratings.filter((r: number) => r === i).length
      }

      setStats({
        average_rating: Math.round(average * 10) / 10,
        total_reviews: ratings.length,
        rating_distribution: distribution
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUserReview = async () => {
    if (!currentUserId) return

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer_profile:profiles!reviews_reviewer_id_fkey (
            id,
            full_name,
            avatar_url,
            user_type
          )
        `)
        .eq('reviewee_id', profileId)
        .eq('reviewer_id', currentUserId)
        .single()

      if (data) {
        setUserReview(data)
      }
    } catch (error) {
      // User hasn't reviewed yet, which is fine
    }
  }

  const submitReview = async () => {
    if (!currentUserId || !newRating || !newComment.trim()) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setSubmitting(true)
    try {
      const reviewData = {
        reviewer_id: currentUserId,
        reviewee_id: profileId,
        rating: newRating,
        comment: newComment.trim()
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select(`
          *,
          reviewer_profile:profiles!reviews_reviewer_id_fkey (
            id,
            full_name,
            avatar_url,
            user_type
          )
        `)
        .single()

      if (error) {
        console.error('Error submitting review:', error)
        toast.error('Error al enviar la reseña')
        return
      }

      setUserReview(data)
      setNewRating(0)
      setNewComment('')
      setShowReviewDialog(false)
      toast.success('Reseña enviada exitosamente')
      
      // Refresh data
      fetchReviews()
      fetchStats()
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Error al enviar la reseña')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleHelpful = async (reviewId: string) => {
    if (!currentUserId) return

    try {
      const review = reviews.find(r => r.id === reviewId)
      if (!review) return

      if (review.is_helpful) {
        // Remove helpful
        const { error } = await supabase
          .from('review_helpful')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', currentUserId)

        if (error) throw error

        setReviews(prev => prev.map(r => 
          r.id === reviewId 
            ? { ...r, is_helpful: false, helpful_count: r.helpful_count - 1 }
            : r
        ))
      } else {
        // Add helpful
        const { error } = await supabase
          .from('review_helpful')
          .insert([{ review_id: reviewId, user_id: currentUserId }])

        if (error) throw error

        setReviews(prev => prev.map(r => 
          r.id === reviewId 
            ? { ...r, is_helpful: true, helpful_count: r.helpful_count + 1 }
            : r
        ))
      }
    } catch (error) {
      console.error('Error toggling helpful:', error)
      toast.error('Error al actualizar')
    }
  }

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating 
                ? 'text-gray-600 fill-gray-600' 
                : 'text-gray-300'
            } ${
              interactive ? 'cursor-pointer hover:text-gray-700' : ''
            }`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-600" />
            Reseñas y Calificaciones
          </CardTitle>
          {canReview && !userReview && (
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Escribir Reseña
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Escribir Reseña</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Calificación
                    </label>
                    {renderStars(newRating, true, setNewRating)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Comentario
                    </label>
                    <Textarea
                      value={newComment}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                      placeholder="Comparte tu experiencia..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowReviewDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={submitReview}
                      disabled={submitting || !newRating || !newComment.trim()}
                    >
                      {submitting ? 'Enviando...' : 'Enviar Reseña'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        {stats && stats.total_reviews > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">{stats.average_rating}</div>
                {renderStars(Math.round(stats.average_rating))}
                <div className="text-sm text-gray-600">
                  ({stats.total_reviews} reseña{stats.total_reviews !== 1 ? 's' : ''})
                </div>
              </div>
            </div>
            
            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.rating_distribution[rating] || 0
                const percentage = stats.total_reviews > 0 
                  ? (count / stats.total_reviews) * 100 
                  : 0
                
                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-8">{rating}</span>
                    <Star className="w-4 h-4 text-gray-600 fill-gray-600" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* User's Review */}
        {userReview && (
          <div className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Tu reseña</Badge>
              {renderStars(userReview.rating)}
            </div>
            <p className="text-sm text-gray-700">{userReview.comment}</p>
            <p className="text-xs text-gray-500 mt-2">
              {formatDate(userReview.created_at)}
            </p>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No hay reseñas aún</p>
              <p className="text-sm">
                {canReview 
                  ? 'Sé el primero en escribir una reseña' 
                  : 'Las reseñas aparecerán aquí cuando estén disponibles'}
              </p>
            </div>
          ) : (
            reviews
              .filter(review => review.id !== userReview?.id) // Don't show user's review twice
              .map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.reviewer_profile.avatar_url} />
                      <AvatarFallback>
                        {review.reviewer_profile.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{review.reviewer_profile.full_name}</h4>
                        <Badge variant="outline" className="text-xs capitalize">
                          {review.reviewer_profile.user_type}
                        </Badge>
                        {renderStars(review.rating)}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(review.created_at)}</span>
                        
                        {currentUserId && currentUserId !== review.reviewer_id && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 px-2 text-xs ${
                                review.is_helpful ? 'text-blue-600' : 'text-gray-500'
                              }`}
                              onClick={() => toggleHelpful(review.id)}
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Útil ({review.helpful_count})
                            </Button>
                            
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                              <Flag className="w-3 h-3 mr-1" />
                              Reportar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}