import { Cart, CheckoutSelectors, CheckoutService, PaymentMethod } from '@bigcommerce/checkout-sdk';
import React, {
    ComponentType,
    createContext,
    FunctionComponent,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { fetchPayPalRestrictedProductIds } from './fetchPayPalRestrictedProductIds';
import { isPayPalMethod, isPayPalMethodId } from './isPayPalMethod';

// pending: lookup not finished yet. PayPal stays hidden until we know the cart is allowed,
// and also if the lookup fails, so a flagged product can never be paid with PayPal by accident.
export type PayPalRestrictionStatus = 'pending' | 'allowed' | 'restricted';

// Outside the provider (unit tests of individual components) nothing is hidden.
const PayPalRestrictionContext = createContext<PayPalRestrictionStatus>('allowed');

export const getCartProductIds = (cart?: Cart): number[] | undefined => {
    if (!cart) {
        return undefined;
    }

    const { physicalItems, digitalItems } = cart.lineItems;
    const ids = [...physicalItems, ...digitalItems].map(({ productId }) => productId);

    return Array.from(new Set(ids)).sort((a, b) => a - b);
};

const getCartProductIdsKey = ({ data }: CheckoutSelectors): string | undefined =>
    getCartProductIds(data.getCart())?.join(',');

interface PayPalRestrictionProviderProps {
    checkoutService: CheckoutService;
    children?: ReactNode;
}

export const PayPalRestrictionProvider: FunctionComponent<PayPalRestrictionProviderProps> = ({
    checkoutService,
    children,
}) => {
    const [status, setStatus] = useState<PayPalRestrictionStatus>('pending');

    useEffect(() => {
        let latestRequest = 0;

        // Re-runs only when the set of products in the cart changes.
        return checkoutService.subscribe(({ data }) => {
            const productIds = getCartProductIds(data.getCart());

            if (!productIds) {
                return;
            }

            const request = ++latestRequest;

            setStatus('pending');

            fetchPayPalRestrictedProductIds(productIds)
                .then((restrictedIds) => {
                    if (request === latestRequest) {
                        setStatus(restrictedIds.length > 0 ? 'restricted' : 'allowed');
                    }
                })
                .catch((error) => {
                    // eslint-disable-next-line no-console
                    console.error(error);

                    if (request === latestRequest) {
                        setStatus('restricted');
                    }
                });
        }, getCartProductIdsKey);
    }, [checkoutService]);

    return (
        <PayPalRestrictionContext.Provider value={status}>
            {children}
        </PayPalRestrictionContext.Provider>
    );
};

export const useIsPayPalHidden = (): boolean =>
    useContext(PayPalRestrictionContext) !== 'allowed';

export const removePayPalMethodIds = (methodIds: string[], isPayPalHidden: boolean): string[] =>
    isPayPalHidden ? methodIds.filter((methodId) => !isPayPalMethodId(methodId)) : methodIds;

interface PaymentMethodsProps {
    defaultMethod?: PaymentMethod;
    methods: PaymentMethod[];
}

// Removes PayPal from the payment step's method list (and default selection) when hidden.
export function withPayPalRestriction<TProps extends PaymentMethodsProps>(
    OriginalComponent: ComponentType<TProps>,
): FunctionComponent<TProps> {
    const WrappedComponent: FunctionComponent<TProps> = (props) => {
        const isPayPalHidden = useIsPayPalHidden();
        const { defaultMethod, methods } = props;

        const allowedMethods = useMemo(
            () => (isPayPalHidden ? methods.filter((method) => !isPayPalMethod(method)) : methods),
            [isPayPalHidden, methods],
        );

        const allowedDefaultMethod =
            isPayPalHidden && defaultMethod && isPayPalMethod(defaultMethod)
                ? allowedMethods[0]
                : defaultMethod;

        return (
            <OriginalComponent
                {...props}
                defaultMethod={allowedDefaultMethod}
                methods={allowedMethods}
            />
        );
    };

    return WrappedComponent;
}
