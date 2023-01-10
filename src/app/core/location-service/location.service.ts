import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppConfig } from "app/config/service.config";
import { BehaviorSubject, Observable, catchError, of, switchMap, map, take } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { LogService } from "../logging/log.service";
import { Tag, TagDetails, TagTable, ZoneTable } from "./location.types";


@Injectable({
    providedIn: 'root'
})
export class LocationService
{

    // Tags
    private _tags: BehaviorSubject<Tag[] | null> = new BehaviorSubject<Tag[]>(null);
    private _tagDetails: BehaviorSubject<TagDetails | null> = new BehaviorSubject<TagDetails>(null);
    private _tables: BehaviorSubject<ZoneTable[] | null> = new BehaviorSubject<ZoneTable[]>(null);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _authService: AuthService,
        private _apiServer: AppConfig,
        private _logging: LogService,
    )
    {
    }

    /** Getter for tags */
    get tags$(): Observable<Tag[]> { return this._tags.asObservable(); }

    /** Setter for tags */
    set tags(value: Tag[]) { this._tags.next(value); }

    /** Getter for tag details */
    get tagDetails$(): Observable<TagDetails> { return this._tagDetails.asObservable(); }

    /** Setter for tag details */
    set tagDetails(value: TagDetails) { this._tagDetails.next(value); }

    /** Getter for tables */
    get tables$(): Observable<ZoneTable[]> { return this._tables.asObservable(); }

    /** Setter for tables */
    set tables(value: ZoneTable[]) { this._tables.next(value); }
    

    getTags(params: {
        page            : number, 
        pageSize        : number, 
        sortByCol       : string, 
        sortingOrder    : 'ASC' | 'DESC' | '',
        latitude?       : number,
        longitude?      : number,
        tagKeyword      : string
    } = {
        page            : 0, 
        pageSize        : 0, 
        sortByCol       : "keyword", 
        sortingOrder    : 'ASC',
        latitude        : 0,
        longitude       : 0,
        tagKeyword      : ""
    }): Observable<Tag[]> 
    {        
        
        let locationService = this._apiServer.settings.apiServer.locationService;
        let accessToken = this._authService.publicToken;
    
        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: params
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
    
        return this._httpClient.get<Tag[]>(locationService + '/tags', header)
            .pipe(
                catchError(() =>
                    of(false)
                ),
                switchMap(async (response) => {
                    this._logging.debug("Response from LocationService (getTags)", response);
    
                    this._tags.next(response["data"].content);
                    return response["data"].content;
                })
            );
    }

    /**
     * 
     * Get Tag Details
     * @param storeId 
     * @returns 
     */
    getTagDetails(storeId: string): Observable<TagDetails[]>
    {
        let locationService = this._apiServer.settings.apiServer.locationService;
        let accessToken = this._authService.publicToken;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                storeId: storeId
            }
        }

        return this._httpClient.get<TagDetails[]>(locationService + '/tags/details', header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from LocationService (getTagDetails)", response);

                    this._tagDetails.next(response["data"]);
                    return response["data"];
                })
            );
    }

    /**
     * Get tables
     * 
     * @param storeId 
     * @returns 
     */
    getTables(storeId: string): Observable<ZoneTable[]>
    {
        let locationService = this._apiServer.settings.apiServer.locationService;
        let accessToken = this._authService.publicToken;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                storeId: storeId
            }
        }

        return this._httpClient.get<TagDetails[]>(locationService + '/tags/tables', header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from LocationService (getTables)", response);

                    this._tables.next(response["data"]);
                    return response["data"];
                })
            );
    }

    /**
     * Create zone table
     * 
     * @param zoneBody 
     * @returns 
     */
    postTableZone(zoneBody: ZoneTable):  Observable<ZoneTable>
    {        
        let locationService = this._apiServer.settings.apiServer.locationService;
        let accessToken = this._authService.publicToken;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

        return this._httpClient.post<any>(locationService + '/tag/zone', zoneBody, header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from LocationService (postZone)", response);

                    return response["data"];
                })
            );
    }

    /**
     * Edit table zone
     * 
     * @param id 
     * @param tableZoneBody 
     * @returns 
     */
    putZone(id: number, tableZoneBody: ZoneTable):  Observable<any>
    {
        let locationService = this._apiServer.settings.apiServer.locationService;
        let accessToken = this._authService.publicToken;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

        return this._httpClient.put<any>(locationService + '/tag/zone/' + id, tableZoneBody, header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from LocationService (putZone)", response);
                    
                    return response;
                })
            );
    }

    deleteZone(id: number): Observable<boolean>
    {
        let locationService = this._apiServer.settings.apiServer.locationService;
        let accessToken = this._authService.publicToken;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.tables$.pipe(
            take(1),
            switchMap(tables => this._httpClient.delete<any>(locationService + '/tag/zone/' + id, header).pipe(
                map((response) => {
                    
                    // Find the index of the deleted table
                    const index = tables.findIndex(item => item.id === id);

                    if (index > -1) {
                        // Delete the table
                        tables.splice(index, 1);
                    }

                    this._logging.debug("Response from LocationService (deleteZone)", response);

                    // Return the deleted status
                    return response.status;
                })
            ))
        );
    }

    postTablesBulk(tables: TagTable[]): Observable<any>
    {        
        let locationService = this._apiServer.settings.apiServer.locationService;
        let accessToken = this._authService.publicToken;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

        return this._httpClient.post<any>(locationService + '/tag/table/bulk', tables, header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from LocationService (postTablesBulk)", response);

                    return response["data"];
                })
            );
    }



    putTable(id: number, tableBody: TagTable):  Observable<any>
    {
        let locationService = this._apiServer.settings.apiServer.locationService;
        let accessToken = this._authService.publicToken;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

        return this._httpClient.put<any>(locationService + '/tag/table/' + id, tableBody, header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from LocationService (putTable)", response);
                    
                    return response;
                })
            );
    }

    deleteTable(id: number): Observable<boolean>
    {
        let locationService = this._apiServer.settings.apiServer.locationService;
        let accessToken = this._authService.publicToken;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.delete<any>(locationService + '/tag/table/' + id, header).pipe(
            map((response) => {

                this._logging.debug("Response from LocationService (deleteTable)", response);

                // Return the deleted status
                return response.status;
            })
        );
    }
}

