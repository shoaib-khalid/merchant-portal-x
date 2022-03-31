import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { ChooseVerticalService } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.service';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Vertical } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.types';

import { MatDialog } from '@angular/material/dialog';
// import { ChooseCountryComponent } from 'app/layout/common/countries/choose-country/choose-country.component'
import { StoresService } from 'app/core/store/store.service';
import { UserService } from 'app/core/user/user.service';
import { Client, RegionCountry } from 'app/core/user/user.types';
import { Platform } from 'app/core/platform/platform.types';
import { PlatformService } from 'app/core/platform/platform.service';

@Component({
    selector       : 'choose-vertical-page',
    templateUrl    : './choose-vertical.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChooseVerticalComponent
{
    platform: Platform;
    
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    yearlyBilling: boolean = true;
    verticals: Vertical[];

    activeCountry: string;

    // display Errors
    createStoreCondition: any = {
        error: null,
        errorTitle: null,
        errorDesc: null
    };

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _chooseVerticalService: ChooseVerticalService,
        private _platformsService: PlatformService,
        // private _matDialog: MatDialog,
        private _storesService: StoresService,
        private _userService: UserService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Get the categories
        this._chooseVerticalService.verticals$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((verticals: Vertical[]) => {

            this._userService.client$.subscribe((response: Client)=>{
                if (response['data'].regionCountry) {
                    let regionId = response['data'].regionCountry.region;
                    if (!response['data'].regionCountry.region) {
                        console.error("Empty symplifiedRegion")
                    }
                    
                    this.verticals = this.getVerticalByRegionId(verticals,regionId);
                }
    
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        });

        // check total of stores this account have
        this._storesService.stores$.subscribe((response)=>{
            if (response.length && response.length > 4) {
                
                this.createStoreCondition.error = "MAX-STORES";
                this.createStoreCondition.errorTitle = "Maximum store creation has been reached";
                this.createStoreCondition.errorDesc = "You have reached the maximum allowed store creation";
            }
        });

        // Subscribe to platform data
        this._platformsService.platform$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((platform: Platform) => {
                this.platform = platform;
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getVerticalByRegionId(verticals: Vertical[], regionId: string){
        return verticals.filter(function (el) {
            
            return el.regionId === regionId;
        });
    }
}
