import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { JwtService } from 'app/core/jwt/jwt.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Injectable()
export class CoreInterceptor implements HttpInterceptor
{
    /**
     * Constructor
     */
    constructor(
        private _fuseConfirmationService: FuseConfirmationService,
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
                if ( error instanceof HttpErrorResponse && !(error.status === 401 && newReq.url.indexOf("clients/authenticate") > -1)  && !(error.status === 409))
                {
                // Show a error message
                
                const confirmation = this._fuseConfirmationService.open({
                    title  : error.error.error ? 'Error ' + error.error.error + ' (' + error.error.status + ')': 'Error',
                    message: error.error.message ? error.error.message : error.message,
                    icon: {
                        show: true,
                        name: "heroicons_outline:exclamation",
                        color: "warn"
                    },
                    actions: {
                        confirm: {
                            label: 'Ok',
                            color: "primary",
                        },
                        cancel: {
                            show: false,
                        },
                    }
                });

                    // Reload the app
                    // location.reload();
                }

                return throwError(error);
            })
        );
    }
}
