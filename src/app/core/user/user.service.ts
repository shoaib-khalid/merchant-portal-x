import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User } from 'app/core/user/user.types';
import { AppConfig } from 'app/config/service.config';
import { LogService } from '../logging/log.service';
import { JwtService } from '../jwt/jwt.service';

@Injectable({
    providedIn: 'root'
})
export class UserService
{
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);

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
     * Setter & getter for user
     *
     * @param value
     */
    set user(value: User)
    {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<User>
    {
        return this._user.asObservable();
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
     * Get the current logged in user data
     */
    get(clientId: string = ""): Observable<any>
    {
        let userService = this._apiServer.settings.apiServer.userService;
        let token = "accessToken";

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${token}`)
        };

        if (clientId !== "") { clientId = "/" + clientId } 
        
        return this._httpClient.get<any>(userService + '/clients' + clientId, header)
        .pipe(
            tap((response) => {
                this._logging.debug("Response from UserService",response);
                return this._user.next(response.data);
            })
        );
    }

    /**
     * Update the user
     *
     * @param user
     */
    update(user: User): Observable<any>
    {
        return this._httpClient.patch<User>('api/common/user', {user}).pipe(
            map((response) => {
                this._user.next(response);
            })
        );
    }


    async getUserChannels() {

        let userService = this._apiServer.settings.apiServer.userService;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const httpOptions = {
            params: {
            userId: clientId
            }
        }
        return await this._httpClient.get(userService + "/userChannels", httpOptions).toPromise();
    }
}
