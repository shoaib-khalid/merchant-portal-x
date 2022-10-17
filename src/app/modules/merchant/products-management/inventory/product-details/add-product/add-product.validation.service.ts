import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AddProductValidationService {

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {
    }

    static getValidatorErrorMessage(validatorName: string, validatorValue?: any) {
      let config = {
        required: 'Required',
        invalidCreditCard: 'Is invalid credit card number',
        invalidEmailAddress: 'Invalid email address',
        invalidPassword: 'Invalid password. Password must be at least 6 characters long, and contain a number.',
        invalidDomain: 'Store URL should only contain alphanumeric and "-" character',
        domainAlreadyTaken: 'Sorry, the selected domain name is already taken',
        storeNameAlreadytaken:'Sorry, the selected name is already taken',
        invalidPhonenumber: 'Invalid phonenumber',
        invalidPostcode: 'Invalid postcode',
        minlength: `Minimum length ${validatorValue.requiredLength}`
      };
  
      return config[validatorName];
    }

    static requiredValidator(control){
      if (control.value === '') {
        return true;
      } else if (control.value === null) {
        return { required: true };
      } else {
        return false;
      }
    }
}