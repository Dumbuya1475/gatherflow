/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A **Webhook** is a user-defined HTTP endpoint that Monime invokes with a **POST request** whenever specific events occur, such as **`payment.completed`** or **`payout.failed`**.
 * Webhooks allow you to receive real-time notifications and integrate Monime’s event stream directly into your own systems.
 *
 * ### Use Cases
 *
 * - **Realtime Payment Updates**
 * Receive an immediate notification when a payment succeeds and update your user’s dashboard without polling the API.
 *
 * - **Automated Payout Reconciliation**
 * Trigger accounting workflows or ERP system updates when a payout is marked as `completed` or `failed`.
 *
 * - **Fraud & Risk Monitoring**
 * Stream payment events into your fraud detection system as they happen.
 *
 * ---
 *
 */
export type Webhook = {
    /**
     * Unique identifier of the webhook object.
     */
    id?: string;
    /**
     * Human-readable name for the webhook configuration. Useful for identifying its purpose in dashboards or logs.
     */
    name?: string;
    /**
     * Publicly accessible URL that will receive event POST requests from this webhook.
     */
    url?: string;
    /**
     * Indicates whether the webhook is currently enabled. If false, events will not be sent.
     */
    enabled?: boolean;
    /**
     * List of event types (e.g., 'payment.created') that will trigger this webhook.
     */
    events?: Array<string> | null;
    /**
     * The release identifier of the API expected by this webhook. Ensures the webhook receives the latest object schema for a given release cycle.
     */
    apiRelease?: Webhook.apiRelease;
    /**
     * Method used to verify the integrity of incoming webhook requests.
     */
    verificationMethod?: ({
        /**
         * Indicates the use of HMAC (HS256) as the signature verification method.
         */
        type: Webhook.type;
        /**
         * The shared secret used to compute and verify the HMAC signature.
         */
        secret: string;
    } | {
        /**
         * Indicates the use of ECDSA (ES256) as the signature verification method.
         */
        type: Webhook.type;
        /**
         * The ECDSA public key used to verify the webhook signature. It is a a PEM-encoded key on the NIST P-256 (prime256v1 / secp256r1) curve.
         */
        readonly publicKey?: string;
    } | {
        /**
         * The type of verification method in use. Either 'HS256' for HMAC or 'ES256' for ECDSA.
         */
        type: Webhook.type;
    }) | null;
    /**
     * Optional HTTP headers to include in webhook requests. Useful for passing authentication or context info.
     */
    headers?: Record<string, string> | null;
    /**
     * Email addresses to notify when delivery to this webhook repeatedly fails.
     */
    alertEmails?: Array<string> | null;
    /**
     * Timestamp when the webhook was created.
     */
    createTime?: string;
    /**
     * Timestamp when the webhook was last updated.
     */
    updateTime?: string | null;
    /**
     * Custom metadata for storing additional context or labels for this webhook.
     */
    metadata?: Record<string, any> | null;
};
export namespace Webhook {
    /**
     * The release identifier of the API expected by this webhook. Ensures the webhook receives the latest object schema for a given release cycle.
     */
    export enum apiRelease {
        CAPH = 'caph',
        SIRIUSB = 'siriusb',
    }
    /**
     * Indicates the use of HMAC (HS256) as the signature verification method.
     */
    export enum type {
        HS256 = 'HS256',
    }
}

