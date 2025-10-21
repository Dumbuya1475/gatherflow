/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CoreresourcesParentOwningObject = {
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

