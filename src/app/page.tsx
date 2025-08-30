
'use server';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CalendarDays, QrCode, Sparkles, Zap, Check, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { EventWithAttendees } from '@/lib/types';
import { EventCard } from '@/components/event-card';

const features = [
  {
    icon: <CalendarDays className="h-8 w-8 text-primary" />,
    title: 'Seamless Event Management',
    description: 'Create, edit, and manage your events with an intuitive interface. From small meetups to large conferences, we have you covered.',
  },
  {
    icon: <QrCode className="h-8 w-8 text-primary" />,
    title: 'QR Code Ticketing',
    description: 'Generate unique QR code tickets for every attendee. Streamline your check-in process with our fast scanning system.',
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: 'Real-time Synchronization',
    description: 'Keep your event data synced in real-time. Attendee lists and check-in statuses are always up-to-date across all devices.',
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Promotions',
    description: 'Generate compelling promotional content for your events with a single click. Let our AI be your marketing assistant.',
  },
];

const pricingTiers = [
    {
        name: 'Basic',
        price: 'Free',
        priceDetail: 'For small & personal events',
        features: [
            'Up to 100 attendees',
            'Unlimited events',
            'QR code ticketing',
            'Basic analytics',
            'Community support'
        ]
    },
    {
        name: 'Pro',
        price: 'SLE 500,000',
        priceDetail: '/month, for growing businesses',
        isPopular: true,
        features: [
            'Up to 1,000 attendees',
            'Everything in Basic',
            'Advanced analytics',
            'AI-powered promotions',
            'Email & chat support'
        ]
    },
    {
        name: 'Enterprise',
        price: 'Contact Us',
        priceDetail: 'For large-scale events',
        features: [
            'Unlimited attendees',
            'Everything in Pro',
            'Custom integrations',
            'Dedicated account manager',
            '24/7 priority support'
        ]
    }
]

async function getRecentEvents() {
    const supabase = createClient();
    const { data: events, error } = await supabase
      .from('events')
      .select('*, tickets(count)')
      .eq('is_public', true)
      .order('date', { ascending: true })
      .limit(4)
  
    if (error) {
      console.error('Error fetching recent events:', error);
      return [];
    }
    return events.map(event => ({
      ...event,
      attendees: event.tickets[0]?.count || 0,
    }));
  }

export default async function LandingPage() {
    const recentEvents: EventWithAttendees[] = await getRecentEvents();
    const { data: { user } } = await createClient().auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="w-full pt-28 pb-20 md:pt-36 md:pb-32 lg:pt-48 lg:pb-40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Organize Events That Inspire
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    GatherFlow is the all-in-one platform to manage, promote, and execute your events flawlessly. From ticketing to check-in, we provide the tools you need to create memorable experiences.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="font-semibold">
                    <Link href="/signup">Get Started for Free</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="#pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://picsum.photos/800/600"
                width="800"
                height="600"
                alt="Hero"
                data-ai-hint="event concert"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>
        
        <section id="events" className="w-full py-20 md:py-32 bg-secondary">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Upcoming Events</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Check out some of the exciting events happening soon.
                    </p>
                </div>
            </div>
            {recentEvents.length > 0 ? (
                <>
                    <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
                        {recentEvents.map((event) => (
                            <EventCard key={event.id} event={event} isLoggedIn={!!user} isMyEvent={user ? event.organizer_id === user.id : false} />
                        ))}
                    </div>
                    <div className="mt-12 text-center">
                        <Button asChild variant="outline">
                            <Link href="/events">
                                View All Events <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </>
            ) : (
                <div className="mt-12 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                    <h3 className="text-xl font-semibold tracking-tight">No upcoming events</h3>
                    <p className="text-sm text-muted-foreground">Please check back later.</p>
                </div>
            )}
          </div>
        </section>

        <section id="features" className="w-full py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is packed with powerful features designed to make your event management process as smooth as possible.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className="h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                  <CardHeader className="flex flex-col items-center text-center">
                    {feature.icon}
                    <CardTitle className="mt-4 text-xl font-semibold font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <section id="pricing" className="w-full py-20 md:py-32 bg-secondary">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                         <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Pricing</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Simple, Transparent Pricing</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Choose the plan that's right for you. No hidden fees.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 mt-12">
                    {pricingTiers.map((tier) => (
                        <Card key={tier.name} className={`flex flex-col ${tier.isPopular ? 'border-primary shadow-lg' : ''}`}>
                             {tier.isPopular && (
                                <div className="bg-primary text-primary-foreground text-sm font-semibold text-center py-1 rounded-t-lg">
                                    Most Popular
                                </div>
                            )}
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                                <p className="text-4xl font-extrabold mt-2">{tier.price}</p>
                                <p className="text-muted-foreground">{tier.priceDetail}</p>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <Check className="h-5 w-5 text-primary" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant={tier.isPopular ? 'default' : 'outline'}>
                                    {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        <section className="w-full py-20 md:py-32">
          <div className="container mx-auto grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                Ready to Create Amazing Events?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of event organizers who trust GatherFlow. Sign up today and experience the difference.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button asChild size="lg" className="w-full font-semibold">
                <Link href="/signup">Sign Up Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
