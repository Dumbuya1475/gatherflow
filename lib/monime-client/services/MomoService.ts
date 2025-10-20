/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Momo } from '../models/Momo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MomoService {
    /**
     * List Momos
     * Retrieves a list of supported momos available in the specified country. Useful for rendering provider selection options during user payment setup or onboarding.
     * @param country ISO 3166-1 alpha-2 country code (e.g., 'SL', 'GH') to filter momos by region.
     * @param limit Maximum number of items to return in a single page. Must be between 1 and 50. Defaults to 10 if not specified.
     * @param after Pagination cursor for fetching the next page of results. Set this to the 'next' cursor value from a previous response to continue paginating forward.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static listMomos(
        country: string,
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
        result?: Array<Momo> | null;
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
            url: '/v1/momos',
            headers: {
                'Monime-Version': monimeVersion,
            },
            query: {
                'limit': limit,
                'after': after,
                'country': country,
            },
        });
    }
    /**
     * Get Momo
     * Retrieves detailed information about a specific momo provider using its Monime-assigned provider ID.
     * @param providerId Unique provider ID for the momo as assigned by Monime.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static getMomo(
        providerId: string,
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
        result?: Momo;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/momos/{providerId}',
            path: {
                'providerId': providerId,
            },
            headers: {
                'Monime-Version': monimeVersion,
            },
        });
    }
}
