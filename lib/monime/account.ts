import { monime } from '../monime';

export async function createMonimeAccount(accountDetails: { name: string; currency: string; }) {
  try {
    const account = await monime.accounts.create(accountDetails);
    return account;
  } catch (error) {
    console.error('Monime account creation failed:', error);
    throw error;
  }
}