/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CoreresourcesParentOwningObject } from './CoreresourcesParentOwningObject';
/**
 * An **Internal Transfer** is the movement of funds between financial accounts that exist within the same Space.
 * Unlike payouts or customer payments that cross external networks (banks, card schemes, or mobile money), an Internal Transfer happens entirely within Monime’s ledger.
 *
 * It is the mechanism for shifting balances between accounts you own or manage, and it never leaves your organization’s financial boundary.
 *
 * ---
 *
 * ### Use Cases
 *
 * - **Wallet Top-ups**
 * A customer wallet account can be funded by moving money from your master operational account.
 * *Example*: A user adds **SLE 1,000** to their app wallet. Your backend issues an Internal Transfer from your **Operational Float** to the user’s **Wallet Account**.
 *
 * - **Inter-Account Routing**
 * Businesses often separate funds for accounting clarity (e.g., “Card Collections,” “Mobile Money Collections,” “Bank Transfers”).
 * *Example*: At the end of each day, you route all **Mobile Money collections** into a central **Settlement Account**.
 *
 * - **Internal Settlements**
 * Useful when multiple departments or sub-entities operate under one Space.
 * *Example*: Subsidiary A owes Subsidiary B **SLE 50,000**. Instead of moving money through the banking system, you perform an Internal Transfer inside your Monime ledger.
 *
 * - **Float Management**
 * Fintechs maintain float across accounts to support disbursements.
 * *Example*: If your **Disbursement Account** is running low, you move funds from your **Collection Account** to top it up before processing payouts.
 *
 *
 * ---
 */
export type InternalTransfer = {
    /**
     * Unique identifier for this transfer object.
     */
    id?: string;
    /**
     * Current status of the transfer:
     * - 'pending': Created but not yet processed.
     * - 'processing': Currently being processed.
     * - 'failed': Transfer failed.
     * - 'completed': Transfer successfully completed.
     */
    status?: InternalTransfer.status;
    /**
     * Amount to be transferred from the source to the destination account.
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
     * Source financial account from which the funds will be debited.
     */
    sourceFinancialAccount?: {
        /**
         * Unique identifier for the financial account
         */
        id?: string;
    };
    /**
     * Destination financial account to which the funds will be credited.
     */
    destinationFinancialAccount?: {
        /**
         * Unique identifier for the financial account
         */
        id?: string;
    };
    /**
     * Reference to the resulting financial transaction(s), if the transfer was completed.
     */
    financialTransactionReference?: string | null;
    /**
     * Human-readable description of the transfer. Useful for developer context, admin UIs, or logs.
     */
    description?: string | null;
    /**
     * Failure details, populated only when the transfer status is 'failed'.
     */
    failureDetail?: {
        /**
         * **Error code** representing the reason this transfer failed. Possible values include:
         * - **unknown**: Generic or unclassified failure.
         * - **fund_insufficient**: Not enough funds in the source account.
         */
        code?: InternalTransfer.code;
        /**
         * **Optional explanation** providing more context about the failure. Useful for developer logs or end-user display.
         */
        message?: string | null;
    } | null;
    /**
     * Ownership chain that shows which object or action triggered the transfer — enabling audit traceability.
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
     * Timestamp indicating when the transfer was created.
     */
    createTime?: string;
    /**
     * Timestamp of the most recent update to the transfer.
     */
    updateTime?: string | null;
    /**
     * Custom metadata for tagging this transfer with additional context or identifiers.
     */
    metadata?: Record<string, any> | null;
};
export namespace InternalTransfer {
    /**
     * Current status of the transfer:
     * - 'pending': Created but not yet processed.
     * - 'processing': Currently being processed.
     * - 'failed': Transfer failed.
     * - 'completed': Transfer successfully completed.
     */
    export enum status {
        PENDING = 'pending',
        PROCESSING = 'processing',
        FAILED = 'failed',
        COMPLETED = 'completed',
    }
    /**
     * **Error code** representing the reason this transfer failed. Possible values include:
     * - **unknown**: Generic or unclassified failure.
     * - **fund_insufficient**: Not enough funds in the source account.
     */
    export enum code {
        UNKNOWN = 'unknown',
        FUND_INSUFFICIENT = 'fund_insufficient',
    }
}

