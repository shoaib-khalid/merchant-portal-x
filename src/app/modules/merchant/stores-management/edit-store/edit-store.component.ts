import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { takeUntil } from 'rxjs/operators';
import { PlatformService } from 'app/core/platform/platform.service';
import { Platform } from 'app/core/platform/platform.types';
import { StoresService } from 'app/core/store/store.service';
import { Store } from 'app/core/store/store.types';

@Component({
    selector     : 'edit-store-page',
    templateUrl  : './edit-store.component.html',
    styles       : [
        `            
            ng-scrollbar.store-settings-scrollbar {
                /* --scrollbar-size: 8px;
                --scrollbar-thumb-color: gray; */
                --scrollbar-hover-size: 12px;
                /* --scrollbar-track-color: rgba(0, 0, 0, 0.05); */
                --scrollbar-border-radius: 3px;
            }
        `
    ],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class EditStoreComponent implements OnInit
{
    @ViewChild('supportNgForm') supportNgForm: NgForm;
    @ViewChild('drawer') drawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    panels: any[] = [];
    selectedPanel: string = 'account';
    
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    platform: Platform = null;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _route: ActivatedRoute,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _platformsService: PlatformService,
        private _storesService: StoresService
    )
    {
        this.selectedPanel = this._route.snapshot.paramMap.get('panel-id') ? this._route.snapshot.paramMap.get('panel-id') : 'account';
    }  

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {

        // Setup available panels
        this.panels = [
            {
                id         : 'account',
                icon       : 'mat_solid:storefront',
                title      : 'Store Account',
                description: 'Manage your public profile and information'
            },
            {
                id         : 'assets',
                icon       : 'mat_outline:image',
                title      : 'Store Assets',
                description: 'Manage your store logo and images'
            },
            {
                id         : 'delivery',
                icon       : 'mat_outline:delivery_dining',
                title      : 'Delivery Settings',
                description: 'Manage your delivery type details and information'
            },
            {
                id         : 'dine-in',
                icon       : 'mat_outline:restaurant',
                title      : 'Dine In Settings',
                description: 'Manage your dine-in details and information'
            },
            {
                id         : 'timing',
                icon       : 'mat_outline:access_time',
                title      : 'Store Timing',
                description: "Manage your store's opening and closing time"
            },
            {
                id         : 'analytics',
                icon       : 'mat_outline:analytics',
                title      : 'Google Analytic',
                description: 'Store Google analytic section'
            }
        ];

        // Subscribe to platform data
        this._platformsService.platform$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((platform: Platform) => {
                this.platform = platform;

                // if (platform.country === 'PAK') {
                //     let index = this.panels.findIndex(item => item.id === 'dine-in')
    
                //     if (index > -1) {
                //         this.panels.splice(index, 1);
                //     }
                // }
            });

        
        this._storesService.store$
        .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((store: Store) => {
                if (store) {
                    // Hide Dine In Settings panel if vertical is e-commerce
                    if (store.verticalCode === "E-Commerce" || store.verticalCode === "ECommerce_PK")
                    {
                        let index = this.panels.findIndex(item => item.id === 'dine-in');
    
                        if (index > -1) {
                            this.panels.splice(index, 1);
                        }
                    }
                }                
            });
        

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {

                // Set the drawerMode and drawerOpened
                if ( matchingAliases.includes('lg') )
                {
                    this.drawerMode = 'side';
                    this.drawerOpened = true;
                }
                else
                {
                    this.drawerMode = 'over';
                    this.drawerOpened = false;
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    ngAfterViewInit(): void
    {
        setTimeout(() => {

        }, 0);
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

    // -----------------------------------------------------------------------------------------------------
    // @ Panel Section
    // -----------------------------------------------------------------------------------------------------
    
    /**
    * Navigate to the panel
    *
    * @param panel
    */
    goToPanel(panel: string): void
    {
        this.selectedPanel = panel;

        // Close the drawer on 'over' mode
        if ( this.drawerMode === 'over' )
        {
            this.drawer.close();
        }
    }
 
    /**
    * Get the details of the panel
    *
    * @param id
    */
    getPanelInfo(id: string): any
    {
        return this.panels.find(panel => panel.id === id);
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
}