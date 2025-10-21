/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CoreresourcesParentOwningObject } from './CoreresourcesParentOwningObject';
/**
 * A **Payment Code** is a programmable, short-lived token that allows users to collect payments from others.
 * It is especially useful in **USSD-like** or **QR-based** flows, where the payer enters or scans a code to complete a transaction.
 *
 * Payment Codes provide flexibility for both **one-time** and **recurrent** collections, with configurable restrictions and targets.
 *
 * ---
 *
 * ### Use Cases
 *
 * - **USSD Payment Collection**
 * A merchant generates a Payment Code and displays it in USSD. Customers enter the code to make payments.
 * *Example*: A vendor creates a one-time code for **SLE 50** which a customer redeems via their mobile money wallet.
 *
 * - **QR Code at Point of Sale**
 * The Payment Code is encoded as a QR displayed at checkout. Customers scan the QR to pay.
 * *Example*: A shop generates a QR-based Payment Code for **SLE 200**, which is redeemed on the spot.
 *
 * - **Recurring Subscription Collection**
 * A fitness center issues a recurrent Payment Code for monthly fees.
 * *Example*: The code accepts up to **12 payments** of **SLE 500** each, after which it auto-completes.
 *
 * - **Targeted Collection**
 * Restrict a Payment Code to a specific MSISDN or provider.
 * *Example*: Only customers on **Orange Money** with a registered number can redeem the code.
 *
 * ---
 */
export type PaymentCode = {
    /**
     * Unique identifier of the payment code object.
     */
    id?: string;
    /**
     * Usage mode of the payment code:
     * - 'one_time': Can be used only once
     * - 'recurrent': Can be used multiple times until a target is met or it expires.
     */
    mode?: PaymentCode.mode;
    /**
     * Lifecycle status of the payment code: 'pending' (created but not in use), 'processing' (currently in use), 'expired' (duration elapsed), 'completed' (usage or target fulfilled), or 'cancelled' (manually invalidated).
     */
    status?: PaymentCode.status;
    /**
     * Optional human-readable name for the payment code, useful for labeling or tracking.
     */
    name?: string | null;
    /**
     * Amount charged per use of the payment code. For 'recurrent' mode, this applies to each payment instance.
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
     * Indicates whether the payment code is currently enabled for use.
     */
    enable?: boolean;
    /**
     * The time at which the payment code expires, provided the code is still pending.
     */
    expireTime?: string;
    /**
     * Optional customer information linked to this payment code. Often used for USSD or receipt context.
     */
    customer?: {
        /**
         * Optional name of the customer associated with the payment code. Displayed in the USSD prompt for contextual reference.
         */
        name?: string | null;
    } | null;
    /**
     * The USSD dial string customer(s) can use to initiate a payment for this code.
     */
    ussdCode?: string;
    /**
     * Reference string associated with the payment code. Useful for transaction tagging or reconciliation.
     */
    reference?: string | null;
    /**
     * List of mobile money providers permitted to process payments using this code.
     */
    authorizedProviders?: Array<'m17' | 'm18'> | null;
    /**
     * MSISDN of the mobile money account exclusively allowed to use this code. Other users will be rejected.
     */
    authorizedPhoneNumber?: string;
    /**
     * Target payment count or amount that determines when a recurrent payment code is considered complete.
     */
    recurrentPaymentTarget?: {
        /**
         * Minimum expected number of payments after which the recurrent payment code may be considered complete. Optional.
         */
        expectedPaymentCount?: number | null;
        /**
         * Minimum total amount to be collected before the recurrent payment code is considered complete. Optional.
         */
        expectedPaymentTotal?: {
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
    /**
     * ID of the financial account where collected funds will be settled. Defaults to the main account if not provided.
     */
    financialAccountId?: string | null;
    /**
     * The data of the payment that was processed for this payment code. This field is available only during the 'payment_code.processed' webhook event.
     */
    processedPaymentData?: {
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
        orderId?: string;
        paymentId?: string;
        orderNumber?: string;
        channelData?: {
            providerId?: string;
            accountId?: string;
            reference?: string;
        };
        financialTransactionReference?: string;
        /**
         * This holds key-value pairs, where both the keys and values are strings not exceeding 64 and 100 characters respectively. This allows for flexible and descriptive tagging or additional information to be associated with the object.
         */
        metadata?: Record<string, any> | null;
    } | null;
    /**
     * Timestamp indicating when the payment code was created.
     */
    createTime?: string;
    /**
     * Timestamp indicating when the payment code was last updated.
     */
    updateTime?: string | null;
    /**
     * Full ownership graph tracing the origin of this payment code objects across multiple objects.
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
     * Custom metadata attached to the payment code for storing business-specific context or tags.
     */
    metadata?: Record<string, any> | null;
};
export namespace PaymentCode {
    /**
     * Usage mode of the payment code:
     * - 'one_time': Can be used only once
     * - 'recurrent': Can be used multiple times until a target is met or it expires.
     */
    export enum mode {
        ONE_TIME = 'one_time',
        RECURRENT = 'recurrent',
    }
    /**
     * Lifecycle status of the payment code: 'pending' (created but not in use), 'processing' (currently in use), 'expired' (duration elapsed), 'completed' (usage or target fulfilled), or 'cancelled' (manually invalidated).
     */
    export enum status {
        PENDING = 'pending',
        CANCELLED = 'cancelled',
        PROCESSING = 'processing',
        EXPIRED = 'expired',
        COMPLETED = 'completed',
    }
}

