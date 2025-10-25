'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, ChevronLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsQR from 'jsqr';
import { getScannableEvents, scanTicketAction } from '@/lib/actions/tickets.tsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/event-card';
import type { EventWithAttendees } from '@/lib/types';

type FlashType = 'success' | 'checkOut' | 'error' | null;

function ScannerView({ event, onBack }: { event: EventWithAttendees, onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [flash, setFlash] = useState<FlashType>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const scanTimeoutRef = useRef<NodeJS.Timeout>();

  // Offline queue for retry
  const offlineQueue = useRef<{ qrToken: string; eventId: number }[]>([]);

  const initializeCamera = useCallback(async () => {
    try {
      console.log('🎥 Initializing camera...');
      
      // Stop existing stream first
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }

      // Request camera with environment facing (back camera)
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasCameraPermission(true);
        console.log('✅ Camera initialized successfully');
      }
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      setHasCameraPermission(false);
      
      let errorMessage = 'Please enable camera permissions in your browser settings to use this app.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and refresh the page.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application.';
        }
      }
      
      toast({
        variant: 'destructive',
        title: 'Camera Access Error',
        description: errorMessage,
      });
    }
  }, [toast]);

  useEffect(() => {
    initializeCamera();
    
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [initializeCamera]);

  const handleScan = useCallback(async (qrToken: string) => {
    if (isProcessing) {
      console.log('⏸️ Already processing a scan, skipping...');
      return;
    }

    console.log('🔍 Processing QR token:', qrToken);
    setIsProcessing(true);
    setIsScanning(false);

    try {
      const result = await scanTicketAction(qrToken, event.id);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Determine flash type based on result
      let flashType: FlashType = 'success';
      if (result.message && result.message.toLowerCase().includes('checked out')) {
        flashType = 'checkOut';
      }
      
      setFlash(flashType);

      toast({
        title: 'Ticket Verified',
        description: result.message,
        className: flashType === 'success' 
          ? 'bg-green-500 text-white border-green-600' 
          : 'bg-blue-500 text-white border-blue-600',
      });

      console.log('✅ Scan successful:', result.message);

    } catch (error: unknown) {
      console.error('❌ Scan failed:', error);
      setFlash('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Could not verify ticket.';
      
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: errorMessage,
      });

      // Queue for offline retry if it's a network error
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        offlineQueue.current.push({ qrToken, eventId: event.id });
        console.log('📝 Added to offline queue for retry');
      }
    } finally {
      // Reset after delay
      scanTimeoutRef.current = setTimeout(() => {
        setFlash(null);
        setIsProcessing(false);
        setIsScanning(true);
        console.log('🔄 Ready for next scan');
      }, 2500);
    }
  }, [event.id, isProcessing, toast]);

  useEffect(() => {
    if (!isScanning || hasCameraPermission === false || isProcessing) return;

    let animationFrameId: number;
    
    const tick = () => {
      if (
        videoRef.current && 
        canvasRef.current && 
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code?.data && !isProcessing) {
            console.log('📱 QR code detected:', code.data);
            handleScan(code.data);
            return; // Stop the animation loop
          }
        }
      }
      
      if (isScanning && !isProcessing) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isScanning, hasCameraPermission, isProcessing, handleScan]);

  // Retry offline scans when back online
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Back online, processing queued scans...');
      
      const queuedScans = [...offlineQueue.current];
      offlineQueue.current = [];
      
      for (const { qrToken, eventId } of queuedScans) {
        try {
          await scanTicketAction(qrToken, eventId);
          console.log('✅ Offline scan processed successfully');
        } catch (error) {
          console.error('❌ Failed to process offline scan:', error);
        }
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const retryCamera = () => {
    setHasCameraPermission(null);
    initializeCamera();
  };

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
        
        {hasCameraPermission === false && (
          <Button onClick={retryCamera} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Camera
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Scanning for: {event.title}</CardTitle>
          <CardDescription>
            Point the camera at a ticket&apos;s QR code to check attendees in/out.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0 relative">
          <video 
            ref={videoRef} 
            className="w-full aspect-video rounded-md bg-black" 
            autoPlay 
            muted 
            playsInline
            onLoadedData={() => console.log('📹 Video loaded and ready')}
          />
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Scanning overlay with corner indicators */}
          <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
          </div>
          
          {/* Camera permission denied overlay */}
          {hasCameraPermission === false && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white p-4 text-center rounded-md">
              <CameraOff className="w-16 h-16 mb-4 text-red-400"/>
              <h3 className="text-xl font-bold mb-2">Camera Access Required</h3>
              <p className="mb-4">Please grant camera permissions to use the scanner.</p>
              <Button onClick={retryCamera} variant="secondary">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
          
          {/* Success/Error flash overlay */}
          {flash && (
            <div className={`absolute inset-0 flex items-center justify-center rounded-md transition-all duration-300 ${
              flash === 'success' ? 'bg-green-500/80' :
              flash === 'checkOut' ? 'bg-blue-500/80' :
              'bg-red-500/80'
            }`}>
              <div className="text-center text-white">
                <div className="text-4xl mb-2">
                  {flash === 'success' ? '✔️' : flash === 'checkOut' ? '📤' : '❌'}
                </div>
                <h2 className="text-2xl font-bold">
                  {flash === 'success' ? 'Checked In' : 
                   flash === 'checkOut' ? 'Checked Out' : 
                   'Error'}
                </h2>
              </div>
            </div>
          )}
          
          {/* Processing overlay */}
          {isProcessing && !flash && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white rounded-md">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
                <h3 className="text-xl font-bold">Processing...</h3>
              </div>
            </div>
          )}
          
          {/* Status indicator */}
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {isProcessing ? 'Processing...' : 
             isScanning ? 'Scanning...' : 
             'Ready'}
          </div>
          
          {/* Event info */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg">
            <div className="text-sm opacity-80">Scanning for</div>
            <div className="font-semibold truncate">{event.title}</div>
            <div className="text-xs opacity-60">
              {event.attendees} attendee{event.attendees !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Instructions */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="text-sm space-y-2">
            <p className="font-medium">How to scan:</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Hold the device steady</li>
              <li>• Position the QR code within the frame</li>
              <li>• First scan checks in, second scan checks out</li>
              <li>• Wait for confirmation before scanning next ticket</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScannerClientPage({ events, isLoggedIn }: { events: EventWithAttendees[], isLoggedIn: boolean }) {
  const [selectedEvent, setSelectedEvent] = useState<EventWithAttendees | null>(null);
  
  if (selectedEvent) {
    return <ScannerView event={selectedEvent} onBack={() => setSelectedEvent(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Select Event to Scan
        </h1>
        <p className="text-muted-foreground">
          Choose an event to begin the check-in process.
        </p>
      </div>

      {events.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
          <Camera className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold tracking-tight mb-2">No Events Assigned</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            You have not been assigned as a scanner for any upcoming events. 
            Contact an event organizer to get scanner permissions.
          </p>
        </div>
      )}

      {events.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <div 
              key={event.id} 
              onClick={() => setSelectedEvent(event)} 
              className="cursor-pointer hover:scale-105 transition-transform duration-200"
            >
              <EventCard 
                event={event} 
                isLoggedIn={isLoggedIn} 
                isScannerMode 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScannerPage() {
  const [events, setEvents] = useState<EventWithAttendees[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        console.log('📡 Fetching scannable events...');
        const { data, error, isLoggedIn } = await getScannableEvents();
        
        if (error) {
          console.error('❌ Error fetching events:', error);
          setError(error);
        } else {
          console.log('✅ Fetched events:', data?.length || 0);
          setEvents(data || []);
        }
        
        setIsLoggedIn(!!isLoggedIn);
      } catch (e) {
        console.error('💥 Unexpected error:', e);
        setError('An unexpected error occurred while loading events.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEvents();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Loading scannable events...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return <ScannerClientPage events={events} isLoggedIn={isLoggedIn} />;
}