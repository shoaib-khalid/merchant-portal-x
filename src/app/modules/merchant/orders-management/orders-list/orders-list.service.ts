import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { Order, OrdersListPagination } from './orders-list.types';

@Injectable({
    providedIn: 'root'
})
export class OrdersListService
{
    private _pagination: BehaviorSubject<OrdersListPagination | null> = new BehaviorSubject(null);
    private _orders: BehaviorSubject<Order[] | null> = new BehaviorSubject(null);

    _currentStores: any = [];

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
     * Getter for data
     */
    get orders$(): Observable<any>
    {
        return this._orders.asObservable();
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
    get storeId(): string
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
                storeId: this.storeId,
            }
        };

        if (receiverName !== "") {
            header.params["receiverName"] = receiverName;
        }

        if (phoneNumber !== "") {
            header.params["phoneNumber"] = phoneNumber;
        }
        
        return this._httpClient.get<{ pagination: OrdersListPagination; stores: Order[] }>(orderService + '/orders', header)
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
                this._currentStores = response["data"].content;
                
                // (this._currentStores).forEach(async (item, index) => {
                    
                // });

                this._logging.debug("Response from OrdersService (After Reconstruct)",this._currentStores);

                // this is observable service

                this._pagination.next(_pagination);
                this._orders.next(this._currentStores);
            })
        );
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

        return this._httpClient.put(orderService + '/orders/' + orderId + '/completion-status-updates', body , header);
    }

    updateCompletion(orderId, nextCompletionStatus)
    {
        this.orders$.subscribe((response)=>{
            response.forEach(item => {
                if (item.id === orderId) {
                    item.completionStatus = nextCompletionStatus;
                } 
            })
        });
    }
}