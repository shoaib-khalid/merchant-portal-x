import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { ChooseVerticalService } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.service';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Vertical } from 'app/modules/merchant/stores-management/choose-vertical/choose-vertical.types';
import { LocaleService } from 'app/core/locale/locale.service';
import { Locale } from 'app/core/locale/locale.types';
import { MatDialog } from '@angular/material/dialog';
import { ChooseCountryComponent } from 'app/layout/common/countries/choose-country/choose-country.component'
import { StoresService } from 'app/core/store/store.service';

@Component({
    selector       : 'choose-vertical-page',
    templateUrl    : './choose-vertical.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChooseVerticalComponent
{
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    yearlyBilling: boolean = true;
    verticals: Vertical[];

    activeCountry: string;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _chooseVerticalService: ChooseVerticalService,
        private _localeService: LocaleService,
        private _matDialog: MatDialog,
        private _storesService: StoresService
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
        // Get current country from locale service
        this._localeService.locale$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((response) => {

            // Get the active lang
            this.activeCountry = response.countryCode.toLowerCase();
        });

        // Check if current country from locale service is empty
        if (!this.activeCountry){

            // Open the dialog
            const dialogRef = this._matDialog.open(ChooseCountryComponent, { disableClose: true });

            // first set locate service data to null
            this._localeService.locale = {
                symplifiedCountryId: "",
                symplifiedRegion: null,
                countryCode: "null"
            };

            // then ask for locale service data from user
            dialogRef.afterClosed()
                .subscribe((result) => {
                    // since we have store service country info we will use that 
                    // to query store service country and mapped it to locale service
                    let symplifiedCountryId: string = result;
                    let symplifiedRegion: string;
                    let _countryCode: string;

                    this._storesService.storeRegionCountries$.subscribe((response)=>{
                        let index = response.findIndex(item => item.id === symplifiedCountryId)
                        if (index > -1){
                            // countryCode not exists in storeService, hence need mapped in here 😢
                            if (symplifiedCountryId === "MYS"){ _countryCode = "my" }
                            else if (symplifiedCountryId === "PAK"){ _countryCode = "pk" }
                            else { _countryCode = "null" }
                            this._localeService.locale = {
                                symplifiedCountryId,
                                symplifiedRegion: response[index].region,
                                countryCode: _countryCode
                            };
                            this._changeDetectorRef.markForCheck();
                        }
                    });
                });
        }

        // Get the categories
        this._chooseVerticalService.verticals$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((verticals: Vertical[]) => {
            this._localeService.locale$.subscribe((response: Locale)=>{

                let regionId = response.symplifiedRegion;
                if (!response.symplifiedRegion) {
                    
                }
                console.log("regionId: ",regionId);
                this.verticals = this.getVerticalByRegionId(verticals,regionId);
    
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        });
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

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getVerticalByRegionId(verticals: Vertical[], regionId: string){
        return verticals.filter(function (el) {
            return el.regionId === regionId;
        });
    }
}
