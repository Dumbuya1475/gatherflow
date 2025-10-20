/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InternalTransfer } from '../models/InternalTransfer';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InternalTransferService {
    /**
     * List Internal Transfers
     * Retrieves a list of internal fund transfers between financial accounts within the Monime ecosystem.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param status Filters transfers by status: 'pending' (awaiting processing), 'processing' (in progress), 'failed' (attempt unsuccessful), or 'completed' (successfully transferred).
     * @param sourceFinancialAccountId Source financial account ID. Filters results to transfers originating from this account.
     * @param destinationFinancialAccountId Destination financial account ID. Filters results to transfers credited to this account.
     * @param financialTransactionReference Financial transaction reference. Filters results to transfers with this transaction reference. Useful for correlation with underlying financial transactions.
     * @param limit Maximum number of items to return in a single page. Must be between 1 and 50. Defaults to 10 if not specified.
     * @param after Pagination cursor for fetching the next page of results. Set this to the 'next' cursor value from a previous response to continue paginating forward.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static listInternalTransfers(
        monimeSpaceId: string,
        status?: 'pending' | 'processing' | 'failed' | 'completed' | null,
        sourceFinancialAccountId?: string | null,
        destinationFinancialAccountId?: string | null,
        financialTransactionReference?: string | null,
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
        result?: Array<InternalTransfer> | null;
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
            url: '/v1/internal-transfers',
            headers: {
                'Monime-Space-Id': monimeSpaceId,
                'Monime-Version': monimeVersion,
            },
            query: {
                'status': status,
                'sourceFinancialAccountId': sourceFinancialAccountId,
                'destinationFinancialAccountId': destinationFinancialAccountId,
                'financialTransactionReference': financialTransactionReference,
                'limit': limit,
                'after': after,
            },
        });
    }
    /**
     * Create Internal Transfer
     * Initiates a transfer of funds between two financial accounts within the same ecosystem.
     * @param idempotencyKey This header is used to uniquely identify a logical request, ensuring that it is not processed more than once during retries.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static createInternalTransfer(
        idempotencyKey: string,
        monimeSpaceId: string,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
        requestBody?: {
            /**
             * Amount to be transferred from the source to the destination financial account.
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
             * Source financial account from which the funds will be withdrawn.
             */
            sourceFinancialAccount: {
                /**
                 * ID of the source financial account that will be debited.
                 */
                id: string;
            };
            /**
             * Destination financial account where the funds will be deposited.
             */
            destinationFinancialAccount: {
                /**
                 * ID of the destination financial account that will be credited.
                 */
                id: string;
            };
            /**
             * Optional description of the transfer. Useful for developer context, logging, or internal references.
             */
            description?: string | null;
            /**
             * Custom metadata for attaching structured context or developer-defined identifiers.
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
        result?: InternalTransfer;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/internal-transfers',
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
     * Delete Internal Transfer
     * Deletes a specific transfer object by its ID. Only applicable for transfers in a deletable state (e.g., pending).
     * @param id Unique identifier of the transfer to delete.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static deleteInternalTransfer(
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
            url: '/v1/internal-transfers/{id}',
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
     * Get Internal Transfer
     * Retrieves detailed information about a specific transfer by its ID.
     * @param id Unique identifier of the transfer to retrieve.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static getInternalTransfer(
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
        result?: InternalTransfer;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/internal-transfers/{id}',
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
     * Update Internal Transfer
     * Updates mutable fields (like description or metadata) of an existing transfer object.
     * @param id ID of the transfer to update.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static patchInternalTransfer(
        id: string,
        monimeSpaceId: string,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
        requestBody?: {
            /**
             * Updated description for the transfer.
             */
            description?: string | null;
            /**
             * Updated metadata for tagging this transfer.
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
        result?: InternalTransfer;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v1/internal-transfers/{id}',
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
