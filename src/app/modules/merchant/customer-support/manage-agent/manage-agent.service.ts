import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Agent, AgentPagination } from 'app/modules/merchant/customer-support/manage-agent/manage-agent.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';

@Injectable({
    providedIn: 'root'
})
export class ManageAgentService
{
    // Private
    private _agent: BehaviorSubject<Agent | null> = new BehaviorSubject(null);
    private _agents: BehaviorSubject<Agent[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<AgentPagination | null> = new BehaviorSubject(null);

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
     * Getter for agent
     */
    get agent$(): Observable<Agent>
    {
        return this._agent.asObservable();
    }

    /**
     * Getter for agents
     */
    get agents$(): Observable<Agent[]>
    {
        return this._agents.asObservable();
    }

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<AgentPagination>
    {
        return this._pagination.asObservable();
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
 
     get storeId(): string
     {
         return localStorage.getItem('storeId') ?? '';
     }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get agents
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
     getAgent(page: number = 0, size: number = 10, sort: string = 'name', channel: 'asc' | 'desc' | '' = 'asc', receiverName: string = '', phoneNumber: string = '', from: string = '', to: string = '', completionStatus: string = ''): 
     Observable<{ pagination: AgentPagination; stores: Agent[] }>
     {
         let userService = this._apiServer.settings.apiServer.userService;
         let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
         let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
 
         const header = {
             headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
             params: {
                 userId: '' + clientId,
                 from: '' + from,
                 to: '' +  to,
                 completionStatus: '' + completionStatus,
                 page: '' + page,
                 pageSize: '' + size,
                 sortByCol: '' + sort,
                 sortingChannel: '' + channel.toUpperCase(),
                 storeId: this.storeId,
             }
         };
         
         return this._httpClient.get<{ pagination: AgentPagination; stores: Agent[] }>(userService + '/clients/', header)
         .pipe(
             tap((response) => {
                 
                 this._logging.debug("Response from ManageAgentService",response);
 
                 let _pagination = {
                     length: response["data"].totalElements,
                     size: response["data"].size,
                     page: response["data"].number,
                     lastPage: response["data"].totalPages,
                     startIndex: response["data"].pageable.offset,
                     endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                 }
                 this._pagination.next(_pagination);
                 
                 this._agents.next(response["data"].content);
             })
         );
     }

    /**
     * Get agent by id
     */
     getAgentById(clientsId): Observable<any>
     {
         let userService = this._apiServer.settings.apiServer.userService;
         let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
         let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
 
         const header = {
             headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
         };
         
         return this._httpClient.get<Agent>(userService + '/clients/' + clientsId , header)
         .pipe(
             tap((response) => {
                 this._logging.debug("Response from ManageAgent (getAgentById)",response);
                 this._agent.next(response.data);
             })
         )
     }
    /**
     * Create discount
     */
     createAgent(body: Agent): Observable<Agent>
     {
         let userService = this._apiServer.settings.apiServer.productService;
         let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
         let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
 
         const header = {
             headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
         };
 
         return this.agents$.pipe(
             take(1),
             // switchMap(discounts => this._httpClient.post<InventoryDiscount>('api/apps/ecommerce/inventory/discount', {}).pipe(
             switchMap(agents => this._httpClient.post<Agent>(userService + '/clients/register' , body , header).pipe(
                 map((newAgent) => {
 
                     // Update the discounts with the new discount
                     this._agents.next([newAgent["data"], ...agents]);
 
                     // Return the new discount
                     return newAgent;
                 })
             ))
         );
     }
    

    /**
     * Update agent
     *
     * @param id
     * @param agent
     */
     updateAgent(clientsId, nextCompletionStatus): Observable<any>
     {
         
         let userService = this._apiServer.settings.apiServer.userService;
         let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
         let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
 
         const header = {
             headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
         };
         
         const body = {
             clientId,
             status: '' +  nextCompletionStatus
         };
 
         console.log(body);
 
         return this._httpClient.put(userService + '/clients/' + clientsId , body , header);
     }

         /**
     * Delete the discount
     *
     * @param discountId
     */
    deleteAgent(clientsId: string): Observable<boolean>
    {
        let userService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
      
        return this.agents$.pipe(
            take(1),
            switchMap(agents => this._httpClient.delete(userService +'/clients/'+ clientsId, header).pipe(
                map((status: number) => {

                    // Find the index of the deleted discount
                    const index = agents.findIndex(item => item.id === clientsId);

                    // Delete the discount
                    agents.splice(index, 1);

                    // Update the discounts
                    this._agents.next(agents);

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

}
