/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CoreresourcesParentOwningObject } from './CoreresourcesParentOwningObject';
/**
 * A **Payout** is a disbursement of funds from a **Financial Account** to a designated destination such as a **Bank Account** or **Mobile Money Wallet**.
 * It represents outbound money flows and is commonly used for **salary disbursements**, **vendor payments**, and **refunds** in automated workflows.
 *
 * Each payout records the **amount**, the **source account**, the **destination details**, and optional **metadata**.
 * It also tracks **status changes** throughout its lifecycle and may include **provider-specific references** for reconciliation.
 *
 */
export type Payout = {
    /**
     * Unique identifier for the payout object.
     */
    id?: string;
    /**
     * Current status of the payout:
     * - 'pending': Created but not yet scheduled.- 'processing': Currently being processed.
     * - 'completed': Successfully completed.
     * - 'failed': Processing failed or rejected.
     */
    status?: Payout.status;
    /**
     * Amount to be paid to the destination provider account.
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
     * SourceAccount of funds, including debit account and transaction details. Can be null if the default account is used.
     */
    source?: {
        /**
         * ID of the financial account where the funds is disbursed from.
         */
        financialAccountId: string;
        /**
         * Internal Monime reference for the debit transaction from the source account. This is null until the payout is processed.
         */
        readonly transactionReference?: string | null;
    } | null;
    /**
     * Destination account details that will receive the payout.
     */
    destination?: ({
        /**
         * Fixed value: 'bank'. Indicates this is a bank payout destination.
         */
        type: Payout.type;
        /**
         * Identifier of the bank or financial service provider.
         */
        providerId: Payout.providerId;
        /**
         * The bank account number to which the payout will be sent.
         */
        accountNumber: string;
        /**
         * Reference or identifier of the underlying transaction that credited the recipient’s bank account. Will be 'null' if the payout is not 'completed'.
         */
        readonly transactionReference?: string | null;
    } | {
        /**
         * Fixed value: 'momo'. Indicates this is a mobile money (MoMo) payout destination.
         */
        type: Payout.type;
        /**
         * Identifier of the mobile money provider.
         */
        providerId: Payout.providerId;
        /**
         * The mobile number (MSISDN) of the recipient's mobile money account.
         */
        phoneNumber: string;
        /**
         * Reference or ID of the transaction that credited the recipient’s mobile money wallet. Set to 'null' if the payout is not 'completed'.
         */
        readonly transactionReference?: string | null;
    } | {
        /**
         * Fixed value: 'wallet'. Indicates this is a digital wallet payout destination.
         */
        type: Payout.type;
        /**
         * Identifier of the digital wallet provider.
         */
        providerId: Payout.providerId;
        /**
         * The ID of the recipient's wallet in the digital wallet ecosystem.
         */
        walletId?: string;
        /**
         * Reference or ID of the transaction that credited the recipient’s wallet. Set to null if the payout has not reached completed status.
         */
        readonly transactionReference?: string | null;
    } | {
        /**
         * Specifies the type of destination account. Must be either 'bank', 'momo', or 'wallet'.
         */
        type: Payout.type;
    });
    /**
     * List of fees applied during payout processing. Empty if not yet processed.
     */
    fees?: Array<{
        /**
         * The type of fee applied.
         */
        code?: string;
        /**
         * The amount of the fee that was applied on top of the payout amount.
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
         * Further metadata describing the fee.
         */
        metadata?: Record<string, any> | null;
    }> | null;
    /**
     * Detailed information about the failure, if the payout status is 'failed'.
     */
    failureDetail?: {
        /**
         * **Error code** indicating why the payout failed. Possible values include:
         * - unknown: General or unclassified failure.
         * - fund_insufficient: Source account lacks sufficient funds.
         * - authorization_failed: Authorization failed or was denied.
         * - provider_unknown: Unexpected error from the external provider.
         * - provider_account_blocked: The destination provider account is blocked.
         * - provider_account_missing: The destination provider account does not exist.
         * - provider_account_quota_exhausted: Daily or per-transaction quota has been exceeded.
         */
        code?: Payout.code;
        /**
         * **Human-readable message** providing more context about the failure. Useful for logs, dashboards, or client-facing error messages.
         */
        message?: string;
    } | null;
    /**
     * Timestamp indicating when the payout object was created.
     */
    createTime?: string;
    /**
     * Timestamp indicating when the payout object was last updated.
     */
    updateTime?: string;
    /**
     * Full ownership graph tracing the origin of this payout objects across multiple objects.
     */
    ownershipGraph?: {
        /**
         * **Immediate object** that owns this entity. This is the direct originator or source object.
         */
        readonly owner?: {
            /**
             * **Unique ID** of the object instance that owns this entity.
             */
            readonly id?: string;
            /**
             * **Type of the object** that owns this entity. Examples include: 'internal_transfer', 'checkout_session', 'payment_code'.
             */
            readonly type?: string;
            /**
             * **Arbitrary metadata** describing the owning object.
             */
            readonly metadata?: Record<string, any> | null;
            owner?: CoreresourcesParentOwningObject;
        };
    } | null;
    /**
     * Optional metadata attached to the payout for additional context.
     */
    metadata?: Record<string, any> | null;
};
export namespace Payout {
    /**
     * Current status of the payout:
     * - 'pending': Created but not yet scheduled.- 'processing': Currently being processed.
     * - 'completed': Successfully completed.
     * - 'failed': Processing failed or rejected.
     */
    export enum status {
        PENDING = 'pending',
        PROCESSING = 'processing',
        COMPLETED = 'completed',
        FAILED = 'failed',
    }
    /**
     * Fixed value: 'bank'. Indicates this is a bank payout destination.
     */
    export enum type {
        BANK = 'bank',
    }
    /**
     * Identifier of the bank or financial service provider.
     */
    export enum providerId {
        SLB001 = 'slb001',
        SLB004 = 'slb004',
        SLB007 = 'slb007',
    }
    /**
     * **Error code** indicating why the payout failed. Possible values include:
     * - unknown: General or unclassified failure.
     * - fund_insufficient: Source account lacks sufficient funds.
     * - authorization_failed: Authorization failed or was denied.
     * - provider_unknown: Unexpected error from the external provider.
     * - provider_account_blocked: The destination provider account is blocked.
     * - provider_account_missing: The destination provider account does not exist.
     * - provider_account_quota_exhausted: Daily or per-transaction quota has been exceeded.
     */
    export enum code {
        UNKNOWN = 'unknown',
        FUND_INSUFFICIENT = 'fund_insufficient',
        AUTHORIZATION_FAILED = 'authorization_failed',
        PROVIDER_UNKNOWN = 'provider_unknown',
        PROVIDER_ACCOUNT_BLOCKED = 'provider_account_blocked',
        PROVIDER_ACCOUNT_MISSING = 'provider_account_missing',
        PROVIDER_ACCOUNT_QUOTA_EXHAUSTED = 'provider_account_quota_exhausted',
    }
}

