/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaymentCode } from '../models/PaymentCode';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PaymentCodeService {
    /**
     * List Payment Codes
     * Retrieves a list of payment codes with support for filtering by mode, USSD code, and status.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param ussdCode Filter by the USSD code assigned to the payment code (if applicable).
     * @param mode Filter by usage mode: 'one_time' for single-use codes, or 'recurrent' for reusable ones.
     * @param status Filter by payment code status: 'pending' (not yet used), 'processing' (in use), 'expired' (duration elapsed), 'cancelled' (manually cancelled), or 'completed' (fulfilled as intended).
     * @param limit Maximum number of items to return in a single page. Must be between 1 and 50. Defaults to 10 if not specified.
     * @param after Pagination cursor for fetching the next page of results. Set this to the 'next' cursor value from a previous response to continue paginating forward.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static listPaymentCodes(
        monimeSpaceId: string,
        ussdCode?: string | null,
        mode?: 'one_time' | 'recurrent' | null,
        status?: 'pending' | 'cancelled' | 'processing' | 'expired' | 'completed' | null,
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
        result?: Array<PaymentCode> | null;
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
            url: '/v1/payment-codes',
            headers: {
                'Monime-Space-Id': monimeSpaceId,
                'Monime-Version': monimeVersion,
            },
            query: {
                'ussd_code': ussdCode,
                'mode': mode,
                'status': status,
                'limit': limit,
                'after': after,
            },
        });
    }
    /**
     * Create Payment Code
     * Creates a new payment code with the specified parameters for value collection and provider restrictions.
     * @param idempotencyKey This header is used to uniquely identify a logical request, ensuring that it is not processed more than once during retries.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static createPaymentCode(
        idempotencyKey: string,
        monimeSpaceId: string,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
        requestBody?: {
            /**
             * Defines whether the payment code is single-use ('one_time') or reusable ('recurrent').
             */
            mode?: 'one_time' | 'recurrent';
            /**
             * Descriptive name for the payment code, used for display or tracking.
             */
            name: string | null;
            /**
             * Whether the payment code should be enabled for use on creation.
             */
            enable?: boolean;
            /**
             * Amount to charge per use of the payment code. For 'recurrent' codes, this applies to each payment.
             */
            amount?: {
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
             * How long the payment code remains valid before expiring.
             */
            duration?: string;
            /**
             * Customer associated with the payment code, if any.
             */
            customer?: {
                /**
                 * Optional name of the customer associated with the payment code. Displayed in the USSD prompt for contextual reference.
                 */
                name?: string | null;
            } | null;
            /**
             * Reference tag to associate with this payment code for reconciliation or tracking.
             */
            reference?: string | null;
            /**
             * List of mobile money provider IDs permitted to process payments using this code.
             */
            authorizedProviders?: Array<'m17' | 'm18'> | null;
            /**
             * MSISDN of the mobile money account exclusively allowed to use this code.
             */
            authorizedPhoneNumber?: string;
            /**
             * Defines the target number of payments or total amount for completing a recurrent code.
             */
            recurrentPaymentTarget?: {
                /**
                 * Minimum expected number of payments after which the recurrent payment code may be considered complete. Optional.
                 */
                expectedPaymentCount?: number | null;
                /**
                 * Minimum total amount to be collected before the recurrent payment code is considered complete. Optional.
                 */
                expectedPaymentTotal?: {
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
             * Financial account where collected funds are settled. Defaults to the main account if omitted.
             */
            financialAccountId?: string | null;
            /**
             * Optional metadata for attaching custom business context to the payment code.
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
        result?: PaymentCode;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/payment-codes',
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
     * Delete Payment Code
     * Deletes a payment code by ID. This operation is only allowed if the code hasn't been used.
     * @param id Unique identifier of the payment code to delete.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static deletePaymentCode(
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
            url: '/v1/payment-codes/{id}',
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
     * Get Payment Code
     * Retrieve a payment code object by its ID.
     * @param id Unique identifier of the payment code to retrieve.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static getPaymentCode(
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
        result?: PaymentCode;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/payment-codes/{id}',
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
     * Update Payment Code
     * Partially updates an existing payment code with new values, rules, or account bindings.
     * @param id The unique ID of the payment code to update.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static updatePaymentCode(
        id: string,
        monimeSpaceId: string,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
        requestBody?: {
            /**
             * Updated display name or label for the payment code.
             */
            name?: string | null;
            /**
             * Updated amount to charge per use.
             */
            amount?: {
                /**
                 * The [3-letter](https://en.wikipedia.org/wiki/ISO_4217) ISO currency code. Currently supported: 'SLE', 'USD'
                 */
                currency?: string;
                /**
                 * The value representation in the currency's minor unit. E.g. For 1 Leone (SLE 1), the value should be 100, denoting cents, the minor unit.
                 */
                value?: number;
            } | null;
            /**
             * New expiration duration for the code.
             */
            duration?: string | null;
            /**
             * Flag to activate or deactivate the payment code.
             */
            enable?: boolean | null;
            /**
             * Updated customer information for this payment code.
             */
            customer?: {
                /**
                 * Optional name of the customer associated with the payment code. Displayed in the USSD prompt for contextual reference.
                 */
                name?: string | null;
            } | null;
            /**
             * New reference string for tagging the payment code.
             */
            reference?: string | null;
            /**
             * Updated list of mobile money providers allowed to use this code.
             */
            authorizedProviders?: Array<'m17' | 'm18'> | null;
            /**
             * New MSISDN authorized to use this payment code exclusively.
             */
            authorizedPhoneNumber?: string | null;
            /**
             * Updated target count or amount for completing a recurrent payment code.
             */
            recurrentPaymentTarget?: {
                /**
                 * Minimum expected number of payments after which the recurrent payment code may be considered complete. Optional.
                 */
                expectedPaymentCount?: number | null;
                /**
                 * Minimum total amount to be collected before the recurrent payment code is considered complete. Optional.
                 */
                expectedPaymentTotal?: {
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
             * Updated destination financial account for funds settlement.
             */
            financialAccountId?: string | null;
            /**
             * Updated metadata for storing additional context about the payment code.
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
        result?: PaymentCode;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v1/payment-codes/{id}',
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
