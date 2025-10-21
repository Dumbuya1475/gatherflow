/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Momo = {
    /**
     * The provider ID for the momo as assigned by Monime.
     */
    providerId?: string;
    /**
     * The name of the momo.
     */
    name?: string;
    /**
     * The country of the momo.
     */
    country?: string;
    /**
     * The status of the momo's operations within monime'.
     */
    status?: {
        /**
         * Whether or not this momo is active within Monime.
         */
        active?: boolean;
    };
    /**
     * The set of Monime features that the momo supports.'
     */
    featureSet?: {
        /**
         * The momo's payout feature information.
         */
        payout?: {
            /**
             * Whether or not Monime can pay out to an account in the momo.
             */
            canPayTo?: boolean;
            /**
             * The supported payout schemes of the momo.
             */
            schemes?: Array<string> | null;
            /**
             * Further metadata describing this momo's payout feature.
             */
            metadata?: Record<string, string> | null;
        };
        /**
         * The momo's payment feature information.
         */
        payment?: {
            /**
             * Whether or not Monime can accept payment from an account in the momo.
             */
            canPayFrom?: boolean;
            /**
             * The supported payment schemes of the momo.
             */
            schemes?: Array<string> | null;
            /**
             * Further metadata describing this momo's payment feature.
             */
            metadata?: Record<string, string> | null;
        };
        /**
         * The momo's KYC verification feature information.
         */
        kycVerification?: {
            /**
             * Whether or not Monime can verify an account's KYC' in the momo.
             */
            canVerifyAccount?: boolean;
            /**
             * Further metadata describing this momo's KYC verification feature.
             */
            metadata?: Record<string, string> | null;
        };
    };
    /**
     * The time the momo's support was added.
     */
    createTime?: string;
    /**
     * The last time the momo's support was updated.
     */
    updateTime?: string | null;
};

