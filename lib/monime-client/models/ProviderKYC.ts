/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A **Provider KYC** object represents the **know-your-customer (KYC) information** retrieved from a financial provider (e.g., Mobile Money operator, Bank).
 *
 * ---
 *
 */
export type ProviderKYC = {
    /**
     * The information of the account in the provider's ecosystem.
     */
    account?: {
        /**
         * Unique identifier of the account in the provider's system.
         */
        id?: string;
        /**
         * Display name associated with the account, if different from the holder's name.
         */
        name?: string;
        /**
         * Full name of the account holder as registered with the provider.
         */
        holderName?: string;
        /**
         * Additional metadata of the account.
         */
        metadata?: Record<string, any> | null;
    };
    /**
     * The information of the financial provider hosting the account.
     */
    provider?: {
        /**
         * The id of the provider as assigned by Monime.
         */
        id?: string;
        /**
         * The type of the provider.
         */
        type?: ProviderKYC.type;
        /**
         * The name of the provider
         */
        name?: string;
    };
};
export namespace ProviderKYC {
    /**
     * The type of the provider.
     */
    export enum type {
        MOMO = 'momo',
        BANK = 'bank',
        WALLET = 'wallet',
    }
}

