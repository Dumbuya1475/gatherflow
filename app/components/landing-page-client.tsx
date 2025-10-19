
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PublicHeader } from '@/components/public-header';
import { Footer } from '@/components/footer';
import { CalendarDays, QrCode, Sparkles, Zap, Check, ArrowRight, Star, Users, TrendingUp } from 'lucide-react';
import type { EventWithAttendees } from '@/lib/types';
import { EventCard } from '@/components/event-card';
import type { User } from '@supabase/supabase-js';

const features = [
  {
    icon: <CalendarDays className="h-8 w-8 text-primary" />,
    title: 'Seamless Event Management',
    description: 'Create, edit, and manage your events with an intuitive interface. From small meetups to large conferences, we have you covered.',
    delay: '0ms'
  },
  {
    icon: <QrCode className="h-8 w-8 text-primary" />,
    title: 'QR Code Ticketing',
    description: 'Generate unique QR code tickets for every attendee. Streamline your check-in process with our fast scanning system.',
    delay: '100ms'
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: 'Real-time Synchronization',
    description: 'Keep your event data synced in real-time. Attendee lists and check-in statuses are always up-to-date across all devices.',
    delay: '200ms'
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Promotions',
    description: 'Generate compelling promotional content for your events with a single click. Let our AI be your marketing assistant.',
    delay: '300ms'
  },
];

const stats = [
  { icon: <Users className="h-6 w-6" />, value: '100+', label: 'Active Users' },
  { icon: <CalendarDays className="h-6 w-6" />, value: '1000+', label: 'Events Created' },
  { icon: <TrendingUp className="h-6 w-6" />, value: '58%', label: 'Customer Satisfaction' },
  { icon: <Star className="h-6 w-6" />, value: '4.9/5', label: 'Average Rating' }
];

const pricingTiers = [
    {
        name: 'Basic',
        price: 'Free',
        priceDetail: 'For small & personal events',
        features: [
            'Up to 3 active events',
            'Up to 100 attendees per event',
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
            'Unlimited events',
            'Up to 1,000 attendees per event',
            'Everything in Basic',
            'Advanced analytics & reporting',
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

interface LandingPageClientProps {
  recentEvents: EventWithAttendees[];
  user: User | null;
}

export function LandingPageClient({ recentEvents, user }: LandingPageClientProps) {

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 overflow-hidden">
        {/* Hero Section with Enhanced Gradient */}
        <section className="w-full pt-28 pb-20 md:pt-36 md:pb-32 lg:pt-35 lg:pb-40 relative">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/10 to-transparent animate-pulse duration-[4000ms]"></div>
          
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl animate-bounce duration-[3000ms]"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-tl from-secondary/20 to-primary/20 rounded-full blur-xl animate-bounce duration-[4000ms] delay-1000"></div>
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-6 animate-in fade-in-0 slide-in-from-left-4 duration-1000">
                <div className="space-y-4">
                  <div className="inline-flex items-center rounded-full border px-4 py-2 text-sm bg-background/50 backdrop-blur-sm animate-in fade-in-0 slide-in-from-left-2 duration-700 delay-200">
                    <Sparkles className="mr-2 h-4 w-4 text-primary animate-pulse" />
                    New: AI-Powered Event Promotions
                  </div>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    Organize Events That <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent animate-gradient">Inspire</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl leading-relaxed">
                    GatherFlow is the all-in-one platform to manage, promote, and execute your events flawlessly. From ticketing to check-in, we provide the tools you need to create memorable experiences.
                  </p>
                </div>
                
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-700" style={{ animationDelay: `${400 + index * 100}ms` }}>
                      <div className="flex justify-center mb-2 text-primary">
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 min-[400px]:flex-row animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
                  <Button asChild size="lg" className="font-semibold group relative overflow-hidden">
                    <Link href="/signup">
                      <span className="relative z-10">Get Started for Free</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                    <Link href="#pricing">
                      <span className="relative z-10">View Pricing</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="mx-auto aspect-video overflow-hidden rounded-xl sm:w-full lg:order-last animate-in fade-in-0 slide-in-from-right-4 duration-1000 delay-200 group">
                <div className="relative h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl overflow-hidden shadow-2xl group-hover:shadow-3xl transition-shadow duration-500">
                  <video 
                    className="w-full h-full object-cover rounded-xl transform group-hover:scale-105 transition-transform duration-700"
                    src="/GatherFlow_Logo.mp4" 
                    poster="/GatherFlow_Logo.png"
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Events Section with Enhanced Design */}
        <section id="events" className="w-full py-20 md:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent"></div>
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
                <div className="space-y-4">
                    <div className="inline-block rounded-lg bg-background/50 px-4 py-2 text-sm font-medium backdrop-blur-sm border border-primary/20">
                      Featured Events
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                      Upcoming <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Events</span>
                    </h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Check out some of the exciting events happening soon.
                    </p>
                </div>
            </div>
            {recentEvents.length > 0 ? (
                <>
                    <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-16">
                        {recentEvents.map((event, index) => (
                            <div 
                              key={event.id} 
                              className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 transform hover:scale-105 transition-all duration-300 hover:z-10 relative group"
                              style={{ animationDelay: `${300 + index * 150}ms` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 transform scale-110"></div>
                              <EventCard event={event} isLoggedIn={!!user} isMyEvent={user ? event.organizer_id === user.id : false} />
                            </div>
                        ))}
                    </div>
                    <div className="mt-16 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-700">
                        <Button asChild variant="outline" className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
                            <Link href="/events">
                                <span className="relative z-10">View All Events</span>
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </Link>
                        </Button>
                    </div>
                </>
            ) : (
                <div className="mt-16 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center bg-background/30 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
                    <div className="mb-4 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full">
                      <CalendarDays className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">No upcoming events</h3>
                    <p className="text-sm text-muted-foreground">Please check back later for exciting new events.</p>
                </div>
            )}
          </div>
        </section>

        {/* Features Section with Staggered Animations */}
        <section id="features" className="w-full py-20 md:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-background/50 px-4 py-2 text-sm font-medium backdrop-blur-sm border border-secondary/20">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Everything You Need to <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Succeed</span>
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is packed with powerful features designed to make your event management process as smooth as possible.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-16">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="h-full group cursor-pointer relative overflow-hidden border-0 bg-card/80 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-700 hover:shadow-2xl transition-all duration-500"
                  style={{ animationDelay: feature.delay }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <CardHeader className="flex flex-col items-center text-center relative z-10">
                    <div className="p-3 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300 group-hover:scale-110 transform">
                      {feature.icon}
                    </div>
                    <CardTitle className="mt-6 text-xl font-semibold font-headline group-hover:text-primary transition-colors duration-300">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center relative z-10">
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Pricing Section with Enhanced Cards */}
        <section id="pricing" className="w-full py-20 md:py-32 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent"></div>
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
                    <div className="space-y-4">
                         <div className="inline-block rounded-lg bg-background/50 px-4 py-2 text-sm font-medium backdrop-blur-sm border border-primary/20">
                           Pricing Plans
                         </div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                          Simple, <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Transparent</span> Pricing
                        </h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Choose the plan that's right for you. No hidden fees, just straightforward value.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 mt-16">
                    {pricingTiers.map((tier, index) => (
                        <Card 
                          key={tier.name} 
                          className={`flex flex-col relative overflow-hidden group cursor-pointer transition-all duration-500 hover:shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4 duration-700 ${
                            tier.isPopular 
                              ? 'border-primary shadow-lg scale-105 bg-card/95' 
                              : 'hover:scale-105 bg-card/80 backdrop-blur-sm'
                          }`}
                          style={{ animationDelay: `${300 + index * 150}ms` }}
                        >
                             {tier.isPopular && (
                                <div className="bg-gradient-to-r from-primary to-blue-400 text-primary-foreground text-sm font-semibold text-center py-2 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-blue-400/90"></div>
                                    <span className="relative z-10 flex items-center justify-center">
                                      <Star className="mr-2 h-4 w-4" />
                                      Most Popular
                                    </span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <CardHeader className="text-center relative z-10">
                                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                                <p className="text-4xl font-extrabold mt-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{tier.price}</p>
                                <p className="text-muted-foreground">{tier.priceDetail}</p>
                            </CardHeader>
                            <CardContent className="flex-1 relative z-10">
                                <ul className="space-y-4">
                                    {tier.features.map((feature, featureIndex) => (
                                        <li key={feature} className="flex items-center gap-3 animate-in fade-in-0 slide-in-from-left-2 duration-500" style={{ animationDelay: `${400 + featureIndex * 100}ms` }}>
                                            <div className="p-1 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                                              <Check className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="relative z-10">
                                <Button className={`w-full group relative overflow-hidden transition-all duration-300 ${
                                  tier.isPopular 
                                    ? 'bg-gradient-to-r from-primary to-blue-400 hover:shadow-lg' 
                                    : ''
                                }`} variant={tier.isPopular ? 'default' : 'outline'}>
                                    <span className="relative z-10">
                                      {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                                    </span>
                                    {!tier.isPopular && (
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA Section with Enhanced Design */}
        <section className="w-full py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl animate-pulse duration-[3000ms]"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-gradient-to-tl from-secondary/10 to-primary/10 rounded-full blur-2xl animate-pulse duration-[4000ms] delay-1000"></div>
          
          <div className="container mx-auto grid items-center justify-center gap-6 px-4 text-center md:px-6 relative z-10">
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                Ready to Create <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Amazing Events?</span>
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed leading-relaxed">
                Join thousands of event organizers who trust GatherFlow. Sign up today and experience the difference.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-300">
              <Button asChild size="lg" className="w-full font-semibold group relative overflow-hidden bg-gradient-to-r from-primary to-blue-400 hover:shadow-xl transition-all duration-300">
                <Link href="/signup">
                  <span className="relative z-10 flex items-center justify-center">
                    Sign Up Now
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                No credit card required • Free forever plan available
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
