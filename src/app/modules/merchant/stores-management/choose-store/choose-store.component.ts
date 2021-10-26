import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector       : 'choose-store',
    templateUrl    : './choose-store.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChooseStoreComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
