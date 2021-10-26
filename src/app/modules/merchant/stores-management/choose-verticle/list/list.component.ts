import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { ChooseVerticleService } from 'app/modules/merchant/stores-management/choose-verticle/choose-verticle.service';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Verticle } from 'app/modules/merchant/stores-management/choose-verticle/choose-verticle.types';
import { LocaleService } from 'app/core/locale/locale.service';
import { Locale } from 'app/core/locale/locale.types';

@Component({
    selector       : 'choose-verticle-list',
    templateUrl    : './list.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChooseVerticleListComponent
{
    yearlyBilling: boolean = true;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    verticles: Verticle[];

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _chooseVerticleService: ChooseVerticleService,
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
        this._chooseVerticleService.verticles$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((verticles: Verticle[]) => {
            this._localeService.locale$.subscribe((response: Locale)=>{

                console.log("response",response)
                let regionId = response.symplified_region;
                this.verticles = this.getVerticleByRegionId(verticles,regionId);
    
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

    getVerticleByRegionId(verticles: Verticle[], regionId: string){
        return verticles.filter(function (el) {
            return el.regionId === regionId;
        });
    }
}
