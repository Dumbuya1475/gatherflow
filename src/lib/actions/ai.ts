'use server';

import { generateEventPromotion, type GenerateEventPromotionInput } from '@/ai/flows/generate-event-promotion';

export async function generatePromotionAction(input: GenerateEventPromotionInput) {
  try {
    const result = await generateEventPromotion(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to generate content.' };
  }
}
