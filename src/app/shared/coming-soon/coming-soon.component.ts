import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector       : 'coming-soon',
    templateUrl    : './coming-soon.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComingSoonComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
