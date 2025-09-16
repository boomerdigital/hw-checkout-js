import axios from 'axios';
import { Address } from '@bigcommerce/checkout-sdk';

// Use environment variable with fallback to PRODUCTION API URL to avoid accidental staging usage
const API_URL = 'https://b7q71nfgm2.execute-api.us-east-2.amazonaws.com/Prod/';
//const API_URL = process.env.API_URL || 'https://b7q71nfgm2.execute-api.us-east-2.amazonaws.com/Prod/';
const API_CLIENT_ID = process.env.API_CLIENT_ID || 'npqb1dowfj7yeh7d1fqwhcod7wqs6al';

export const fetchToken = async (): Promise<string | null> => {
    try {
        const response = await fetch(`/customer/current.jwt?app_client_id=${API_CLIENT_ID}`, {
            method: 'GET',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        });

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Error fetching token:', error);
        return null;
    }
};
export const getHeaders = (token: string) => {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Current-Customer': token,
    };
};

export const fetchCertificateDetails = async (certId: number) => {
    try {
        const token = await fetchToken();
        if (!token) {
            throw new Error('Token not available');
        }

        const headers = getHeaders(token);
        const response = await axios.get(`${API_URL}query/${certId}`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error fetching certificate details:', error);
        throw error;
    }
};
export const validateTaxesWithAvalara = async (taxRequest: any) => {
    try {
        const token = await fetchToken();
        if (!token) {
            throw new Error('Token not available');
        }
        const headers = getHeaders(token);
        const response = await axios.post(`${API_URL}createTransaction`, taxRequest, { headers });
        return response.data;
    } catch (error) {
        console.error('Error validating with avalara:', error);
        throw error;
    }
};
export const createCertificate = async (formData: any) => {
    try {
        const token = await fetchToken();
        if (!token) {
            throw new Error('Token not available');
        }
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Current-Customer': token,
        };
        const response = await axios.post(`${API_URL}create`, formData, { headers });

        if (response.status !== 200) {
            throw new Error(`Error submitting the form: ${response.statusText}`);
        }
        return response.data;
    } catch (error) {
        console.error('Error creating certificate:', error);
        throw error;
    }
};

export const getFormData = (formValues: any, customer: any, _shippingAddress: Address) => {
    const formData = {
        signedDate: formValues.effectiveDate,
        expirationDate: formValues.expirationDate || '9999-12-31',
        exposureZone: { name: formValues.region },
        exemptionReason: { name: formValues.exemptionReason },
        exemptionNumber: formValues.exemptionNumber,
        valid: true,
        isSingleCertificate: formValues.certificateType === 'single',
        CertificateCustomFields: {
            1: formValues.entityUseCode,
            2: formValues.exemptionDescription,
            3: formValues.businessType,
            4: formValues.dbaName,
            5: formValues.contactTitle,
            6: formValues.federalTaxId,
        },
        customers: [
            {
                customerCode: customer.id,
                name: formValues.businessName,
                line1: formValues.businessAddress,
                city: formValues.businessCity,
                postalCode: formValues.businessZip,
                phoneNumber: formValues.contactPhone,
                emailAddress: formValues.contactEmail,
                country: 'US',
                region: formValues.businessState,
                // Additional contact information
                contactName: formValues.contactName,
                federalTaxId: formValues.federalTaxId,
            },
        ],
    };

    return formData;
};
