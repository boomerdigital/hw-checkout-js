import React, { useState } from 'react';
import { Modal, ModalHeader } from '../ui/modal';
import { withCheckout } from '../checkout';
import { CheckoutContextProps } from '@bigcommerce/checkout/payment-integration-api';
import { createCertificate, getFormData } from './services/LambdaService';
import CertExpressForm from './CertExpressForm';
import { CreateCertificateProps, CertificateFormValues } from './types';

const CreateCertificateWithCertExpress: React.FC<CreateCertificateProps & { checkoutService: any }> = ({ 
    customer, 
    shippingAddress, 
    checkoutService 
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onAfterOpen = () => {
        console.log('CertExpress modal opened');
    };

    const onRequestClose = () => {
        setIsOpen(false);
        setShowSuccess(false);
        setError(null);
    };

    const showModal = () => {
        setIsOpen(true);
    };

    const handleSubmit = async (values: CertificateFormValues) => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            setError(null);

            console.log('Submitting CertExpress certificate:', values);

            // Convert CertExpress data to our backend format
            const formData = getFormData(values, customer, shippingAddress) as any;

            // Add CertExpress specific data
            if (values.certExpressId) {
                formData.certExpressId = values.certExpressId;
                formData.source = 'certexpress';
            }

            const result = await createCertificate(formData);
            
            if (result) {
                setShowSuccess(true);
                
                // Refresh checkout data
                setTimeout(async () => {
                    try {
                        const response = await checkoutService.loadCheckout();
                        const shippingAddress = response.data.getShippingAddress();
                        
                        if (shippingAddress) {
                            await checkoutService.updateShippingAddress(shippingAddress);
                        }

                        // Update checkout with certificate data
                        const checkoutData = await checkoutService.loadCheckout();
                        const updateData = {
                            cart: checkoutData.data.getCart(),
                            shippingAddress: checkoutData.data.getShippingAddress(),
                            billingAddress: checkoutData.data.getBillingAddress(),
                            customer: checkoutData.data.getCustomer(),
                            customerMessage: "",
                        };

                        await checkoutService.updateCheckout(updateData);
                        console.log('Checkout updated successfully after certificate creation');
                        
                    } catch (updateError) {
                        console.error('Error updating checkout after certificate creation:', updateError);
                    }

                    // Close modal after successful submission
                    setTimeout(() => {
                        onRequestClose();
                    }, 2000);
                }, 1000);
            }
        } catch (error) {
            console.error('Error creating certificate:', error);
            setError('Failed to create certificate. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get environment configuration
    const getEnvironmentConfig = () => {
        // This should come from your checkout configuration
        return {
            environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
            companyId: process.env.AVALARA_COMPANY_ID || '',
            companyCode: process.env.AVALARA_COMPANY_CODE || '',
        };
    };

    const config = getEnvironmentConfig();

    return (
        <>
            <button
                className="button button--primary"
                type="button"
                onClick={showModal}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Creating Certificate...' : 'Create Tax Exemption Certificate'}
            </button>

            <Modal 
                isOpen={isOpen} 
                onAfterOpen={onAfterOpen} 
                onRequestClose={onRequestClose}
                shouldCloseOnOverlayClick={false}
            >
                <ModalHeader>
                    <h2>Create Tax Exemption Certificate</h2>
                    <button 
                        type="button" 
                        className="modal-close-button"
                        onClick={onRequestClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </ModalHeader>

                <div className="modal-body">
                    {showSuccess ? (
                        <div className="certificate-success">
                            <div className="success-icon">✓</div>
                            <h3>Certificate Created Successfully!</h3>
                            <p>Your tax exemption certificate has been created and will be applied to your order.</p>
                            <p>This modal will close automatically in a few seconds.</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="alert alert-error">
                                    <p>{error}</p>
                                </div>
                            )}
                            
                            <CertExpressForm
                                onSubmit={handleSubmit}
                                customerId={customer.id?.toString()}
                                customerEmail={customer.email}
                                companyId={config.companyId}
                                companyCode={config.companyCode}
                                environment={config.environment as 'sandbox' | 'production'}
                            />
                        </>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default withCheckout((props: CheckoutContextProps) => props)(CreateCertificateWithCertExpress);