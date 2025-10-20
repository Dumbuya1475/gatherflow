/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Webhook } from '../models/Webhook';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WebhookService {
    /**
     * List Webhooks
     * Retrieves list of webhooks.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param limit Maximum number of items to return in a single page. Must be between 1 and 50. Defaults to 10 if not specified.
     * @param after Pagination cursor for fetching the next page of results. Set this to the 'next' cursor value from a previous response to continue paginating forward.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static listWebhooks(
        monimeSpaceId: string,
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
        result?: Array<Webhook> | null;
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
            url: '/v1/webhooks',
            headers: {
                'Monime-Version': monimeVersion,
                'Monime-Space-Id': monimeSpaceId,
            },
            query: {
                'limit': limit,
                'after': after,
            },
        });
    }
    /**
     * Create Webhook
     * Create a new webhook with configuration for target URL, events, headers, and security.
     * @param idempotencyKey This header is used to uniquely identify a logical request, ensuring that it is not processed more than once during retries.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static createWebhook(
        idempotencyKey: string,
        monimeSpaceId: string,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
        requestBody?: {
            /**
             * Human-readable name for the webhook configuration.
             */
            name: string;
            /**
             * Target URL that will receive webhook event payloads.
             */
            url: string;
            /**
             * Flag indicating if the webhook should be active upon creation.
             */
            enabled?: boolean;
            /**
             * Defines the target API release for this webhook. A release represents a stable snapshot of the API schema. Ensures the webhook receives the latest object schema for a given release cycle.
             */
            apiRelease: 'caph' | 'siriusb';
            /**
             * List of event types that should trigger this webhook.
             */
            events: Array<string> | null;
            /**
             * Optional HTTP headers to include in outbound webhook requests.
             */
            headers?: Record<string, string> | null;
            /**
             * Optional email addresses to notify on repeated delivery failures.
             */
            alertEmails?: Array<string> | null;
            /**
             * Method to be use to verify the integrity of incoming webhook requests.
             */
            verificationMethod?: ({
                /**
                 * Indicates the use of HMAC (HS256) as the signature verification method.
                 */
                type: 'HS256';
                /**
                 * The shared secret used to compute and verify the HMAC signature.
                 */
                secret: string;
            } | {
                /**
                 * Indicates the use of ECDSA (ES256) as the signature verification method.
                 */
                type: 'ES256';
                /**
                 * The ECDSA public key used to verify the webhook signature. It is a a PEM-encoded key on the NIST P-256 (prime256v1 / secp256r1) curve.
                 */
                readonly publicKey?: string;
            } | {
                /**
                 * The type of verification method in use. Either 'HS256' for HMAC or 'ES256' for ECDSA.
                 */
                type: 'ES256' | 'HS256';
            }) | null;
            /**
             * Custom metadata for tagging or annotating this webhook.
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
        result?: Webhook;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/webhooks',
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
     * Delete Webhook
     * Delete a webhook by its ID. This action is irreversible.
     * @param id Unique identifier of the webhook to delete.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static deleteWebhook(
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
            url: '/v1/webhooks/{id}',
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
     * Get Webhook
     * Retrieve details of a specific webhook by its ID.
     * @param id Unique identifier of the webhook to retrieve.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static getWebhook(
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
        result?: Webhook;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/webhooks/{id}',
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
     * Update Webhook
     * Partially update an existing webhook's configuration and behavior.
     * @param id Unique identifier of the webhook to update.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static updateWebhook(
        id: string,
        monimeSpaceId: string,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
        requestBody?: {
            /**
             * Updated name for the webhook.
             */
            name?: string | null;
            /**
             * New URL to send webhook requests to.
             */
            url?: string | null;
            /**
             * Enable or disable the webhook.
             */
            enabled?: boolean | null;
            /**
             * Updated API release name for webhook payloads.
             */
            apiRelease?: 'caph' | 'siriusb' | null;
            /**
             * Updated list of events that trigger the webhook.
             */
            events?: Array<string> | null;
            /**
             * Updated HTTP headers to include in webhook requests.
             */
            headers?: Record<string, string> | null;
            /**
             * Updated alert email list for delivery failures.
             */
            alertEmails?: Array<string> | null;
            /**
             * Updated custom metadata for the webhook.
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
        result?: Webhook;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/v1/webhooks/{id}',
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
