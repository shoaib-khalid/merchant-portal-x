import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CountriesComponent } from 'app/layout/common/countries/countries.component';
import { ChooseCountryComponent } from 'app/layout/common/countries/choose-country/choose-country.component';
import { SharedModule } from 'app/shared/shared.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@NgModule({
    declarations: [
        CountriesComponent,
        ChooseCountryComponent
    ],
    imports     : [
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatFormFieldModule,
        MatSelectModule,
        SharedModule
    ],
    exports     : [
        CountriesComponent
    ]
})
export class CountriesModule
{
}
