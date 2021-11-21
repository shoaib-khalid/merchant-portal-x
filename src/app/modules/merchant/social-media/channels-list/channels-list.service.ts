import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { ChannelsList, ChannelsListPagination } from './channels-list.types';

@Injectable({
    providedIn: 'root'
})
export class ChannelsListService
{
    private _pagination: BehaviorSubject<ChannelsListPagination | null> = new BehaviorSubject(null);
    private _channels: BehaviorSubject<ChannelsList[] | null> = new BehaviorSubject(null);
    private _channel: BehaviorSubject<ChannelsList | null> = new BehaviorSubject(null);

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
     * Getter for channels
     */
    get channels$(): Observable<any>
    {
        return this._channels.asObservable();
    }

    /**
     * Getter for channels
     */
    get channel$(): Observable<any>
    {
        return this._channel.asObservable();
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
    get pagination$(): Observable<ChannelsListPagination>
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
    getChannels(page: number = 0, size: number = 10, sort: string = 'name', channel: 'asc' | 'desc' | '' = 'asc', receiverName: string = '', phoneNumber: string = '', from: string = '', to: string = '', completionStatus: string = ''): 
    Observable<{ pagination: ChannelsListPagination; stores: ChannelsList[] }>
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
        
        return this._httpClient.get<{ pagination: ChannelsListPagination; stores: ChannelsList[] }>(userService + '/userChannels/', header)
        .pipe(
            tap((response) => {
                
                this._logging.debug("Response from ChannelsService",response);

                let _pagination = {
                    length: response["data"].totalElements,
                    size: response["data"].size,
                    page: response["data"].number,
                    lastPage: response["data"].totalPages,
                    startIndex: response["data"].pageable.offset,
                    endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                }
                this._pagination.next(_pagination);
                
                this._channels.next(response["data"].content);
            })
        );
    }

    getChannelById(channelId): Observable<any>
    {
        let userService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        return this._httpClient.get<ChannelsList>(userService + '/channels/' + channelId, header)
        .pipe(
            tap((response) => {
                this._logging.debug("Response from ChannelsService (getChannelById)",response);
                this._channel.next(response.data);
            })
        )
    }

    updateChannel(channelId, nextCompletionStatus): Observable<any>
    {
        
        let userService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        const body = {
            channelId,
            status: '' +  nextCompletionStatus
        };

        console.log(body);

        return this._httpClient.put(userService + '/channels/' + channelId + '/completion-status-updates', body , header);
    }

    updateCompletion(channelId, nextCompletionStatus)
    {
        this.channels$.subscribe((response)=>{
            response.forEach(item => {
                if (item.id === channelId) {
                    item.completionStatus = nextCompletionStatus;
                } 
            })
        });
    }
}
