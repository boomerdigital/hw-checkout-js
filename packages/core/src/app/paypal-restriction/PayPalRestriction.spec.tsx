import { Cart, CheckoutSelectors, CheckoutService, PaymentMethod } from '@bigcommerce/checkout-sdk';
import { act, render, screen } from '@testing-library/react';
import React, { FunctionComponent } from 'react';

import { getCart } from '../cart/carts.mock';

import { fetchPayPalRestrictedProductIds } from './fetchPayPalRestrictedProductIds';
import {
    getCartProductIds,
    PayPalRestrictionProvider,
    removePayPalMethodIds,
    withPayPalRestriction,
} from './PayPalRestriction';

jest.mock('./fetchPayPalRestrictedProductIds', () => ({
    fetchPayPalRestrictedProductIds: jest.fn(),
}));

const mockFetch = fetchPayPalRestrictedProductIds as jest.MockedFunction<
    typeof fetchPayPalRestrictedProductIds
>;

const method = (id: string, gateway?: string) => ({ id, gateway } as PaymentMethod);

const MethodList: FunctionComponent<{ defaultMethod?: PaymentMethod; methods: PaymentMethod[] }> = ({
    defaultMethod,
    methods,
}) => (
    <div>
        <span data-test="default">{defaultMethod?.id}</span>
        <span data-test="methods">{methods.map(({ id }) => id).join(',')}</span>
    </div>
);

const RestrictedMethodList = withPayPalRestriction(MethodList);

const createCheckoutService = (cart?: Cart) =>
    ({
        subscribe: jest.fn((subscriber: (state: CheckoutSelectors) => void) => {
            subscriber({ data: { getCart: () => cart } } as unknown as CheckoutSelectors);

            return jest.fn();
        }),
    } as unknown as CheckoutService);

const renderWithProvider = (checkoutService: CheckoutService) =>
    render(
        <PayPalRestrictionProvider checkoutService={checkoutService}>
            <RestrictedMethodList
                defaultMethod={method('paypalcommerce')}
                methods={[method('paypalcommerce'), method('braintree'), method('paypalcommercevenmo')]}
            />
        </PayPalRestrictionProvider>,
    );

const shownMethods = () => screen.getByText((_, el) => el?.getAttribute('data-test') === 'methods').textContent;
const shownDefault = () => screen.getByText((_, el) => el?.getAttribute('data-test') === 'default').textContent;

describe('getCartProductIds', () => {
    it('returns unique sorted product ids from physical and digital items', () => {
        const cart = getCart();

        expect(getCartProductIds(cart)).toEqual(
            Array.from(
                new Set([...cart.lineItems.physicalItems, ...cart.lineItems.digitalItems].map(({ productId }) => productId)),
            ).sort((a, b) => a - b),
        );
    });

    it('returns undefined before the cart has loaded', () => {
        expect(getCartProductIds(undefined)).toBeUndefined();
    });
});

describe('removePayPalMethodIds', () => {
    it('removes PayPal wallets only when hidden', () => {
        const ids = ['paypalcommerce', 'applepay', 'braintreepaypal', 'paypalcommercevenmo'];

        expect(removePayPalMethodIds(ids, true)).toEqual(['applepay']);
        expect(removePayPalMethodIds(ids, false)).toEqual(ids);
    });
});

describe('PayPalRestrictionProvider + withPayPalRestriction', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('hides PayPal while the lookup is pending', () => {
        mockFetch.mockReturnValue(new Promise(() => undefined));

        renderWithProvider(createCheckoutService(getCart()));

        expect(shownMethods()).toBe('braintree');
        expect(shownDefault()).toBe('braintree');
    });

    it('shows PayPal when no cart product is flagged', async () => {
        mockFetch.mockResolvedValue([]);

        renderWithProvider(createCheckoutService(getCart()));
        await act(() => Promise.resolve());

        expect(shownMethods()).toBe('paypalcommerce,braintree,paypalcommercevenmo');
        expect(shownDefault()).toBe('paypalcommerce');
    });

    it('hides PayPal when a cart product is flagged', async () => {
        mockFetch.mockResolvedValue([103]);

        renderWithProvider(createCheckoutService(getCart()));
        await act(() => Promise.resolve());

        expect(shownMethods()).toBe('braintree');
    });

    it('hides PayPal when the lookup fails', async () => {
        mockFetch.mockRejectedValue(new Error('network'));

        renderWithProvider(createCheckoutService(getCart()));
        await act(() => Promise.resolve());

        expect(shownMethods()).toBe('braintree');
    });

    it('leaves methods untouched outside the provider', () => {
        render(<RestrictedMethodList methods={[method('paypalcommerce')]} />);

        expect(shownMethods()).toBe('paypalcommerce');
    });
});
