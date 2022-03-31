import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service'
import { ClientAuthenticate } from './auth.type';

@Injectable()
export class AuthService
{
    private _authenticated: boolean = false;
    private _clientAuthenticate: BehaviorSubject<ClientAuthenticate | null> = new BehaviorSubject(null);

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
     * Getter for Client Authenticate
     *
    */
    get clientAuthenticate$(): Observable<ClientAuthenticate>
    {
        return this._clientAuthenticate.asObservable();
    }
 
    /**
     * Setter for Client Authenticate
     *
     * @param value
     */
    set clientAuthenticate(value: ClientAuthenticate)
    {
        // Store the value
        this._clientAuthenticate.next(value);
    }

    /**
     * Setter & getter for access token
     */
    set jwtAccessToken(token: string)
    {
        localStorage.setItem('jwtAccessToken', token);
    }

    get jwtAccessToken(): string
    {
        return localStorage.getItem('jwtAccessToken') ?? '';
    }

    /**
     * Getter for public access token
     */
    get publicToken(): string
    {
        return "Bearer accessToken";
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
        let userService = this._apiServer.settings.apiServer.userService;
        const header = {
            headers: new HttpHeaders().set("Authorization", this.publicToken)
        };

        return this._httpClient.get(userService + '/clients/' + email + '/password_reset', header).pipe(
            switchMap(async (response: any) => {

                this._logging.debug("Response from UserService (password_reset)",response);
                
            })
        );
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(id: string, code, body): Observable<any>
    {
        let userService = this._apiServer.settings.apiServer.userService;
        const header = {
            headers: new HttpHeaders().set("Authorization", this.publicToken)
        };

        return this._httpClient.put(userService + '/clients/' + id + '/password/' + code + '/reset' , body ,  header).pipe(
            switchMap(async (response: any) => {

                this._logging.debug("Response from UserService (password_reset_id)",response);
            })

        );
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
        const header = {
            headers: new HttpHeaders().set("Authorization", this.publicToken)
        };
        
        return this._httpClient.post(userService + '/clients/authenticate', credentials, header)
            .pipe(
                map((response: any) => {

                    this._logging.debug("Response from UserService (/clients/authenticate)",response);

                    // Generate jwt manually since Kalsym User Service does not have JWT
                    let jwtPayload = {
                        iat: Date.parse(response.data.session.created),
                        iss: 'Fuse',
                        exp: Date.parse(response.data.session.expiry),
                        role: response.data.role,
                        act: response.data.session.accessToken,
                        rft: response.data.session.refreshToken,
                        uid: response.data.session.ownerId
                    }

                    // this._genJwt.generate(jwtheader,jwtpayload,secret)
                    let token = this._jwt.generate({ alg: "HS256", typ: "JWT"},jwtPayload,response.data.session.accessToken);

                    // Store the access token in the local storage
                    this.jwtAccessToken = token;

                    // Set the authenticated flag to true
                    this._authenticated = true;

                    // Store Authentication
                    this._clientAuthenticate.next(response.data);

                    // Return true
                    return response.data;
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
        const header = {
            headers: new HttpHeaders().set("Authorization", this.publicToken)
        };
        
        return this._httpClient.post(userService + '/clients/session/refresh', this._jwt.getJwtPayload(this.jwtAccessToken).rft ,header).pipe(
            catchError(() =>
                // Return false
                of(false)
            ),
            switchMap(async (response: any) => {

                this._logging.debug("Response from UserService (/clients/session/refresh)",response);

                // Generate jwt manually since Kalsym User Service does not have JWT
                let jwtPayload = {
                    iat: Date.parse(response.data.session.created),
                    iss: 'Fuse',
                    exp: Date.parse(response.data.session.expiry),
                    role: response.data.role,
                    act: response.data.session.accessToken,
                    rft: response.data.session.refreshToken,
                    uid: response.data.session.ownerId
                }

                // this._genJwt.generate(jwtheader,jwtpayload,secret)
                let token = this._jwt.generate({ alg: "HS256", typ: "JWT"},jwtPayload,response.data.session.accessToken);

                // Store the access token in the local storage
                this.jwtAccessToken = token;

                // Set the authenticated flag to true
                this._authenticated = true;

                // Store Authentication
                this._clientAuthenticate.next(response.data);

                // Return true
                return response.data;
            })
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any>
    {
        // Remove the access token from the local storage
        localStorage.removeItem('jwtAccessToken');
        localStorage.removeItem('storeId');

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
    signUp(user: { name: string; email: string; password: string; username: string;countryId: string }): Observable<any>
    {
        let userService = this._apiServer.settings.apiServer.userService;
        const header: any = {
            headers: new HttpHeaders().set("Authorization", `Bearer accessToken`)
        };
        const body = {
            "deactivated": true,
            "email": user.email,
            "locked": true,
            "name": user.name,
            "username": user.username,
            "password": user.password,
            "roleId": "STORE_OWNER",
            "countryId":user.countryId
          };
        
        return this._httpClient.post(userService + '/clients/register', body, header).pipe(
            map((response, error) => {
                this._logging.debug("Response from AuthService (signUp)",response);

                return response;
            },
            catchError((error:HttpErrorResponse)=>{
                return of(error);
            })
            )
        );
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
        if ( !this.jwtAccessToken )
        {
            return of(false);
        }

        // Check the access token expire date
        if ( AuthUtils.isTokenExpired(this.jwtAccessToken) )
        {
            return of(false);
        }

        // If the access token exists and it didn't expire, sign in using it
        return this.signInUsingToken();
    }
}
