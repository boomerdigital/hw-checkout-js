// Payment method / gateway ids where the shopper pays through a PayPal-branded option
// (PayPal, Pay Later, Venmo, PayPal alternative methods).
// Card processing that merely runs on PayPal (paypalcommercecreditcards, Payments Pro,
// Fastlane, Google Pay via PayPal) is intentionally not listed: the shopper never sees PayPal.
export const PAYPAL_METHOD_IDS: string[] = [
    'paypalexpress',
    'paypalcommerce',
    'paypalcommercecredit',
    'paypalcommercevenmo',
    'paypalcommercealternativemethods',
    'braintreepaypal',
    'braintreepaypalcredit',
    'braintreevenmo',
];

export const isPayPalMethodId = (methodId?: string): boolean =>
    !!methodId && PAYPAL_METHOD_IDS.includes(methodId);

export const isPayPalMethod = ({ id, gateway }: { id: string; gateway?: string }): boolean =>
    isPayPalMethodId(id) || isPayPalMethodId(gateway);
