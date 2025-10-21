/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Bank = {
    /**
     * The provider ID for the momo as assigned by Monime.
     */
    providerId?: string;
    /**
     * The name of the bank.
     */
    name?: string;
    /**
     * The country of the bank.
     */
    country?: string;
    /**
     * The status of the bank's operations within monime'.
     */
    status?: {
        /**
         * Whether or not this bank is active within Monime.
         */
        active?: boolean;
    };
    /**
     * The set of Monime features that the bank supports.'
     */
    featureSet?: {
        /**
         * The bank's payout feature information.
         */
        payout?: {
            /**
             * Whether or not Monime can pay out to an account in the bank.
             */
            canPayTo?: boolean;
            /**
             * The supported payout schemes of the bank.
             */
            schemes?: Array<string> | null;
            /**
             * Further metadata describing this bank's payout feature.
             */
            metadata?: Record<string, string> | null;
        };
        /**
         * The bank's payment feature information.
         */
        payment?: {
            /**
             * Whether or not Monime can accept payment from an account in the bank.
             */
            canPayFrom?: boolean;
            /**
             * The supported payment schemes of the bank.
             */
            schemes?: Array<string> | null;
            /**
             * Further metadata describing this bank's payment feature.
             */
            metadata?: Record<string, string> | null;
        };
        /**
         * The bank's KYC verification feature information.
         */
        kycVerification?: {
            /**
             * Whether or not Monime can verify an account's KYC' in the bank.
             */
            canVerifyAccount?: boolean;
            /**
             * Further metadata describing this bank's KYC verification feature.
             */
            metadata?: Record<string, string> | null;
        };
    };
    /**
     * The time the bank's support was added.
     */
    createTime?: string;
    /**
     * The last time the bank's support was updated.
     */
    updateTime?: string | null;
};

