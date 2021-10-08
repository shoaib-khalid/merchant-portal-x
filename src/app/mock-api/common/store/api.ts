import { Injectable } from '@angular/core';
import { assign, cloneDeep } from 'lodash-es';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { store as storeData } from 'app/mock-api/common/store/data';

@Injectable({
    providedIn: 'root'
})
export class UserMockApi
{
    private _store: any = storeData;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService)
    {
        // Register Mock API handlers
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void
    {
        // -----------------------------------------------------------------------------------------------------
        // @ User - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/common/store')
            .reply(() => [200, cloneDeep(this._store)]);

        // -----------------------------------------------------------------------------------------------------
        // @ User - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/common/store')
            .reply(({request}) => {

                // Get the user mock-api
                const store = cloneDeep(request.body.store);

                // Update the user mock-api
                this._store = assign({}, this._store, store);

                // Return the response
                return [200, cloneDeep(this._store)];
            });
    }
}
