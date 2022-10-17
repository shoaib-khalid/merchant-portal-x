import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector       : 'addon',
    templateUrl    : './addon.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddOnComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
