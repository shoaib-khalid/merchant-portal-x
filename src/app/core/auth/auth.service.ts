import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { StoresService } from 'app/core/store/store.service';
import { LocaleService } from 'app/core/locale/locale.service';
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
        private _storesService: StoresService,
        private _localeService: LocaleService,
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
        let userService = this._apiServer.settings.apiServer.userService;
        let productService = this._apiServer.settings.apiServer.productService;
        let token = "accessToken"
        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${token}`)
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
        let productService = this._apiServer.settings.apiServer.productService;
        let token = "accessToken"
        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${token}`)
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
        let productService = this._apiServer.settings.apiServer.productService;
        let token = "accessToken"
        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${token}`)
        };
        
        return this._httpClient.post(userService + '/clients/authenticate', credentials, header).pipe(
            switchMap(async (response: any) => {

                this._logging.debug("Response from UserService (/clients/authenticate)",response);

                /**
                 * 
                 *  JWT
                 * 
                 */


                // Generate jwt manually since Kalsym User Service does not have JWT
                let jwtPayload = {
                    iat: Date.parse(response.data.session.created),
                    iss: 'Fuse',
                    exp: Date.parse(response.data.session.expiry),
                    role: response.data.role,
                    act: response.data.session.accessToken,
                    uid: response.data.session.ownerId
                }

                this._logging.debug("Generate JWT payload with Fuse", jwtPayload);


                /**
                 * 
                 *  USER SERVICE
                 * 
                 */


                var header: any = {
                    headers: new HttpHeaders().set("Authorization", `Bearer ${response.data.session.accessToken}`)
                };
                
                // this._genJwt.generate(jwtheader,jwtpayload,secret)
                let token = this._jwt.generate({ alg: "HS256", typ: "JWT"},jwtPayload,response.data.session.accessToken);

                // get user info
                let userData: any = await this._httpClient.get(userService + "/clients/" + response.data.session.ownerId, header).toPromise();
                
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

                this._logging.debug("UserService Object (Generated by Fuse)",user);

                /**
                 * 
                 *  PROCESS
                 * 
                 */

                // Store the access token in the local storage
                this.accessToken = token;
                
                // Store the refresh token in the local storage
                this.refreshToken = response.data.session.refreshToken;
                
                // Set the authenticated flag to true
                this._authenticated = true;
                
                // Return a new observable with the response
                let newResponse = {
                    "accessToken": this.accessToken,
                    "tokenType": "bearer",
                    "user": user
                };

                this._logging.debug("JWT Object (Generated by Fuse)",newResponse);
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
        // kena accessToken
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

                this._logging.debug("Response from UserService (/clients/session/refresh)",response);

                /**
                 * 
                 *  JWT
                 * 
                 */


                // Generate jwt manually since Kalsym User Service does not have JWT
                let jwtPayload = {
                    iat: Date.parse(response.data.session.created),
                    iss: 'Fuse',
                    exp: Date.parse(response.data.session.expiry),
                    role: response.data.role,
                    act: response.data.session.accessToken,
                    uid: response.data.session.ownerId
                }

                this._logging.debug("JWT Object (Generated by Fuse)",jwtPayload);


                /**
                 * 
                 *  USER SERVICE
                 * 
                 */


                var header: any = {
                    headers: new HttpHeaders().set("Authorization", `Bearer ${response.data.session.accessToken}`)
                };
                
                // this._genJwt.generate(jwtheader,jwtpayload,secret)
                let token = this._jwt.generate({ alg: "HS256", typ: "JWT"},jwtPayload,response.data.session.accessToken);

                // get user info
                let userData: any = await this._httpClient.get(userService + "/clients/" + response.data.session.ownerId, header).toPromise();
                
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

                this._logging.debug("UserService Object (Generated by Fuse)",user);

                /**
                 * 
                 *  PROCESS
                 * 
                 */

                // Store the access token in the local storage
                this.accessToken = token;

                // Store the refresh token in the local storage
                this.refreshToken = response.data.session.refreshToken;

                // Set the authenticated flag to true
                this._authenticated = true;

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
        localStorage.removeItem('refreshToken');
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
    signUp(user: { name: string; email: string; password: string; username: string }): Observable<any>
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
            "roleId": "STORE_OWNER"
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
