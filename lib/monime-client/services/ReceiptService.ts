/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Receipt } from '../models/Receipt';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReceiptService {
    /**
     * Get Receipt
     * Retrieves a receipt using its order number.
     * @param orderNumber The order number of the receipt to retrieve.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static retrieveReceipt(
        orderNumber: string,
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
        result?: Receipt;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/receipts/{orderNumber}',
            path: {
                'orderNumber': orderNumber,
            },
            headers: {
                'Monime-Version': monimeVersion,
                'Monime-Space-Id': monimeSpaceId,
            },
        });
    }
    /**
     * Redeem Receipt
     * Redeem one or more entitlements from a receipt. When processing a bulk redemption, if any entitlement is already exhausted, the entire operation is rejected.
     * @param orderNumber The order number of the receipt to be redeemed.
     * @param idempotencyKey This header is used to uniquely identify a logical request, ensuring that it is not processed more than once during retries.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static redeemReceipt(
        orderNumber: string,
        idempotencyKey: string,
        monimeSpaceId: string,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
        requestBody?: {
            /**
             * Whether to redeem all entitlements in the receipt.
             */
            redeemAll?: boolean | null;
            /**
             * List of entitlements to redeem. When set, it takes precedence over the 'redeemAll' flag.
             */
            entitlements?: Array<{
                /**
                 * Stable entitlement key (e.g., SKU, ticket_type, or any identifier unique to the product).
                 */
                key: string;
                /**
                 * Units of entitlement to redeem. This should not exceed the remaining quantity of the entitlement.
                 */
                units?: number;
            }> | null;
            /**
             * Optional metadata for attaching context or tracking info.
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
        /**
         * Represents the outcome of redeeming entitlement(s) from a receipt.
         */
        result?: {
            /**
             * Whether the redemption was successful. This will be false if any of the entitlements had already been exhausted.
             */
            redeem?: boolean;
            receipt?: Receipt;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/receipts/{orderNumber}/redeem',
            path: {
                'orderNumber': orderNumber,
            },
            headers: {
                'Idempotency-Key': idempotencyKey,
                'Monime-Version': monimeVersion,
                'Monime-Space-Id': monimeSpaceId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
