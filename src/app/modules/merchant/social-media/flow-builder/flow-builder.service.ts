import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { FlowBuilder, FlowBuilderPagination } from './flow-builder.types';

@Injectable({
    providedIn: 'root'
})
export class FlowBuilderService
{
    private _pagination: BehaviorSubject<FlowBuilderPagination | null> = new BehaviorSubject(null);
    private _orders: BehaviorSubject<FlowBuilder[] | null> = new BehaviorSubject(null);
    private _order: BehaviorSubject<FlowBuilder | null> = new BehaviorSubject(null);

    public data$: any;

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
     * Getter for orders
     */
    get orders$(): Observable<any>
    {
        return this._orders.asObservable();
    }

    /**
     * Getter for orders
     */
    get order$(): Observable<any>
    {
        return this._order.asObservable();
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
    get pagination$(): Observable<FlowBuilderPagination>
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
    getFlowBuilders(page: number = 0, size: number = 10, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', receiverName: string = '', phoneNumber: string = '', from: string = '', to: string = '', completionStatus: string = ''): 
    Observable<{ pagination: FlowBuilderPagination; stores: FlowBuilder[] }>
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
                sortingFlowBuilder: '' + order.toUpperCase(),
                storeId: this.storeId,
            }
        };

        if (receiverName !== "") {
            header.params["receiverName"] = receiverName;
        }

        if (phoneNumber !== "") {
            header.params["phoneNumber"] = phoneNumber;
        }
        
        return this._httpClient.get<{ pagination: FlowBuilderPagination; stores: FlowBuilder[] }>(orderService + '/orders', header)
        .pipe(
            tap((response) => {
                
                this._logging.debug("Response from FlowBuildersService (Before Reconstruct)",response);

                // Pagination
                let _pagination = {
                    length: response["data"].totalElements,
                    size: response["data"].size,
                    page: response["data"].number,
                    lastPage: response["data"].totalPages,
                    startIndex: response["data"].pageable.offset,
                    endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                }
                this._logging.debug("Response from FlowBuildersService (pagination)",_pagination);
                
                // this is local
                this._currentStores = response["data"].content;
                
                // (this._currentStores).forEach(async (item, index) => {
                    
                // });

                this._logging.debug("Response from FlowBuildersService (After Reconstruct)",this._currentStores);

                // this is observable service

                this._pagination.next(_pagination);
                this._orders.next(this._currentStores);
            })
        );
    }

    getFlowBuilderById(orderId): Observable<any>
    {
        let orderService = this._apiServer.settings.apiServer.orderService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        return this._httpClient.get<FlowBuilder>(orderService + '/orders/' + orderId, header)
        .pipe(
            tap((response) => {
                this._logging.debug("Response from FlowBuildersService (getFlowBuilderById)",response);
                this._order.next(response.data);
            })
        )
    }

    updateFlowBuilder(orderId, nextCompletionStatus): Observable<any>
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

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    async getAllflows() {
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
        let flowBuilderService: string = this._apiServer.settings.apiServer.flowBuilderService;

        let response = await this._httpClient.get(flowBuilderService + "/flow/getall/" + clientId).toPromise();
        this._logging.debug("Response from FlowBuildersService (retrieveGraph)",response);
        return response;
    }

    async retrieveGraph(flowId) {
        let flowBuilderService: string = this._apiServer.settings.apiServer.flowBuilderService;
        let response = await this._httpClient.get(flowBuilderService + "/mxgraph/" + flowId).toPromise();

        this._logging.debug("Response from FlowBuildersService (retrieveGraph)",response);
        return response;
    }

    async retrieveFlowDetails(flowId) {
        let flowBuilderService: string = this._apiServer.settings.apiServer.flowBuilderService;
        let response = await this._httpClient.get(flowBuilderService + "/flow/" + flowId).toPromise();

        this._logging.debug("Response from FlowBuildersService (retrieveFlowDetails)",response);
        return response;
    }
    
    updateFlowDetails(body, flowId) {
        let flowBuilderService: string = this._apiServer.settings.apiServer.flowBuilderService;
        
        this._httpClient.patch<any>(flowBuilderService + "/flow/" + flowId, body).toPromise
          ().then((data) => {
            this._logging.debug("Response from FlowBuildersService (updateFlowDetails)",data);
          });
      }

    postNewFlowDefaultJson(json,flowId) {
        let flowBuilderService: string = this._apiServer.settings.apiServer.flowBuilderService;
        const body: any = json;

        let response = this._httpClient.post<any>(flowBuilderService + "/mxgraph/" + flowId, body).toPromise();

        this._logging.debug("Response from FlowBuildersService (postNewFlowDefaultJson)",response);
        return response;
    }
}
