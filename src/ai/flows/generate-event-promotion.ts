
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating event promotion content.
 *
 * It includes:
 * - `generateEventPromotion`: A function to generate promotional content for an event.
 * - `GenerateEventPromotionInput`: The input type for the `generateEventPromotion` function.
 * - `GenerateEventPromotionOutput`: The output type for the `generateEventPromotion` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEventPromotionInputSchema = z.object({
  eventTitle: z.string().describe('The title of the event.'),
  eventDescription: z.string().describe('A brief description of the event.'),
  eventDateTime: z.string().describe('The date and time of the event in ISO 8601 format.'),
  targetAudience: z.string().describe('The target audience for the event.'),
});
export type GenerateEventPromotionInput = z.infer<typeof GenerateEventPromotionInputSchema>;

const GenerateEventPromotionOutputSchema = z.object({
  promotionalContent: z
    .string()
    .describe('A compelling promotional message of about one paragraph for the event.'),
});
export type GenerateEventPromotionOutput = z.infer<typeof GenerateEventPromotionOutputSchema>;

export async function generateEventPromotion(
  input: GenerateEventPromotionInput
): Promise<GenerateEventPromotionOutput> {
  return generateEventPromotionFlow(input);
}

const generateEventPromotionPrompt = ai.definePrompt({
  name: 'generateEventPromotionPrompt',
  input: {schema: GenerateEventPromotionInputSchema},
  output: {schema: GenerateEventPromotionOutputSchema},
  prompt: `You are an expert marketing copywriter specializing in events.

  Generate a compelling promotional message of about one single paragraph for the following event. Make it sound exciting and engaging, but keep it concise.

  Event Title: {{{eventTitle}}}
  Event Description: {{{eventDescription}}}
  Event Date and Time: {{{eventDateTime}}}
  Target Audience: {{{targetAudience}}}`,
});

const generateEventPromotionFlow = ai.defineFlow(
  {
    name: 'generateEventPromotionFlow',
    inputSchema: GenerateEventPromotionInputSchema,
    outputSchema: GenerateEventPromotionOutputSchema,
  },
  async input => {
    const {output} = await generateEventPromotionPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return any output.');
    }
    return output;
  }
);
