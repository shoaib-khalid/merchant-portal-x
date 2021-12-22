import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { JwtService } from 'app/core/jwt/jwt.service';

@Injectable()
export class AppInterceptor implements HttpInterceptor
{
    /**
     * Constructor
     */
    constructor(
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

        // Response
        return next.handle(newReq).pipe(
            catchError((error) => {
                // Catch "401 Unauthorized" responses
                // Ignore intercept for login () clients/authenticate
                if ( error instanceof HttpErrorResponse && (error.status === 500 || error.status === 503) )
                {
                    // Sign out
                    alert("Error from backend, Error status: "+ error.status +", Error Message: "+error.message)

                    // Reload the app
                    location.reload();
                }

                return throwError(error);
            })
        );
    }
}
