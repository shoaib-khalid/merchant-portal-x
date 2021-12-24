import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { take, takeUntil } from 'rxjs/operators';
import { AvailableLangs, TranslocoService } from '@ngneat/transloco';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { LocaleService } from 'app/core/locale/locale.service';
import { AvailableCountries } from 'app/core/locale/locale.types';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ChooseCountryComponent } from 'app/layout/common/countries/choose-country/choose-country.component'
import { StoresService } from 'app/core/store/store.service';
import { StoreRegionCountries } from 'app/core/store/store.types';
import { Router } from '@angular/router';


@Component({
    selector       : 'countries',
    templateUrl    : './countries.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'countries'
})
export class CountriesComponent implements OnInit, OnDestroy
{
    allowedCountries: StoreRegionCountries[] = [];
    availableCountries: AvailableCountries = [];
    activeCountry: string;
    flagCodes: any;
    promptChooseCountry: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    currentURLPath: string;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseNavigationService: FuseNavigationService,
        private _translocoService: TranslocoService,
        private _storesService: StoresService,
        private _localeService: LocaleService,
        private _matDialog: MatDialog,
        private _router: Router
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
        // get current url path location
        this.currentURLPath = this._router.url;
        console.log("this.currentURLPath ", this.currentURLPath )

        // disable this as we dont want locale service to define the allowed countries
        // this.availableCountries = this._localeService.getAvailableCountries();

        // Get the allowed countries from store service
        this._storesService.storeRegionCountries$.subscribe((response: StoreRegionCountries[])=>{
            // allowed countries by store service
            this.allowedCountries = response;
            let _allowedCountries = [];
            this.allowedCountries.forEach(item => {
                // countryCode not exists in storeService, hence need mapped in here 😢
                let _countryCode: string;
                if (item.id === "MYS"){ _countryCode = "my" }
                else if (item.id  === "PAK"){ _countryCode = "pk" }
                else { _countryCode = "null" }
                _allowedCountries.push({
                    countryCode: _countryCode,
                    label: item.name
                });

                // this is to enable store service allowed countrie to be injected in country flag selection in header
                this.availableCountries = _allowedCountries;
            });
        });
        
        // Get current country from locale service
        this._localeService.locale$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {

                // Get the active lang
                this.activeCountry = response.countryCode.toLowerCase();

                // Update the navigation
                this._updateNavigation(response.countryCode.toLowerCase());
            });

        // Check if current country from locale service is empty
        if (!this.activeCountry && this.currentURLPath === "/stores/choose-vertical"){

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

        // Set the country iso codes for countries for flags
        this.flagCodes = {
            'null': 'null',
            'en': 'us',
            'tr': 'tr',
            'my': 'my',
            'pk': 'pk'
        };
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

    /**
     * Set the active country
     *
     * @param country
     */
     setActiveCountry(countryCode: string): void
    {
        // Get the active country
        this.activeCountry = countryCode;

        // Update the navigation
        this._updateNavigation(countryCode);

        let symplifiedRegion: string;
        let symplifiedCountryId: string;
        if (countryCode == 'my') {
            symplifiedCountryId = "MYS";
            symplifiedRegion = "SEA";
        } else if (countryCode == 'pk'){
            symplifiedCountryId = "PAK";
            symplifiedRegion = "SA";
        } else {
            symplifiedCountryId = null;
            symplifiedRegion = null;
        }

        // Set the active country
        this._localeService.update(symplifiedCountryId,symplifiedRegion,countryCode);
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the navigation
     *
     * @param lang
     * @private
     */
    private _updateNavigation(lang: string): void
    {
        // For the demonstration purposes, we will only update the Dashboard names
        // from the navigation but you can do a full swap and change the entire
        // navigation data.
        //
        // You can import the data from a file or request it from your backend,
        // it's up to you.

        // Get the component -> navigation data -> item
        const navComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');

        // Return if the navigation component does not exist
        if ( !navComponent )
        {
            return null;
        }

        // Get the flat navigation data
        const navigation = navComponent.navigation;

        // Get the Project dashboard item and update its title
        const projectDashboardItem = this._fuseNavigationService.getItem('dashboards.project', navigation);
        if ( projectDashboardItem )
        {
            this._translocoService.selectTranslate('Project').pipe(take(1))
                .subscribe((translation) => {

                    // Set the title
                    projectDashboardItem.title = translation;

                    // Refresh the navigation component
                    navComponent.refresh();
                });
        }

        // Get the Analytics dashboard item and update its title
        const analyticsDashboardItem = this._fuseNavigationService.getItem('dashboards.analytics', navigation);
        if ( analyticsDashboardItem )
        {
            this._translocoService.selectTranslate('Analytics').pipe(take(1))
                .subscribe((translation) => {

                    // Set the title
                    analyticsDashboardItem.title = translation;

                    // Refresh the navigation component
                    navComponent.refresh();
                });
        }
    }
}
