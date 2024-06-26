import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { ChooseVerticalService } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.service';
import { BehaviorSubject, combineLatest, forkJoin, Subject } from 'rxjs';
import { mergeMap, switchMap, takeUntil } from 'rxjs/operators';
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

        combineLatest([
            this._chooseVerticalService.verticals$,
            this._userService.client$
        ])
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(([verticals, client]: [Vertical[], Client]) => {

            if (verticals.length > 0 && client) {

                if (!client.countryId) {
                    console.error("Empty symplifiedRegion")
                }
                
                this.verticals = this.getVerticalByRegionId(verticals, client.regionCountry.region);
            }
            // Mark for check
            this._changeDetectorRef.markForCheck();
        })

        // check total of stores this account have
        this._storesService.stores$.subscribe((response)=>{
            if (response.length && response.length > 11) {
                
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
