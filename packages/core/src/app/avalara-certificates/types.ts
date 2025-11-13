import { Address } from '@bigcommerce/checkout-sdk';
export interface Customer {
    id: number;
    email: string;
    isGuest: boolean;
    fullName: string;
}
export interface CertificateDetail {
    id: number;
    exemptPercentage: number;
    customers: { name: string }[];
    exemptionReason: { name: string };
}
 export interface CertificateFormValues {
    // Business Information
    businessName: string;
    dbaName: string;
    businessAddress: string;
    businessCity: string;
    businessState: string;
    businessZip: string;
    federalTaxId: string;
    contactName: string;
    contactTitle: string;
    contactPhone: string;
    contactEmail: string;
    
    // Certificate Details
    certificateType: string;
    exemptionNumber: string;
    region: string;
    exemptionReason: string;
    effectiveDate: string;
    expirationDate: string;
    
    // Additional Information
    entityUseCode: string;
    businessType: string;
    exemptionDescription: string;
    certificateLabels: OptionType[];
}
export interface OptionType {
    value: string;
    label: string;
}

export interface CreateCertificateProps {
    customer: Customer;
   // certIds: number[];
    shippingAddress: Address;
}