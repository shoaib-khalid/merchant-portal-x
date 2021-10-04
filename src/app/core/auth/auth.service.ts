import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { AppConfig } from 'app/config/service.config';
import { GenerateJwt } from 'app/core/jwt/generate.jwt';

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
        private _apiServer: AppConfig,
        private _genJwt: GenerateJwt
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

        //miqdaad
        // console.log("here: " +this._apiServer.settings.apiServer.userService);
        let userService = this._apiServer.settings.apiServer.userService;
        let token = "accessToken"
        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${token}`)
        };
        
        return this._httpClient.post(userService + '/clients/authenticate', credentials, header).pipe(
            switchMap((response: any) => {

                // Generate jwt manually since Kalsym User Service does not have JWT
                let jwtPayload = {
                    iat: response.data.session.created,
                    iss: 'Fuse',
                    exp: response.data.session.expiry
                }

                // this._genJwt.generate(jwtPayload,role,secret)
                let token = this._genJwt.generate(jwtPayload,response.data.role,response.data.session.accessToken);
                
                // Store the access token in the local storage
                this.accessToken = token;

                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                let user = {
                    "id": response.data.session.ownerId,
                    "name": response.data.session.username,
                    "email": credentials.username,
                    "avatar": "assets/images/avatars/brian-hughes.jpg",
                    "status": "online"
                };

                this._userService.user = user;
                
                
                // Return a new observable with the response
                let newResponse = {
                    "accessToken": this.accessToken,
                    "tokenType": "bearer",
                    "user": user
                };

                console.log(newResponse);
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
        return this._httpClient.post('api/auth/refresh-access-token', {
            accessToken: this.accessToken
        }).pipe(
            catchError(() =>

                // Return false
                of(false)
            ),
            switchMap((response: any) => {

                // Store the access token in the local storage
                this.accessToken = response.accessToken;

                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                this._userService.user = response.user;

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
