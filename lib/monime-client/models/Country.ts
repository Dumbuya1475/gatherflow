/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Country = {
    /**
     * The ISO 3166-1 alpha-2 country code.
     */
    code?: string;
    /**
     * The name of the country.
     */
    name?: string;
    /**
     * The default currency object of the country.
     */
    currency?: {
        /**
         * The [3-letter](https://en.wikipedia.org/wiki/ISO_4217) ISO currency code.
         */
        code?: string;
        /**
         * The subunit for the currency.
         */
        unit?: string;
        /**
         * The unit length for the currency's subunit.
         */
        unitLength?: number;
    };
    /**
     * The list supported currency codes in ISO 4217 format in that country. It includes the default currency's code.
     */
    supportedCurrencies?: Array<string> | null;
};

