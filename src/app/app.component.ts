import { Component } from '@angular/core';

@Component({
    selector   : 'app-root',
    templateUrl: './app.component.html',
    styleUrls  : ['./app.component.scss']
})
export class AppComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }

    ngOnInit() {
        console.log("navigator.userAgent", navigator.userAgent);
    }
}
