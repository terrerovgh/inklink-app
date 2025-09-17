'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { PortfolioImage } from '@/shared/types/profiles';

interface PortfolioGalleryProps {
  images: PortfolioImage[];
  columns?: 2 | 3 | 4;
  showTitles?: boolean;
  showTags?: boolean;
  maxImages?: number;
  className?: string;
}

export function PortfolioGallery({
  images,
  columns = 3,
  showTitles = true,
  showTags = true,
  maxImages,
  className = ''
}: PortfolioGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const displayImages = maxImages ? images.slice(0, maxImages) : images;
  const remainingCount = maxImages && images.length > maxImages ? images.length - maxImages : 0;

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedImageIndex(null);
  };

  const goToPrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      goToPrevious();
    } else if (event.key === 'ArrowRight') {
      goToNext();
    } else if (event.key === 'Escape') {
      closeLightbox();
    }
  };

  if (images.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-muted-foreground">
          <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
            <ExternalLink className="h-8 w-8" />
          </div>
          <p>No portfolio images available</p>
        </div>
      </div>
    );
  }

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
  };

  const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  return (
    <>
      <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
        {displayImages.map((image, index) => (
          <Card
            key={image.id}
            className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            onClick={() => openLightbox(index)}
          >
            <CardContent className="p-0 relative">
              <div className="relative aspect-square">
                <Image
                  src={image.image_url}
                  alt={image.title || `Portfolio image ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                    <ExternalLink className="h-5 w-5 text-gray-900" />
                  </div>
                </div>
              </div>
              {(showTitles && image.title) || (showTags && image.tags && image.tags.length > 0) ? (
                <div className="p-3">
                  {showTitles && image.title && (
                    <h4 className="font-medium text-sm truncate mb-1">{image.title}</h4>
                  )}
                  {showTags && image.tags && image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {image.tags.slice(0, 2).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {image.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{image.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
        
        {remainingCount > 0 && (
          <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-200">
            <CardContent className="p-0 relative">
              <div className="relative aspect-square bg-muted flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground mb-1">
                    +{remainingCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    more images
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent 
          className="max-w-4xl w-full h-[90vh] p-0 bg-black/95 border-0"
          onKeyDown={handleKeyDown}
        >
          <DialogHeader className="absolute top-4 left-4 right-4 z-10">
            <div className="flex items-center justify-between text-white">
              <DialogTitle className="text-lg">
                {selectedImage?.title || `Image ${(selectedImageIndex || 0) + 1} of ${images.length}`}
              </DialogTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white/70">
                  {(selectedImageIndex || 0) + 1} / {images.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={closeLightbox}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {selectedImage && (
              <div className="relative max-w-full max-h-full">
                <Image
                  src={selectedImage.image_url}
                  alt={selectedImage.title || `Portfolio image ${(selectedImageIndex || 0) + 1}`}
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain"
                  priority
                />
              </div>
            )}
            
            {/* Navigation buttons */}
            {selectedImageIndex !== null && selectedImageIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            
            {selectedImageIndex !== null && selectedImageIndex < images.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>
          
          {/* Image details */}
          {selectedImage && (selectedImage.description || (selectedImage.tags && selectedImage.tags.length > 0)) && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
              {selectedImage.description && (
                <p className="text-sm mb-2">{selectedImage.description}</p>
              )}
              {selectedImage.tags && selectedImage.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedImage.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}