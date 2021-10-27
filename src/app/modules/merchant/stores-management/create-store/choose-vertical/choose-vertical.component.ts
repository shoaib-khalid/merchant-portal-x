import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { ChooseVerticalService } from 'app/modules/merchant/stores-management/create-store/choose-vertical/choose-vertical.service';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Vertical } from 'app/modules/merchant/stores-management/create-store/choose-vertical/choose-vertical.types';
import { LocaleService } from 'app/core/locale/locale.service';
import { Locale } from 'app/core/locale/locale.types';

@Component({
    selector       : 'choose-vertical-page',
    templateUrl    : './choose-vertical.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChooseVerticalComponent
{
    yearlyBilling: boolean = true;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    verticals: Vertical[];

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _chooseVerticalService: ChooseVerticalService,
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
        // Get the categories
        this._chooseVerticalService.verticals$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((verticals: Vertical[]) => {
            this._localeService.locale$.subscribe((response: Locale)=>{

                console.log("response",response)
                let regionId = response.symplified_region;
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
