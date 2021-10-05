import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User } from 'app/core/user/user.types';
import { AppConfig } from 'app/config/service.config';

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
        private _apiServer: AppConfig
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

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current logged in user data
     */
    async get(): Promise<Observable<User>>
    {

        let userService = this._apiServer.settings.apiServer.userService;
        let token = "accessToken"
        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${token}`)
        };
        

        // let userData: any = await this._httpClient.get(userService + "/clients/" + response.data.session.ownerId, header).toPromise();

        return await this._httpClient.get<any>(userService + '/clients/' + '51a4bc43-53e0-4e6e-9fb0-fff57cf02ba9', header)

        // return this._httpClient.get<User>('api/common/user')
        .pipe(
            tap((user) => {
                return this._user.next(user.data);
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
}
