import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class RegisterStoreValidationService {

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

    static domainValidator(control) {

        
        if (!control.value || control.value === null){
          return { required: true };
        }

        // Allow only alphanumeric and -
        if (
          control.value.match(
            /^[0-9A-Za-z][0-9A-Za-z-]+[0-9A-Za-z]$/
          )
        ) {
          return null;
        } else {
          return { invalidDomain: true };
        }
    }
  
    static creditCardValidator(control) {
        // Visa, MasterCard, American Express, Diners Club, Discover, JCB
        if (
            control.value.match(
            /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/
            )
        ) {
            return null;
        } else {
            return { invalidCreditCard: true };
        }
    }
  
    static emailValidator(control) {
        // RFC 2822 compliant regex
        if (
            control.value.match(
            /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
            )
        ) {
            return null;
        } else {
            return { invalidEmailAddress: true };
        }
    }

    static phonenumberValidator(control) {

        if (!control.value || control.value === null){
          return { required: true };
        }

        // https://regexr.com/3c53v
        if (
          control.value.match(
            /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/
          )
        ) {
          return null;
        } else {
          return { invalidPhonenumber: true };
        }
    }

    static postcodeValidator(control) {

        if (!control.value || control.value === null){
          return { required: true };
        }

        // https://regexr.com/3c53v
        if (
          control.value.match(
            /^[0-9]+$/
          )
        ) {
          return null;
        } else {
          return { invalidPostcode: true };
        }
    }
  
    static passwordValidator(control) {
        // {6,100}           - Assert password is between 6 and 100 characters
        // (?=.*[0-9])       - Assert a string has at least one number
        if (control.value.match(/^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*]{6,100}$/)) {
            return null;
        } else {
            return { invalidPassword: true };
        }
    }

    static requiredValidator(control){
      if (control.value) {
        return true;
      } else {
        return false;
      }
    }
}