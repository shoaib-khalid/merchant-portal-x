import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { Order, OrderItem, OrdersCountSummary, OrdersListPagination } from './orders-list.types';

@Injectable({
    providedIn: 'root'
})
export class OrdersListService
{
    private _pagination: BehaviorSubject<OrdersListPagination | null> = new BehaviorSubject(null);
    private _order: BehaviorSubject<Order | null> = new BehaviorSubject(null);
    private _orders: BehaviorSubject<Order[] | null> = new BehaviorSubject(null);
    private _ordersCountSummary: BehaviorSubject<OrdersCountSummary[] | null> = new BehaviorSubject(null);
    private _orderItems: BehaviorSubject<OrderItem[] | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _jwt: JwtService,
        private _logging: LogService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for orders
     */
     get order$(): Observable<any>
     {
         return this._order.asObservable();
     }

    /**
     * Getter for orders
     */
    get orders$(): Observable<any>
    {
        return this._orders.asObservable();
    }

    /**
     * Getter for orders
     */
    get ordersCountSummary$(): Observable<any>
    {
        return this._ordersCountSummary.asObservable();
    }

    /**
     * Getter for orderItems
     */
    get orderItems$(): Observable<any>
    {
        return this._orderItems.asObservable();
    }

    /**
     * Getter for access token
     */
 
    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    } 

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<OrdersListPagination>
    {
        return this._pagination.asObservable();
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
     * Get data
     */
    getOrders(page: number = 0, size: number = 10, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', receiverName: string = '', phoneNumber: string = '', from: string = '', to: string = '', completionStatus: string = ''): 
    Observable<{ pagination: OrdersListPagination; stores: Order[] }>
    {
        

        let orderService = this._apiServer.settings.apiServer.orderService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                from: '' + from,
                to: '' +  to,
                completionStatus: '' + completionStatus,
                page: '' + page,
                pageSize: '' + size,
                sortByCol: '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                storeId: this.storeId$,
            }
        };

        if (receiverName !== "") {
            header.params["receiverName"] = receiverName;
        }

        if (phoneNumber !== "") {
            header.params["phoneNumber"] = phoneNumber;
        }
        
        return this._httpClient.get<{ pagination: OrdersListPagination; stores: Order[] }>(orderService + '/orders/search', header)
        .pipe(
            tap((response) => {
                
                this._logging.debug("Response from OrdersService (Before Reconstruct)",response);

                // Pagination
                let _pagination = {
                    length: response["data"].totalElements,
                    size: response["data"].size,
                    page: response["data"].number,
                    lastPage: response["data"].totalPages,
                    startIndex: response["data"].pageable.offset,
                    endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                }
                this._logging.debug("Response from OrdersService (pagination)",_pagination);
                
                // this is local
                let _orders = response["data"].content;
                
                // (this._currentStores).forEach(async (item, index) => {
                    
                // });

                this._logging.debug("Response from OrdersService (After Reconstruct)",_orders);

                // this is observable service

                this._pagination.next(_pagination);
                this._orders.next(_orders);
            })
        );
    }

    getOrderById(orderId): Observable<any>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        return this._httpClient.get<Order>(orderService + '/orders/' + orderId, header)
        .pipe(
            tap((response) => {
                this._logging.debug("Response from OrdersService (getOrderById)",response);
                this._order.next(response.data);
            })
        )
    }

    getOrderItemsById(orderId): Observable<any>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        return this._httpClient.get<OrderItem[]>(orderService + '/orders/' + orderId + '/items', header)
        .pipe(
            tap((response) => {
                this._logging.debug("Response from OrdersService (getOrderItemsById)",response);
                this._orderItems.next(response.data);
            })
        )
    }

    updateOrder(orderId, nextCompletionStatus): Observable<any>
    {
        
        let orderService = this._apiServer.settings.apiServer.orderService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        const body = {
            orderId,
            status: '' +  nextCompletionStatus
        };

        console.log(body);

        return this.orders$.pipe(
            take(1),
            switchMap(orders => this._httpClient.put<Order>(orderService + '/orders/' + orderId + '/completion-status-updates', body , header).pipe(
                map((updatedOrder) => {

                    this._logging.debug("Response from ProductsService (updateOrder)",updatedOrder);

                    // Find the index of the updated product
                    const index = orders.findIndex(item => item.order.id === orderId);
                    
                    // Update the product
                    orders[index] = { ...orders[index], ...updatedOrder["data"]};

                    // Update the products
                    this._orders.next(orders);

                    // Return the updated product
                    return updatedOrder["data"];
                }),
                switchMap(updatedOrder => this.order$.pipe(
                    take(1),
                    filter(item => item && item.order.id === orderId),
                    tap(() => {

                        // Update the product if it's selected
                        this._order.next(updatedOrder["data"]);

                        // Return the updated product
                        return updatedOrder["data"];
                    })
                ))
            ))
        );

        // return this._httpClient.put(orderService + '/orders/' + orderId + '/completion-status-updates', body , header);
    }

    // updateCompletion(orderId, nextCompletionStatus)
    // {

    //     return this.orders$.pipe(
    //         take(1),
    //         // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
    //         switchMap(products => this._httpClient.put<Order>(productService + '/stores/' + this.storeId$ + '/products/' + id, product , header).pipe(
    //             map((updatedProduct) => {

    //                 this._logging.debug("Response from ProductsService (updateProduct)",updatedProduct);

    //                 // Find the index of the updated product
    //                 const index = products.findIndex(item => item.id === id);
                    
    //                 // Update the product
    //                 products[index] = { ...products[index], ...updatedProduct["data"]};

    //                 // Update the products
    //                 this._products.next(products);

    //                 // Return the updated product
    //                 return updatedProduct["data"];
    //             }),
    //             switchMap(updatedProduct => this.product$.pipe(
    //                 take(1),
    //                 filter(item => item && item.id === id),
    //                 tap(() => {

    //                     // Update the product if it's selected
    //                     this._product.next(updatedProduct["data"]);

    //                     // Return the updated product
    //                     return updatedProduct["data"];
    //                 })
    //             ))
    //         ))
    //     );

    //     this.orders$.subscribe((response)=>{

    //         let _orders = response;

            
    //         _orders.forEach(item => {
    //             if (item.id === orderId) {
    //                 item.completionStatus = nextCompletionStatus;
    //             } 
    //         })


    //         this._orders.next(_orders);;
    //     });
    // }

        /**
     * Get data
     */
    getOrdersCountSummary(): Observable<OrdersCountSummary[]>
    {

        let orderService = this._apiServer.settings.apiServer.orderService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

        return this._httpClient.get<OrdersCountSummary[]>(orderService + '/orders/countsummary/' + this.storeId$, header)
        .pipe(
            tap((response) => {
                
                this._logging.debug("Response from OrdersService (getOrdersCountSummary)",response);
            
                this._ordersCountSummary.next(response["data"]);
            })
        );
    }
}
