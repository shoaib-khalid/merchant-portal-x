import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlatformService } from './core/platform/platform.service';
import { Platform } from './core/platform/platform.types';

declare let gtag: Function;

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
        private _router: Router,
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
                    let googleAnalyticId = null;
    
                    // set title
                    this._titleService.setTitle(this.platform.name + " - Merchant Portal");
    
                    // set GA code
                    googleAnalyticId = this.platform.gacode;
                    this.favIcon16.href = this.platform.favicon16 + '?original=true';
                    this.favIcon32.href = this.platform.favicon32 + '?original=true';

                    // Set Google Analytic Code
                    if (googleAnalyticId) {

                        // Remove this later
                        // load google tag manager script
                        // const script = document.createElement('script');
                        // script.type = 'text/javascript';
                        // script.async = true;
                        // script.src = 'https://www.google-analytics.com/analytics.js';
                        // document.head.appendChild(script);   
                        
                        // register google tag manager
                        const script2 = document.createElement('script');
                        script2.async = true;
                        script2.src = 'https://www.googletagmanager.com/gtag/js?id=' + googleAnalyticId;
                        document.head.appendChild(script2);

                        // load custom GA script
                        const gaScript = document.createElement('script');
                        gaScript.innerHTML = `
                        window.dataLayer = window.dataLayer || [];
                        function gtag() { dataLayer.push(arguments); }
                        gtag('js', new Date());
                        gtag('config', '${googleAnalyticId}');
                        `;
                        document.head.appendChild(gaScript);

                        // GA for all pages
                        this._router.events.subscribe(event => {
                            if(event instanceof NavigationEnd){
                                // register google analytics            
                                gtag('config', googleAnalyticId, {'page_path': event.urlAfterRedirects});
                                
                            }
                        });
                    }
                }
            });
    }
}
