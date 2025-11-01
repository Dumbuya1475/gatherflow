import { createClient } from 'monime-package';

const client = createClient({
  monimeSpaceId: process.env.MONIME_SPACE_ID!,
  accessToken: process.env.MONIME_ACCESS_TOKEN!,
});

interface CreateAccountParams {
  name: string;
  currency?: string;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface MonimeAccount {
  id: string;
  name: string;
  currency: string;
  balance: {
    available: {
      currency: string;
      value: number;
    };
  };
  reference?: string;
  description?: string;
  createTime: string;
  updateTime: string;
}

/**
 * Creates a new Monime financial account
 */
export async function createMonimeAccount(params: CreateAccountParams): Promise<MonimeAccount> {
  try {
    const response = await client.financialAccount.create(params.name);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create payment account');
    }

    return response.data.result;
  } catch (error) {
    console.error('Failed to create Monime account:', error);
    throw new Error('Failed to create payment account');
  }
}

/**
 * Gets a Monime account by ID
 */
export async function getMonimeAccount(accountId: string): Promise<MonimeAccount> {
  try {
    const response = await client.financialAccount.get(accountId);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to retrieve payment account');
    }

    return response.data.result;
  } catch (error) {
    console.error('Failed to get Monime account:', error);
    throw new Error('Failed to retrieve payment account');
  }
}

/**
 * Gets account balance
 */
export async function getAccountBalance(accountId: string): Promise<number> {
  try {
    const account = await getMonimeAccount(accountId);
    return account.balance.available.value;
  } catch (error) {
    console.error('Failed to get account balance:', error);
    throw new Error('Failed to retrieve account balance');
  }
}