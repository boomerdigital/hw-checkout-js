import { isPayPalMethod, isPayPalMethodId } from './isPayPalMethod';

describe('isPayPalMethod', () => {
    it('matches PayPal-branded wallets by id', () => {
        ['paypalcommerce', 'paypalcommercecredit', 'paypalcommercevenmo', 'paypalexpress', 'braintreepaypal'].forEach(
            (id) => expect(isPayPalMethodId(id)).toBe(true),
        );
    });

    it('matches methods whose gateway is a PayPal wallet', () => {
        expect(isPayPalMethod({ id: 'sepa', gateway: 'paypalcommercealternativemethods' })).toBe(true);
    });

    it('does not match card processing or other wallets', () => {
        ['paypalcommercecreditcards', 'paypal', 'googlepaypaypalcommerce', 'applepay', 'braintree', undefined].forEach(
            (id) => expect(isPayPalMethodId(id)).toBe(false),
        );

        expect(isPayPalMethod({ id: 'card', gateway: 'stripeupe' })).toBe(false);
    });
});
