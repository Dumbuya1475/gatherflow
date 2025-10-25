import { CreateEventForm } from '@/components/create-event-form';

export default async function CreateEventPage() {
  return (
        <div className="container mx-auto max-w-5xl py-8 flex flex-col items-center justify-center">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Create a New Event
        </h1>
        <p className="text-muted-foreground">
          Fill out the details below to get your event up and running.
        </p>
      </div>
      <CreateEventForm />
    </div>
  );
}
