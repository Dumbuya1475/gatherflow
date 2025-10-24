'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface FeaturedEvent {
  id: string;
  title: string;
  date: string;
  location: string | null;
  price: number;
  cover_image: string | null;
}

interface FeaturedEventsCarouselProps {
  events: FeaturedEvent[];
}

export function FeaturedEventsCarousel({ events }: FeaturedEventsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (events.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex, events.length]);

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % events.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  if (events.length === 0) {
    return (
      <div className="relative h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
        <div className="text-center p-8">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No Featured Events</h3>
          <p className="text-sm text-muted-foreground">Check back soon for upcoming events!</p>
        </div>
      </div>
    );
  }

  const currentEvent = events[currentIndex];

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl overflow-hidden shadow-2xl group">
      {/* Main Image */}
      <div className="relative h-full w-full overflow-hidden">
        {currentEvent.cover_image ? (
          <Image
            src={currentEvent.cover_image}
            alt={currentEvent.title}
            fill
            className={`object-cover transition-all duration-500 ${
              isTransitioning ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
            } group-hover:scale-105`}
            priority={currentIndex === 0}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Calendar className="h-24 w-24 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Event Information Overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-6 transition-all duration-500 ${
            isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white line-clamp-2 group-hover:text-primary/90 transition-colors">
              {currentEvent.title}
            </h3>

            <div className="flex flex-wrap gap-3 text-sm text-white/90">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(currentEvent.date), 'MMM d, yyyy')}</span>
              </div>
              {currentEvent.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{currentEvent.location}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  ${currentEvent.price.toFixed(2)}
                </span>
                <span className="text-sm text-white/70">per ticket</span>
              </div>

              <Button
                asChild
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link href={`/events/${currentEvent.id}`}>
                  View Event
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {events.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              aria-label="Previous event"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              aria-label="Next event"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Navigation Dots */}
      {events.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {events.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to event ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Event Counter Badge */}
      {events.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
          {currentIndex + 1} / {events.length}
        </div>
      )}
    </div>
  );
}
