/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProviderKYC } from '../models/ProviderKYC';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProviderKycService {
    /**
     * Get Provider KYC
     * Retrieves the KYC profile of an account from a specified provider.
     * @param accountId The ID of the account in the provider's ecosystem'.
     * @param providerId The ID of the provider as identified by Monime.
     * @returns any OK
     * @throws ApiError
     */
    public static getProviderKyc(
        accountId: string,
        providerId: string,
    ): CancelablePromise<{
        /**
         * Represents the status of the query operation, confirming if it was successful. This field is always true
         */
        success?: boolean;
        /**
         * Contains a list of messages providing relevant information or feedback related to the query or operation
         */
        messages?: Array<any>;
        result?: ProviderKYC;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v1/provider-kyc/{providerId}',
            path: {
                'providerId': providerId,
            },
            query: {
                'accountId': accountId,
            },
        });
    }
}
