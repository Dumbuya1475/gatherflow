/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CoreresourcesParentOwningObject } from './CoreresourcesParentOwningObject';
/**
 * A **Financial Transaction** represents a movement of funds that affects a Financial Account, either as a **credit** (inflow) or a **debit** (outflow).
 * Every transaction adjusts the balance of an account and provides a full audit trail of how money moves within Monime.
 *
 * ---
 *
 * ### Use Cases
 *
 * - **Customer Payment Recording**
 * A user pays SLE 500 into your platform via Mobile Money.
 * *Result*: A **credit transaction** is posted to a financial account of the space; this transaction is linked to a **Payment** created from the originating **Payment Code**.
 *
 * - **Fee Deduction**
 * A SLE 50 fee is charged for a payout of SLE 1,000.
 * *Result*:
 * - A **debit transaction** of SLE 1,000 from the payout account.
 * - A **debit transaction** of SLE 50 from the payout account.
 *
 * - **Internal Transfer**
 * Moving SLE 10,000 from a Settlement Account to a Disbursement Float.
 * *Result*:
 * - A **debit transaction** on the Settlement Account.
 * - A **credit transaction** on the Disbursement Float Account.
 *
 * - **Refund or Reversal**
 * If a payment is refunded, a corresponding **debit transaction** reduces the merchant’s balance.
 * *Result*: The audit trail shows both the original credit and the refund debit, linked together.
 *
 * ---
 *
 */
export type FinancialTransaction = {
    /**
     * Unique identifier for this financial transaction.
     */
    id?: string;
    /**
     * Indicates whether the transaction is a 'credit' or 'debit'.
     */
    type?: FinancialTransaction.type;
    /**
     * The monetary value involved in this transaction.
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
     * The exact time when this transaction was recorded.
     */
    timestamp?: string;
    /**
     * Internal identifier associated with this transaction for reconciliation purposes.
     */
    reference?: string | null;
    /**
     * The account that was debited or credited as part of this transaction, including post-transaction balance snapshot.
     */
    financialAccount?: {
        /**
         * **Account ID**: Unique identifier of the financial account affected by this transaction.
         */
        readonly id?: string;
        /**
         * **Account balance**: Balance snapshot of the account immediately after the transaction, if available.
         */
        readonly balance?: {
            /**
             * **Post-transaction balance**: The available balance of the account immediately after this transaction completed.
             */
            after?: {
                /**
                 * The [3-letter](https://en.wikipedia.org/wiki/ISO_4217) ISO currency code. Currently supported: 'SLE', 'USD'
                 */
                currency?: string;
                /**
                 * The value representation in the currency's minor unit. E.g. For 1 Leone (SLE 1), the value should be 100, denoting cents, the minor unit.
                 */
                value?: number;
            };
        } | null;
    };
    /**
     * Indicates that this transaction was created as the result of a reversal action. The transaction itself represents the reversal of fund.
     */
    originatingReversal?: {
        /**
         * The ID of the transaction that was reversed by this transaction
         */
        originTxnId?: string;
        /**
         * The reference of the transaction that was reversed by this transaction
         */
        originTxnRef?: string;
    } | null;
    /**
     * Indicates that this transaction was created as the result of an internal platform fee. The transaction itself represents the fee.
     */
    originatingFee?: {
        /**
         * The type of charge applied.
         */
        code?: string;
    } | null;
    /**
     * Traceability structure showing which resource or object owns or initiated this transaction.
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
     * Custom structured key-value pairs associated with this transaction for additional context.
     */
    metadata?: Record<string, any> | null;
};
export namespace FinancialTransaction {
    /**
     * Indicates whether the transaction is a 'credit' or 'debit'.
     */
    export enum type {
        CREDIT = 'credit',
        DEBIT = 'debit',
    }
}

