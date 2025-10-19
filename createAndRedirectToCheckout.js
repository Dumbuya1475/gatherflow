async function createAndRedirectToCheckout(eventId) {
  try {
    const response = await fetch('/api/payment/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: eventId,
        quantity: 1, // Assuming quantity is always 1, adjust if needed
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error creating checkout session:', data.error);
      alert(data.error || 'Failed to create checkout session.');
      return { success: false, error: data.error || 'Failed to create checkout session.' };
    }

    window.location.href = data.hostedUrl;
    return { success: true };
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    alert('An unexpected error occurred during payment processing.');
    return { success: false, error: 'An unexpected error occurred.' };
  }
}