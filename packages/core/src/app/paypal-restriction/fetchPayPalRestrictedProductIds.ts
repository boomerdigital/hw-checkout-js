// Products are flagged in the BigCommerce control panel with a custom field:
//   name: no_paypal    value: yes
// The name is matched case-insensitively; the value may be yes / true / 1.
export const RESTRICTION_FIELD_NAME = 'no_paypal';

const TRUTHY_VALUES = ['yes', 'true', '1'];

// Storefront GraphQL caps `products(entityIds:)` at 50 results per request.
const PAGE_SIZE = 50;

const QUERY = `
    query HwPayPalRestrictedProducts($entityIds: [Int!], $first: Int) {
        site {
            products(entityIds: $entityIds, first: $first) {
                edges {
                    node {
                        entityId
                        customFields(first: 50) {
                            edges { node { name value } }
                        }
                    }
                }
            }
        }
    }
`;

interface CustomField {
    name: string;
    value: string;
}

interface ProductsResponse {
    data?: {
        site: {
            products: {
                edges: Array<{
                    node: {
                        entityId: number;
                        customFields: { edges: Array<{ node: CustomField }> };
                    };
                }>;
            };
        };
    };
    errors?: Array<{ message: string }>;
}

export const isRestrictionField = ({ name, value }: CustomField): boolean =>
    name.trim().toLowerCase() === RESTRICTION_FIELD_NAME &&
    TRUTHY_VALUES.includes(value.trim().toLowerCase());

// Exposed by templates/pages/checkout.html in hw-stencil-theme.
export const getStorefrontToken = (): string | undefined =>
    (window as Window & { HW_STOREFRONT_TOKEN?: string }).HW_STOREFRONT_TOKEN || undefined;

const fetchPage = async (
    entityIds: number[],
    token: string,
    fetchFn: typeof fetch,
): Promise<number[]> => {
    const response = await fetchFn('/graphql', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: QUERY, variables: { entityIds, first: PAGE_SIZE } }),
    });

    if (!response.ok) {
        throw new Error(`PayPal restriction lookup failed: HTTP ${response.status}`);
    }

    const { data, errors }: ProductsResponse = await response.json();

    if (errors?.length || !data) {
        throw new Error(`PayPal restriction lookup failed: ${errors?.[0]?.message ?? 'no data'}`);
    }

    return data.site.products.edges
        .filter(({ node }) => node.customFields.edges.some((edge) => isRestrictionField(edge.node)))
        .map(({ node }) => node.entityId);
};

/**
 * Returns the ids (from `productIds`) of products flagged as not payable with PayPal.
 * Throws when the lookup cannot be completed, so callers can fail closed.
 */
export const fetchPayPalRestrictedProductIds = async (
    productIds: number[],
    token: string | undefined = getStorefrontToken(),
    fetchFn: typeof fetch = (...args) => fetch(...args),
): Promise<number[]> => {
    if (productIds.length === 0) {
        return [];
    }

    if (!token) {
        throw new Error('PayPal restriction lookup failed: storefront API token missing');
    }

    const pages: number[][] = [];

    for (let i = 0; i < productIds.length; i += PAGE_SIZE) {
        pages.push(productIds.slice(i, i + PAGE_SIZE));
    }

    const results = await Promise.all(pages.map((page) => fetchPage(page, token, fetchFn)));

    return ([] as number[]).concat(...results);
};
