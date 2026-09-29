import {
    fetchPayPalRestrictedProductIds,
    isRestrictionField,
} from './fetchPayPalRestrictedProductIds';

const productNode = (entityId: number, fields: Array<{ name: string; value: string }>) => ({
    node: {
        entityId,
        customFields: { edges: fields.map((node) => ({ node })) },
    },
});

const jsonResponse = (body: unknown, ok = true, status = 200) =>
    Promise.resolve({ ok, status, json: () => Promise.resolve(body) } as Response);

describe('isRestrictionField', () => {
    it('matches the flag name case-insensitively with a truthy value', () => {
        expect(isRestrictionField({ name: 'no_paypal', value: 'yes' })).toBe(true);
        expect(isRestrictionField({ name: ' No_PayPal ', value: 'TRUE' })).toBe(true);
        expect(isRestrictionField({ name: 'no_paypal', value: '1' })).toBe(true);
    });

    it('ignores other fields and falsy values', () => {
        expect(isRestrictionField({ name: 'no_paypal', value: 'no' })).toBe(false);
        expect(isRestrictionField({ name: 'no_paypal', value: '' })).toBe(false);
        expect(isRestrictionField({ name: 'color', value: 'yes' })).toBe(false);
    });
});

describe('fetchPayPalRestrictedProductIds', () => {
    it('returns only flagged product ids', async () => {
        const fetchFn = jest.fn(() =>
            jsonResponse({
                data: {
                    site: {
                        products: {
                            edges: [
                                productNode(1, [{ name: 'no_paypal', value: 'yes' }]),
                                productNode(2, [{ name: 'material', value: 'steel' }]),
                                productNode(3, []),
                            ],
                        },
                    },
                },
            }),
        );

        await expect(fetchPayPalRestrictedProductIds([1, 2, 3], 'token', fetchFn)).resolves.toEqual([1]);

        const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];

        expect(url).toBe('/graphql');
        expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token');
        expect(JSON.parse(init.body as string).variables).toEqual({ entityIds: [1, 2, 3], first: 50 });
    });

    it('splits large carts into pages of 50', async () => {
        const fetchFn = jest.fn(() =>
            jsonResponse({ data: { site: { products: { edges: [] } } } }),
        );
        const ids = Array.from({ length: 120 }, (_, i) => i + 1);

        await fetchPayPalRestrictedProductIds(ids, 'token', fetchFn);

        expect(fetchFn).toHaveBeenCalledTimes(3);
    });

    it('skips the request for an empty cart', async () => {
        const fetchFn = jest.fn();

        await expect(fetchPayPalRestrictedProductIds([], undefined, fetchFn)).resolves.toEqual([]);
        expect(fetchFn).not.toHaveBeenCalled();
    });

    it('throws when the token is missing', async () => {
        await expect(fetchPayPalRestrictedProductIds([1], undefined, jest.fn())).rejects.toThrow(
            'token missing',
        );
    });

    it('throws on HTTP and GraphQL errors', async () => {
        await expect(
            fetchPayPalRestrictedProductIds([1], 'token', () => jsonResponse({}, false, 401)),
        ).rejects.toThrow('HTTP 401');

        await expect(
            fetchPayPalRestrictedProductIds([1], 'token', () =>
                jsonResponse({ errors: [{ message: 'bad query' }] }),
            ),
        ).rejects.toThrow('bad query');
    });
});
