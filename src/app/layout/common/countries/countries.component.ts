import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { take } from 'rxjs/operators';
import { AvailableLangs, TranslocoService } from '@ngneat/transloco';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { LocaleService } from 'app/core/locale/locale.service';
import { AvailableCountries } from 'app/core/locale/locale.types';

@Component({
    selector       : 'countries',
    templateUrl    : './countries.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'countries'
})
export class CountriesComponent implements OnInit, OnDestroy
{
    availableCountries: AvailableCountries;
    activeCountry: string;
    flagCodes: any;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseNavigationService: FuseNavigationService,
        private _translocoService: TranslocoService,
        private _localeService: LocaleService,
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
        // Get the available countries from transloco
        this.availableCountries = this._localeService.getAvailableCountries();

        console.log("this.availableCountries", this.availableCountries)

        // Subscribe to language changes
        this._localeService.locale$.subscribe((activeCountry) => {

            console.log("activeCountry.countryCode", activeCountry.countryCode.toLowerCase())

            // Get the active lang
            this.activeCountry = activeCountry.countryCode.toLowerCase();

            // Update the navigation
            this._updateNavigation(activeCountry.countryCode.toLowerCase());
        });

        // Set the country iso codes for countries for flags
        this.flagCodes = {
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
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set the active country
     *
     * @param country
     */
     setActiveCountry(country: string): void
    {
        // Get the active country
        this.activeCountry = country;

        // Update the navigation
        this._updateNavigation(country);

        let symplified_region: string;
        if (country == 'my') {
            symplified_region = "SEA";
        } else if (country == 'pk'){
            symplified_region = "SA";
        } else {
            symplified_region = null;
        }

        // Set the active country
        this._localeService.update(country,symplified_region);
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
