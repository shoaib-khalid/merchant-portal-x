import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Vertical } from 'app/modules/merchant/stores-management/create-store/choose-vertical/choose-vertical.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ChooseVerticalService
{
    // Private
    private _vertical: BehaviorSubject<Vertical | null> = new BehaviorSubject(null);
    private _verticals: BehaviorSubject<Vertical[] | null> = new BehaviorSubject(null);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _jwt: JwtService
        )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for verticals
     */
    get verticals$(): Observable<Vertical[]>
    {
        return this._verticals.asObservable();
    }

    /**
     * Getter for vertical
     */
    get vertical$(): Observable<Vertical>
    {
        return this._vertical.asObservable();
    }

    /**
     * Getter for access token
     */
 
     get accessToken(): string
     {
         return localStorage.getItem('accessToken') ?? '';
     } 

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get verticals
     */

    getVerticals(): Observable<Vertical[]> {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        return this._httpClient.get<any>(productService + '/region-verticals', header)
            .pipe(
                map((vertical) => {

                    // Update the vertical
                    this._verticals.next(vertical.data);

                    // Return the vertical
                    return vertical.data;
                }),
                switchMap((vertical) => {

                    if ( !vertical )
                    {
                        return throwError('Could not found vertical with id of !');
                    }

                    return of(vertical);
                })
            );     

    }

    /**
     * Get vertical by id
     */
    getVerticalById(id: string): Observable<Vertical>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                "clientId": clientId
            }
        };
        
        return this._httpClient.get<any>(productService + '/verticals', header)
        .pipe(
            map((vertical) => {

                // Update the vertical
                this._vertical.next(vertical.data.content);

                // Return the vertical
                return vertical;
            }),
            switchMap((vertical) => {

                if ( !vertical )
                {
                    return throwError('Could not found vertical with id of ' + id + '!');
                }

                return of(vertical);
            })
        );
    }

    // This fuction used to sort object
    dynamicSort(property) {
        var sortOrder = 1;
        if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a,b) {
            /* next line works with strings and numbers, 
                * and you may want to customize it to your needs
                */
            var result = (a[property].toLowerCase() < b[property].toLowerCase()) ? -1 : (a[property].toLowerCase() > b[property].toLowerCase()) ? 1 : 0;
            return result * sortOrder;
        }
    }
}
