import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { JwtService } from 'app/core/jwt/jwt.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor
{
    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _jwt: JwtService
    )
    {
    }

    /**
     * Intercept
     *
     * @param req
     * @param next
     */
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
    {
        // Clone the request object
        let newReq = req.clone();

        // Request
        //
        // If the access token didn't expire, add the Authorization header.
        // We won't add the Authorization header if the access token expired.
        // This will force the server to return a "401 Unauthorized" response
        // for the protected API routes which our response interceptor will
        // catch and delete the access token from the local storage while logging
        // the user out from the app.
        if ( this._authService.accessToken && !AuthUtils.isTokenExpired(this._authService.accessToken) )
        {
            // retrive back original access token (not jwt) from generated jwt 
            // act stand for accessToken
            let accessToken = this._jwt.getJwtPayload(this._authService.accessToken).act;
            newReq = req.clone({
                headers: req.headers.set('Authorization', 'Bearer ' + accessToken)
            });
        }

        // Response
        return next.handle(newReq).pipe(
            catchError((error) => {
                // Catch "401 Unauthorized, 400, 404 Not Found" responses
                // Ignore intercept for login () clients/authenticate
                const errorCode = [401,400,404];
                const paths = ['/confirmation-required','/forgot-password','/reset-password','/sign-in','/sign-up'];                

                if ( error instanceof HttpErrorResponse && 
                     (errorCode.includes(error.status) || error.status === 0) && 
                     newReq.url.indexOf("clients/") > -1 && 
                     !paths.includes(location.pathname)
                   )
                {   
                    // Sign out
                    this._authService.signOut();

                    // Reload the app
                    location.reload();
                }

                return throwError(error);
            })
        );
    }
}
