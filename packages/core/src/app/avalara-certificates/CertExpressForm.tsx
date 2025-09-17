import React, { useEffect, useRef, useState } from 'react';
import './certExpressForm.scss';
import { CertificateFormValues } from './types';

interface CertExpressFormProps {
    onSubmit: (values: CertificateFormValues) => void;
    customerId?: string;
    customerEmail?: string;
    companyId?: string;
    companyCode?: string;
    environment?: 'sandbox' | 'production';
}

// Define global types for CertExpress SDK
declare global {
    interface Window {
        GenCert?: {
            init: (config: any) => void;
        };
    }
}

const CertExpressForm: React.FC<CertExpressFormProps> = ({
    onSubmit,
    customerId = '',
    customerEmail = '',
    companyId = '',
    companyCode = '',
    environment = 'sandbox'
}) => {
    const widgetContainerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
        loadCertExpressSDK();
    }, []);

    const loadCertExpressSDK = () => {
        // Check if SDK is already loaded
        if (window.GenCert) {
            initializeCertExpressWidget();
            return;
        }

        // Load the SDK using environment variable
        const script = document.createElement('script');
        script.src = process.env.CERTEXPRESS_SDK_URL || 
            (environment === 'sandbox' 
                ? 'https://certexpress-sandbox.avalara.com/js/gencert.min.js'
                : 'https://certexpress.avalara.com/js/gencert.min.js');
        
        script.onload = () => {
            initializeCertExpressWidget();
        };
        
        script.onerror = () => {
            console.error('Failed to load CertExpress SDK');
            handleError('Failed to load certificate widget. Please try the alternative options below.');
        };
        
        document.head.appendChild(script);
    };

    const initializeCertExpressWidget = () => {
        try {
            if (!window.GenCert || !widgetContainerRef.current) {
                throw new Error('CertExpress SDK or container not available');
            }

            const config = {
                containerId: widgetContainerRef.current.id,
                
                // Environment configuration
                environment: environment,
                
                // Customer information
                customerId: customerId,
                customerEmail: customerEmail,
                
                // Company configuration
                companyId: companyId,
                companyCode: companyCode,
                
                // Styling
                theme: {
                    primaryColor: '#333333',
                    accentColor: '#0066cc',
                    borderRadius: '4px',
                    fontFamily: 'Montserrat, sans-serif'
                },
                
                // Event handlers
                onSuccess: handleCertificateSuccess,
                onError: handleCertificateError,
                onLoad: handleWidgetLoad
            };

            window.GenCert.init(config);
            console.log('CertExpress widget initialized successfully');

        } catch (error) {
            console.error('Failed to initialize CertExpress widget:', error);
            handleError('Failed to initialize certificate widget.');
        }
    };

    const handleCertificateSuccess = (certificateData: any) => {
        console.log('Certificate created successfully:', certificateData);
        
        try {
            // Convert CertExpress data to our expected format
            const formValues: CertificateFormValues = {
                // Business Information
                businessName: certificateData.businessName || '',
                dbaName: certificateData.dbaName || '',
                businessAddress: certificateData.businessAddress || '',
                businessCity: certificateData.businessCity || '',
                businessState: certificateData.businessState || '',
                businessZip: certificateData.businessZip || '',
                federalTaxId: certificateData.federalTaxId || '',
                
                // Contact Information
                contactName: certificateData.contactName || '',
                contactTitle: certificateData.contactTitle || '',
                contactPhone: certificateData.contactPhone || '',
                contactEmail: certificateData.contactEmail || '',
                
                // Certificate Details
                certificateType: certificateData.certificateType || 'blanket',
                exemptionNumber: certificateData.exemptionNumber || '',
                region: certificateData.region || '',
                exemptionReason: certificateData.exemptionReason || '',
                effectiveDate: certificateData.effectiveDate || new Date().toISOString().split('T')[0],
                expirationDate: certificateData.expirationDate || '',
                
                // Additional Information
                entityUseCode: certificateData.entityUseCode || '',
                businessType: certificateData.businessType || '',
                exemptionDescription: certificateData.exemptionDescription || '',
                certificateLabels: certificateData.labels || [{ value: '23', label: 'ECOMMERCE UPLOAD' }], // ECOMMERCE UPLOAD
                
                // CertExpress specific data
                certExpressId: certificateData.id,
                certExpressData: certificateData
            };

            // Call the parent's onSubmit handler
            onSubmit(formValues);
            
        } catch (error) {
            console.error('Error processing certificate data:', error);
            handleError('Certificate created but there was an issue processing the data.');
        }
    };

    const handleCertificateError = (error: any) => {
        console.error('Certificate creation failed:', error);
        handleError('Failed to create certificate. Please try the alternative options below.');
    };

    const handleWidgetLoad = () => {
        setIsLoading(false);
        console.log('CertExpress widget loaded successfully');
    };

    const handleError = (errorMessage: string) => {
        setError(errorMessage);
        setIsLoading(false);
        setShowFallback(true);
    };

    const generateContainerId = () => {
        return `certexpress-widget-${Math.random().toString(36).substr(2, 9)}`;
    };

    return (
        <div className="certexpress-form-container">
            <div className="certexpress-header">
                <h3>Tax Exemption Certificate</h3>
                <p>Create your tax exemption certificate using Avalara's CertExpress widget for seamless certificate management.</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    <p>{error}</p>
                </div>
            )}

            {/* CertExpress Widget Container */}
            <div 
                ref={widgetContainerRef}
                id={generateContainerId()}
                className="certexpress-widget-container"
            >
                {isLoading && (
                    <div className="certexpress-loading">
                        <div className="spinner"></div>
                        <p>Loading certificate form...</p>
                    </div>
                )}
            </div>

            {/* Fallback options */}
            {showFallback && (
                <div className="certexpress-fallback">
                    <h4>Alternative Certificate Submission</h4>
                    <p>If you're unable to complete the certificate form above, you can:</p>
                    <ul>
                        <li>
                            Email your existing certificate to{' '}
                            <a href="mailto:certificates@handcuffwarehouse.com">
                                certificates@handcuffwarehouse.com
                            </a>
                        </li>
                        <li>
                            Call us at{' '}
                            <a href="tel:1-800-XXX-XXXX">1-800-XXX-XXXX</a> for assistance
                        </li>
                        <li>
                            <button 
                                type="button" 
                                className="button button--secondary"
                                onClick={() => window.location.reload()}
                            >
                                Reload Page
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CertExpressForm;