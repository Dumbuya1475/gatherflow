import { monime } from '../monime';

interface CreateAccountParams {
  name: string;
  currency: string;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface MonimeAccount {
  id: string;
  name: string;
  currency: string;
  balance: number;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Creates a new Monime financial account
 */
export async function createMonimeAccount(params: CreateAccountParams): Promise<MonimeAccount> {
  try {
    const response = await monime.accounts.create({
      name: params.name,
      currency: params.currency,
      reference: params.reference,
      description: params.description,
      metadata: params.metadata,
    });

    return response;
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
    const response = await monime.accounts.get(accountId);
    return response;
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
    return account.balance;
  } catch (error) {
    console.error('Failed to get account balance:', error);
    throw new Error('Failed to retrieve account balance');
  }
}