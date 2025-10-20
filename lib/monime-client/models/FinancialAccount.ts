/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A **Financial Account** is a logical wallet or ledger unit that holds and tracks money for a user or entity.
 * It represents a balance in a specific currency and serves as the foundation for all money movement within Monime.
 *
 * Each account is uniquely identifiable, has a human-friendly display name (e.g., **“Main Wallet”**), and is always tied to a single currency such as **SLE** or **USD**.
 *
 * In APIs, Financial Accounts act as the **source** or **destination** of funds for transfers, payouts, or collections.
 *
 * ---
 *
 * ### Use Cases
 *
 * - **Embedded Finance**
 * With **Embedded Finance on Monime**, fintechs can create **dynamic wallet accounts** hosted directly on Monime’s infrastructure.
 * Incoming collections from **cards, Mobile Money, or banks** are deposited into these accounts, which can then be used for **spend, cash-out, or peer-to-peer (P2P) transfers** by moving funds between accounts.
 * *Example* : Payments received through **Checkout Sessions** are credited to a user’s wallet account and can later be transferred to another user’s wallet, enabling seamless P2P experiences.
 *
 * - **Settlement Account**
 * Businesses separate collected funds from the account used to settle merchants or subsidiaries.
 * *Example*: A PSP routes daily Mobile Money collections into a **Settlement Account** before initiating payouts.
 *
 * - **Disbursement Float**
 * A pre-funded account maintained to ensure outgoing transfers and payouts can always be covered.
 * *Example*: Your platform maintains a **Disbursement Float** account; when it runs low, you top it up via an Internal Transfer.
 *
 * - **Dedicated Currency Account**
 * Multi-currency platforms maintain one account per supported currency.
 * *Example*: A customer has both a **USD Account** and an **SLE Account**, ensuring currency isolation and easier reconciliation.
 *
 * ---
 *
 */
export type FinancialAccount = {
    /**
     * Unique identifier of the financial account.
     */
    id?: string;
    /**
     * __UVAN__ (Universal Virtual Account Number) — a unique, checksum alias used for secure, error-resistant inbound transfers across Monime and external providers.
     */
    uvan?: string;
    /**
     * Human-readable label for the financial account, such as 'Main Wallet' or 'Operations Reserve'.
     */
    name?: string;
    /**
     * ISO 4217 currency code (e.g., 'SLE', 'USD') indicating the account's currency.
     */
    currency?: string;
    /**
     * Optional external reference ID for this account (e.g., the account's identifier in your internal system). Must be unique across accounts. Useful for reconciliation, tracking, or cross-system mapping.
     */
    reference?: string | null;
    /**
     * Optional description of the account's purpose or usage context.
     */
    description?: string | null;
    /**
     * Current available balance of the financial account.
     */
    balance?: {
        /**
         * The amount of funds currently available for use or withdrawal.
         */
        available?: {
            /**
             * The [3-letter](https://en.wikipedia.org/wiki/ISO_4217) ISO currency code. Currently supported: 'SLE', 'USD'
             */
            currency?: string;
            /**
             * The value representation in the currency's minor unit. E.g. For 1 Leone (SLE 1), the value should be 100, denoting cents, the minor unit.
             */
            value?: number;
        };
    } | null;
    /**
     * Timestamp when the financial account was created.
     */
    createTime?: string;
    /**
     * Timestamp when the financial account was last modified.
     */
    updateTime?: string | null;
    /**
     * Updated metadata for storing additional context about the account.
     */
    metadata?: Record<string, any> | null;
};

