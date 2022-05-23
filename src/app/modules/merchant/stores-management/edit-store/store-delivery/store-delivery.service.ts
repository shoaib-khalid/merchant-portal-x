import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppConfig } from "app/config/service.config";
import { AuthService } from "app/core/auth/auth.service";
import { JwtService } from "app/core/jwt/jwt.service";
import { LogService } from "app/core/logging/log.service";
import { BehaviorSubject, Observable } from "rxjs";
import { switchMap, take, map, tap, catchError, filter } from 'rxjs/operators';
import { City } from "./store-delivery.types";

@Injectable({
    providedIn: 'root'
})
export class StoresDeliveryService
{
    private _city: BehaviorSubject<City | null> = new BehaviorSubject(null);
    private _cities: BehaviorSubject<City[] | null> = new BehaviorSubject(null);

    /**
    * Constructor
    */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _jwt: JwtService,
        private _logging: LogService,
        private _authService: AuthService,

    )
    {
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
    * Getter for city
    *
    */
    get city$(): Observable<City>
    {
        return this._city.asObservable();
    }
 
    /**
    * Setter for city
    *
    * @param value
    */
    set city(value: City)
    {
        // Store the value
        this._city.next(value);
    }

    /**
    * Getter for city
    *
    */
    get cities$(): Observable<City[]>
    {
        return this._cities.asObservable();
    }
    
    /**
    * Setter for city
    *
    * @param value
    */
    set cities(value: City[])
    {
        // Store the value
        this._cities.next(value);
    }

    getStoreRegionCountryStateCity(state: string, city: string = null): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = (this._authService.jwtAccessToken === '' || this._authService.jwtAccessToken === null) ? 'accessToken' : this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                "state": state,
                "city" : city
            }
        };

        if (!city) {delete header.params.city}

        return this.cities$.pipe(
            take(1),
            switchMap(cities => this._httpClient.get<any>(productService + '/region-country-state-city', header).pipe(
                map((response) => {
                    this._logging.debug("Response from StoresService (getStoreRegionCountryStateCity)",response);

                    // ---------------
                    // Update Store
                    // ---------------
                    this._cities.next(response.data);

                    return response.data;
                })
            ))
        );    
    }
}