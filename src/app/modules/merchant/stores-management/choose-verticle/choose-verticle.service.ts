import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Verticle } from 'app/modules/merchant/stores-management/choose-verticle/choose-verticle.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ChooseVerticleService
{
    // Private
    private _verticle: BehaviorSubject<Verticle | null> = new BehaviorSubject(null);
    private _verticles: BehaviorSubject<Verticle[] | null> = new BehaviorSubject(null);
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
     * Getter for verticles
     */
    get verticles$(): Observable<Verticle[]>
    {
        return this._verticles.asObservable();
    }

    /**
     * Getter for verticle
     */
    get verticle$(): Observable<Verticle>
    {
        return this._verticle.asObservable();
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
     * Get verticles
     */

    getVerticles(): Observable<Verticle[]> {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        return this._httpClient.get<any>(productService + '/region-verticals', header)
            .pipe(
                map((verticle) => {

                    // Update the verticle
                    this._verticles.next(verticle.data);

                    // Return the verticle
                    return verticle.data;
                }),
                switchMap((verticle) => {

                    if ( !verticle )
                    {
                        return throwError('Could not found verticle with id of !');
                    }

                    return of(verticle);
                })
            );     

    }

    /**
     * Get verticle by id
     */
    getVerticleById(id: string): Observable<Verticle>
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
        
        return this._httpClient.get<any>(productService + '/verticles', header)
        .pipe(
            map((verticle) => {

                // Update the verticle
                this._verticle.next(verticle.data.content);

                // Return the verticle
                return verticle;
            }),
            switchMap((verticle) => {

                if ( !verticle )
                {
                    return throwError('Could not found verticle with id of ' + id + '!');
                }

                return of(verticle);
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
