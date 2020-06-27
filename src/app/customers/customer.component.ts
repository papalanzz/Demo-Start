import { Component, OnInit } from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, ValidatorFn, Validators} from '@angular/forms';

import { Customer } from './customer';
import {ValidateFn} from 'codelyzer/walkerFactory/walkerFn';
import {debounceTime} from 'rxjs/operators';

// hard coded range, cant pass more params to this function so need to wrap it in a factory function
// which takes in min and max vals and returns a ValidatorFunction ValidationFn
// function ratingRange(c: AbstractControl): { [key: string]: boolean } | null {
//   if (c.value !== null && (isNaN(c.value) || c.value < 1 || c.value > 5)) {
//     return { 'range': true}; // true if the form control is invalid,
//                              // key is the name of the validation rule
//                              // and value is true to add it to the list of validation errors
//   }
//   return null; // return null if the formControl is valid
// }
// here

// lets us pass in params to create validator
function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return { 'range': true}; // true if the form control is invalid,
                               // key is the name of the validation rule
                               // and value is true to add it to the list of validation errors
    }
    return null; // return null if the formControl is valid
  }
}

function emailMatcher(c: AbstractControl): { [key: string]: boolean} | null {
  const emailControl = c.get('email');
  const emailConfirmationControl = c.get('emailConfirmation');
  if (emailControl.pristine || emailConfirmationControl.pristine) {
    return null;
  }

  if (emailControl.value === emailConfirmationControl.value) {
    return null;
  }
  return {'match': true};
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  // customer: Customer = new Customer();
  customerForm: FormGroup;
  emailMessage: string;
  emailConfirmationMessage: string;
  firstNameMessage: string;
  lastNameMessage: string;
  phoneMessage: string;
  ratingMessage: string;

  private phoneValidationMessage = {
    required: 'Please enter your phone number'
  };
  private ratingValidationMessage = {
    range: 'must be between 1 and 5'
  };
  private emailValidationMessages = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.'
  };
  private emailConfirmationValidationMessages = {
    required: 'Please confirm email address.',
    match: 'Please match email address.'
  };

  private firstNameValidationMessages = {
    required: 'Please enter your first name',
    minlength: 'First name must be greater than 2 char long'
  };
  private lastNameValidationMessages = {
    required: 'Please enter your last name',
    maxlength: 'last name must be less than 10 char long'
  };
  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.customerForm = this.formBuilder.group( {
      firstName : ['', [ Validators.required, Validators.minLength(3)] ],
      lastName : ['', [ Validators.required, Validators.maxLength(10)] ],
      emailGroup: this.formBuilder.group({
        email : ['', [Validators.required, Validators.email] ],
        emailConfirmation: ['', Validators.required ],
      }, { validator: emailMatcher }),
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1,5)],
      sendCatalog : true,
      addresses: this.formBuilder.array([this.buildAddress() ])
    });

    this.customerForm.get('notification').valueChanges.subscribe(
      value => this.setNotification(value)
    );



    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(debounceTime(1000)).subscribe(
      value => {
        this.setEmailMessage(emailControl);
      }
    );

    const emailConfirmationControl = this.customerForm.get('emailGroup');
    emailConfirmationControl.valueChanges.pipe(debounceTime(1000)).subscribe(
      value => {
        this.setEmailConfirmationMessage(emailConfirmationControl);
      }
    );

    const phoneControl = this.customerForm.get('phone');
    phoneControl.valueChanges.subscribe(
      value => {
        this.setPhoneMessage(phoneControl);
      }

    );

    const ratingControl = this.customerForm.get('rating');
    ratingControl.valueChanges.subscribe(
      value => {
        this.setRatingMessage(ratingControl);
      }
    );

    const firstNameControl = this.customerForm.get('firstName');
    firstNameControl.valueChanges.subscribe(
      value => this.setFirstNameMessage(firstNameControl)
    );

    const lastNameControl = this.customerForm.get('lastName');
    lastNameControl.valueChanges.subscribe(
      value => this.setLastNameMessage(lastNameControl)
    );
  }
  get addresses(): FormArray {
    return <FormArray> this.customerForm.get('addresses');
  }

  save() {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  populateTestData() {
    this.customerForm.setValue({
      firstName: 'Chet',
      lastName: 'Walters',
      email: 'chet@walters.com',
      sendCatalog: false
    });
  }
  // changing validation on the fly
  setNotification(notifyVia: string) {
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === 'text') {
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }

  private setEmailMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(
        key => this.emailValidationMessages[key]).join('');
    }
  }

  private setFirstNameMessage(c: AbstractControl): void {
    this.firstNameMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.firstNameMessage = Object.keys(c.errors).map(
        key => this.firstNameValidationMessages[key]).join('');
    }
  }

  private setLastNameMessage(c: AbstractControl): void {
    this.lastNameMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.lastNameMessage = Object.keys(c.errors).map(
        key => this.lastNameValidationMessages[key]).join('');
    }
  }

  private setEmailConfirmationMessage(c: AbstractControl) {
    this.emailConfirmationMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailConfirmationMessage = Object.keys(c.errors).map(
        key => this.emailConfirmationValidationMessages[key]).join('');
    }
  }

  private setPhoneMessage(c: AbstractControl) {
    this.phoneMessage = '';
    if ( c.errors) {
      this.phoneMessage = Object.keys(c.errors).map(
        key => this.phoneValidationMessage[key]).join('');
    }
  }


  private setRatingMessage(c: AbstractControl) {
    this.ratingMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.ratingMessage = Object.keys(c.errors).map(
        key => this.ratingValidationMessage[key]).join('');
    }
  }

  private buildAddress(): FormGroup {
    return this.formBuilder.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: ''
    });
  }

  addAddress() {
    this.addresses.push(this.buildAddress());
  }
}
