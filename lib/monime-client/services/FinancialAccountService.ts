/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FinancialAccount } from '../models/FinancialAccount';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FinancialAccountService {
    /**
     * List Financial Accounts
     * Retrieves list of financial accounts.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param uvan Filter by Universal Virtual Account Number (UVAN), a unique alias for the financial account.
     * @param reference Filter by external reference ID used to link the account with your internal system.
     * @param withBalance If true, includes the balance of the financial accounts in the response.
     * @param limit Maximum number of items to return in a single page. Must be between 1 and 50. Defaults to 10 if not specified.
     * @param after Pagination cursor for fetching the next page of results. Set this to the 'next' cursor value from a previous response to continue paginating forward.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static listFinancialAccounts(
        monimeSpaceId: string,
        uvan?: string | null,
        reference?: string | null,
        withBalance?: boolean,
        limit: number = 10,
        after?: string | null,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
    ): CancelablePromise<{
        /**
         * Represents the status of the query operation, confirming if it was successful. This field is always true
         */
        success?: boolean;
        /**
         * Contains a list of messages providing relevant information or feedback related to the query or operation
         */
        messages?: Array<any>;
        /**
         * The list of items in the response
         */
        result?: Array<FinancialAccount> | null;
        /**
         * The pagination info associated with the response
         */
        pagination?: {
            /**
             * Number of items returned in the current page.
             */
            count?: number;
            /**
             * Cursor pointing to the next page of results. Use this value as the 'after' query parameter in your next request to fetch the following page. If null, you have reached the end of the result set.
             */
            next?: string | null;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/financial-accounts',
            headers: {
                'Monime-Space-Id': monimeSpaceId,
                'Monime-Version': monimeVersion,
            },
            query: {
                'uvan': uvan,
                'reference': reference,
                'withBalance': withBalance,
                'limit': limit,
                'after': after,
            },
        });
    }
    /**
     * Create Financial Account
     * Creates a new financial account for holding or managing funds within a Space.
     * @param idempotencyKey This header is used to uniquely identify a logical request, ensuring that it is not processed more than once during retries.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static createFinancialAccount(
        idempotencyKey: string,
        monimeSpaceId: string,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
        requestBody?: {
            /**
             * Label for the financial account, e.g., 'Main Wallet' or 'Reserved Account'.
             */
            name: string;
            /**
             * ISO 4217 currency code (e.g., 'SLE', 'USD') indicating the account's currency.
             */
            currency: string;
            /**
             * Optional external reference ID for this account. Must be unique across financial accounts in the same Space.
             */
            reference?: string | null;
            /**
             * Optional note about the account’s usage or purpose.
             */
            description?: string | null;
            /**
             * Updated metadata for storing additional context about the account.
             */
            metadata?: Record<string, any> | null;
        },
    ): CancelablePromise<{
        /**
         * Represents the status of the query operation, confirming if it was successful. This field is always true
         */
        success?: boolean;
        /**
         * Contains a list of messages providing relevant information or feedback related to the query or operation
         */
        messages?: Array<any>;
        result?: FinancialAccount;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/financial-accounts',
            headers: {
                'Idempotency-Key': idempotencyKey,
                'Monime-Version': monimeVersion,
                'Monime-Space-Id': monimeSpaceId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get Financial Account
     * Retrieves details of a financial account by its ID.
     * @param id Unique identifier of the financial account to retrieve.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param withBalance If true, includes the balance of the financial account in the response.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static getFinancialAccount(
        id: string,
        monimeSpaceId: string,
        withBalance?: boolean,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
    ): CancelablePromise<{
        /**
         * Represents the status of the query operation, confirming if it was successful. This field is always true
         */
        success?: boolean;
        /**
         * Contains a list of messages providing relevant information or feedback related to the query or operation
         */
        messages?: Array<any>;
        result?: FinancialAccount;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/financial-accounts/{id}',
            path: {
                'id': id,
            },
            headers: {
                'Monime-Version': monimeVersion,
                'Monime-Space-Id': monimeSpaceId,
            },
            query: {
                'withBalance': withBalance,
            },
        });
    }
    /**
     * Update Financial Account
     * Partially updates a financial account. Fields not included in the request body remain unchanged.
     * @param id The ID of the financial account to update.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static updateFinancialAccount(
        id: string,
        monimeSpaceId: string,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
        requestBody?: {
            /**
             * Updated label for the financial account.
             */
            name?: string | null;
            /**
             * Updated external reference ID. Must be unique across accounts.
             */
            reference?: string | null;
            /**
             * Updated description of the account's purpose.
             */
            description?: string | null;
            /**
             * Updated metadata for storing additional context about the account.
             */
            metadata?: Record<string, any> | null;
        },
    ): CancelablePromise<{
        /**
         * Represents the status of the query operation, confirming if it was successful. This field is always true
         */
        success?: boolean;
        /**
         * Contains a list of messages providing relevant information or feedback related to the query or operation
         */
        messages?: Array<any>;
        result?: FinancialAccount;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v1/financial-accounts/{id}',
            path: {
                'id': id,
            },
            headers: {
                'Monime-Version': monimeVersion,
                'Monime-Space-Id': monimeSpaceId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
