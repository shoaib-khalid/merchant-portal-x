import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';
// import { FaqCategory, Guide, GuideCategory } from 'app/modules/merchant/stores-management/create-store/register-store/register-store.types';

@Injectable({
    providedIn: 'root'
})
export class RegisterStoreService
{
    // private _faqs: ReplaySubject<FaqCategory[]> = new ReplaySubject<FaqCategory[]>(1);
    // private _guides: ReplaySubject<GuideCategory[]> = new ReplaySubject<GuideCategory[]>(1);
    // private _guide: ReplaySubject<Guide> = new ReplaySubject<Guide>(1);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for FAQs
     */
    // get faqs$(): Observable<FaqCategory[]>
    // {
    //     return this._faqs.asObservable();
    // }

    /**
     * Getter for guides
     */
    // get guides$(): Observable<GuideCategory[]>
    // {
    //     return this._guides.asObservable();
    // }

    /**
     * Getter for guide
     */
    // get guide$(): Observable<GuideCategory>
    // {
    //     return this._guide.asObservable();
    // }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all FAQs
     */
    // getDeliveryProviders(): Observable<FaqCategory[]>
    // {
    //     return this._httpClient.get<FaqCategory[]>('api/apps/help-center/faqs').pipe(
    //         tap((response: any) => {
    //             this._faqs.next(response);
    //         })
    //     );
    // }

    /**
     * POST
     */

}
