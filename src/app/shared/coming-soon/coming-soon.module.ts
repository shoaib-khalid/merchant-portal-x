import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ComingSoonComponent } from 'app/shared/coming-soon/coming-soon.component';
import { comingSoonRoutes } from 'app/shared/coming-soon/coming-soon.routing';

@NgModule({
    declarations: [
        ComingSoonComponent
    ],
    imports     : [
        RouterModule.forChild(comingSoonRoutes)
    ]
})
export class ComingSoonModule
{
}
