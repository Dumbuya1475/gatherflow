
'use server';

import { generateEventPromotion, type GenerateEventPromotionInput } from '@/ai/flows/generate-event-promotion';

export async function generatePromotionAction(input: GenerateEventPromotionInput) {
  try {
    const result = await generateEventPromotion(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('AI Generation Error:', error);
    if (error instanceof Error) {
        return { success: false, error: `Failed to generate content: ${error.message}` };
    }
    return { success: false, error: 'An unknown error occurred during AI content generation.' };
  }
}
