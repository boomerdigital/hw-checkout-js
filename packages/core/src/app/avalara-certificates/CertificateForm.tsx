import React, { useEffect, useState } from 'react';
import { FormikProps, withFormik } from 'formik';
import * as Yup from 'yup';
import stateAbbreviations from './stateAbbreviations';
import stateReasons from './stateReasons';
import reasonsMapping from './reasonsMapping';
import Select from 'react-select';
import './certificateForm.scss';
import { CertificateFormValues } from './types';

interface CertificateFormProps {
    initialRegion?: string;
    onSubmit: (values: CertificateFormValues) => void;
}
interface OptionType {
    value: string;
    label: string;
}
const labelOptions: OptionType[] =[
    { value: '19', label: 'AFFIDAVIT' },
    { value: '29', label: 'AUTO-VALIDATION NO ISSUES FOUND' },
    { value: '22', label: 'CERTEXPRESS IMPORT' },
    { value: '26', label: 'CERTEXPRESS PUBLIC UPLOAD' },
];

const CertificateForm = ({
    values,
    touched,
    errors,
    handleChange,
    handleSubmit,
    setFieldValue,
    isSubmitting,
}: FormikProps<CertificateFormValues>) => {
    const [reasons, setReasons] = useState<string[]>([]);
    useEffect(() => {
        if (values.region) {
            const selectedState: keyof typeof stateReasons =  values.region;
            const reasonsForState = stateReasons[selectedState] || [];
            setReasons(reasonsForState);
            setFieldValue('exemptionReason', ''); // Resetear el select de razones cuando cambie la región
        }
    }, [values.region, setFieldValue]);

    return (
        <form className="form certificate-form" onSubmit={handleSubmit}>
            <fieldset className="form-fieldset">
                <div className="form-body">
                    <h3 className="form-section-title">Business Information</h3>
                    
                    {/* Business Name and DBA */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="businessName">Business Name</label>
                            <span className="required-label">Required</span>
                            <input
                                type="text"
                                name="businessName"
                                id="businessName"
                                className="form-input"
                                value={values.businessName}
                                onChange={handleChange}
                            />
                            {touched.businessName && errors.businessName && (
                                <div className="error">{errors.businessName}</div>
                            )}
                        </div>
                        <div className="form-field">
                            <label htmlFor="dbaName">DBA Name (if different)</label>
                            <span className="optional-label">Optional</span>
                            <input
                                type="text"
                                name="dbaName"
                                id="dbaName"
                                className="form-input"
                                value={values.dbaName}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Business Address */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="businessAddress">Business Address</label>
                            <span className="required-label">Required</span>
                            <input
                                type="text"
                                name="businessAddress"
                                id="businessAddress"
                                className="form-input"
                                placeholder="Street Address"
                                value={values.businessAddress}
                                onChange={handleChange}
                            />
                            {touched.businessAddress && errors.businessAddress && (
                                <div className="error">{errors.businessAddress}</div>
                            )}
                        </div>
                    </div>

                    {/* City and State */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="businessCity">City</label>
                            <span className="required-label">Required</span>
                            <input
                                type="text"
                                name="businessCity"
                                id="businessCity"
                                className="form-input"
                                value={values.businessCity}
                                onChange={handleChange}
                            />
                            {touched.businessCity && errors.businessCity && (
                                <div className="error">{errors.businessCity}</div>
                            )}
                        </div>
                        <div className="form-field">
                            <label htmlFor="businessState">State/Province</label>
                            <span className="required-label">Required</span>
                            <input
                                type="text"
                                name="businessState"
                                id="businessState"
                                className="form-input"
                                value={values.businessState}
                                onChange={handleChange}
                            />
                            {touched.businessState && errors.businessState && (
                                <div className="error">{errors.businessState}</div>
                            )}
                        </div>
                    </div>

                    {/* ZIP and Tax ID */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="businessZip">ZIP/Postal Code</label>
                            <span className="required-label">Required</span>
                            <input
                                type="text"
                                name="businessZip"
                                id="businessZip"
                                className="form-input"
                                value={values.businessZip}
                                onChange={handleChange}
                            />
                            {touched.businessZip && errors.businessZip && (
                                <div className="error">{errors.businessZip}</div>
                            )}
                        </div>
                        <div className="form-field">
                            <label htmlFor="federalTaxId">Federal Tax ID (EIN)</label>
                            <span className="required-label">Required</span>
                            <input
                                type="text"
                                name="federalTaxId"
                                id="federalTaxId"
                                className="form-input"
                                placeholder="XX-XXXXXXX"
                                value={values.federalTaxId}
                                onChange={handleChange}
                            />
                            {touched.federalTaxId && errors.federalTaxId && (
                                <div className="error">{errors.federalTaxId}</div>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="contactName">Contact Person</label>
                            <span className="required-label">Required</span>
                            <input
                                type="text"
                                name="contactName"
                                id="contactName"
                                className="form-input"
                                value={values.contactName}
                                onChange={handleChange}
                            />
                            {touched.contactName && errors.contactName && (
                                <div className="error">{errors.contactName}</div>
                            )}
                        </div>
                        <div className="form-field">
                            <label htmlFor="contactTitle">Title</label>
                            <span className="optional-label">Optional</span>
                            <input
                                type="text"
                                name="contactTitle"
                                id="contactTitle"
                                className="form-input"
                                value={values.contactTitle}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Phone and Email */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="contactPhone">Phone Number</label>
                            <span className="required-label">Required</span>
                            <input
                                type="tel"
                                name="contactPhone"
                                id="contactPhone"
                                className="form-input"
                                value={values.contactPhone}
                                onChange={handleChange}
                            />
                            {touched.contactPhone && errors.contactPhone && (
                                <div className="error">{errors.contactPhone}</div>
                            )}
                        </div>
                        <div className="form-field">
                            <label htmlFor="contactEmail">Email Address</label>
                            <span className="required-label">Required</span>
                            <input
                                type="email"
                                name="contactEmail"
                                id="contactEmail"
                                className="form-input"
                                value={values.contactEmail}
                                onChange={handleChange}
                            />
                            {touched.contactEmail && errors.contactEmail && (
                                <div className="error">{errors.contactEmail}</div>
                            )}
                        </div>
                    </div>

                    <h3 className="form-section-title">Certificate Details</h3>

                    {/* Certificate Type and Exemption Number */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="certificateType">Certificate Type</label>
                            <span className="required-label">Required</span>
                            <select
                                name="certificateType"
                                id="certificateType"
                                className="form-input"
                                value={values.certificateType}
                                onChange={handleChange}
                            >
                                <option value="">Select Certificate Type</option>
                                <option value="blanket">Blanket Certificate</option>
                                <option value="single">Single Purchase Certificate</option>
                            </select>
                            {touched.certificateType && errors.certificateType && (
                                <div className="error">{errors.certificateType}</div>
                            )}
                        </div>
                        <div className="form-field">
                            <label htmlFor="exemptionNumber">Exemption Certificate Number</label>
                            <span className="optional-label">Optional</span>
                            <input
                                type="text"
                                name="exemptionNumber"
                                id="exemptionNumber"
                                className="form-input"
                                value={values.exemptionNumber}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Region and Exemption Reason */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="region">Regions Covered by Certificate</label>
                            <span className="required-label">Required</span>
                            <select
                                name="region"
                                id="region"
                                className="form-input"
                                value={values.region}
                                onChange={handleChange}
                            >
                                <option value="">Select a Region</option>
                                {Object.keys(stateAbbreviations).map((state) => (
                                    <option key={state} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
                            {touched.region && errors.region && <div className="error">{errors.region}</div>}
                        </div>
                        <div className="form-field">
                            <label htmlFor="exemptionReason">Reason for Exemption</label>
                            <span className="required-label">Required</span>
                            <select
                                name="exemptionReason"
                                id="exemptionReason"
                                className="form-input"
                                value={values.exemptionReason}
                                onChange={handleChange}
                            >
                                <option value="">Select a Reason</option>
                                {reasons.map((reason) => (
                                    <option key={reason} value={reason}>
                                        {reasonsMapping[reason] || reason}
                                    </option>
                                ))}
                            </select>
                            {touched.exemptionReason && errors.exemptionReason && (
                                <div className="error">{errors.exemptionReason}</div>
                            )}
                        </div>
                    </div>

                    {/* Effective and Expiration Dates */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="effectiveDate">Effective Date</label>
                            <span className="required-label">Required</span>
                            <input
                                type="date"
                                name="effectiveDate"
                                id="effectiveDate"
                                className="form-input"
                                value={values.effectiveDate}
                                onChange={handleChange}
                            />
                            {touched.effectiveDate && errors.effectiveDate && (
                                <div className="error">{errors.effectiveDate}</div>
                            )}
                        </div>
                        <div className="form-field">
                            <label htmlFor="expirationDate">Expiration Date</label>
                            <span className="optional-label">Optional</span>
                            <input
                                type="date"
                                name="expirationDate"
                                id="expirationDate"
                                className="form-input"
                                value={values.expirationDate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <h3 className="form-section-title">Additional Information</h3>

                    {/* Entity Use Code and Business Type */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="entityUseCode">Entity Use Code</label>
                            <span className="optional-label">Optional</span>
                            <input
                                type="text"
                                name="entityUseCode"
                                id="entityUseCode"
                                className="form-input"
                                value={values.entityUseCode}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="businessType">Business Type</label>
                            <span className="optional-label">Optional</span>
                            <select
                                name="businessType"
                                id="businessType"
                                className="form-input"
                                value={values.businessType}
                                onChange={handleChange}
                            >
                                <option value="">Select Business Type</option>
                                <option value="retailer">Retailer</option>
                                <option value="manufacturer">Manufacturer</option>
                                <option value="wholesaler">Wholesaler</option>
                                <option value="government">Government Entity</option>
                                <option value="nonprofit">Non-Profit Organization</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Exemption Description */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="exemptionDescription">Exemption Description</label>
                            <span className="optional-label">Optional</span>
                            <textarea
                                name="exemptionDescription"
                                id="exemptionDescription"
                                className="form-input"
                                rows={3}
                                placeholder="Provide additional details about your exemption..."
                                value={values.exemptionDescription}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Certificate Labels */}
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="certificateLabels">Certificate Labels</label>
                            <span className="optional-label">Optional</span>
                            <Select
                                id="certificateLabels"
                                name="certificateLabels"
                                options={labelOptions}
                                isMulti
                                value={values.certificateLabels}
                                onChange={(selected) => setFieldValue('certificateLabels', selected)}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="button button--primary" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                Creating Certificate...
                                <span className="spinner"></span>
                            </>
                        ) : (
                            'Create Certificate'
                        )}
                    </button>
                </div>

            </fieldset>
        </form>
    );
};

const EnhancedCertificateForm = withFormik<CertificateFormProps, CertificateFormValues>({
    mapPropsToValues: (props) => ({
        // Business Information
        businessName: '',
        dbaName: '',
        businessAddress: '',
        businessCity: '',
        businessState: '',
        businessZip: '',
        federalTaxId: '',
        contactName: '',
        contactTitle: '',
        contactPhone: '',
        contactEmail: '',
        
        // Certificate Details
        certificateType: '',
        exemptionNumber: '',
        region: props.initialRegion || '',
        exemptionReason: '',
        effectiveDate: '',
        expirationDate: '',
        
        // Additional Information
        entityUseCode: '',
        businessType: '',
        exemptionDescription: '',
        certificateLabels: [],
    }),

    validationSchema: Yup.object().shape({
        // Business Information - Required
        businessName: Yup.string().required('Business name is required'),
        businessAddress: Yup.string().required('Business address is required'),
        businessCity: Yup.string().required('City is required'),
        businessState: Yup.string().required('State/Province is required'),
        businessZip: Yup.string().required('ZIP/Postal code is required'),
        federalTaxId: Yup.string().required('Federal Tax ID is required'),
        contactName: Yup.string().required('Contact name is required'),
        contactPhone: Yup.string().required('Phone number is required'),
        contactEmail: Yup.string().email('Invalid email format').required('Email is required'),
        
        // Certificate Details - Required
        certificateType: Yup.string().required('Certificate type is required'),
        region: Yup.string().required('Region is required'),
        exemptionReason: Yup.string().required('Reason for exemption is required'),
        effectiveDate: Yup.date().required('Effective date is required').nullable(),
        
        // Optional fields
        expirationDate: Yup.date().nullable(),
        exemptionNumber: Yup.string(),
        entityUseCode: Yup.string(),
        businessType: Yup.string(),
        exemptionDescription: Yup.string(),
    }),

    handleSubmit: (values, { props }) => {
        props.onSubmit(values);
    },
})(CertificateForm);

export default EnhancedCertificateForm;
