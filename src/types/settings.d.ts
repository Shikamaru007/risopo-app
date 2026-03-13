export interface BusinessProfile {
    id?: number;
    businessName: string;
    businessEmail?: string;
    businessAddress?: string;
    phone?: string;
    defaultCurrency: string;
    refundPolicy?: string;
    logoId?: string;
}
export interface BankMethod {
    id: string;
    type: 'bank';
    label: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
}
export interface CryptoMethod {
    id: string;
    type: 'crypto';
    label: string;
    network: string;
    walletAddress: string;
}
export interface PaymentLinkMethod {
    id: string;
    type: 'link';
    label: string;
    url: string;
}
export type PaymentMethod = BankMethod | CryptoMethod | PaymentLinkMethod;
export interface FeatureFlag {
    key: string;
    enabled: boolean;
}
export interface AppSettings {
    profile?: BusinessProfile;
    paymentMethods: PaymentMethod[];
    defaultCurrency: string;
    flags?: FeatureFlag[];
    updatedAt?: string;
}
export interface SettingsRecord extends BusinessProfile {
    id?: number;
    paymentMethods?: PaymentMethod[];
}
