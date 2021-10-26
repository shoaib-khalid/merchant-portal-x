import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CountriesComponent } from 'app/layout/common/countries/countries.component';
import { SharedModule } from 'app/shared/shared.module';

@NgModule({
    declarations: [
        CountriesComponent
    ],
    imports     : [
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        SharedModule
    ],
    exports     : [
        CountriesComponent
    ]
})
export class CountriesModule
{
}
