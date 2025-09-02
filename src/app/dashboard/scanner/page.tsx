
'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsQR from 'jsqr';
import { getScannableEvents, verifyTicket } from '@/lib/actions/tickets';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { EventWithAttendees } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/event-card';

function ScannerView({ event, onBack }: { event: EventWithAttendees, onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
     return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [toast]);

  useEffect(() => {
    if (!isScanning) return;
    
    let animationFrameId: number;
    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current && isScanning) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (context) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
                setIsScanning(false);
                verifyScannedCode(code.data);
            }
        }
      }
      if(isScanning) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (hasCameraPermission) {
        animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasCameraPermission, isScanning, event.id]);
  
  const verifyScannedCode = async (scannedData: string) => {
    const result = await verifyTicket(scannedData, event.id);
    if(result.success) {
        toast({
            title: 'Ticket Verified',
            description: result.message,
            className: 'bg-green-500 text-white',
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Verification Failed',
            description: result.error,
        })
    }

    // Resume scanning after a delay
    setTimeout(() => {
        setIsScanning(true);
    }, 3000);
  }

  return (
    <div className="space-y-4">
       <Button variant="outline" onClick={onBack}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Scanning for: {event.title}</CardTitle>
          <CardDescription>Point the camera at a ticket's QR code.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 relative">
          <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {hasCameraPermission === false && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4 text-center">
                <CameraOff className="w-16 h-16 mb-4"/>
                <h3 className="text-xl font-bold">Camera Access Required</h3>
                <p>Please grant camera permissions to use the scanner.</p>
            </div>
          )}
          {hasCameraPermission && !isScanning && (
             <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4">
                <h3 className="text-xl font-bold">Processing...</h3>
            </div>
          )}
        </CardContent>
      </Card>
      {hasCameraPermission === null && (
         <Alert>
            <AlertTitle>Requesting Camera Access</AlertTitle>
            <AlertDescription>
                We need to access your camera to scan QR codes.
            </AlertDescription>
        </Alert>
      )}

      {hasCameraPermission === false && (
         <Alert variant="destructive">
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDescription>
                Please enable camera permissions in your browser settings to use the scanner.
            </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function ScannerClientPage({ events, isLoggedIn }: { events: EventWithAttendees[], isLoggedIn: boolean}) {
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
                <h3 className="text-xl font-semibold tracking-tight">No Events Assigned</h3>
                <p className="text-sm text-muted-foreground">
                    You have not been assigned as a scanner for any upcoming events.
                </p>
            </div>
        )}

        {events.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
                <div key={event.id} onClick={() => setSelectedEvent(event)} className="cursor-pointer">
                <EventCard event={event} isLoggedIn={isLoggedIn} isScannerMode={true} />
                </div>
            ))}
            </div>
        )}
        </div>
    )
}


export default function ScannerPage() {
    const [events, setEvents] = useState<EventWithAttendees[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const { data, error, isLoggedIn } = await getScannableEvents();
                if (error) {
                    setError(error);
                } else {
                    setEvents(data || []);
                }
                setIsLoggedIn(!!isLoggedIn);
            } catch (e) {
                setError('An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        }
        fetchEvents();
    }, []);


    if (isLoading) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
              Scanner
            </h1>
            <p className="text-muted-foreground">Loading scannable events...</p>
          </div>
        </div>
      );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                        Scanner
                    </h1>
                </div>
                <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
            </div>
        )
    }
  
    return <ScannerClientPage events={events} isLoggedIn={isLoggedIn} />;
  }
