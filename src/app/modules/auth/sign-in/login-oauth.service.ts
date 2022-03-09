import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { AppConfig } from 'app/config/service.config';



@Injectable({
    providedIn: 'root'
})
export class LoginOauthService
{



    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,


    )
    {
    }

    socialOptions = {
        headers: new HttpHeaders({
          "Content-Type": "application/json"
        }),
        withCredentials : true
      
      };

    OAUTH_API_LOGIN: string = "https://api.symplified.it/user-service/v1/" + "clients/loginoauth";

    get userService$()
    {
        return this._apiServer.settings.apiServer.userService;
    }

    // get accessToken(): string
    // {
    //     return localStorage.getItem('accessToken') ?? '';
    // }

    // get storeId$(): string
    // {
    //      return localStorage.getItem('storeId') ?? '';
    // }

    // get httpOptions$() {
    //     return {
    //       headers: new HttpHeaders().set("Authorization", `Bearer ${this.jwtToken$}`),
    //     };
    // }
    
    // get jwtToken$(){
    //     return this._jwt.getJwtPayload(this.accessToken).act;
    // }


    loginOauth(authRequest:any):Observable<any> {
        return this._httpClient
          .post<any>(this.userService$ +'/clients/loginoauth', authRequest, this.socialOptions)
          
      }
}
