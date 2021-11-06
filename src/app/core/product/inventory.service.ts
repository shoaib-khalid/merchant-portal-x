import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { InventoryCategory, InventoryPagination, InventoryProduct, InventoryVariant, InventoryVariantsAvailable, InventoryProductX } from 'app/core/product/inventory.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';

@Injectable({
    providedIn: 'root'
})
export class InventoryService
{
    // Private
    private _product: BehaviorSubject<InventoryProduct | null> = new BehaviorSubject(null);
    private _products: BehaviorSubject<InventoryProduct[] | null> = new BehaviorSubject(null);
    private _inventories: BehaviorSubject<InventoryProductX[] | null> = new BehaviorSubject(null);
    private _categories: BehaviorSubject<InventoryCategory[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<InventoryPagination | null> = new BehaviorSubject(null);
    private _variant: BehaviorSubject<InventoryVariant | null> = new BehaviorSubject(null);
    private _variants: BehaviorSubject<InventoryVariant[] | null> = new BehaviorSubject(null);
    private _variantTags: BehaviorSubject<InventoryVariantsAvailable[] | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _jwt: JwtService,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for categories
     */
    get categories$(): Observable<InventoryCategory[]>
    {
        return this._categories.asObservable();
    }

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<InventoryPagination>
    {
        return this._pagination.asObservable();
    }

    /**
     * Getter for product
     */
    get product$(): Observable<InventoryProduct>
    {
        return this._product.asObservable();
    }

    /**
     * Getter for products
     */
    get products$(): Observable<InventoryProduct[]>
    {
        return this._products.asObservable();
    }

    /**
     * Getter for products inventories
     */
     get inventories$(): Observable<InventoryProductX[]>
     {
         return this._inventories.asObservable();
     }    

    /**
     * Getter for variants
     */
     get variants$(): Observable<InventoryVariant[]>
     {
         return this._products.asObservable();
     }

    /**
     * Getter for access token
     */
 
     get accessToken(): string
     {
         return localStorage.getItem('accessToken') ?? '';
     }

    /**
     * Getter for storeId
     */
 
     get storeId$(): string
     {
         return localStorage.getItem('storeId') ?? '';
     }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get categories
     */
    getCategories(name: string = null): Observable<InventoryCategory[]>
    {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            name
        };

        // product-service/v1/swagger-ui.html#/store-controller/putStoreCategoryByStoreIdUsingGET
        return this._httpClient.get<any>(productService + '/stores/' + this.storeId$ + '/store-categories',header).pipe(
            tap((categories) => {
                this._categories.next(categories.data);
            })
        );
    }

    /**
     * Create category
     *
     * @param category
     */
    createCategory(category: InventoryCategory, body = {}): Observable<InventoryCategory>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                name: category.name,
                storeId: this.storeId$
            }
        };

        // product-service/v1/swagger-ui.html#/store-category-controller/postStoreCategoryByStoreIdUsingPOST
        return this.categories$.pipe(
            take(1),
            switchMap(categories => this._httpClient.post<any>(productService + '/store-categories', body , header).pipe(
                map((newCategory) => {
                    // Update the categories with the new category
                    this._categories.next([...categories, newCategory.data]);

                    // Return new category from observable
                    return newCategory;
                })
            ))
        );
    }
 
    /**
     * Update the category
     *
     * @param id
     * @param category
     */
    updateCategory(id: string, category: InventoryCategory): Observable<InventoryCategory>
    {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                name: category.name,
                storeCategoryId: id,
                storeId: this.storeId$
            }
        };

        // product-service/v1/swagger-ui.html#/store-category-controller/putStoreProductAssetsByIdUsingPUT
        return this.categories$.pipe(
            take(1),
            switchMap(categories => this._httpClient.put<InventoryCategory>(productService + '/store-categories',header)
            .pipe(
                map((updatedCategories) => {

                    // Find the index of the updated category
                    const index = categories.findIndex(item => item.id === id);

                    // Update the category
                    categories[index] = updatedCategories;

                    // Update the categories
                    this._categories.next(categories);

                    // Return the updated category
                    return updatedCategories;
                })
            ))
        );
    }
 
    /**
     * Delete the category
     *
     * @param id
     */
    deleteCategory(id: string): Observable<boolean>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

        // product-service/v1/swagger-ui.html#/store-category-controller
        return this.categories$.pipe(
            take(1),
            switchMap(categories => this._httpClient.delete(productService + '/store-categories/' + id ,header)
            .pipe(
                map((isDeleted: boolean) => {

                    // Find the index of the deleted category
                    const index = categories.findIndex(item => item.id === id);

                    // Delete the category
                    categories.splice(index, 1);

                    // Update the categories
                    this._categories.next(categories);

                    // Return the deleted status
                    return isDeleted;
                }),
                filter(isDeleted => isDeleted),
                switchMap(isDeleted => this.products$.pipe(
                    take(1),
                    map((products) => {

                        // Iterate through the products
                        products.forEach((product) => {

                            // remove that category in each products 
                            product.categoryId = "";

                        });

                        // Return the deleted status
                        return isDeleted;
                    })
                ))
            ))
        );
    }

    /**
     * Get products
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getProducts(page: number = 0, size: number = 20, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', status: string = 'ACTIVE,INACTIVE'):
        Observable<{ pagination: InventoryPagination; products: InventoryProduct[] }>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page: '' + page,
                pageSize: '' + size,
                sortByCol: '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                name: '' + search,
                status: '' + status
            }
        };

        return this._httpClient.get<any>(productService +'/stores/'+this.storeId$+'/products', header).pipe(
            tap((response) => {
                let _pagination = {
                    length: response.data.totalElements,
                    size: response.data.size,
                    page: response.data.number,
                    lastPage: response.data.totalPages,
                    startIndex: response.data.pageable.offset,
                    endIndex: response.data.pageable.offset + response.data.numberOfElements - 1
                }
                this._pagination.next(_pagination);
                
                let _newProducts: Array<any> = [];
                let _newVariants: Array<any> = [];
                let _newVariantTags: Array<any> = [];
                (response.data.content).forEach(object => {
                    _newProducts.push({
                        id: object.id,
                        thumbnail: object.thumbnailUrl,
                        images: Object.keys(object.productAssets).map(function(key){return object.productAssets[key].url}),
                        status: object.status,
                        name: object.name,
                        description: object.description,
                        productInventories: object.productInventories,
                        stock: object.productInventories[0].quantity, // need looping
                        allowOutOfStockPurchases: object.allowOutOfStockPurchases,
                        minQuantityForAlarm: object.minQuantityForAlarm,
                        trackQuantity: object.trackQuantity,
                        sku: object.productInventories[0].sku, // need looping
                        price: object.productInventories[0].price, // need looping
                        weight: 0,
                        categoryId: object.categoryId,
                        variants: object.productVariants
                    });
                    _newVariants.push(object.productVariants)
                    _newVariantTags.push({
                        id: Object.keys(object.productVariants).map(function(key){return object.productVariants[key].id}),
                        value: Object.keys(object.productVariants).map(function(key){return object.productVariants[key].value}),
                        productId: Object.keys(object.productVariants).map(function(key){return object.productVariants[key].productId}),
                    });
                });
                this._products.next(_newProducts);
                this._variants.next(_newVariants);
                this._variantTags.next(_newVariantTags);
            })
        );
    }

    /**
     * Get product by id
     */
    getProductById(id: string): Observable<InventoryProduct>
    {
        return this._products.pipe(
            take(1),
            map((products) => {

                console.log("products: ",products)

                // Find the product
                const product = products.find(item => item.id === id) || null;

                // Update the product
                this._product.next(product);

                // Return the product
                return product;
            }),
            switchMap((product) => {

                if ( !product )
                {
                    return throwError('Could not found product with id of ' + id + '!');
                }

                return of(product);
            })
        );
    }

    /**
     * Create product
     */
    createProduct(categoryId): Observable<InventoryProduct>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const now = new Date();
        const date = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes()  + ":" + now.getSeconds();

        const body = {
            "categoryId": categoryId,
            "name": "A New Product " + date,
            "status": "INACTIVE",
            "description": "Tell us more about your product",
            "storeId": this.storeId$,
            "allowOutOfStockPurchases": false,
            "trackQuantity": false,
            "minQuantityForAlarm": -1
        };

        return this.products$.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(products => this._httpClient.post<InventoryProduct>(productService + '/stores/' + this.storeId$ + '/products', body , header).pipe(
                map((newProduct) => {

                    // Update the products with the new product
                    this._products.next([newProduct["data"], ...products]);

                    // Return the new product
                    return newProduct;
                })
            ))
        );
    }

    /**
     * Update product
     *
     * @param id
     * @param product
     */
    updateProduct(id: string, product: InventoryProduct): Observable<InventoryProduct>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.products$.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(products => this._httpClient.put<InventoryProduct>(productService + '/stores/' + this.storeId$ + '/products/' + id, product , header).pipe(
                map((updatedProduct) => {

                    // Find the index of the updated product
                    const index = products.findIndex(item => item.id === id);

                    // Update the product
                    products[index] = updatedProduct["data"];

                    // Update the products
                    this._products.next(products);

                    // Return the updated product
                    return updatedProduct["data"];
                }),
                switchMap(updatedProduct => this.product$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() => {

                        // Update the product if it's selected
                        this._product.next(updatedProduct["data"]);

                        // Return the updated product
                        return updatedProduct["data"];
                    })
                ))
            ))
        );
    }

    /**
     * Delete the product
     *
     * @param id
     */
    deleteProduct(id: string): Observable<boolean>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
      
        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.delete(productService +'/stores/'+this.storeId$+'/products/'+id, header).pipe(
                map((status: number) => {

                    // Find the index of the deleted product
                    const index = products.findIndex(item => item.id === id);

                    // Delete the product
                    products.splice(index, 1);

                    // Update the products
                    this._products.next(products);

                    let isDeleted:boolean = false;
                    if (status === 200) {
                        isDeleted = true
                    }

                    // Return the deleted status
                    return isDeleted;
                })
            ))
        );
    }

    addInventoryToProduct(product: InventoryProduct): Observable<InventoryProductX>{

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const now = new Date();
        const date = now.getFullYear() + "" + (now.getMonth()+1) + "" + now.getDate() + "" + now.getHours() + "" + now.getMinutes()  + "" + now.getSeconds();

        const body = {
            "productId": product.id,
            "itemCode": product.id + date,
            "price": 0,
            "compareAtprice": 0,
            "quantity": 1,
            "sku": null,
            "status": "AVAILABLE"
        };

        // return of();

        return this.inventories$.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(products => this._httpClient.post<InventoryProduct>(productService +'/stores/'+this.storeId$+'/products/' + product.id + "/inventory", body , header).pipe(
                map((newProduct) => {

                    console.log("newProduct InventoryItem",newProduct)
                    // Update the products with the new product
                    // this._products.next([newProduct["data"], ...products]);

                    // Return the new product
                    return newProduct["data"];
                })
            ))
        );
    }

    updateInventoryToProduct(product: InventoryProduct): Observable<InventoryProductX>{

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const now = new Date();
        const date = now.getFullYear() + "" + (now.getMonth()+1) + "" + now.getDate() + "" + now.getHours() + "" + now.getMinutes()  + "" + now.getSeconds();

        const body = {
            "productId": product.id,
            "itemCode": product.id + date,
            "price": 0,
            "compareAtprice": 0,
            "quantity": 1,
            "sku": null,
            "status": "AVAILABLE"
        };

        // return of();

        return this.inventories$.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(products => this._httpClient.post<InventoryProduct>(productService +'/stores/'+this.storeId$+'/products/' + product.id + "/inventory", body , header).pipe(
                map((newProduct) => {

                    console.log("newProduct InventoryItem",newProduct)
                    // Update the products with the new product
                    // this._products.next([newProduct["data"], ...products]);

                    // Return the new product
                    return newProduct["data"];
                })
            ))
        );
    }

    /**
     * Get variants
     */
     getVariants(): Observable<InventoryVariant[]>
     {
         return this._httpClient.get<InventoryVariant[]>('api/apps/ecommerce/inventory/variants').pipe(
             tap((variants) => {
                 this._variants.next(variants);
             })
         );
         
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const now = new Date();
        const date = now.getFullYear() + "" + (now.getMonth()+1) + "" + now.getDate() + "" + now.getHours() + "" + now.getMinutes()  + "" + now.getSeconds();

        // const body = {
        //     "productId": product.id,
        //     "itemCode": product.id + date,
        //     "price": 0,
        //     "compareAtprice": 0,
        //     "quantity": 0,
        //     "sku": null,
        //     "status": "AVAILABLE"
        // };

        // console.log("productId",product)

        // // return of();

        // return this.variants$.pipe(
        //     take(1),
        //     switchMap(products => this._httpClient.post<InventoryVariant[]>(productService +'/stores/'+this.storeId$+'/products/' + product.id + "/inventory", body , header).pipe(
        //         map((newProduct) => {

        //             console.log("newProduct InventoryItem",newProduct)
        //             // Update the products with the new product
        //             this._products.next([newProduct["data"], ...products]);

        //             // Return the new product
        //             return newProduct;
        //         })
        //     ))
        // );

        return of();
    }

    /**
     * Get variants by productId
     */

    getVariantsByProductId(productId): Observable<InventoryVariant[]> {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                productId: productId,
                storeId: this.storeId$
            }
        };

        // product-service/v1/swagger-ui.html#/store-category-controller/postStoreCategoryByStoreIdUsingPOST
        return this.variants$.pipe(
            take(1),
            switchMap(variants => this._httpClient.get<any>(productService + '/stores/' + this.storeId$ + '/products/' + productId + '/variants' , header).pipe(
                map((newVariants) => {
                    // Update the variants with the new Variants
                    this._variants.next([...variants, newVariants.data]);

                    // Return new Variants from observable
                    return newVariants.data;
                })
            ))
        );

    }

    /**
     * Create variant
     *
     * @param variant
     */
    createVariant(variant: InventoryVariant): Observable<InventoryVariant>
    {
        return this.variants$.pipe(
            take(1),
            switchMap(variants => this._httpClient.post<InventoryVariant>('api/apps/ecommerce/inventory/variant', {variant}).pipe(
                map((newVariant) => {

                    // Update the variants with the new variant
                    this._variants.next([...variants, newVariant]);

                    // Return new variant from observable
                    return newVariant;
                })
            ))
        );
    }

    /**
     * Update the variant
     *
     * @param id
     * @param variant
     */
    updateVariant(id: string, variant: InventoryVariant): Observable<InventoryVariant>
    {
        return this.variants$.pipe(
            take(1),
            switchMap(variants => this._httpClient.patch<InventoryVariant>('api/apps/ecommerce/inventory/variant', {
                id,
                variant
            }).pipe(
                map((updatedVariant) => {

                    // Find the index of the updated variant
                    const index = variants.findIndex(item => item.id === id);

                    // Update the variant
                    variants[index] = updatedVariant;

                    // Update the variants
                    this._variants.next(variants);

                    // Return the updated variant
                    return updatedVariant;
                })
            ))
        );
    }

    /**
     * Delete the variant
     *
     * @param id
     */
    deleteVariant(id: string): Observable<boolean>
    {
        return this.variants$.pipe(
            take(1),
            switchMap(variants => this._httpClient.delete('api/apps/ecommerce/inventory/variant', {params: {id}}).pipe(
                map((isDeleted: boolean) => {

                    // Find the index of the deleted variant
                    const index = variants.findIndex(item => item.id === id);

                    // Delete the variant
                    variants.splice(index, 1);

                    // Update the variants
                    this._variants.next(variants);

                    // Return the deleted status
                    return isDeleted;
                }),
                filter(isDeleted => isDeleted),
                switchMap(isDeleted => this.products$.pipe(
                    take(1),
                    map((products) => {

                        // Iterate through the contacts
                        products.forEach((product) => {

                            const variantIndex = product.variants.findIndex(variant => variant === id);

                            // If the contact has the variant, remove it
                            if ( variantIndex > -1 )
                            {
                                product.variants.splice(variantIndex, 1);
                            }
                        });

                        // Return the deleted status
                        return isDeleted;
                    })
                ))
            ))
        );
    }

    /**
     * Get variants
     */
    getVariantsTag(): Observable<InventoryVariantsAvailable[]>
    {
        return this._httpClient.get<InventoryVariant[]>('api/apps/ecommerce/inventory/variants').pipe(
            tap((variants) => {
                this._variants.next(variants);
            })
        );
    }
 
    /**
     * Create variant Tag
     *
     * @param variant
    */
    createVariantTag(variant: InventoryVariantsAvailable): Observable<InventoryVariantsAvailable>
    {
        return this.variants$.pipe(
            take(1),
            switchMap(variants => this._httpClient.post<InventoryVariantsAvailable>('api/apps/ecommerce/inventory/variant', {variant}).pipe(
                map((newVariant) => {

                    // Update the variants with the new variant
                    this._variants.next([...variants, newVariant]);

                    // Return new variant from observable
                    return newVariant;
                })
            ))
        );
     }
 
    /**
     * Update the variant Tag
     *
     * @param id
     * @param variant
    */
    updateVariantTag(id: string, variant: InventoryVariantsAvailable): Observable<InventoryVariantsAvailable>
    {
        return this.variants$.pipe(
            take(1),
            switchMap(variants => this._httpClient.patch<InventoryVariantsAvailable>('api/apps/ecommerce/inventory/variant', {
                id,
                variant
            }).pipe(
                map((updatedVariant) => {

                    // Find the index of the updated variant
                    const index = variants.findIndex(item => item.id === id);

                    // Update the variant
                    variants[index] = updatedVariant;

                    // Update the variants
                    this._variants.next(variants);

                    // Return the updated variant
                    return updatedVariant;
                })
            ))
        );
    }
 
    /**
      * Delete the variant Tag
      *
      * @param id
     */
    deleteVariantTag(id: string): Observable<boolean>
    {
        return this.variants$.pipe(
            take(1),
            switchMap(variants => this._httpClient.delete('api/apps/ecommerce/inventory/variant', {params: {id}}).pipe(
                map((isDeleted: boolean) => {

                    // Find the index of the deleted variant
                    const index = variants.findIndex(item => item.id === id);

                    // Delete the variant
                    variants.splice(index, 1);

                    // Update the variants
                    this._variants.next(variants);

                    // Return the deleted status
                    return isDeleted;
                }),
                filter(isDeleted => isDeleted),
                switchMap(isDeleted => this.products$.pipe(
                    take(1),
                    map((products) => {

                        // Iterate through the contacts
                        products.forEach((product) => {

                            const variantIndex = product.variants.findIndex(variant => variant === id);

                            // If the contact has the variant, remove it
                            if ( variantIndex > -1 )
                            {
                                product.variants.splice(variantIndex, 1);
                            }
                        });

                        // Return the deleted status
                        return isDeleted;
                    })
                ))
            ))
        );
    }

    /**
     * Update the avatar of the given contact
     *
     * @param id
     * @param avatar
     */
    /*uploadAvatar(id: string, avatar: File): Observable<Contact>
    {
        return this.contacts$.pipe(
            take(1),
            switchMap(contacts => this._httpClient.post<Contact>('api/apps/contacts/avatar', {
                id,
                avatar
            }, {
                headers: {
                    'Content-Type': avatar.type
                }
            }).pipe(
                map((updatedContact) => {

                    // Find the index of the updated contact
                    const index = contacts.findIndex(item => item.id === id);

                    // Update the contact
                    contacts[index] = updatedContact;

                    // Update the contacts
                    this._contacts.next(contacts);

                    // Return the updated contact
                    return updatedContact;
                }),
                switchMap(updatedContact => this.contact$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() => {

                        // Update the contact if it's selected
                        this._contact.next(updatedContact);

                        // Return the updated contact
                        return updatedContact;
                    })
                ))
            ))
        );
    }*/
}
