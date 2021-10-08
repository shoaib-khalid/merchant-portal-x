import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { StoreService } from 'app/core/store/store.service';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service'

@Injectable()
export class AuthService
{
    private _authenticated: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _userService: UserService,
        private _storeService: StoreService,
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
     * Setter & getter for access token
     */
    set accessToken(token: string)
    {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }

    /**
     * Setter & getter for refresh token
     */
    set refreshToken(token: string)
    {
        localStorage.setItem('refreshToken', token);
    }

    get refreshToken(): string
    {
        return localStorage.getItem('refreshToken') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any>
    {
        return this._httpClient.post('api/auth/forgot-password', email);
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any>
    {
        return this._httpClient.post('api/auth/reset-password', password);
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { username: string; password: string }): Observable<any>
    {
        // Throw error, if the user is already logged in
        if ( this._authenticated )
        {
            return throwError('User is already logged in.');
        }

        let userService = this._apiServer.settings.apiServer.userService;
        let productService = this._apiServer.settings.apiServer.productService;
        let token = "accessToken"
        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${token}`)
        };
        
        return this._httpClient.post(userService + '/clients/authenticate', credentials, header).pipe(
            switchMap(async (response: any) => {

                // Generate jwt manually since Kalsym User Service does not have JWT
                let jwtPayload = {
                    iat: Date.parse(response.data.session.created),
                    iss: 'Fuse',
                    exp: Date.parse(response.data.session.expiry),
                    role: response.data.role,
                    act: response.data.session.accessToken,
                    uid: response.data.session.ownerId
                }

                this._logging.debug("JWT generated at frontend",jwtPayload);

                let header: any = {
                    headers: new HttpHeaders().set("Authorization", `Bearer ${response.data.session.accessToken}`)
                };
                
                // this._genJwt.generate(jwtheader,jwtpayload,secret)
                let token = this._jwt.generate({ alg: "HS256", typ: "JWT"},jwtPayload,response.data.session.accessToken);

                // get user info
                let userData: any = await this._httpClient.get(userService + "/clients/" + response.data.session.ownerId, header).toPromise();
                
                // get store info
                let _parameter = { 
                    params: {
                    "clientId": response.data.session.ownerId
                    }
                }
                // append parameter to header
                Object.assign(_parameter,header)
                
                // get store info
                let storeData: any = await this._httpClient.get(productService + '/stores', header).toPromise();

                // Store the access token in the local storage
                this.accessToken = token;
                
                // Store the refresh token in the local storage
                this.refreshToken = response.data.session.refreshToken;
                
                // Set the authenticated flag to true
                this._authenticated = true;
                
                // Store the user on the user service
                let user = {
                    "id": userData.data.id,
                    "name": userData.data.name,
                    "email": userData.data.email,
                    "avatar": "assets/images/logo/logo_symplified_bg.png",
                    "status": "online",
                    "role": userData.data.roleId
                };

                this._userService.user = user;

                this._logging.debug("Data for User Service (Frontend)",user);

                // Store the stores on the store service
                let stores = [];
                (storeData.data.content).forEach(element => {
                    stores.push({
                        id: element.id,
                        name: element.name
                    })
                });

                this._storeService.store = stores;

                this._logging.debug("Data for Store Service (Frontend)",stores);
                
                // Return a new observable with the response
                let newResponse = {
                    "accessToken": this.accessToken,
                    "tokenType": "bearer",
                    "user": user
                };

                this._logging.debug("New Generate JWT Response by (Frontend)",newResponse);
                // return of(response); // original
                return of(newResponse);
            })
        );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any>
    {
        // Renew token
        let userService = this._apiServer.settings.apiServer.userService;
        let productService = this._apiServer.settings.apiServer.productService;
        let token = "accessToken"
        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${token}`)
        };
        
        return this._httpClient.post(userService + '/clients/session/refresh',
            this.refreshToken
        ,header).pipe(
            catchError(() =>
                // Return false
                of(false)
            ),
            switchMap(async (response: any) => {

                this._logging.debug("Response from User Service (backend) /clients/session/refresh",response);

                // Generate jwt manually since Kalsym User Service does not have JWT
                let jwtPayload = {
                    iat: Date.parse(response.data.session.created),
                    iss: 'Fuse',
                    exp: Date.parse(response.data.session.expiry),
                    role: response.data.role,
                    act: response.data.session.accessToken,
                    uid: response.data.session.ownerId
                }

                this._logging.debug("JWT generated at frontend",jwtPayload);

                // this._genJwt.generate(jwtheader,jwtpayload,secret)
                let token = this._jwt.generate({ alg: "HS256", typ: "JWT"},jwtPayload,response.data.session.accessToken);

                let header: any = {
                    headers: new HttpHeaders().set("Authorization", `Bearer ${response.data.session.accessToken}`)
                };

                let userData: any = await this._httpClient.get(userService + "/clients/" + response.data.session.ownerId, header).toPromise();
                
                // get store info
                let _parameter = { 
                    params: {
                    "clientId": response.data.session.ownerId
                    }
                }
                // append parameter to header
                Object.assign(_parameter,header)
                
                // get store info
                let storeData: any = await this._httpClient.get(productService + '/stores', header).toPromise();

                // Store the access token in the local storage
                this.accessToken = token;

                // Store the refresh token in the local storage
                this.refreshToken = response.data.session.refreshToken;

                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                let user = {
                    "id": userData.data.id,
                    "name": userData.data.name,
                    "email": userData.data.email,
                    "avatar": "assets/images/logo/logo_symplified_bg.png",
                    "status": "online",
                    "role": userData.data.roleId,
                };

                this._logging.debug("Data for User Service (Frontend)",user);

                // Store the user on the user service
                this._userService.user = user;

                // Store the stores on the store service
                let stores = [];
                (storeData.data.content).forEach(element => {
                    stores.push({
                        id: element.id,
                        name: element.name
                    })
                });

                this._storeService.store = stores;

                this._logging.debug("Data for Store Service (Frontend)",stores);

                // Return true
                return of(true);
            })
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any>
    {
        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');

        // Set the authenticated flag to false
        this._authenticated = false;

        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: { name: string; email: string; password: string; company: string }): Observable<any>
    {
        return this._httpClient.post('api/auth/sign-up', user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: { email: string; password: string }): Observable<any>
    {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean>
    {
        // Check if the user is logged in
        if ( this._authenticated )
        {
            return of(true);
        }

        // Check the access token availability
        if ( !this.accessToken )
        {
            return of(false);
        }

        // Check the access token expire date
        if ( AuthUtils.isTokenExpired(this.accessToken) )
        {
            return of(false);
        }

        // If the access token exists and it didn't expire, sign in using it
        return this.signInUsingToken();
    }
}
