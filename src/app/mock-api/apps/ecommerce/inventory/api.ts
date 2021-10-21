import { Injectable } from '@angular/core';
import { assign, cloneDeep } from 'lodash-es';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { brands as brandsData, categories as categoriesData, products as productsData, variants as variantsData, vendors as vendorsData } from 'app/mock-api/apps/ecommerce/inventory/data';

@Injectable({
    providedIn: 'root'
})
export class ECommerceInventoryMockApi
{
    private _categories: any[] = categoriesData;
    // private _brands: any[] = brandsData;
    private _products: any[] = productsData;
    private _variants: any[] = variantsData;
    private _vendors: any[] = vendorsData;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService)
    {
        // Register Mock API handlers
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void
    {
        // -----------------------------------------------------------------------------------------------------
        // @ Categories - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/apps/ecommerce/inventory/categories')
            .reply(() => [200, cloneDeep(this._categories)]);


        // -----------------------------------------------------------------------------------------------------
        // @ Variants - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/apps/ecommerce/inventory/category')
            .reply(({request}) => {

                // Get the category
                const newVariant = cloneDeep(request.body.category);

                // Generate a new GUID
                newVariant.id = FuseMockApiUtils.guid();

                // Unshift the new category
                this._categories.unshift(newVariant);

                // Return the response
                return [200, newVariant];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Variants - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/apps/ecommerce/inventory/category')
            .reply(({request}) => {

                // Get the id and category
                const id = request.body.id;
                const category = cloneDeep(request.body.category);

                // Prepare the updated category
                let updatedCategory = null;

                // Find the category and update it
                this._categories.forEach((item, index, categories) => {

                    if ( item.id === id )
                    {
                        // Update the category
                        categories[index] = assign({}, categories[index], category);

                        // Store the updated category
                        updatedCategory = categories[index];
                    }
                });

                // Return the response
                return [200, updatedCategory];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Brands - GET
        // -----------------------------------------------------------------------------------------------------
        // this._fuseMockApiService
        //     .onGet('api/apps/ecommerce/inventory/brands')
        //     .reply(() => [200, cloneDeep(this._brands)]);

        // -----------------------------------------------------------------------------------------------------
        // @ Products - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/apps/ecommerce/inventory/products', 300)
            .reply(({request}) => {

                // Get available queries
                const search = request.params.get('search');
                const sort = request.params.get('sort') || 'name';
                const order = request.params.get('order') || 'asc';
                const page = parseInt(request.params.get('page') ?? '1', 10);
                const size = parseInt(request.params.get('size') ?? '10', 10);

                // Clone the products
                let products: any[] | null = cloneDeep(this._products);

                // Sort the products
                if ( sort === 'sku' || sort === 'name' || sort === 'active' )
                {
                    products.sort((a, b) => {
                        const fieldA = a[sort].toString().toUpperCase();
                        const fieldB = b[sort].toString().toUpperCase();
                        return order === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
                    });
                }
                else
                {
                    products.sort((a, b) => order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]);
                }

                // If search exists...
                if ( search )
                {
                    // Filter the products
                    products = products.filter(contact => contact.name && contact.name.toLowerCase().includes(search.toLowerCase()));
                }

                // Paginate - Start
                const productsLength = products.length;

                // Calculate pagination details
                const begin = page * size;
                const end = Math.min((size * (page + 1)), productsLength);
                const lastPage = Math.max(Math.ceil(productsLength / size), 1);

                // Prepare the pagination object
                let pagination = {};

                // If the requested page number is bigger than
                // the last possible page number, return null for
                // products but also send the last possible page so
                // the app can navigate to there
                if ( page > lastPage )
                {
                    products = null;
                    pagination = {
                        lastPage
                    };
                }
                else
                {
                    // Paginate the results by size
                    products = products.slice(begin, end);

                    // Prepare the pagination mock-api
                    pagination = {
                        length    : productsLength,
                        size      : size,
                        page      : page,
                        lastPage  : lastPage,
                        startIndex: begin,
                        endIndex  : end - 1
                    };
                }

                // Return the response
                return [
                    200,
                    {
                        products,
                        pagination
                    }
                ];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Product - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/apps/ecommerce/inventory/product')
            .reply(({request}) => {

                // Get the id from the params
                const id = request.params.get('id');

                // Clone the products
                const products = cloneDeep(this._products);

                // Find the product
                const product = products.find(item => item.id === id);

                // Return the response
                return [200, product];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Product - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/apps/ecommerce/inventory/product')
            .reply(() => {

                // Generate a new product
                const newProduct = {
                    id         : FuseMockApiUtils.guid(),
                    category   : '',
                    name       : 'A New Product',
                    description: '',
                    variants       : [],
                    sku        : '',
                    barcode    : '',
                    brand      : '',
                    vendor     : '',
                    stock      : '',
                    reserved   : '',
                    cost       : '',
                    basePrice  : '',
                    taxPercent : '',
                    price      : '',
                    weight     : '',
                    thumbnail  : '',
                    images     : [],
                    active     : false
                };

                // Unshift the new product
                this._products.unshift(newProduct);

                // Return the response
                return [200, newProduct];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Product - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/apps/ecommerce/inventory/product')
            .reply(({request}) => {

                // Get the id and product
                const id = request.body.id;
                const product = cloneDeep(request.body.product);

                // Prepare the updated product
                let updatedProduct = null;

                // Find the product and update it
                this._products.forEach((item, index, products) => {

                    if ( item.id === id )
                    {
                        // Update the product
                        products[index] = assign({}, products[index], product);

                        // Store the updated product
                        updatedProduct = products[index];
                    }
                });

                // Return the response
                return [200, updatedProduct];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Product - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/apps/ecommerce/inventory/product')
            .reply(({request}) => {

                // Get the id
                const id = request.params.get('id');

                // Find the product and delete it
                this._products.forEach((item, index) => {

                    if ( item.id === id )
                    {
                        this._products.splice(index, 1);
                    }
                });

                // Return the response
                return [200, true];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Variants - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/apps/ecommerce/inventory/variants')
            .reply(() => [200, cloneDeep(this._variants)]);

        // -----------------------------------------------------------------------------------------------------
        // @ Variants - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/apps/ecommerce/inventory/variant')
            .reply(({request}) => {

                // Get the variant
                const newVariant = cloneDeep(request.body.variant);

                // Generate a new GUID
                newVariant.id = FuseMockApiUtils.guid();

                // Unshift the new variant
                this._variants.unshift(newVariant);

                // Return the response
                return [200, newVariant];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Variants - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/apps/ecommerce/inventory/variant')
            .reply(({request}) => {

                // Get the id and variant
                const id = request.body.id;
                const variant = cloneDeep(request.body.variant);

                // Prepare the updated variant
                let updatedVariant = null;

                // Find the variant and update it
                this._variants.forEach((item, index, variants) => {

                    if ( item.id === id )
                    {
                        // Update the variant
                        variants[index] = assign({}, variants[index], variant);

                        // Store the updated variant
                        updatedVariant = variants[index];
                    }
                });

                // Return the response
                return [200, updatedVariant];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Variant - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/apps/ecommerce/inventory/variant')
            .reply(({request}) => {

                // Get the id
                const id = request.params.get('id');

                // Find the variant and delete it
                this._variants.forEach((item, index) => {

                    if ( item.id === id )
                    {
                        this._variants.splice(index, 1);
                    }
                });

                // Get the products that have the variant
                const productsWithVariant = this._products.filter(product => product.variants.indexOf(id) > -1);

                // Iterate through them and delete the variant
                productsWithVariant.forEach((product) => {
                    product.variants.splice(product.variants.indexOf(id), 1);
                });

                // Return the response
                return [200, true];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Vendors - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/apps/ecommerce/inventory/vendors')
            .reply(() => [200, cloneDeep(this._vendors)]);
    }
}
