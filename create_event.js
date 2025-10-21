import { createEventAction } from './app/lib/actions/events.ts';

const formData = new FormData();
formData.append('title', 'My Public Event');
formData.append('description', 'This is a public event.');
formData.append('date', '2025-12-31T23:59:59');
formData.append('end_date', '2026-01-01T02:00:00');
formData.append('location', 'Virtual');
formData.append('capacity', '100');
formData.append('is_paid', 'true');
formData.append('price', '10');
formData.append('is_public', 'true');
formData.append('requires_approval', 'false');
formData.append('customFields', '[]');

createEventAction(formData);
