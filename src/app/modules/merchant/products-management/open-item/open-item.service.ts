import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppConfig } from "app/config/service.config";
import { AuthService } from "app/core/auth/auth.service";
import { JwtService } from "app/core/jwt/jwt.service";
import { LogService } from "app/core/logging/log.service";
import { Product, ProductAssets, ProductInventory, ProductPagination } from "app/core/product/inventory.types";
import { BehaviorSubject, Observable, map, switchMap, take, tap, throwError, of, filter } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class OpenItemService
{

    // Private
    private _product: BehaviorSubject<Product | null> = new BehaviorSubject(null);
    private _products: BehaviorSubject<Product[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<ProductPagination | null> = new BehaviorSubject(null);
    

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _authService: AuthService,
        private _apiServer: AppConfig,
        private _logging: LogService,
        private _jwt: JwtService
    )
    {
    }

    /** Getter for storeId */
    get storeId$(): string { return localStorage.getItem('storeId') ?? ''; }

    /** Getter for open items */
    get openItems$(): Observable<Product[]> { return this._products.asObservable(); }

    /** Getter for open items pagination */
    get openItemsPagination$(): Observable<ProductPagination> { return this._pagination.asObservable(); }

    getOpenItems(
        params : {
            page: number, 
            pageSize: number,
            sortByCol: string,
            sortingOrder: 'ASC' | 'DESC' | '',
            name: string,
            status: string,
            showAllPrice: boolean,
            isCustomPrice: boolean
        } = 
        {
            page: 0, 
            pageSize: 100,
            sortByCol: 'sequenceNumber',
            sortingOrder: 'ASC',
            name: '',
            status: 'ACTIVE,INACTIVE,OUTOFSTOCK',
            showAllPrice: true,
            isCustomPrice: true
        },

        ):
        Observable<{ pagination: ProductPagination; products: Product[] }>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: params
        };

        return this._httpClient.get<any>(productService +'/stores/' + this.storeId$ + '/products', header).pipe(
            map((response) => {

                this._logging.debug("Response from ProductsService (getOpenItems)", response);

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

                return response.data.content;
            })
        );
    }

    /**
     * Get ctegory by id
     */
    getOpenItemById(id: string): Observable<Product>
    {
        return this.openItems$.pipe(
            take(1),
            map((item) => {

                // Find the product
                const product = item.find(item => item.id === id) || null;

                this._logging.debug("Response from ProductsService (Current Product)", product);

                // // Update the product
                // this._product.next(product);

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
     * Create Open Item
     */
    createOpenItem(productBody: Product): Observable<Product>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.openItems$.pipe(
            take(1),
            switchMap(products => this._httpClient.post<Product>(productService + '/stores/' + this.storeId$ + '/products', productBody , header).pipe(
                map((newProduct) => {
                    
                    // initialise variants and inventory to empty 
                    let _newProduct = newProduct["data"];
                    _newProduct["productVariants"] = [];
                    _newProduct["productAssets"] = [];
                    _newProduct["productInventories"] = [{
                        sku: null,
                        price: null,
                        quantity: null
                    }];

                    this._logging.debug("Response from ProductsService (createOpenItem)", _newProduct);

                    // Update the products with the new product
                    this._products.next([...products, _newProduct]);

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
    updateOpenItem(id: string, product: Product): Observable<Product>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.openItems$.pipe(
            take(1),
            switchMap(products => this._httpClient.put<Product>(productService + '/stores/' + this.storeId$ + '/products/' + id, product , header).pipe(
                map((updatedProduct) => {

                    this._logging.debug("Response from ProductsService (updateOpenItem)", updatedProduct);

                    // Find the index of the updated product
                    const index = products.findIndex(item => item.id === id);

                    if (!updatedProduct["data"].thumbnailUrl){
                        updatedProduct["data"]["thumbnailUrl"] = null;
                    }
                    
                    // Update the product
                    products[index] = { ...products[index], ...updatedProduct["data"]};

                    // Update the products
                    this._products.next(products);

                    // Return the updated product
                    return updatedProduct["data"];
                })
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
      
        return this.openItems$.pipe(
            take(1),
            switchMap(products => this._httpClient.delete(productService +'/stores/' + this.storeId$ + '/products/'+id, header).pipe(
                map((status: number) => {

                    this._logging.debug("Response from ProductsService (deleteProduct)", status);

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
      
        return this.openItems$.pipe(
            take(1),
            switchMap(products => this._httpClient.post(productService +'/stores/' + this.storeId$ + '/products/bulk-delete', ids, header).pipe(
                map((status) => {

                    this._logging.debug("Response from ProductsService (deleteProductInBulk)", status);

                    // Return the deleted status
                    return status['status'];
                })
            ))
        );
    }

    updateProductSequenceInBulk(editBody : { id: string, sequenceNumber: number }[]): Observable<any>
    {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                storeId: this.storeId$,
            }
        };
        
        return this._httpClient.post<any>(productService + '/stores/' + this.storeId$ + '/products/bulk-edit-sequence', editBody, header).pipe(
            tap((response) => {
                this._logging.debug("Response from ProductsService (updateProductSequenceInBulk)", response);
            })
        )
    }

    /**
     * Add Inventory to the product
     *
     * @param product
     */
    addInventoryToOpenItem(product: Product, productInventory): Observable<ProductInventory>{

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

        return this.openItems$.pipe(
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
    updateInventoryOpenItem(productId: string, productInventoriesId: string, productInventory): Observable<ProductInventory>{

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

        return this.openItems$.pipe(
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
     * Add assets to the product
     *
     * @param product
     */
    addOpenItemAssets(productId: string, formData: FormData = null, productAssets: ProductAssets, assetIndex: number = null, url: any = null): Observable<ProductAssets>{

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

        return this.openItems$.pipe(
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

    deleteOpenItemAssets(productId: string, assetId: string) : Observable<ProductAssets> {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.openItems$.pipe(
            take(1),
            switchMap(products => this._httpClient.delete<Product>(productService +'/stores/'+this.storeId$+'/products/' + productId + "/assets/" + assetId, header).pipe(
                map((response) => {

                    this._logging.debug("Response from ProductsService (deleteOpenItemAssets)",response);

                    // Find the index of the updated product
                    const index = products.findIndex(item => item.id === productId);
                    // const assetIndex = products[index].productAssets.push(response["data"]);
                    const assetIndex = products[index].productAssets.findIndex(asset => asset.id === assetId);

                    let updatedProduct = products[index].productAssets.splice(assetIndex, 1);

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

}

