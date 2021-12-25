import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Product, ProductVariant, ProductInventory, ProductCategory, ProductPagination, ProductVariantAvailable, ProductPackageOption, ProductAssets } from 'app/core/product/inventory.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from '../logging/log.service';

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

    private _package: BehaviorSubject<ProductPackageOption | null> = new BehaviorSubject(null);
    private _packages: BehaviorSubject<ProductPackageOption[] | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _logging: LogService,
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
     * Getter for package
     */
    get package$(): Observable<ProductPackageOption>
    {
        return this._package.asObservable();
    }
     

    /**
     * Getter for packages
     */
    get packages$(): Observable<ProductPackageOption[]>
    {
        return this._packages.asObservable();
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
                page        : '' + page,
                pageSize    : '' + size,
                sortByCol   : '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                name        : '' + search,
                status      : '' + status
            }
        };

        return this._httpClient.get<any>(productService +'/stores/'+this.storeId$+'/products', header).pipe(
            tap((response) => {

                this._logging.debug("Response from ProductsService",response);

                let _pagination = {
                    length: response.data.totalElements,
                    size: response.data.size,
                    page: response.data.number,
                    lastPage: response.data.totalPages,
                    startIndex: response.data.pageable.offset,
                    endIndex: response.data.pageable.offset + response.data.numberOfElements - 1
                }
                this._pagination.next(_pagination);
                this._products.next(response.data.content);
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

                // Find the product
                const product = products.find(item => item.id === id) || null;

                this._logging.debug("Response from ProductsService (Current Product)",product);

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
    createProduct(productBody: Product): Observable<Product>
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
            switchMap(products => this._httpClient.post<Product>(productService + '/stores/' + this.storeId$ + '/products', productBody , header).pipe(
                map((newProduct) => {

                    this._logging.debug("Response from ProductsService (createProduct) - Before",newProduct);
                    
                    // initialise variants and inventory to empty 
                    let _newProduct = newProduct["data"];
                    _newProduct["productVariants"] = [];
                    _newProduct["productAssets"] = [];
                    _newProduct["productInventories"] = [{
                        sku: null,
                        price: null,
                        quantity: null
                    }];

                    this._logging.debug("Response from ProductsService (createProduct) - After",_newProduct);

                    // Update the products with the new product
                    this._products.next([_newProduct, ...products]);

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

                    this._logging.debug("Response from ProductsService (updateProduct)",updatedProduct);

                    // Find the index of the updated product
                    const index = products.findIndex(item => item.id === id);
                    
                    // Update the product
                    products[index] = { ...products[index], ...updatedProduct["data"]};

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
     * Get product assets by id
     */

    async getProductAssetsById(productId){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        let response = await this._httpClient.get<any>(productService + '/stores/' + this.storeId$ + '/products/' + productId + '/assets').toPromise();

        this._logging.debug("Response from ProductsService (getProductAssetsById)",response);

        return response.data;
    }

    /**
     * Add assets to the product
     *
     * @param product
     */
     addProductAssets(productId: string, formData: FormData, productAssets: ProductAssets, assetIndex: number = null): Observable<ProductAssets>{

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                itemCode: productAssets.itemCode,
                isThumbnail: productAssets.isThumbnail
            }
        };

        if (!productAssets.itemCode || productAssets.itemCode == "") {
            delete header.params['itemCode'];
        }

        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.post<Product>(productService +'/stores/'+this.storeId$+'/products/' + productId + "/assets", formData , header).pipe(
                map((response) => {

                    this._logging.debug("Response from ProductsService (addProductAssets)",response);
                    
                    // Find the index of the updated product
                    const index = products.findIndex(item => item.id === productId);

                    let updatedProduct;
                    if (assetIndex !== null) {
    
                        // ---------------
                        // update mechanism
                        // ---------------

                        const assetIndex = products[index].productAssets.push(response["data"]);

                        updatedProduct = products[index];
                        updatedProduct.productAssets[assetIndex] = response["data"];
                        
                    } else {

                        // ---------------
                        // add mechanism
                        // ---------------
                        
                        updatedProduct = products[index];
                        updatedProduct.productAssets.push(response["data"]);
                        
                    }
                    
                    if (productAssets.isThumbnail === true) {
                        updatedProduct.thumbnailUrl = response["data"].url;
                    }
                    
                    // Update the product
                    products[index] = { ...products[index], ...updatedProduct};

                    // Update the products
                    this._products.next(products);

                    // Return the new product
                    return response["data"];
                })
            ))
        );
    } 

    updateProductAssets(productId: string, productAssets: ProductAssets, assetId: string) : Observable<ProductAssets> {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.put<Product>(productService +'/stores/'+this.storeId$+'/products/' + productId + "/assets/" + assetId, productAssets , header).pipe(
                map((response) => {
                    
                    this._logging.debug("Response from ProductsService (updateProductAssets)",response);

                    // Find the index of the updated product
                    const index = products.findIndex(item => item.id === productId);
                    const assetIndex = products[index].productAssets.push(response["data"]);

                    let updatedProduct = products[index];
                    updatedProduct.productAssets[assetIndex] = response["data"];
                    updatedProduct.thumbnailUrl = response["data"].url;

                    // Update the product
                    products[index] = { ...products[index], ...updatedProduct};

                    // Update the products
                    this._products.next(products);

                    // Return the new product
                    return response["data"];
                })
            ))
        );
    }

    deleteProductAssets(productId: string, assetId: string) : Observable<ProductAssets> {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.delete<Product>(productService +'/stores/'+this.storeId$+'/products/' + productId + "/assets/" + assetId, header).pipe(
                map((response) => {

                    this._logging.debug("Response from ProductsService (deleteProductAssets)",response);

                    // Find the index of the updated product
                    const index = products.findIndex(item => item.id === productId);
                    const assetIndex = products[index].productAssets.push(response["data"]);

                    let updatedProduct = products[index].productInventories.splice(assetIndex, 1);

                    // Update the product
                    products[index] = { ...products[index], ...updatedProduct};
                    

                    // Update the products
                    this._products.next(products);

                    // Return the new product
                    return response["data"];
                })
            ))
        );
    }

    /**
     * Add Inventory to the product
     *
     * @param product
     */
    addInventoryToProduct(product: Product, productInventory): Observable<ProductInventory>{

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
            "price": productInventory.price,
            "compareAtprice": 0,
            "quantity": productInventory.availableStock,
            "sku": productInventory.sku,
            "status": "AVAILABLE"
        };

        // return of();

        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.post<Product>(productService +'/stores/'+this.storeId$+'/products/' + product.id + "/inventory", body , header).pipe(
                map((newInventory) => {


                    // Find the index of the updated product
                    const index = products.findIndex(item => item.id === product.id);
                    let updatedProduct = products[index];
                    updatedProduct.productInventories = [newInventory["data"]];
                    
                    // Update the product
                    products[index] = { ...products[index], ...updatedProduct};

                    // Update the products
                    this._products.next(products);

                    this._logging.debug("Response from ProductsService (addInventoryToProduct)",newInventory);

                    // Return the new product
                    return newInventory["data"];
                })
            ))
        );
    }

    /**
     * Update Inventory to the product
     *
     * @param product
     */
    updateInventoryToProduct(productId: string, productInventoriesId: string, productInventories: ProductInventory): Observable<ProductInventory>{

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._products.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(products => this._httpClient.put<Product>(productService +'/stores/'+this.storeId$+'/products/' + productId + "/inventory/" + productInventoriesId, productInventories , header).pipe(
                map((response) => {

                    this._logging.debug("Response from ProductsService (updateInventoryToProduct)",response);

                    // Find the index of the updated product
                    const productIndex = products.findIndex(item => item.id === productId);

                    // Find the index of the updated product inventory
                    const productInventoryIndex = products[productIndex].productInventories.findIndex(element => element.itemCode === response["data"].itemCode);

                    // Update the product
                    products[productIndex].productInventories[productInventoryIndex] = { ...products[productIndex].productInventories[productInventoryIndex], ...response["data"] };
                    
                    // Update the products
                    this._products.next(products);

                    // Return the new product
                    return response["data"];
                })
            ))
        );
    }

    /**
     * Delete Inventory to the product
     *
     * @param product
     */
    deleteInventoryToProduct(productId: string, productInventoriesId: string): Observable<ProductInventory>{

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._products.pipe(
            take(1),
            switchMap(products => this._httpClient.delete<Product>(productService +'/stores/'+this.storeId$+'/products/' + productId + "/inventory/" + productInventoriesId, header).pipe(
                map((response) => {

                    this._logging.debug("Response from ProductsService (deleteInventoryToProduct)",response);

                    // Find the index of the updated product
                    const productIndex = products.findIndex(item => item.id === productId);

                    // Find the index of the updated product inventory
                    const productInventoryIndex = products[productIndex].productInventories.findIndex(element => element.itemCode === response["data"].itemCode);

                    // Update the product
                    products[productIndex].productInventories.splice(productInventoryIndex, 1);
                    
                    // Update the products
                    this._products.next(products);

                    // Return the new product
                    return response["data"];
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
                // this._pagination.next(_pagination);
                
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
                // this._products.next(_newProducts);
                // this._variants.next(_newVariants);
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
                map((response) => {

                    this._logging.debug("Response from ProductsService (Create Variant)",response);

                    let newProduct = response["data"];
                    // check productVariantsAvailable exists or not in the response
                    if (!response.productVariantsAvailable) {
                        newProduct["productVariantsAvailable"] = [];
                    }

                    // Return the new product
                    return newProduct;
                })
            ))
        );
    }

    /**
     * Update Product Variant
     */

    updateVariant(id: string, variant: ProductVariant): Observable<ProductCategory>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        let queryParam = "?storeId=" + this.storeId$ + "&name=" + variant.name;

        // product-service/v1/swagger-ui.html#/store-category-controller/putStoreProductAssetsByIdUsingPUT
        return this._httpClient.put<any>(productService + '/store-categories/' + id + queryParam, header);
    }

    /**
     * Update Product Variant
     */
    deleteVariant(productId:string, variantId:string, variant: ProductVariant){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
      
        return this._products.pipe(
            take(1),
            switchMap(products => this._httpClient.delete(productService + '/stores/' + this.storeId$ + '/products/' + productId + '/variants/' + variant.id, header).pipe(
                map((response) => {

                    this._logging.debug("Response from ProductsService (deleteVariant)",response);

                    // Find the index of the updated product
                    const productIndex = products.findIndex(item => item.id === productId);

                    // Find the index of the updated product inventory
                    const productVariantIndex = products[productIndex].productVariants.findIndex(element => element.id === variantId);

                    // Update the product
                    products[productIndex].productVariants[productVariantIndex] = { ...products[productIndex].productVariants[productVariantIndex], ...response["data"] };
                    
                    // Update the products
                    this._products.next(products);

                    // Return the deleted variant
                    return variant;
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
    createVariantAvailable(variantAvailable: ProductVariantAvailable, productId: string){
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

                    this._logging.debug("Response from ProductsService (Create Variant Available)",newProduct);

                    // Return the new product
                    return newProduct["data"];
                })
            ))
        );
    }

    updateVariantAvailable(id: string, variant: ProductVariant): Observable<ProductCategory>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        let queryParam = "?storeId=" + this.storeId$ + "&name=" + variant.name;

        // product-service/v1/swagger-ui.html#/store-category-controller/putStoreProductAssetsByIdUsingPUT
        return this._httpClient.put<any>(productService + '/store-categories/' + id + queryParam, header);
    }

    /**
     * Update Product Variant
     */
    deleteVariantAvailable(variantAvailable: ProductVariantAvailable, productId:string){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
      
        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.delete(productService + '/stores/' + this.storeId$ + '/products/' + productId + '/variants-available/' + variantAvailable.id, header).pipe(
                map(() => {
                    // Return the deleted variant
                    return variantAvailable;
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
                storeId: this.storeId$
            }
        };
        
        if (name !== null) {
            header.params["name"] = name;
        }

        // product-service/v1/swagger-ui.html#/store-controller/putStoreCategoryByStoreIdUsingGET
        return this._httpClient.get<any>(productService + '/store-categories',header).pipe(
            tap((categories) => {
                this._logging.debug("Response from ProductsService (getCategories)",categories);
                this._categories.next(categories["data"].content);
            })
        );
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
    getByQueryCategories(page: number = 0, size: number = 20, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = ''):
    Observable<{ pagination: ProductPagination; products: ProductCategory[] }>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page        : '' + page,
                pageSize    : '' + size,
                sortByCol   : '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                name        : '' + search,
                storeId : '' + this.storeId$,
            }
        };

        return this._httpClient.get<any>(productService  + '/store-categories',header).pipe(
            tap((response) => {

                this._logging.debug("Response from ProductsService (getByQueryCategories)",response);

                let _pagination = {
                    length: response.data.totalElements,
                    size: response.data.size,
                    page: response.data.number,
                    lastPage: response.data.totalPages,
                    startIndex: response.data.pageable.offset,
                    endIndex: response.data.pageable.offset + response.data.numberOfElements - 1
                }
                this._pagination.next(_pagination);
                this._categories.next(response.data.content);
            })
        );
    }

    /**
     * Get ctegory by id
     */
    getCategoriesById(id: string): Observable<ProductCategory>
    {
        return this._categories.pipe(
            take(1),
            map((categories) => {

                // Find the product
                const category = categories.find(item => item.id === id) || null;

                this._logging.debug("Response from ProductsService (Current Category)",category);

                // Update the product
                this._category.next(category);

                // Return the product
                return category;
            }),
            switchMap((category) => {

                if ( !category )
                {
                    return throwError('Could not found product with id of ' + id + '!');
                }

                return of(category);
            })
        );
    }
    
 
     /**
      * Create category
      *
      * @param category
      */
    createCategory(category: ProductCategory, formData: FormData = null): Observable<ProductCategory>
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
            switchMap(categories => this._httpClient.post<any>(productService + '/store-categories', formData , header).pipe(
                map((newCategory) => {

                    this._logging.debug("Response from ProductsService (createCategory)",category);

                    // Update the categories with the new category
                    this._categories.next([newCategory.data, ...categories]);

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
    updateCategory(id: string, category: ProductCategory, formdata: FormData = null, fileSource = null): Observable<ProductCategory>
    {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        let queryParam = "?storeId=" + this.storeId$ + "&name=" + category.name;

        // product-service/v1/swagger-ui.html#/store-category-controller/putStoreProductAssetsByIdUsingPUT
        return this.categories$.pipe(
            take(1),
            switchMap(categories => this._httpClient.put<any>(productService + '/store-categories/' + id + queryParam, formdata , header).pipe(
                map((newCategory) => {

                    this._logging.debug("Response from ProductsService (updateCategory)",newCategory);

                    // Find the index of the updated product
                    const index = categories.findIndex(item => item.id === id);

                    let updatedCategory = categories[index];
                    updatedCategory = category;

                    // assign sourceFile from FE back to categories
                    if (fileSource !== null) {
                        updatedCategory = Object.assign(updatedCategory,{thumbnailUrl: fileSource});
                    }
                    
                    // Update the categories
                    categories[index] = { ...categories[index], ...updatedCategory};

                    // Update the categories with the new category
                    this._categories.next(categories);

                    // Return new category from observable
                    return newCategory["data"];
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
                map((response) => {


                    this._logging.debug("Response from ProductsService (deleteCategory)", response);

                    // Find the index of the deleted category
                    const index = categories.findIndex(item => item.id === id);

                    // Delete the category
                    categories.splice(index, 1);

                    // Update the categories
                    this._categories.next(categories);

                    // Return the deleted status
                    return response["status"];
                })
            ))
        );
    }

    /**
     * Get Product Package Options
     * 
     * @param name
     */
    getProductPackageOptions(packageId: string): Observable<ProductPackageOption[]>
    {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

        return this._httpClient.get<any>(productService + '/stores/' + this.storeId$ + '/package/' + packageId + '/options',header).pipe(
            tap((packages) => {
                this._logging.debug("Response from ProductsService (getProductPackageOptions)",packages);
                this._packages.next(packages.data);
            })
        );
    }

    /**
     * Add Inventory to the product
     *
     * @param product
     */
    addOptionsToProductPackage(packageId, body: ProductPackageOption): Observable<ProductInventory>{

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const now = new Date();
        const date = now.getFullYear() + "" + (now.getMonth()+1) + "" + now.getDate() + "" + now.getHours() + "" + now.getMinutes()  + "" + now.getSeconds();

        // return of();

        return this._inventories.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(products => this._httpClient.post<Product>(productService +'/stores/'+this.storeId$+'/products/' + packageId + "/inventory", body , header).pipe(
                map((newProduct) => {

                    this._logging.debug("Response from ProductsService (addOptionsToProductPackage)",newProduct);
                    // Update the products with the new product
                    // this._products.next([newProduct["data"], ...products]);

                    // Return the new product
                    return newProduct["data"];
                })
            ))
        );
    }

    createProductsOptionById(packageId, productPackage) : Observable<ProductPackageOption>
    {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        // product-service/v1/swagger-ui.html#/store-category-controller/postStoreCategoryByStoreIdUsingPOST
        return this.packages$.pipe(
            take(1),
            switchMap(packages => this._httpClient.post<ProductPackageOption>(productService + '/stores/' + this.storeId$ + '/package/' + packageId + '/options', productPackage , header).pipe(
                map((newpackage) => {
                    // Update the categories with the new category
                    this._packages.next([...packages, newpackage["data"]]);

                    this._logging.debug("Response from ProductsService (createProductsOptionById)",newpackage);

                    // Return new category from observable
                    return newpackage["data"];
                })
            ))
        );
    }

    getProductsOptionById(optionId: string): Observable<ProductPackageOption>
    {
        return this._packages.pipe(
            take(1),
            map((packages) => {

                // Find the product
                const _package = packages.find(item => item.id === optionId) || null;

                this._logging.debug("Response from ProductsService (getProductsOptionById)",_package);

                // Update the product
                this._package.next(_package);

                // Return the product
                return _package;
            }),
            switchMap((_package) => {

                if ( !_package )
                {
                    return throwError('Could not found optionId with id of ' + optionId + '!');
                }

                return of(_package);
            })
        );
    }

    updateProductsOption(packageId: string, productPackage, optionId: string) : Observable<ProductPackageOption>
    {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.packages$.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(packages => this._httpClient.put<ProductPackageOption>(productService + '/stores/' + this.storeId$ + '/package/' + packageId + '/options/' + optionId, productPackage , header).pipe(
                map((updatedPackage) => {

                    this._logging.debug("Response from ProductsService (updateProductsOptionById)",updatedPackage);

                    // Find the index of the updated product
                    const index = packages.findIndex(item => item.id === optionId);
                    
                    // Update the product
                    // packages[index] = { ...packages[index], ...updatedPackage["data"]};
                    packages[index] = updatedPackage["data"];

                    // Update the products
                    this._packages.next(packages);

                    // Return the updated product
                    return updatedPackage["data"];
                })
            ))
        );
    }

    deleteProductsOptionById(optionId: string, packageId: string): Observable<boolean>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.packages$.pipe(
            take(1),
            switchMap(packages => this._httpClient.delete<any>(productService + '/stores/' + this.storeId$ + '/package/' + packageId + '/options/' + optionId, header).pipe(
                map((response) => {
                    
                    // Find the index of the deleted product
                    const index = packages.findIndex(item => item.id === optionId);

                    // Delete the product
                    packages.splice(index, 1);

                    this._logging.debug("Response from ProductsService (deleteProductsOptionById)",response);

                    // Return the deleted status
                    return response.status;
                })
            ))
        );
    }

}