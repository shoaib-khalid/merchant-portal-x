import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MerchantSetup } from 'app/core/merchant-setup/merchant-setup.status'
import { MerchantSetupService } from 'app/core/merchant-setup/merchant-setup.service'
import { StoresService } from 'app/core/store/store.service'
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
        private _storesService: StoresService,
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
            // if no store Go to Choose Vertical
            console.log("GOING TO ChooseVertical")
            this.goToChooseVertical();
        } else if (this._merchantSetup.storeSetup == 1){
            // if there is 1 store and already have product, go to Dashboard
            if (this._merchantSetup.productSetup === true){
                console.log("GOING TO Dashboard")
                this.goToDashboard();
            } else {
                // if there is 1 store but no product, go to Add Products
                // at this point, storeId still not saved in local storage (due to response of get store is in array of object), 
                // due to nature of add product (for product service) - backend
                // need to have store service object[0] to be saved in local storage
                await this._storesService.setFirstStoreId();
                this.goToAddProducts();
            }
        } else {
            // if there is more than 1 store
            // in goToChooseStore() there will be another checking and redirect to product OR dashboard 
            // depend on the store, whether if have product or not 
            console.log("GOING TO ChooseStore")
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
     * Redirect for Choose Vertical that already created
     */
    goToChooseVertical(): void
    {
        this._router.navigate(['/stores/choose-vertical']);
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
         this._router.navigate(['/stores']);
     }    
}

