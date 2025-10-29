import axios from 'axios';

export interface MonimeAccount {
  id: string;
  uvan: string;
  name: string;
  currency: string;
  reference?: string;
  description?: string;
  balance?: {
    available: {
      currency: string;
      value: number;
    };
  };
  createTime?: string;
  updateTime?: string;
  metadata?: any;
}

export async function createMonimeAccount({
  name,
  currency,
  reference,
  description,
  metadata
}: {
  name: string;
  currency: string;
  reference?: string;
  description?: string;
  metadata?: any;
}): Promise<MonimeAccount> {
  // Replace with your Monime API endpoint and authentication
  const MONIME_API_URL = process.env.MONIME_API_URL || 'https://api.monime.io/v1/financial-account/object';
  const MONIME_API_KEY = process.env.MONIME_API_KEY;

  const response = await axios.post(
    MONIME_API_URL,
    {
      name,
      currency,
      reference,
      description,
      metadata
    },
    {
      headers: {
        'Authorization': `Bearer ${MONIME_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}
// lib/monime/account.ts
// Utility for creating Monime financial accounts via API

import axios from 'axios';

const MONIME_API_URL = 'https://api.monime.io/v1/financial-account'; // Replace with actual endpoint
const MONIME_API_KEY = process.env.MONIME_API_KEY;

export async function createMonimeAccount({ name, currency, reference, description }) {
  try {
    const response = await axios.post(
      MONIME_API_URL,
      {
        name,
        currency,
        reference,
        description,
      },
      {
        headers: {
          'Authorization': `Bearer ${MONIME_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating Monime account:', error);
    throw error;
  }
}
