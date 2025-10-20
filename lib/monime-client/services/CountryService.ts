/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Country } from '../models/Country';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CountryService {
    /**
     * List Countries
     * Retrieves a list of supported countries available in the Monime platform. Useful for onboarding flows, address validation, or region-based payment configurations.
     * @param limit Maximum number of items to return in a single page. Must be between 1 and 50. Defaults to 10 if not specified.
     * @param after Pagination cursor for fetching the next page of results. Set this to the 'next' cursor value from a previous response to continue paginating forward.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static listCountries(
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
        result?: Array<Country> | null;
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
            url: '/v1/countries',
            headers: {
                'Monime-Version': monimeVersion,
            },
            query: {
                'limit': limit,
                'after': after,
            },
        });
    }
    /**
     * Get Country
     * Retrieves detailed information about a specific country, including its ISO code, name, currencies, and any supported capabilities on the Monime platform.
     * @param countryCode The ISO 3166-1 alpha-2 country code.
     * @param monimeVersion Specifies which version of the Monime API will handle this request.
     * @returns any OK
     * @throws ApiError
     */
    public static getCountry(
        countryCode: string,
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
        result?: Country;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/countries/{countryCode}',
            path: {
                'countryCode': countryCode,
            },
            headers: {
                'Monime-Version': monimeVersion,
            },
        });
    }
}
