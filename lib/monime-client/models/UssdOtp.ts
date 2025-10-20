/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A **USSD OTP** represents a **one-time passcode session** used to authenticate users through a USSD dial flow.
 * It enables secure, **phone-bound verification**, ensuring that the person interacting via USSD is the legitimate account holder.
 *
 * In addition to generating and validating the OTP, the flow may include **user-facing feedback messages** that confirm the process.
 *
 * ---
 *
 */
export type UssdOtp = {
    /**
     * **Unique identifier** for this USSD OTP session.
     */
    id?: string;
    /**
     * **Status** of the OTP session. One of:
     * - pending: Awaiting verification.
     * - verified: OTP was successfully confirmed.
     * - expired: OTP expired before verification.
     */
    status?: UssdOtp.status;
    /**
     * **USSD dial code** that the user should dial (e.g., *715*12345#) to initiate the OTP verification.
     */
    dialCode?: string;
    /**
     * **Authorized phone number** (MSISDN) associated with this OTP. May be masked for privacy.
     */
    authorizedPhoneNumber?: string;
    /**
     * **Message** shown to the user after successful verification, typically rendered on the USSD interface.
     */
    verificationMessage?: string | null;
    /**
     * Timestamp when this OTP session was created.
     */
    createTime?: string;
    /**
     * **Expiration time** after which the OTP becomes invalid.
     */
    expireTime?: string;
    /**
     * **Optional metadata** for attaching additional context or tracking info to this OTP session.
     */
    metadata?: Record<string, any> | null;
};
export namespace UssdOtp {
    /**
     * **Status** of the OTP session. One of:
     * - pending: Awaiting verification.
     * - verified: OTP was successfully confirmed.
     * - expired: OTP expired before verification.
     */
    export enum status {
        PENDING = 'pending',
        VERIFIED = 'verified',
        EXPIRED = 'expired',
    }
}

