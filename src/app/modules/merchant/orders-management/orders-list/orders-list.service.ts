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
                
                this._logging.debug("Response from OrdersService (getOrders)",response);

                // Pagination
                let _pagination = {
                    length: response["data"].totalElements,
                    size: response["data"].size,
                    page: response["data"].number,
                    lastPage: response["data"].totalPages,
                    startIndex: response["data"].pageable.offset,
                    endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                }
                this._logging.debug("Response from OrdersService (getOrders pagination)",_pagination);

                // this is observable service
                this._pagination.next(_pagination);
                this._orders.next(response["data"].content);
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

        return this._httpClient.put<Order>(orderService + '/orders/' + orderId + '/completion-status-updates', body , header).pipe(
            map((updatedOrder) => {

                this._logging.debug("Response from ProductsService (updateOrder)",updatedOrder);

                // Return the updated product
                return updatedOrder["data"];
            })
        );
    }

    updateCompletion(orderId, nextCompletionStatus)
    {

        let orderService = this._apiServer.settings.apiServer.orderService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.orders$.pipe(
            take(1),
            switchMap(orders => this._httpClient.get<Order>(orderService + '/orders/details/' + orderId, header).pipe(
                map((response) => {

                    this._logging.debug("Response from OrdersService (updateCompletion) - Get Details By OrderId",response);

                    // Find the index of the updated product
                    const index = orders.findIndex(item => item.order.id === orderId);

                    console.log("huhuh",response["data"])
                    // let newResponse = orders[index];
                    // newResponse.currentComp
                    
                    // Update the product
                    orders[index] = { ...orders[index], ...response["data"]};

                    // Update the products
                    this._orders.next(orders);

                    // Return the updated product
                    return response["data"];
                })
            ))
        );

        // this.orders$.subscribe((response)=>{

        //     let _orders = response;

            
        //     _orders.forEach(item => {
        //         if (item.id === orderId) {
        //             item.completionStatus = nextCompletionStatus;
        //         } 
        //     })


        //     this._orders.next(_orders);;
        // });
    }

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
