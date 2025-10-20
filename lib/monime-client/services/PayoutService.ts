/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Payout } from '../models/Payout';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PayoutService {
    /**
     * List Payouts
     * Retrieves list of payouts.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param status Filter payouts by status:
     * - 'pending': Awaiting processing
     * - 'processing': Currently being processed
     * - 'failed': Processing failed
     * - 'completed': Successfully disbursed
     * @param sourceFinancialAccountId Filter payouts by the originating financial account. Useful for scoping to a specific wallet or reserve account.
     * @param sourceTransactionReference Reference for the batch or group of financial transactions triggered as part of a payout. Enables traceability across related entries.
     * @param destinationTransactionReference Filter by the transaction reference assigned by the destination provider (e.g., a bank or wallet system). Useful for reconciliation with third-party systems.
     * @param limit Maximum number of items to return in a single page. Must be between 1 and 50. Defaults to 10 if not specified.
     * @param after Pagination cursor for fetching the next page of results. Set this to the 'next' cursor value from a previous response to continue paginating forward.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static listPayouts(
        monimeSpaceId: string,
        status?: 'pending' | 'processing' | 'failed' | 'completed' | null,
        sourceFinancialAccountId?: string | null,
        sourceTransactionReference?: string | null,
        destinationTransactionReference?: string | null,
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
        result?: Array<Payout> | null;
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
            url: '/v1/payouts',
            headers: {
                'Monime-Space-Id': monimeSpaceId,
                'Monime-Version': monimeVersion,
            },
            query: {
                'status': status,
                'sourceFinancialAccountId': sourceFinancialAccountId,
                'sourceTransactionReference': sourceTransactionReference,
                'destinationTransactionReference': destinationTransactionReference,
                'limit': limit,
                'after': after,
            },
        });
    }
    /**
     * Create Payout
     * Creates a new payout with a specified amount, destination, and optional source account.
     * @param idempotencyKey This header is used to uniquely identify a logical request, ensuring that it is not processed more than once during retries.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static createPayout(
        idempotencyKey: string,
        monimeSpaceId: string,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
        requestBody?: {
            /**
             * The amount to be paid out to the destination account.
             */
            amount: {
                /**
                 * The [3-letter](https://en.wikipedia.org/wiki/ISO_4217) ISO currency code. Currently supported: 'SLE', 'USD'
                 */
                currency?: string;
                /**
                 * The value representation in the currency's minor unit. E.g. For 1 Leone (SLE 1), the value should be 100, denoting cents, the minor unit.
                 */
                value?: number;
            };
            /**
             * Optional details of the source account to be debited. If omitted, the default 'main' account is used.
             */
            source?: {
                /**
                 * ID of the financial account where the funds is disbursed from.
                 */
                financialAccountId: string;
                /**
                 * Internal Monime reference for the debit transaction from the source account. This is null until the payout is processed.
                 */
                readonly transactionReference?: string | null;
            } | null;
            /**
             * Information about the destination account that will receive the payout.
             */
            destination: ({
                /**
                 * Fixed value: 'bank'. Indicates this is a bank payout destination.
                 */
                type: 'bank';
                /**
                 * Identifier of the bank or financial service provider.
                 */
                providerId: 'slb001' | 'slb004' | 'slb007';
                /**
                 * The bank account number to which the payout will be sent.
                 */
                accountNumber: string;
                /**
                 * Reference or identifier of the underlying transaction that credited the recipient’s bank account. Will be 'null' if the payout is not 'completed'.
                 */
                readonly transactionReference?: string | null;
            } | {
                /**
                 * Fixed value: 'momo'. Indicates this is a mobile money (MoMo) payout destination.
                 */
                type: 'momo';
                /**
                 * Identifier of the mobile money provider.
                 */
                providerId: 'm17' | 'm18';
                /**
                 * The mobile number (MSISDN) of the recipient's mobile money account.
                 */
                phoneNumber: string;
                /**
                 * Reference or ID of the transaction that credited the recipient’s mobile money wallet. Set to 'null' if the payout is not 'completed'.
                 */
                readonly transactionReference?: string | null;
            } | {
                /**
                 * Fixed value: 'wallet'. Indicates this is a digital wallet payout destination.
                 */
                type: 'wallet';
                /**
                 * Identifier of the digital wallet provider.
                 */
                providerId: 'dw001';
                /**
                 * The ID of the recipient's wallet in the digital wallet ecosystem.
                 */
                walletId?: string;
                /**
                 * Reference or ID of the transaction that credited the recipient’s wallet. Set to null if the payout has not reached completed status.
                 */
                readonly transactionReference?: string | null;
            } | {
                /**
                 * Specifies the type of destination account. Must be either 'bank', 'momo', or 'wallet'.
                 */
                type: 'bank' | 'momo' | 'wallet';
            });
            /**
             * Optional metadata to associate additional business context with the payout.
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
        result?: Payout;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/payouts',
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
     * Delete Payout
     * Deletes a payout object by ID. This is only allowed if the payout is still in a pre-processing state (e.g., pending or scheduled).
     * @param id The unique ID of the payout object to delete.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static deletePayout(
        id: string,
        monimeSpaceId: string,
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
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/v1/payouts/{id}',
            path: {
                'id': id,
            },
            headers: {
                'Monime-Version': monimeVersion,
                'Monime-Space-Id': monimeSpaceId,
            },
        });
    }
    /**
     * Get Payout
     * Retrieves a payout object by its unique identifier.
     * @param id Unique identifier of the payout to retrieve.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static getPayout(
        id: string,
        monimeSpaceId: string,
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
        result?: Payout;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/payouts/{id}',
            path: {
                'id': id,
            },
            headers: {
                'Monime-Version': monimeVersion,
                'Monime-Space-Id': monimeSpaceId,
            },
        });
    }
    /**
     * Update Payout
     * Updates an existing payout object by ID. Fields can only be modified if the payout has not yet been processed.
     * @param id The unique ID of the payout object to update.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static updatePayout(
        id: string,
        monimeSpaceId: string,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
        requestBody?: {
            /**
             * Updated metadata for attaching custom information to the payout.
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
        result?: Payout;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v1/payouts/{id}',
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
