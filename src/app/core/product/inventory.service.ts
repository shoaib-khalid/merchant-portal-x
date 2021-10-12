import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { InventoryCategory, InventoryPagination, InventoryProduct, InventoryVariant, InventoryVariantsAvailable } from 'app/core/product/inventory.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';

@Injectable({
    providedIn: 'root'
})
export class InventoryService
{
    // Private
    private _categories: BehaviorSubject<InventoryCategory[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<InventoryPagination | null> = new BehaviorSubject(null);
    private _product: BehaviorSubject<InventoryProduct | null> = new BehaviorSubject(null);
    private _products: BehaviorSubject<InventoryProduct[] | null> = new BehaviorSubject(null);
    private _variants: BehaviorSubject<InventoryVariant[] | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _jwt: JwtService
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
     * Getter for variants
     */
    get variants$(): Observable<InventoryVariant[]>
    {
        return this._variants.asObservable();
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
     * Get brands
     */
    // getBrands(): Observable<InventoryBrand[]>
    // {
    //     return this._httpClient.get<InventoryBrand[]>('api/apps/ecommerce/inventory/brands').pipe(
    //         tap((brands) => {
    //             this._brands.next(brands);
    //         })
    //     );
    // }

    /**
     * Get categories
     */
    getCategories(): Observable<InventoryCategory[]>
    {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

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
     createCategory(category: InventoryCategory): Observable<InventoryCategory>
     {
         return this.categories$.pipe(
             take(1),
             switchMap(categories => this._httpClient.post<InventoryCategory>('api/apps/ecommerce/inventory/category', {category}).pipe(
                 map((newCategory) => {
                     // Update the categories with the new category
                     this._categories.next([...categories, newCategory]);
 
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
         return this.categories$.pipe(
             take(1),
             switchMap(categories => this._httpClient.patch<InventoryCategory>('api/apps/ecommerce/inventory/category', {
                 id,
                 category
             }).pipe(
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
         return this.categories$.pipe(
             take(1),
             switchMap(categories => this._httpClient.delete('api/apps/ecommerce/inventory/category', {params: {id}}).pipe(
                 map((isDeleted: boolean) => {
 
                     // Find the index of the deleted category
                     const index = categories.findIndex(item => item.id === id);
 
                     // Delete the category
                     categories.splice(index, 1);
 
                     // Update the categories
                     this._variants.next(categories);
 
                     // Return the deleted status
                     return isDeleted;
                 }),
                 filter(isDeleted => isDeleted),
                 switchMap(isDeleted => this.products$.pipe(
                     take(1),
                     map((products) => {
 
                         // Iterate through the contacts
                         products.forEach((product) => {
 
                             const variantIndex = product.variants.findIndex(category => category === id);
 
                             // If the contact has the category, remove it
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
     * Get products
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getProducts(page: number = 0, size: number = 20, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = ''):
        Observable<{ pagination: InventoryPagination; products: InventoryProduct[] }>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page: '' + page,
                pageSize: '' + size,
                sortByCol: '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                name: '' + search
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
                    endIndex: response.data.pageable.offset + response.data.pageable.numberOfElements - 1
                }
                this._pagination.next(_pagination);

                
                
                let _newProducts: Array<any> = [];
                (response.data.content).forEach(object => {
                    _newProducts.push({
                        id: object.id,
                        category: object.categoryId,
                        name: object.name,
                        description: object.description,
                        variants: object.productVariants, // array of string // to be ask albert
                        sku: object.productInventories[0].sku, // need looping
                        barcode: null,
                        allowOutOfStockPurchases: object.allowOutOfStockPurchases,
                        trackQuantity: object.trackQuantity,
                        stock: object.productInventories[0].quantity, // need looping
                        cost: 0,
                        basePrice: 0,
                        taxPercent: 0,
                        price: object.productInventories[0].price, // need looping
                        weight: 0,
                        thumbnail: object.thumbnailUrl,
                        images: Object.keys(object.productAssets).map(function(key){return object.productAssets[key].url}), // need looping
                        active: true
                    });
                });

                this._products.next(_newProducts);
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
    createProduct(): Observable<InventoryProduct>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        // const categoryId = await this.getCategoryId()

        // const body = {
        //     "categoryId": categoryId,
        //     "name": this.title,
        //     "status": this.productStatus,
        //     "description": this.description,
        //     "storeId": localStorage.getItem("storeId"),
        //     "allowOutOfStockPurchases": this.continueSelling,
        //     "trackQuantity": this.trackQuantity,
        //     "minQuantityForAlarm": this.minQtyAlarm ? this.minQtyAlarm : -1
        // };

        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            // switchMap(products => this._httpClient.post<InventoryProduct>(productService +'/stores/'+this.storeId$+'/products', body , header).pipe(
                map((newProduct) => {
                    // Update the products with the new product
                    this._products.next([newProduct, ...products]);

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
        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.patch<InventoryProduct>('api/apps/ecommerce/inventory/product', {
                id,
                product
            }).pipe(
                map((updatedProduct) => {

                    // Find the index of the updated product
                    const index = products.findIndex(item => item.id === id);

                    // Update the product
                    products[index] = updatedProduct;

                    // Update the products
                    this._products.next(products);

                    // Return the updated product
                    return updatedProduct;
                }),
                switchMap(updatedProduct => this.product$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() => {

                        // Update the product if it's selected
                        this._product.next(updatedProduct);

                        // Return the updated product
                        return updatedProduct;
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
        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.delete('api/apps/ecommerce/inventory/product', {params: {id}}).pipe(
                map((isDeleted: boolean) => {

                    // Find the index of the deleted product
                    const index = products.findIndex(item => item.id === id);

                    // Delete the product
                    products.splice(index, 1);

                    // Update the products
                    this._products.next(products);

                    // Return the deleted status
                    return isDeleted;
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
    getVariantsList(): Observable<InventoryVariantsAvailable[]>
    {
        return this._httpClient.get<InventoryVariant[]>('api/apps/ecommerce/inventory/variants').pipe(
            tap((variants) => {
                this._variants.next(variants);
            })
        );
    }
 
    /**
     * Create variant List
     *
     * @param variant
    */
    createVariantList(variant: InventoryVariantsAvailable): Observable<InventoryVariantsAvailable>
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
     * Update the variant List
     *
     * @param id
     * @param variant
    */
    updateVariantList(id: string, variant: InventoryVariantsAvailable): Observable<InventoryVariantsAvailable>
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
      * Delete the variant List
      *
      * @param id
     */
    deleteVariantList(id: string): Observable<boolean>
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
