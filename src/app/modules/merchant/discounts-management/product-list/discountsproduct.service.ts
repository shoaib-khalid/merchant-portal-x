import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ApiResponseModel, StoreDiscountProduct, StoreDiscountProductPagination } from './discountsproduct.types';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { Product, ProductPagination } from 'app/core/product/inventory.types';

@Injectable({
    providedIn: 'root'
})
export class DiscountsProductService
{
    // Private
    //for discount product service
    private _discountProduct: BehaviorSubject<StoreDiscountProduct | null> = new BehaviorSubject(null);
    private _discountsProduct: BehaviorSubject<StoreDiscountProduct[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<StoreDiscountProductPagination | null> = new BehaviorSubject(null);

    //for product 
    private _product: BehaviorSubject<Product | null> = new BehaviorSubject(null);
    private _products: BehaviorSubject<Product[]| null> = new BehaviorSubject(null);
    private _productPagination: BehaviorSubject<ProductPagination | null> = new BehaviorSubject(null);


    // private static readonly SERVICE_URL = `${_apiServer.settings.apiServer.productService}/core2/tnt/dm/cms-posts`;
  
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _logging: LogService,
        private _jwt: JwtService,
        private _fuseConfirmationService: FuseConfirmationService,
    )

    {
    }

    get discount$(): Observable<StoreDiscountProduct>
    {
        return this._discountProduct.asObservable();
    }

    get discounts$(): Observable<StoreDiscountProduct[]>
    {
        return this._discountsProduct.asObservable();
    }

    get pagination$(): Observable<StoreDiscountProductPagination>
    {
        return this._pagination.asObservable();
    }

    get productpagination$(): Observable<ProductPagination>
    {
        return this._productPagination.asObservable();
    }

    get product$(): Observable<Product>
    {
        return this._product.asObservable();
    }

    get products$(): Observable<Product[]>
    {
        return this._products.asObservable();
    }

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }

    get storeId$(): string
    {
         return localStorage.getItem('storeId') ?? '';
    }

    get httpOptions$() {
        return {
          headers: new HttpHeaders().set("Authorization", `Bearer ${this.jwtToken$}`),
        };
    }
    
    get jwtToken$(){
        return this._jwt.getJwtPayload(this.accessToken).act;
    }

    get productService$()
    {
        return this._apiServer.settings.apiServer.productService;
    }

    // -----------------------------------------------------------------------------------------------------
    // Product Discount
    // -----------------------------------------------------------------------------------------------------

    getDiscountsProduct(discountId):Observable<StoreDiscountProduct>
    {
        return this._httpClient.get<any>(this.productService$ +'/stores/'+this.storeId$+'/discount/'+discountId+'/product', this.httpOptions$).pipe(
            tap((response) => {

                this._logging.debug("Response from DiscountsService",response);

                
            let _pagination = {
                length: response.data.totalElements,
                size: response.data.size,
                page: response.data.number,
                lastPage: response.data.totalPages,
                startIndex: response.data.pageable.offset,
                endIndex: response.data.pageable.offset + response.data.numberOfElements - 1
            }
            this._pagination.next(_pagination);
            this._discountsProduct.next(response.data.content);

            })
        );
    }

    getByQueryDiscountsProduct(discountId:string,page: number = 0, size: number = 5, order: 'asc' | 'desc' | '' = 'asc'):
    Observable<{ pagination: StoreDiscountProductPagination; products: StoreDiscountProduct[] }>
{

    const headerParam = {
   
        params: {
            page        : '' + page,
            pageSize    : '' + size,
            sortingOrder: '' + order.toUpperCase(),
        }
    };

    const header = Object.assign(this.httpOptions$, headerParam);

    return this._httpClient.get<any>(this.productService$ +'/stores/'+this.storeId$+'/discount/'+discountId+'/product', header).pipe(
        tap((response) => {

            this._logging.debug("RRRRRRRRRRRRRRRRRRRRRRRRt",response);

            let _pagination = {
                length: response.data.totalElements,
                size: response.data.size,
                page: response.data.number,
                lastPage: response.data.totalPages,
                startIndex: response.data.pageable.offset,
                endIndex: response.data.pageable.offset + response.data.numberOfElements - 1
            }
            this._pagination.next(_pagination);
            this._discountsProduct.next(response.data.content);
        })
    );
}

    getDiscountById(id: string): Observable<StoreDiscountProduct>
    {
        return this._discountsProduct.pipe(
            take(1),
            map((discounts) => {

                // Find the discount
                const discount = discounts.find(item => item.id === id) || null;

                this._logging.debug("Response from DiscountsService (Current StoreDiscountProduct)",discount);

                // Update the discount
                this._discountProduct.next(discount);

                // Return the discount
                return discount;
            }),
            switchMap((discount) => {

                if ( !discount )
                {
                    return throwError('Could not found discount with id of ' + id + '!');
                }

                return of(discount);
            })
        );
    }

    getStoreDiscountProduct(discountId: string) : Observable<ApiResponseModel<StoreDiscountProduct>>
    {

        return this._httpClient.get<ApiResponseModel<StoreDiscountProduct>>(this.productService$ +'/stores/'+this.storeId$+'/discount/'+discountId+'/product',this.httpOptions$);
    }


    createProductDiscount(discountId: string, discountProduct:StoreDiscountProduct ): Observable<StoreDiscountProduct>
    {
        return this.discount$.pipe(
            take(1),
            switchMap(_discountProduct => this._httpClient.post<any>(this.productService$ + '/stores/' + this.storeId$ + '/discount/' + discountId + '/product' , discountProduct , this.httpOptions$).pipe(
                map((newdiscountProduct) => {

                    // Return the new discount
                    return newdiscountProduct;
                })
            ))
        );
    }

    updateProductDiscount(discountId: string, body: StoreDiscountProduct): Observable<StoreDiscountProduct>
    {
        return this.discounts$.pipe(
            take(1),
            // switchMap(discounts => this._httpClient.post<InventoryDiscount>('api/apps/ecommerce/inventory/discount', {}).pipe(
            switchMap(discounts => this._httpClient.put<StoreDiscountProduct>(this.productService$ + '/stores/' + this.storeId$ + '/discount/'+ discountId + '/product', body , this.httpOptions$).pipe(
                map((updatedDiscount) => {

                    // // Find the index of the updated discount
                    // const index = discounts.findIndex(item => item.id === discountId);

                    // // Update the discount
                    // discounts[index] = { ...discounts[index], ...updatedDiscount["data"]};

                    // // Update the discounts
                    // this._discountsProduct.next(discounts);

                    // Return the updated discount
                    return updatedDiscount["data"];
                })
            ))
        );
    }

    deleteDiscountProduct(discountId,discountProductId: string): Observable<boolean>
    {
       
        return this.discounts$.pipe(
            take(1),
            switchMap(discounts => this._httpClient.delete(this.productService$ +'/stores/'+this.storeId$+'/discount/'+discountId + '/product/'+discountProductId, this.httpOptions$).pipe(
                map((status: number) => {

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

    
    // -----------------------------------------------------------------------------------------------------
    // Product Service
    // -----------------------------------------------------------------------------------------------------
    // this service we use for dropdown listing
    getProducts():Observable<ApiResponseModel<Product[]>>
    {
        return this._httpClient.get<ApiResponseModel<Product[]>>(this.productService$ +'/stores/'+this.storeId$+'/products', this.httpOptions$).pipe(
            tap((response : ApiResponseModel<Product[]>) => {

                this._logging.debug("Response from Product Service in Product Discount Service",response);

                // this._products.next(response.data);
            })
        );
    }

    getProductById(productId:string):Observable<ApiResponseModel<Product>>
    {
        return this._httpClient.get<ApiResponseModel<Product>>(this.productService$ +'/stores/'+this.storeId$+'/products/'+productId, this.httpOptions$).pipe(
            tap((response : ApiResponseModel<Product>) => {

                this._logging.debug("Response from Product Service in Product Discount Service",response);

                // this._product.next(response.data);
            })
        );

    }

    getByQueryProducts(page: number = 0, size: number = 20, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', status: string = 'ACTIVE,INACTIVE',categoryId?:string):
    Observable<{ pagination: ProductPagination; products: Product[] }>
{

    const headerParam = {
   
        params: {
            page        : '' + page,
            pageSize    : '' + size,
            sortByCol   : '' + sort,
            sortingOrder: '' + order.toUpperCase(),
            name        : '' + search,
            status      : '' + status
        }
    };
    if (categoryId) {
        headerParam.params["categoryId"] = categoryId;
      }
    const header = Object.assign(this.httpOptions$, headerParam);

    return this._httpClient.get<any>(this.productService$ +'/stores/'+this.storeId$+'/products', header).pipe(
        tap((response) => {

            this._logging.debug("Response from ProductsService",response);

            let _productPagination = {
                length: response.data.totalElements,
                size: response.data.size,
                page: response.data.number,
                lastPage: response.data.totalPages,
                startIndex: response.data.pageable.offset,
                endIndex: response.data.pageable.offset + response.data.numberOfElements - 1
            }
            this._productPagination.next(_productPagination);
            this._products.next(response.data.content);
        })
    );
}


}
