/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FinancialTransaction } from '../models/FinancialTransaction';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FinancialTransactionService {
    /**
     * List Financial Transactions
     * Retrieves a list of financial transactions.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param financialAccountId Filter transactions involving the specified financial account ID.
     * @param reference Filter by Monime-assigned transaction reference. Useful for retrieving all transactions grouped under the same reference identifier.
     * @param type Filter transactions by type: 'credit' for incoming funds or 'debit' for outgoing ones.
     * @param limit Maximum number of items to return in a single page. Must be between 1 and 50. Defaults to 10 if not specified.
     * @param after Pagination cursor for fetching the next page of results. Set this to the 'next' cursor value from a previous response to continue paginating forward.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static listFinancialTransactions(
        monimeSpaceId: string,
        financialAccountId?: string | null,
        reference?: string | null,
        type?: 'credit' | 'debit' | null,
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
        result?: Array<FinancialTransaction> | null;
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
            url: '/v1/financial-transactions',
            headers: {
                'Monime-Space-Id': monimeSpaceId,
                'Monime-Version': monimeVersion,
            },
            query: {
                'financialAccountId': financialAccountId,
                'reference': reference,
                'type': type,
                'limit': limit,
                'after': after,
            },
        });
    }
    /**
     * Get Financial Transaction
     * Retrieves the details of a financial transaction, including its type, amount, source account, and ownership trace.
     * @param id Unique identifier of the financial transaction to retrieve.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static getTransaction(
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
        result?: FinancialTransaction;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/financial-transactions/{id}',
            path: {
                'id': id,
            },
            headers: {
                'Monime-Version': monimeVersion,
                'Monime-Space-Id': monimeSpaceId,
            },
        });
    }
}
