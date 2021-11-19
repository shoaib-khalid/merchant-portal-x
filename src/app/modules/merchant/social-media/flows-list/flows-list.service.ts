import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { FlowsList, FlowsListPagination } from './flows-list.types';

@Injectable({
    providedIn: 'root'
})
export class FlowsListService
{
    private _pagination: BehaviorSubject<FlowsListPagination | null> = new BehaviorSubject(null);
    private _flows: BehaviorSubject<FlowsList[] | null> = new BehaviorSubject(null);
    private _flow: BehaviorSubject<FlowsList | null> = new BehaviorSubject(null);

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
     * Getter for flows
     */
    get flows$(): Observable<any>
    {
        return this._flows.asObservable();
    }

    /**
     * Getter for flows
     */
    get flow$(): Observable<any>
    {
        return this._flow.asObservable();
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
    get pagination$(): Observable<FlowsListPagination>
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
    getFlows(page: number = 0, size: number = 10, sort: string = 'name', flow: 'asc' | 'desc' | '' = 'asc', receiverName: string = '', phoneNumber: string = '', from: string = '', to: string = '', completionStatus: string = ''): 
    Observable<{ pagination: FlowsListPagination; stores: FlowsList[] }>
    {
        

        let flowService = this._apiServer.settings.apiServer.flowBuilderService;
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
                sortingFlow: '' + flow.toUpperCase(),
                storeId: this.storeId,
            }
        };

        if (receiverName !== "") {
            header.params["receiverName"] = receiverName;
        }

        if (phoneNumber !== "") {
            header.params["phoneNumber"] = phoneNumber;
        }
        
        return this._httpClient.get<{ pagination: FlowsListPagination; stores: FlowsList[] }>(flowService + '/flow/getall/' + clientId, header)
        .pipe(
            tap((response) => {
                
                this._logging.debug("Response from FlowsService",response);
                
                this._flows.next(response["data"]);
            })
        );
    }

    getFlowById(flowId): Observable<any>
    {
        let flowService = this._apiServer.settings.apiServer.flowBuilderService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        return this._httpClient.get<FlowsList>(flowService + '/flows/' + flowId, header)
        .pipe(
            tap((response) => {
                this._logging.debug("Response from FlowsService (getFlowById)",response);
                this._flow.next(response.data);
            })
        )
    }

    updateFlow(flowId, nextCompletionStatus): Observable<any>
    {
        
        let flowService = this._apiServer.settings.apiServer.flowBuilderService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        const body = {
            flowId,
            status: '' +  nextCompletionStatus
        };

        console.log(body);

        return this._httpClient.put(flowService + '/flows/' + flowId + '/completion-status-updates', body , header);
    }

    updateCompletion(flowId, nextCompletionStatus)
    {
        this.flows$.subscribe((response)=>{
            response.forEach(item => {
                if (item.id === flowId) {
                    item.completionStatus = nextCompletionStatus;
                } 
            })
        });
    }
}
