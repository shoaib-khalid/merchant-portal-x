import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector       : 'create-store',
    templateUrl    : './create-store.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateStoreComponent
{
    yearlyBilling: boolean = true;

    /**
     * Constructor
     */
    constructor()
    {
    }
}
