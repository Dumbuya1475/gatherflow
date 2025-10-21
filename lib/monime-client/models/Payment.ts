/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CoreresourcesParentOwningObject } from './CoreresourcesParentOwningObject';
/**
 * A **Payment** represents a customer payment made through Monime’s platform.
 * It captures high-level information about the user-initiated payment, including the **amount**, **status**, **channel** (e.g., **Mobile Money**, **Card**, **Bank**), associated **order**, **fees applied**, and links to **downstream financial transactions**.
 *
 * The **Payment** is a business object — the single record developers and merchants interact with when tracking or reconciling user payments.
 * It should not be confused with **Financial Transactions**, which are lower-level, fine-grained ledger entries.
 * In fact, **one Payment usually generates multiple Financial Transactions** — for example:
 * - A **credit** of the received funds into the merchant’s account.
 * - One or more **debits** representing platform charges or processing fees.
 */
export type Payment = {
    /**
     * Unique identifier for the payment object.
     */
    id?: string;
    /**
     * Current status of the payment. Can be one of:
     * - pending: Created but not yet processed.
     * - processing: Payment is currently being processed.
     * - completed: Payment was successfully completed.
     */
    status?: Payment.status;
    /**
     * Total payment amount requested from the payer.
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
     * Payment channel details (e.g., Mobile Money, Bank, Card) used to complete this payment.
     */
    channel?: ({
        /**
         * **Type** of channel. This is always set to 'bank' for Bank payments.
         */
        type?: Payment.type;
        /**
         * **Provider code** for the bank or financial institution facilitating the payment.
         */
        provider?: string;
        /**
         * **Bank transaction reference** assigned by the provider when the payment was made. Often used for reconciliation and tracing within the bank’s system.
         */
        reference?: string;
        /**
         * **Bank account number** used to initiate the payment. This is usually masked to protect user privacy.
         */
        accountNumber?: string;
        /**
         * **Hashed account number**. A hashed identifier derived from the account number. Enables repeat usage recognition, fraud analysis, and loyalty program tracking — without exposing raw account number.
         */
        fingerprint?: string;
        /**
         * **Optional metadata** for attaching contextual information relevant for audits, reconciliation, or internal processing.
         */
        metadata?: Record<string, any> | null;
    } | {
        /**
         * **Type** of channel. This is always set to 'card' for card-based payments.
         */
        type?: Payment.type;
        /**
         * **Card scheme** such as 'visa' or 'mastercard'.
         */
        scheme?: Payment.scheme;
        /**
         * **Last four digits** of the card number used. Helpful for user recognition and support.
         */
        last4?: string;
        /**
         * **Card fingerprint**. A hashed identifier derived from the card number. Enables repeat usage recognition, fraud analysis, and loyalty program tracking — without exposing the card number.
         */
        fingerprint?: string;
        /**
         * **Optional metadata** for attaching contextual information useful for audit trails or internal reconciliation.
         */
        metadata?: Record<string, any> | null;
    } | {
        /**
         * **Type** of channel. This is always set to 'wallet' for digital wallet payments.
         */
        type?: Payment.type;
        /**
         * **Wallet provider** code or identifier.
         */
        provider?: string;
        /**
         * **Wallet transaction reference** assigned when the payment was executed. Often used for reconciliation and user support.
         */
        reference?: string;
        /**
         * **Wallet identifier** representing the source wallet involved in the transaction. Usually masked or obfuscated.
         */
        walletId?: string;
        /**
         * **Hashed wallet identifier**. Enables secure correlation, repeat-usage detection, and loyalty programs — while preserving privacy.
         */
        fingerprint?: string;
        /**
         * **Optional metadata** for attaching contextual or audit-related details about the wallet transaction.
         */
        metadata?: Record<string, any> | null;
    } | {
        /**
         * **Type** of channel. This is always set to 'momo' for Mobile Money payments.
         */
        type?: Payment.type;
        /**
         * **Provider code** for the Mobile Money operator (e.g., 'm17' for Orange Money) that is facilitating the payment.
         */
        provider?: string;
        /**
         * **Network transaction reference** assigned by the Mobile Money operator when the payment was made. This is often visible to the payer and useful for tracing the transaction in the provider’s system.
         */
        reference?: string;
        /**
         * **Phone number (MSISDN)** of the Mobile Money wallet that initiated the payment. This is usually masked for privacy and security.
         */
        phoneNumber?: string;
        /**
         * **Hashed phone number**. A hashed identifier derived from the phone number. Enables repeat usage recognition, fraud analysis, and loyalty program tracking — without exposing the raw phone number.
         */
        fingerprint?: string;
        /**
         * **Optional metadata** for attaching extra contextual information useful for audit logs, reconciliation, or internal tracking.
         */
        metadata?: Record<string, any> | null;
    } | {
        /**
         * **Type** of payment channel used to process the payment. Supported values:
         * - bank: Bank account payments
         * - card: Debit or credit card payments
         * - momo: Mobile money payments
         * - wallet: Digital wallet payments.
         */
        type?: Payment.type;
    });
    /**
     * Optional label for identifying or grouping the payment. Useful in dashboards or reporting tools.
     */
    name?: string | null;
    /**
     * External reference to associate this payment with a system outside Monime (e.g., an order ID or invoice number).
     */
    reference?: string | null;
    /**
     * Monime Order Number — internal order identifier associated with this payment. Used to track payments initiated from an embedded commerce or checkout session.
     */
    orderNumber?: string | null;
    /**
     * ID of the destination financial account where the funds will be credited after a successful payment.
     */
    financialAccountId?: string | null;
    /**
     * Reference to the resulting financial transaction(s), if the payment was successful.
     */
    financialTransactionReference?: string | null;
    /**
     * List of applied fees associated with this payment, such as platform or processing fees.
     */
    fees?: Array<{
        /**
         * The type of fee applied.
         */
        code?: string;
        /**
         * The amount of the fee that was applied for the payment.
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
     * Timestamp indicating when the payment was created.
     */
    createTime?: string;
    /**
     * Timestamp indicating when the payment was last updated.
     */
    updateTime?: string | null;
    /**
     * Ownership chain showing how this payment was initiated — enabling full audit traceability.
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
     * Custom metadata attached to the payment
     */
    metadata?: Record<string, any> | null;
};
export namespace Payment {
    /**
     * Current status of the payment. Can be one of:
     * - pending: Created but not yet processed.
     * - processing: Payment is currently being processed.
     * - completed: Payment was successfully completed.
     */
    export enum status {
        PENDING = 'pending',
        PROCESSING = 'processing',
        COMPLETED = 'completed',
    }
    /**
     * **Type** of channel. This is always set to 'bank' for Bank payments.
     */
    export enum type {
        BANK = 'bank',
    }
    /**
     * **Card scheme** such as 'visa' or 'mastercard'.
     */
    export enum scheme {
        MASTERCARD = 'mastercard',
        VISA = 'visa',
    }
}

