import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MerchantSetup } from 'app/core/merchant-setup/merchant-setup.status'
import { MerchantSetupService } from 'app/core/merchant-setup/merchant-setup.service'
import { LogService } from 'app/core/logging/log.service'

@Component({
    selector     : 'redirect-page',
    templateUrl  : './redirect.component.html',
    encapsulation: ViewEncapsulation.None
})
export class RedirectComponent implements OnInit, OnDestroy
{

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    merchantSetup: MerchantSetup;
    private _merchantSetup: any;
    flag: boolean;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _merchantSetupService: MerchantSetupService,
        private _logging: LogService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for MerchantSetupService
     */



    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    async ngOnInit()
    // ngOnInit(): void
    {   

        this._merchantSetup = await this._getMerchantStoreStatus();

        this._logging.debug("Merchant Setup Status",this._merchantSetup);
            
        if (this._merchantSetup.storeSetup == 0){
            // if no store Go to Choose Verticle
            this.goToChooseVerticle();
        } else if (this._merchantSetup.storeSetup == 1){
            // if there is 1 store and already have product, go to Dashboard
            if (this._merchantSetup.productSetup === true){
                this.goToDashboard();
            } else {
                // if there is 1 store but no product, go to Add Products
                this.goToAddProducts();
            }
        } else {
            // if there is more than 1 store
            // in goToChooseStore() there will be another checking and redirect to product OR dashboard 
            // depend on the store, whether if have product or not 
            this.goToChooseStore();
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    /**
     * Get Merchant Store Status
     */
    async _getMerchantStoreStatus(){
        return new Promise(async resolve => {
            (await this._merchantSetupService.get()).subscribe(async ()=> {
                // Subscribe to user changes
                this._merchantSetupService.merchantSetup$
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe( (merchantSetup: MerchantSetup) => {
                        this.merchantSetup = merchantSetup; // Service
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                });
                resolve(this.merchantSetup);
            });
        });
    }

    /**
     * Redirect for Dashboard that already created
     */
     goToDashboard(): void
     {
         this._router.navigate(['/dashboard']);
     }

    /**
     * Redirect for Choose Verticle that already created
     */
    goToChooseVerticle(): void
    {
        this._router.navigate(['/choose-verticle']);
    }

    /**
     * Redirect for Add Products that already created
     */
    goToAddProducts(): void
    {
        this._router.navigate(['/products']);
    }

    /**
     * Redirect for Choose Store that already created
     */
     goToChooseStore(): void
     {
         this._router.navigate(['/choose-store']);
     }    
}

