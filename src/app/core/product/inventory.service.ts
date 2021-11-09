import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Product, ProductVariant, ProductInventory, ProductCategory, ProductPagination, ProductVariantAvailable } from 'app/core/product/inventory.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';

@Injectable({
    providedIn: 'root'
})
export class InventoryService
{
    // Private
    private _product: BehaviorSubject<Product | null> = new BehaviorSubject(null);
    private _products: BehaviorSubject<Product[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<ProductPagination | null> = new BehaviorSubject(null);

    private _variant: BehaviorSubject<ProductVariant | null> = new BehaviorSubject(null);
    private _variants: BehaviorSubject<ProductVariant[] | null> = new BehaviorSubject(null);

    private _category: BehaviorSubject<ProductCategory | null> = new BehaviorSubject(null);
    private _categories: BehaviorSubject<ProductCategory[] | null> = new BehaviorSubject(null);

    private _inventory: BehaviorSubject<ProductInventory | null> = new BehaviorSubject(null);
    private _inventories: BehaviorSubject<ProductInventory[] | null> = new BehaviorSubject(null);

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
     * Getter for product
     */
    get product$(): Observable<Product>
    {
        return this._product.asObservable();
    }

    /**
     * Getter for products
     */
    get products$(): Observable<Product[]>
    {
        return this._products.asObservable();
    }

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<ProductPagination>
    {
        return this._pagination.asObservable();
    }

    /**
     * Getter for categories
     */
    get categories$(): Observable<ProductCategory[]>
    {
        return this._categories.asObservable();
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
     * Get products
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getProducts(page: number = 0, size: number = 20, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', status: string = 'ACTIVE,INACTIVE'):
        Observable<{ pagination: ProductPagination; products: Product[] }>
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
            })
        );
    }

    /**
     * Get product by id
     */
    getProductById(id: string): Observable<Product>
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
    createProduct(categoryId): Observable<Product>
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
            switchMap(products => this._httpClient.post<Product>(productService + '/stores/' + this.storeId$ + '/products', body , header).pipe(
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
    updateProduct(id: string, product: Product): Observable<Product>
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
            switchMap(products => this._httpClient.put<Product>(productService + '/stores/' + this.storeId$ + '/products/' + id, product , header).pipe(
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

    /**
     * Add Inventory to the product
     *
     * @param product
     */
    addInventoryToProduct(product: Product): Observable<ProductInventory>{

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

        return this._inventories.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(products => this._httpClient.post<Product>(productService +'/stores/'+this.storeId$+'/products/' + product.id + "/inventory", body , header).pipe(
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
     * Update Inventory to the product
     *
     * @param product
     */
    updateInventoryToProduct(product: Product): Observable<ProductInventory>{

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

        return this._inventories.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(products => this._httpClient.post<Product>(productService +'/stores/'+this.storeId$+'/products/' + product.id + "/inventory", body , header).pipe(
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


    getVariants(){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
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
            })
        );
    }

    /**
     * Create Product Variant
     * 
     * @param variant
     * @param productId
     */
    createVariant(variant: ProductVariant, productId: string){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const now = new Date();
        const date = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes()  + ":" + now.getSeconds();

        return this.products$.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(products => this._httpClient.post<ProductVariant>(productService + '/stores/' + this.storeId$ + '/products/' + productId + "/variants", variant , header).pipe(
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
     * Update Product Variant
     */

    updateVariant(test:any, test2:any){
    }

    /**
     * Update Product Variant
     */
    deleteVariant(variantId: string, productId:string){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
      
        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.delete(productService + '/stores/' + this.storeId$ + '/products/' + productId + '/variants/' + variantId, header).pipe(
                map((status: number) => {

                    // Find the index of the deleted product
                    const index = products.findIndex(item => item.id === productId);

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

    /**
     * Create Product Variant
     * 
     * @param variantAvailable
     * @param productId
     */
    createProductVariantAvailable(variantAvailable: ProductVariantAvailable, productId: string){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const now = new Date();
        const date = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes()  + ":" + now.getSeconds();

        return this.products$.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(products => this._httpClient.post<ProductVariantAvailable>(productService + '/stores/' + this.storeId$ + '/products/' + productId + "/variants-available", variantAvailable , header).pipe(
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
     * Get categories
     * 
     * @param name
     */
    getCategories(name: string = null): Observable<ProductCategory[]>
    {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                name
            }
        };

        // product-service/v1/swagger-ui.html#/store-controller/putStoreCategoryByStoreIdUsingGET
        return this._httpClient.get<any>(productService + '/stores/' + this.storeId$ + '/store-categories',header).pipe(
            tap((categories) => {
                this._categories.next(categories.data.content);
            })
        );
    }
 
     /**
      * Create category
      *
      * @param category
      */
    createCategory(category: ProductCategory, body = {}): Observable<ProductCategory>
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
    updateCategory(id: string, category: ProductCategory): Observable<ProductCategory>
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
        return this._categories.pipe(
            take(1),
            switchMap(categories => this._httpClient.put<ProductCategory>(productService + '/store-categories',header)
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
        return this._categories.pipe(
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

}
