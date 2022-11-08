import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Product, ProductVariant, ProductInventory, ProductCategory, ProductPagination, ProductVariantAvailable, ProductPackageOption, ProductAssets, ProductCategoryPagination, DeliveryVehicleType, ApiResponseModel, ProductInventoryItem, ParentCategory, AddOnGroupTemplate, AddOnItemTemplate, AddOnGroupProduct, AddOnItemProduct, AddOnProduct } from 'app/core/product/inventory.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from '../logging/log.service';
import { AuthService } from '../auth/auth.service';

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
    private _categoryPagination: BehaviorSubject<ProductCategoryPagination | null> = new BehaviorSubject(null);
    private _parentCategories: BehaviorSubject<ParentCategory[] | null> = new BehaviorSubject(null);

    private _inventory: BehaviorSubject<ProductInventory | null> = new BehaviorSubject(null);
    private _inventories: BehaviorSubject<ProductInventory[] | null> = new BehaviorSubject(null);

    private _package: BehaviorSubject<ProductPackageOption | null> = new BehaviorSubject(null);
    private _packages: BehaviorSubject<ProductPackageOption[] | null> = new BehaviorSubject(null);

    private _productPaginationForCombo: BehaviorSubject<ProductPagination | null> = new BehaviorSubject(null);
    private _productsForCombo: BehaviorSubject<Product[] | null> = new BehaviorSubject(null);

    private _addOnGroupTemplate: BehaviorSubject<AddOnGroupTemplate | null> = new BehaviorSubject(null);
    private _addOnGroupTemplates: BehaviorSubject<AddOnGroupTemplate[] | null> = new BehaviorSubject(null);

    private _addOnItemTemplate: BehaviorSubject<AddOnItemTemplate | null> = new BehaviorSubject(null);
    private _addOnItemTemplates: BehaviorSubject<AddOnItemTemplate[] | null> = new BehaviorSubject(null);

    private _addOnGroupProduct: BehaviorSubject<AddOnGroupProduct | null> = new BehaviorSubject(null);
    private _addOnGroupProducts: BehaviorSubject<AddOnGroupProduct[] | null> = new BehaviorSubject(null);

    private _addOnItemProduct: BehaviorSubject<AddOnItemProduct | null> = new BehaviorSubject(null);
    private _addOnItemProducts: BehaviorSubject<AddOnItemProduct[] | null> = new BehaviorSubject(null);
    
    private _addOnsProduct: BehaviorSubject<AddOnProduct[] | null> = new BehaviorSubject(null);
    private _addOnProduct: BehaviorSubject<AddOnProduct | null> = new BehaviorSubject(null);
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _authService: AuthService,
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
     * Setter for product
     *
     * @param value
     */
    set product(value: Product)
    {
        // Store the value
        this._product.next(value);
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
     * Getter for products for combo
     */
     get productsForCombo$(): Observable<Product[]>
     {
         return this._productsForCombo.asObservable();
     }
 
     /**
      * Getter for product pagination for combo
      */
     get productPaginationForCombo$(): Observable<ProductPagination>
     {
         return this._productPaginationForCombo.asObservable();
     }

    /**
     * Getter for categories
     */
    get categories$(): Observable<ProductCategory[]>
    {
        return this._categories.asObservable();
    }

    /**
     * Getter for pagination
     */
    get categoriesPagination$(): Observable<ProductCategoryPagination>
    {
        return this._categoryPagination.asObservable();
    }

    /**
     * Getter for parent categories
     */
    get parentCategories$(): Observable<ParentCategory[]>
    {
        return this._parentCategories.asObservable();
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
     * Getter for storeId
     */
 
    get storeId$(): string
    {
        return localStorage.getItem('storeId') ?? '';
    }

    // ------------------
    // Add On
    // ------------------

    /** Getter for addOnGroupTemplate */
    get addOnGroupTemplate$(): Observable<AddOnGroupTemplate> { return this._addOnGroupTemplate.asObservable(); }

    /** Setter for addOnGroupTemplate */
    set addOnGroupTemplate(value: AddOnGroupTemplate) { this._addOnGroupTemplate.next(value); }

    /** Getter for addOnGroupTemplates */
    get addOnGroupTemplates$(): Observable<AddOnGroupTemplate[]> { return this._addOnGroupTemplates.asObservable(); }

    /** Getter for addOnItemTemplate */
    get addOnItemTemplate$(): Observable<AddOnItemTemplate> { return this._addOnItemTemplate.asObservable(); }

    /** Getter for addOnItemTemplates */
    get addOnItemTemplates$(): Observable<AddOnItemTemplate[]> { return this._addOnItemTemplates.asObservable(); }

    /** Getter for addOnGroupProduct */
    get addOnGroupProduct$(): Observable<AddOnGroupProduct> { return this._addOnGroupProduct.asObservable(); }

    /** Getter for addOnGroupProducts */
    get addOnGroupProducts$(): Observable<AddOnGroupProduct[]> { return this._addOnGroupProducts.asObservable(); }

    /** Getter for addOnItemProduct */
    get addOnItemProduct$(): Observable<AddOnItemProduct> { return this._addOnItemProduct.asObservable(); }

    /** Getter for addOnItemProducts */
    get addOnItemProducts$(): Observable<AddOnItemProduct[]> { return this._addOnItemProducts.asObservable(); }

    /** Getter for addOnProduct */
    get addOnProduct$(): Observable<AddOnProduct> { return this._addOnProduct.asObservable(); }

    /** Getter for addOnsProduct */
    get addOnsProduct$(): Observable<AddOnProduct[]> { return this._addOnsProduct.asObservable(); }

    /** Setter for addOnsProduct */
    set addOnsProduct(value: any){ this._addOnsProduct.next(value); }

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
    getProducts(page: number = 0, size: number = 10, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', status: string = 'ACTIVE,INACTIVE,OUTOFSTOCK', categoryId: string = ''):
        Observable<{ pagination: ProductPagination; products: Product[] }>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page        : '' + page,
                pageSize    : '' + size,
                sortByCol   : '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                name        : '' + search,
                status      : '' + status,
                categoryId  : '' + categoryId,
                showAllPrice: true
            }
        };

        if (categoryId === null || categoryId === '') delete header.params.categoryId;
        if (search === null || search === '') delete header.params.name;

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
     * Get all products for product list in combo section
     * 
     * @returns 
     */
    getAllProducts():Observable<{products: Product[]}>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.get<{products: Product[]}>(productService +'/stores/'+this.storeId$+'/products', header).pipe(
            tap((response) => {

                this._logging.debug("Response from ProductsService (getAllProducts)", response);

                // this._products.next(response.data);
            })
        );
    }

    /**
     * 
     * Get products for product list in combo section
     * 
     * @param page 
     * @param size 
     * @param sort 
     * @param order 
     * @param search 
     * @param status 
     * @param categoryId 
     * @returns 
     */
    getProductsForCombo(page: number = 0, size: number = 10, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', status: string = 'ACTIVE,INACTIVE', categoryId: string = ''):
        Observable<{ pagination: ProductPagination; products: Product[] }>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page        : '' + page,
                pageSize    : '' + size,
                sortByCol   : '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                name        : '' + search,
                status      : '' + status,
                categoryId  : '' + categoryId,
                showAllPrice: true
            }
        };

        if (categoryId === null || categoryId === '') delete header.params.categoryId;

        return this._httpClient.get<any>(productService +'/stores/'+this.storeId$+'/products', header).pipe(
            tap((response) => {

                this._logging.debug("Response from ProductsService (getProductsForCombo)", response);

                let _pagination = {
                    length: response.data.totalElements,
                    size: response.data.size,
                    page: response.data.number,
                    lastPage: response.data.totalPages,
                    startIndex: response.data.pageable.offset,
                    endIndex: response.data.pageable.offset + response.data.numberOfElements - 1
                }
                this._productPaginationForCombo.next(_pagination);
                this._productsForCombo.next(response.data.content);
            })
        );
    }

    /**
     * Get product by ID without calling API
     */
    getProductsById(id: string): Observable<Product>
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
     * Get product by ID by calling API
     * 
     * @param productId 
     * @returns 
     */
    getProductById(productId:string):Observable<Product>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.get<Product>(productService +'/stores/'+this.storeId$+'/products/'+productId, header).pipe(
            tap((response) => {

                this._logging.debug("Response from ProductsService (getProductById)", response);

                // Update the product
                this._product.next(response["data"]);

            })
        );

    }


    /**
     * Create product
     */
    createProduct(productBody: Product): Observable<Product>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

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
                    return _newProduct;
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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.put<Product>(productService + '/stores/' + this.storeId$ + '/products/' + id, product , header).pipe(
                map((updatedProduct) => {

                    this._logging.debug("Response from ProductsService (updateProduct)", updatedProduct);

                    // Find the index of the updated product
                    const index = products.findIndex(item => item.id === id);

                    if (!updatedProduct["data"].thumbnailUrl){
                        updatedProduct["data"]["thumbnailUrl"] = null;
                    }
                    
                    // Update the product
                    products[index] = { ...products[index], ...updatedProduct["data"]};

                    // Update the products
                    this._products.next(products);
                    this._productsForCombo.next(products);

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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
      
        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.delete(productService +'/stores/'+this.storeId$+'/products/'+id, header).pipe(
                map((status: number) => {

                    this._logging.debug("Response from ProductsService (deleteProduct)", status);

                    // Find the index of the deleted product
                    const index = products.findIndex(item => item.id === id);

                    // Delete the product
                    products.splice(index, 1);

                    // Update the products
                    this._products.next(products);
                    this._productsForCombo.next(products);

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
     * Delete many products
     *
     * @param id
     */
    deleteProductInBulk(ids: string[]): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
      
        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.post(productService +'/stores/'+this.storeId$+'/products/bulk-delete', ids, header).pipe(
                map((status) => {

                    this._logging.debug("Response from ProductsService (deleteProductInBulk)", status);

                    // Return the deleted status
                    return status['status'];
                })
            ))
        );
    }

    /**
     * Get product assets by id
     */

    async getProductAssetsById(productId){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        let response = await this._httpClient.get<any>(productService + '/stores/' + this.storeId$ + '/products/' + productId + '/assets').toPromise();

        this._logging.debug("Response from ProductsService (getProductAssetsById)", response);

        return response.data;
    }

    /**
     * Add assets to the product
     *
     * @param product
     */
    addProductAssets(productId: string, formData: FormData = null, productAssets: ProductAssets, assetIndex: number = null, url: any = null): Observable<ProductAssets>{

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                itemCode: productAssets.itemCode,
                isThumbnail: productAssets.isThumbnail,
                url
            }
        };

        if (!productAssets.itemCode || productAssets.itemCode == "") {
            delete header.params.itemCode;
        }
        if (!url || url === "") {
            delete header.params.url;
        }

        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.post<Product>(productService +'/stores/' + this.storeId$ + '/products/' + productId + "/assets", formData , header).pipe(
                map((response) => {

                    this._logging.debug("Response from ProductsService (addProductAssets)", response);
                    
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
                    
                    if (response["data"].isThumbnail === true) {
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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const body = {
            productId: product.id,
            itemCode: productInventory.itemCode,
            price: productInventory.price,
            compareAtprice: 0,
            quantity: productInventory.quantity,
            sku: productInventory.sku,
            status: productInventory.status? productInventory.status : "NOTAVAILABLE",
            dineInPrice: productInventory.dineInPrice
        };

        // Delete empty value
        if (productInventory.price === null || productInventory.price === undefined) {
            delete body.price;
        }
        if (productInventory.dineInPrice === null || productInventory.dineInPrice === undefined) {
            delete body.dineInPrice;
        }

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
     * Add Inventory to the product
     *
     * @param product
     */
    addInventoryToProductBulk(productId: string, bodies): Observable<any>{

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.post<ProductInventory>(productService +'/stores/'+this.storeId$+'/products/' + productId + "/inventory/bulk", bodies , header).pipe(
                map((newInventory) => {

                    this._logging.debug("Response from ProductsService (addInventoryToProduct- Bulk)", newInventory);

                    // Return the new product
                    return newInventory["data"];
                })
            ))
        );
    }

    /**
     * Add Inventory item to the product
     *
     * @param product
     */
     addInventoryItemToProduct(product: Product, productInventory){

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const body = {
            "productId": productInventory.productId,
            "itemCode": productInventory.itemCode,
            "productVariantAvailableId": productInventory.productVariantAvailableId,
            "sequenceNumber": productInventory.sequenceNumber,
        };

        return this._httpClient.post<any>(productService +'/stores/'+this.storeId$+'/products/' + product.id + "/inventory-item", body , header).toPromise();
    }

    addInventoryItemToProductBulk( productId: string, storeId: string, bodies: ProductInventoryItem[]) : Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.post<any>(productService + '/stores/' + this.storeId$ + '/products/' + productId + "/inventory-item/bulk-item", bodies , header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from ProductsService (addInventoryItemToProduct- Bulk)", response);

                    return response["data"];
                })
            );
    }

    /**
     * Update Inventory to the product
     *
     * @param product
     */
    updateInventoryToProduct(productId: string, productInventoriesId: string, productInventory): Observable<ProductInventory>{

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const body = {
            productId: productId,
            itemCode: productInventory.itemCode,
            price: productInventory.price,
            compareAtprice: 0,
            quantity: productInventory.quantity,
            sku: productInventory.sku,
            status: productInventory.status? productInventory.status : "NOTAVAILABLE",
            dineInPrice: productInventory.dineInPrice
        };

        // Delete empty value
        if (productInventory.price === null || productInventory.price === undefined) {
            delete body.price;
        }
        if (productInventory.dineInPrice === null || productInventory.dineInPrice === undefined) {
            delete body.dineInPrice;
        }

        return this._products.pipe(
            take(1),
            switchMap(products => this._httpClient.put<Product>(productService +'/stores/'+this.storeId$+'/products/' + productId + "/inventory/" + productInventoriesId, body , header).pipe(
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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._products.pipe(
            take(1),
            switchMap(products => this._httpClient.delete<Product>(productService +'/stores/'+this.storeId$+'/products/' + productId + "/inventory/" + productInventoriesId, header).pipe(
                map((response) => {

                    this._logging.debug("Response from ProductsService (deleteInventoryToProduct)",response);

                    // // Find the index of the updated product
                    // const productIndex = products.findIndex(item => item.id === productId);

                    // // Find the index of the updated product inventory
                    // const productInventoryIndex = products[productIndex].productInventories.findIndex(element => element.itemCode === response["data"].itemCode);

                    // // Update the product
                    // products[productIndex].productInventories.splice(productInventoryIndex, 1);
                    
                    // // Update the products
                    // this._products.next(products);

                    // Return the new product
                    return response["data"];
                })
            ))
        );
    }


    getVariants(): Observable<ProductVariant[]>{
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

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
    createVariant(variant: ProductVariant, productId: string): Observable<ProductVariant>{
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const now = new Date();
        const date = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes()  + ":" + now.getSeconds();

        // variant.id = '1234'
        // return of (variant)
        
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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        // return of ()
      
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


    // async getVariantAvailable(productId: string)
    // {
    //     let productService = this._apiServer.settings.apiServer.productService;
    //     let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

    //     const header = {
    //         headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            
    //     };

    //     let response = await this._httpClient.get<any>(productService +'/stores/'+ this.storeId$ +'/products/' + productId + '/variants-available', header).toPromise();
        
    //     return response.data;
            
    // }

    /**
     * Get Variant available
     * 
     * @param productId
     */
    getVariantAvailable(productId: string): Observable<ProductVariantAvailable[]>
    {

    let productService = this._apiServer.settings.apiServer.productService;
    let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

    const header = {
        headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
    };

    return this._httpClient.get<ProductVariantAvailable[]>(productService +'/stores/'+ this.storeId$ +'/products/' + productId + '/variants-available', header).pipe(
        map((response) => {
            this._logging.debug("Response from ProductsService (getVariantAvailable)", response);
            return response['data']
        })
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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

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

    createVariantAvailableBulk(variantAvailable: ProductVariantAvailable[], productId: string){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const now = new Date();
        const date = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes()  + ":" + now.getSeconds();

        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.post<ProductVariantAvailable>(productService + '/stores/' + this.storeId$ + '/products/' + productId + "/variants-available/bulk", variantAvailable , header).pipe(
                map((newProduct) => {

                    this._logging.debug("Response from ProductsService (Create Variant Available in Bulk)", newProduct);

                    // Return the new product
                    return newProduct;
                })
            ))
        );
    }

    updateVariantAvailable(id: string, variant: ProductVariant): Observable<ProductCategory>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        let queryParam = "?storeId=" + this.storeId$ + "&name=" + variant.name;

        // product-service/v1/swagger-ui.html#/store-category-controller/putStoreProductAssetsByIdUsingPUT
        return this._httpClient.put<any>(productService + '/store-categories/' + id + queryParam, header);
    }

    updateVariantAvailableBulk(variantAvailable: ProductVariantAvailable[], productId: string){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        // return of()
        return this.products$.pipe(
            take(1),
            switchMap(products => this._httpClient.put<ProductVariantAvailable>(productService + '/stores/' + this.storeId$ + '/products/' + productId + "/variants-available/bulk", variantAvailable , header).pipe(
                map((newProduct) => {

                    this._logging.debug("Response from ProductsService (Update Variant Available in Bulk)", newProduct);

                    // Return the new product
                    return newProduct;
                })
            ))
        );
    }

    /**
     * Update Product Variant
     */
    deleteVariantAvailable(variantAvailable: ProductVariantAvailable, productId:string){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

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
    Observable<{ pagination: ProductCategoryPagination; products: ProductCategory[] }>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

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
                this._categoryPagination.next(_pagination);
                this._categories.next(response.data.content);
            })
        );
    }

    getParentCategories(page: number = 0, size: number = 20, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', verticalcode:string=''):
    Observable<ParentCategory[]>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page        : '' + page,
                pageSize    : '' + size,
                sortByCol   : '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                name        : '' + search,
                verticalCode        : '' + verticalcode,

            }
        };

        return this._httpClient.get<any>(productService  + '/store-categories', header).pipe(
            map((response) => {

                this._logging.debug("Response from getParentCategories (getParentCategories)", response);

                this._parentCategories.next(response.data["content"]);

                return response.data["content"]
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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                name: category.name,
                storeId: this.storeId$,
                parentCategoryId:category.parentCategoryId 
            }
        };

        if (!category.parentCategoryId || category.parentCategoryId === "") {
            delete header.params['parentCategoryId'];
        }
        
        // product-service/v1/swagger-ui.html#/store-category-controller/postStoreCategoryByStoreIdUsingPOST
        return this.categories$.pipe(
            take(1),
            switchMap(categories => this._httpClient.post<any>(productService + '/store-categories', formData , header).pipe(
                map((newCategory) => {

                    this._logging.debug("Response from ProductsService (createCategory)",category);

                    // Update the categories with the new category
                    this._categories.next([newCategory.data, ...categories]);
                    
                    let paginationNumber = this._categoryPagination["_value"]
                    
                    paginationNumber.length = paginationNumber.length + 1
                        
                    this._categoryPagination.next(paginationNumber)
                    
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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                name: category.name,
                storeId: this.storeId$,
                parentCategoryId:category.parentCategoryId 
            }
        };

        if (!category.parentCategoryId || category.parentCategoryId === "") {
            delete header.params['parentCategoryId'];
        }
        
        // product-service/v1/swagger-ui.html#/store-category-controller/putStoreProductAssetsByIdUsingPUT
        return this.categories$.pipe(
            take(1),
            switchMap(categories => this._httpClient.put<any>(productService + '/store-categories/' + id , formdata , header).pipe(
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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

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
                    
                    let paginationNumber = this._categoryPagination["_value"]
                    
                    paginationNumber.length = paginationNumber.length - 1
                        
                    this._categoryPagination.next(paginationNumber)

                    // Return the deleted status
                    return response["status"];
                })
            ))
        );
    }

    /**
     * Delete many categories
     *
     * @param id
     */
    deleteCategoriesInBulk(ids: string[]): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
    
        return this._categories.pipe(
            take(1),
            switchMap(categories => this._httpClient.post(productService +'/store-categories/' + this.storeId$ + '/bulk-delete', ids, header).pipe(
                map((status) => {

                    this._logging.debug("Response from ProductsService (deleteCategoriesInBulk)", status);

                    // Return the deleted status
                    return status['status'];
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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        // Delete empty value
        Object.keys(productPackage).forEach(key => {
            if (Array.isArray(productPackage[key])) {
                productPackage[key] = productPackage[key].filter(element => element !== null)
            }
            
            if (!productPackage[key] || (Array.isArray(productPackage[key]) && productPackage[key].length === 0)) {
                delete productPackage[key];
            }
        });

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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        // Delete empty value
        Object.keys(productPackage).forEach(key => {
            if (Array.isArray(productPackage[key])) {
                productPackage[key] = productPackage[key].filter(element => element !== null)
            }
            
            if (!productPackage[key] || (Array.isArray(productPackage[key]) && productPackage[key].length === 0)) {
                delete productPackage[key];
            }
        });

        return this.packages$.pipe(
            take(1),
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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

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


    /**
     * Get existing product name to check if the product name already exists 
     * 
     * @param name 
     * @returns 
     */
    async getExistingProductName(name:string){
        

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params:{
                productName: name
            }
        };

        let response = await this._httpClient.get<any>(productService + '/stores/' + this.storeId$ + '/products/checkname', header)
                            .pipe<any>(catchError((error:HttpErrorResponse)=>{
                                    return of(error);
                                })
                            )
                            .toPromise();


        this._logging.debug("Response from ProductsService (getExistingProductName) ", response);
        
        //if exist status = 409, if not exist status = 200
        return response.status;

    }

    getDeliveryVehicleType(): Observable<DeliveryVehicleType>
    {
        let deliveryService = this._apiServer.settings.apiServer.deliveryService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        return this._httpClient.get<any>(deliveryService + '/orders/getDeliveryVehicleType/' , header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from DeliveryService (getDeliveryVehicleType)", response);
                    return response["data"];
                })
            );
    }

    searchProduct(name: string, page: number = 0, size: number = 10,):  Observable<Product[]>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page        : '' + page,
                pageSize    : '' + size,
                name        : '' + name,
            }
        };

        return this._httpClient.get<any>(productService + '/products/search/', header).pipe(
            map((response) => {

                this._logging.debug("Response from ProductsService (searchProduct)", response);

                return response.data.content;
            })
        );
    }

    cloneStoreProducts(thisStoreId: string, otherStoreId: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                storeOwnerId : '' + otherStoreId
            }
        };

        return this._httpClient.post<any>(productService + '/stores/' + thisStoreId + '/products/clone' , null, header).pipe(
            map((response) => {
                this._logging.debug("Response from ProductsService (cloneStoreProducts )", response);

                return response;
            })
        );

    }

    cloneSelectedStoreProducts(thisStoreId: string, otherStoreId: string, productIds: string[]): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                storeBranchId : '' + otherStoreId
            }
        };

        return this._httpClient.post<any>(productService + '/stores/' + thisStoreId + '/products/selected-clone' , productIds, header).pipe(
            map((response) => {
                this._logging.debug("Response from ProductsService (cloneSelectedStoreProducts )", response);

                return response;
            })
        );

    }

    getAddOnGroupTemplates(
        params: {
            page    : number,
            pageSize: number,
            storeId : string
        } =
        {
            page    : 0,
            pageSize: 20,
            storeId : null
        }
    ): Observable<AddOnGroupTemplate[]>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        // let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let accessToken = "accessToken";

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params : params
        };

        // Delete empty value
        Object.keys(header.params).forEach(key => {
            if (Array.isArray(header.params[key])) {
                header.params[key] = header.params[key].filter(element => element !== null)
            }
            
            if (!header.params[key] || (Array.isArray(header.params[key]) && header.params[key].length === 0)) {
                delete header.params[key];
            }
        });
        
        return this._httpClient.get<any>(productService + '/addon-template-group', header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from ProductService (getAddOnGroupTemplates)", response);

                    this._addOnGroupTemplates.next(response["data"]["content"]);
                    return response["data"];
                })
            );
    }

    getAddOnGroupTemplateById(id : string): Observable<AddOnGroupTemplate>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        // let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let accessToken = "accessToken";

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        return this._httpClient.get<any>(productService + '/addon-template-group/' + id, header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from ProductService (getAddOnGroupTemplateById)", response);
                    
                    this._addOnGroupTemplate.next(response["data"]);
                    return response["data"];
                })
            );
    }

    createAddOnGroupTemplate(addOnTemplateBody: AddOnGroupTemplate): Observable<AddOnGroupTemplate>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.addOnGroupTemplates$.pipe(
            take(1),
            switchMap(templates => this._httpClient.post<AddOnGroupTemplate>(productService + '/addon-template-group', addOnTemplateBody , header).pipe(
                map((newTemplateGroup) => {

                    this._logging.debug("Response from ProductsService (createAddOnGroupTemplate)", newTemplateGroup);
                    
                    let _newTemplateGroup = newTemplateGroup["data"];

                    if (templates) {
                        this._addOnGroupTemplates.next([_newTemplateGroup, ...templates]);
                    }
                    else {
                        this._addOnGroupTemplates.next([_newTemplateGroup]);
                    }

                    // Return the new product
                    return _newTemplateGroup;
                })
            ))
        );
    }

    /**
     * Update template group
     *
     * @param id
     * @param templateBody
     */
    updateAddOnGroupTemplate(id: string, templateBody: AddOnGroupTemplate): Observable<AddOnGroupTemplate>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.addOnGroupTemplates$.pipe(
            take(1),
            switchMap(templates => this._httpClient.put<AddOnGroupTemplate>(productService + '/addon-template-group/' + id, templateBody , header).pipe(
                map((updatedTemplate) => {

                    this._logging.debug("Response from ProductsService (updateAddOnGroupTemplate)", updatedTemplate);

                    // Find the index of the updated template
                    const index = templates.findIndex(item => item.id === id);
                    
                    // Update the product
                    templates[index] = { ...templates[index], ...updatedTemplate["data"]};

                    // Update the products
                    this._addOnGroupTemplates.next(templates);

                    // Return the updated product
                    return updatedTemplate["data"];
                })
            ))
        );
    }

    /**
     * Delete the add on item template
     *
     * @param id
     */
    deleteAddOnGroupTemplate(id: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
    
        return this.addOnGroupTemplates$.pipe(
            take(1),
            switchMap(templates => this._httpClient.delete(productService +'/addon-template-group/' + id, header).pipe(
                map((status) => {

                    this._logging.debug("Response from ProductsService (deleteAddOnGroupTemplate)", status);

                    // Find the index of the deleted template
                    const index = templates.findIndex(item => item.id === id);

                    // Delete the template
                    templates.splice(index, 1);

                    // Update the templates
                    this._addOnGroupTemplates.next(templates);

                    // Return the deleted status
                    return status;
                })
            ))
        );
    }







    getAddOnItemTemplates(
        params: {
            page    : number,
            pageSize: number,
            groupId : string
        } =
        {
            page    : 0,
            pageSize: 10,
            groupId : null
        }
    ): Observable<AddOnItemTemplate[]>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        // let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let accessToken = "accessToken";

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params : params
        };

        // Delete empty value
        Object.keys(header.params).forEach(key => {
            if (Array.isArray(header.params[key])) {
                header.params[key] = header.params[key].filter(element => element !== null)
            }
            
            if (!header.params[key] || (Array.isArray(header.params[key]) && header.params[key].length === 0)) {
                delete header.params[key];
            }
        });
        
        return this._httpClient.get<any>(productService + '/addon-template-item', header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from ProductService (getAddOnItemTemplates)", response);

                    this._addOnItemTemplates.next(response["data"]["content"]);
                    return response["data"]["content"];
                })
            );
    }

    createAddOnItemTemplateBulk(addOnTemplateBodies: AddOnItemTemplate[]): Observable<AddOnItemTemplate>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.post<AddOnItemTemplate[]>(productService + '/addon-template-item/bulk', addOnTemplateBodies, header).pipe(
            map((newTemplateItem) => {

                this._logging.debug("Response from ProductsService (createAddOnItemTemplateBulk)", newTemplateItem);

                let _newTemplateItems = newTemplateItem["data"];

                // Return the new product
                return _newTemplateItems;
            })
        )

    }

    /**
     * Update template group
     *
     * @param id
     * @param templateBody
     */
    updateAddOnItemTemplate(id: string, templateBody: AddOnItemTemplate): Observable<AddOnItemTemplate>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.addOnItemTemplates$.pipe(
            take(1),
            switchMap(templates => this._httpClient.put<AddOnItemTemplate>(productService + '/addon-template-item/' + id, templateBody, header).pipe(
                map((updatedTemplate) => {

                    this._logging.debug("Response from ProductsService (updateAddOnItemTemplate)", updatedTemplate);

                    // Find the index of the updated template
                    const index = templates.findIndex(item => item.id === id);
                    
                    // Update the product
                    templates[index] = { ...templates[index], ...updatedTemplate["data"]};

                    // Update the products
                    this._addOnItemTemplates.next(templates);

                    // Return the updated product
                    return updatedTemplate["data"];
                })
            ))
        );
    }

    /**
     * Delete the add on item template
     *
     * @param id
     */
    deleteAddOnItemTemplate(id: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
    
        return this.addOnItemTemplates$.pipe(
            take(1),
            switchMap(templates => this._httpClient.delete(productService +'/addon-template-item/' + id, header).pipe(
                map((status) => {

                    this._logging.debug("Response from ProductsService (deleteAddOnItemTemplate)", status);

                    // Find the index of the deleted template
                    const index = templates.findIndex(item => item.id === id);

                    // Delete the template
                    templates.splice(index, 1);

                    // Update the templates
                    this._addOnItemTemplates.next(templates);

                    // Return the deleted status
                    return status;
                })
            ))
        );
    }



    getAddOnGroupsOnProduct( params: { productId : string } = { productId : null} )
    : Observable<AddOnGroupProduct[]>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        // let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let accessToken = "accessToken";

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params : params
        };

        // Delete empty value
        Object.keys(header.params).forEach(key => {
            if (Array.isArray(header.params[key])) {
                header.params[key] = header.params[key].filter(element => element !== null)
            }
            
            if (!header.params[key] || (Array.isArray(header.params[key]) && header.params[key].length === 0)) {
                delete header.params[key];
            }
        });
        
        return this._httpClient.get<any>(productService + '/product-addon-group', header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from ProductService (getAddOnGroupsOnProduct)", response);

                    this._addOnGroupProducts.next(response["data"]);
                    return response["data"];
                })
            );
    }

    createAddOnGroupOnProduct(addOnTemplateBody: AddOnGroupProduct): Observable<AddOnGroupProduct>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.addOnGroupProducts$.pipe(
            take(1),
            switchMap(templates => this._httpClient.post<AddOnGroupProduct>(productService + '/product-addon-group', addOnTemplateBody , header).pipe(
                map((newTemplateGroup) => {

                    this._logging.debug("Response from ProductsService (createAddOnGroupOnProduct)", newTemplateGroup);
                    
                    let _newTemplateGroup = newTemplateGroup["data"];

                    if (templates) {
                        this._addOnGroupProducts.next([_newTemplateGroup, ...templates]);
                    }
                    else {
                        this._addOnGroupProducts.next([_newTemplateGroup]);
                    }

                    // Return the new product
                    return _newTemplateGroup;
                })
            ))
        );
    }

    updateAddOnGroupOnProduct(id: string, groupBody: AddOnGroupProduct): Observable<AddOnGroupProduct>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.addOnGroupProducts$.pipe(
            take(1),
            switchMap(templates => this._httpClient.put<AddOnGroupProduct>(productService + '/product-addon-group/' + id, groupBody , header).pipe(
                map((updatedTemplate) => {

                    this._logging.debug("Response from ProductsService (updateAddOnGroupOnProduct)", updatedTemplate);

                    // Find the index of the updated template
                    const index = templates.findIndex(item => item.id === id);
                    
                    // Update the product
                    templates[index] = { ...templates[index], ...updatedTemplate["data"]};

                    // Update the products
                    this._addOnGroupProducts.next(templates);

                    // Return the updated product
                    return updatedTemplate["data"];
                })
            ))
        );
    }

    deleteAddOnGroupOnProduct(id: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
    
        return this.addOnsProduct$.pipe(
            take(1),
            switchMap(templates => this._httpClient.delete(productService +'/product-addon-group/' + id, header).pipe(
                map((status) => {

                    this._logging.debug("Response from ProductsService (deleteAddOnGroupOnProduct)", status);

                    // Find the index of the deleted template
                    const index = templates.findIndex(item => item.id === id);

                    // Delete the template
                    templates.splice(index, 1);

                    // Update the templates
                    this._addOnsProduct.next(templates);

                    // Return the deleted status
                    return status;
                })
            ))
        );
    }



    getAddOnItemsOnProduct( params: { productId : string } = { productId : null} )
    : Observable<AddOnProduct[]>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        // let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let accessToken = "accessToken";

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params : params
        };

        // Delete empty value
        Object.keys(header.params).forEach(key => {
            if (Array.isArray(header.params[key])) {
                header.params[key] = header.params[key].filter(element => element !== null)
            }
            
            if (!header.params[key] || (Array.isArray(header.params[key]) && header.params[key].length === 0)) {
                delete header.params[key];
            }
        });
        
        return this._httpClient.get<any>(productService + '/product-addon', header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from ProductService (getAddOnItemsOnProduct)", response);

                    this._addOnsProduct.next(response["data"]);
                    return response["data"];
                })
            );
    }

    createAddOnItemOnProductBulk(addOnTemplateBodies: AddOnItemProduct[]): Observable<AddOnItemProduct>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.post<AddOnItemProduct[]>(productService + '/product-addon/bulk', addOnTemplateBodies, header).pipe(
            map((newTemplateItem) => {

                this._logging.debug("Response from ProductsService (createAddOnItemOnProductBulk)", newTemplateItem);

                let _newTemplateItems = newTemplateItem["data"];

                // Return the new product
                return _newTemplateItems;
            })
        )
    }

    /**
     * Update template group
     *
     * @param id
     * @param templateBody
     */
    updateAddOnItemOnProduct(id: string, templateBody: AddOnItemProduct): Observable<AddOnItemProduct>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.addOnsProduct$.pipe(
            take(1),
            switchMap(templates => this._httpClient.put<AddOnItemProduct>(productService + '/product-addon/' + id, templateBody, header).pipe(
                map((updatedTemplate) => {

                    this._logging.debug("Response from ProductsService (updateAddOnItemOnProduct)", updatedTemplate);

                    // Find the index of the updated template
                    const index = templates.findIndex(item => item.id === id);
                    
                    // Update the product
                    templates[index] = { ...templates[index], ...updatedTemplate["data"]};

                    // Update the products
                    this._addOnsProduct.next(templates);

                    // Return the updated product
                    return updatedTemplate["data"];
                })
            ))
        );
    }

    /**
     * Delete the add on item template
     *
     * @param id
     */
    deleteAddOnItemOnProduct(id: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
    
        return this._httpClient.delete(productService +'/product-addon/' + id, header).pipe(
            map((status) => {

                this._logging.debug("Response from ProductsService (deleteAddOnItemOnProduct)", status);

                // Return the deleted status
                return status;
            })
        )        
    }

}