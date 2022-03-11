import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlatformService } from './core/platform/platform.service';
import { Platform } from './core/platform/platform.types';

@Component({
    selector   : 'app-root',
    templateUrl: './app.component.html',
    styleUrls  : ['./app.component.scss']
})
export class AppComponent
{
    platform: Platform;

    favIcon16: HTMLLinkElement = document.querySelector('#appIcon16');
    favIcon32: HTMLLinkElement = document.querySelector('#appIcon32');

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _titleService: Title,
        private _platformsService: PlatformService
    )
    {
    }

    ngOnInit() {
        console.log("navigator.userAgent", navigator.userAgent);

        // Subscribe to platform data
        this._platformsService.platform$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((platform: Platform) => {
                if (platform) {
                    this.platform = platform;
    
                    // set title
                    this._titleService.setTitle(this.platform.name + " - Merchant Portal");
    
                    // set icon
                    if (this.platform.id === "symplified") {
                        this.favIcon16.href = 'assets/branding/deliverin/favicon/favicon-16x16.png';
                        this.favIcon32.href = 'assets/branding/deliverin/favicon/favicon-32x32.png';
                    } else if (this.platform.id === "easydukan") {
                        this.favIcon16.href = 'assets/branding/easydukan/favicon/favicon-16x16.png';
                        this.favIcon32.href = 'assets/branding/easydukan/favicon/favicon-32x32.png';
                    } else {
                        console.error("Unregistered platform");
                        
                        this.favIcon16.href = 'favicon-16x16.png';
                        this.favIcon32.href = 'favicon-32x32.png';
                    } 
                }
            });
            
    }
}
