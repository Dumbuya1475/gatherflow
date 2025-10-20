/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckoutSession } from '../models/CheckoutSession';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CheckoutSessionService {
    /**
     * List Checkout Sessions
     * Retrieves list of checkout sessions.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param limit Maximum number of items to return in a single page. Must be between 1 and 50. Defaults to 10 if not specified.
     * @param after Pagination cursor for fetching the next page of results. Set this to the 'next' cursor value from a previous response to continue paginating forward.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static listCheckoutSessions(
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
        result?: Array<CheckoutSession> | null;
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
            url: '/v1/checkout-sessions',
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
     * Create Checkout Session
     * Creates a new checkout session to initiate a user payment experience.
     * @param idempotencyKey This header is used to uniquely identify a logical request, ensuring that it is not processed more than once during retries.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static createCheckoutSession(
        idempotencyKey: string,
        monimeSpaceId: string,
        monimeVersion?: 'caph.2025-08-23' | 'caph.2025-06-20' | null,
        requestBody?: {
            /**
             * Title or label for the checkout session. Used for display in customer-facing UIs.
             */
            name: string;
            /**
             * Optional long-form description explaining the purpose or context of the checkout session.
             */
            description?: string | null;
            /**
             * The URL to redirect the customer to if they cancel the checkout process before completing payment. This typically returns the user to your site or app with context about the cancellation.
             */
            cancelUrl?: string;
            /**
             * The URL to redirect the customer to after successfully completing the checkout. Typically used to confirm the order or show a success message on your site or app.
             */
            successUrl?: string;
            /**
             * Opaque value sent back via callback for correlating the session. Never exposed in read APIs.
             */
            callbackState?: string | null;
            /**
             * Optional external reference identifier (e.g., order ID) used to link this session with the developer’s backend system.
             */
            reference?: string | null;
            /**
             * Financial account where collected funds are settled. Defaults to the main account if omitted.
             */
            financialAccountId?: string | null;
            /**
             * List of items to be displayed and charged in the session. Must include at least one item.
             */
            lineItems: Array<({
                /**
                 * Type of line item. This must be set to 'custom'.
                 */
                type?: 'custom';
                /**
                 * Unique internal identifier for this line item. This is generated by the system and cannot be provided by the user. Unique across all checkout sessions.
                 */
                readonly id?: string;
                /**
                 * Name of the product or service represented by this line item.
                 */
                name: string;
                /**
                 * Monetary value representing the price per unit of this item.
                 */
                price: {
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
                 * Number of units being purchased. Must be between 1 and 100,000.
                 */
                quantity?: number;
                /**
                 * External system-provided identifier for this line item, used for cross-system tracking, reconciliation, or referencing purposes. Must be unique within the checkout session. If not provided, a unique identifier will be generated.
                 */
                reference?: string | null;
                /**
                 * Optional description providing additional details about the item.
                 */
                description?: string | null;
                /**
                 * Up to 3 image URLs visually representing this item.
                 */
                images?: Array<string> | null;
            } | {
                type?: 'custom';
            })> | null;
            /**
             * **Payment method configuration** that controls which payment options (e.g., Banks, Cards, MOMO, Wallets) are enabled or restricted during checkout.
             */
            paymentOptions?: {
                /**
                 * Settings for card-based payments. Allows disabling the card method entirely.
                 */
                card?: {
                    /**
                     * When true, card-based payment options will be hidden or disabled during checkout.
                     */
                    disable?: boolean;
                };
                /**
                 * Settings for bank payments. You can restrict which bank providers are available or excluded.
                 */
                bank?: {
                    /**
                     * When true, bank-based payment options will be hidden or disabled during checkout.
                     */
                    disable?: boolean;
                    /**
                     * Bank providers to explicitly allow for this session. Takes precedence over 'disabledProviders'.
                     */
                    enabledProviders?: Array<'slb001' | 'slb004' | 'slb007'> | null;
                    /**
                     * If set, these bank providers will be excluded from this session.  If a provider is in both enabled and disabled lists, it will be allowed.
                     */
                    disabledProviders?: Array<'slb001' | 'slb004' | 'slb007'> | null;
                };
                /**
                 * Settings for mobile money payments. Customize which MoMo providers are shown at checkout.
                 */
                momo?: {
                    /**
                     * When true, mobile money (MoMo) options will be hidden or disabled during checkout.
                     */
                    disable?: boolean;
                    /**
                     * MoMo providers to explicitly allow for this session. Takes precedence over 'disabledProviders'.
                     */
                    enabledProviders?: Array<'m17' | 'm18'> | null;
                    /**
                     * MoMo providers to exclude from this session. If a provider is in both enabled and disabled lists, it will be allowed.
                     */
                    disabledProviders?: Array<'m17' | 'm18'> | null;
                };
                /**
                 * Settings for wallet-based payments. Control whether wallets are available and which ones.
                 */
                wallet?: {
                    /**
                     * When true, wallet-based payment options will be hidden or disabled during checkout.
                     */
                    disable?: boolean;
                    /**
                     * Wallet providers to explicitly allow for this session. Takes precedence over 'disabledProviders'.
                     */
                    enabledProviders?: Array<'dw001'> | null;
                    /**
                     * Wallet providers to exclude from this session. If a provider is in both enabled and disabled lists, it will be allowed.
                     */
                    disabledProviders?: Array<'dw001'> | null;
                };
            } | null;
            /**
             * Visual customization options for the checkout UI, such as color schemes or logos.
             */
            brandingOptions?: {
                /**
                 * Primary brand color in hex format (e.g., '#00FF00') used to customize the appearance of the checkout interface.
                 */
                primaryColor?: string;
            } | null;
            /**
             * Key-value pairs for attaching contextual metadata.
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
        result?: CheckoutSession;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v1/checkout-sessions',
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
     * Delete Checkout Session
     * Deletes a checkout session. This operation is only allowed if the session has not yet been initiated by the user.
     * @param id ID of the checkout session to delete.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static deleteCheckoutSession(
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
            url: '/v1/checkout-sessions/{id}',
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
     * Get Checkout Session
     * Retrieves the full details of a checkout session by ID.
     * @param id ID of the checkout session to retrieve.
     * @param monimeSpaceId The value is the tenancy parameter that Monime uses to determine which space the request is intended for.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static getCheckoutSession(
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
        result?: CheckoutSession;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/checkout-sessions/{id}',
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
