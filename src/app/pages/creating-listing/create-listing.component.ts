import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { ListingService } from '../../services/listing.service';
import { FirebaseService } from '../../services/firebase.service';

// Custom validator for contact: phone or email
function contactValidator() {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) return null;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[\d\s\-+()]{10,}$/;

    if (emailPattern.test(value) || phonePattern.test(value)) {
      return null;
    }

    return { invalidContact: true };
  };
}

@Component({
  selector: 'app-create-listing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-listing.component.html',
  styleUrls: ['./create-listing.component.css']
})
export class CreateListingComponent {
  listingForm: FormGroup;
  isSubmitting = false;
  previewImage = '';

  constructor(
  private fb: FormBuilder,
  private router: Router,
  private listingService: ListingService,
  private authService: AuthService,
  private firebaseService: FirebaseService
) {
    this.listingForm = this.fb.group({
      title: ['', Validators.required],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]],
      price: ['', [Validators.required, Validators.min(1)]],
      location: ['', Validators.required],
      photoUrl: [''],
      condition: ['Good'],
      sellerContact: ['', [Validators.required, contactValidator()]]
    });

    this.listingForm.get('photoUrl')?.valueChanges.subscribe(url => {
      this.previewImage = url || '';
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.listingForm.get(controlName);
    return !!(control?.invalid && control?.touched);
  }

  getFormValue(controlName: string): string {
    return this.listingForm.get(controlName)?.value || '';
  }

 async onSubmit(): Promise<void> {
  if (this.listingForm.invalid) {
    this.listingForm.markAllAsTouched();
    return;
  }

  const currentUser = this.authService.getCurrentUser();

  if (!currentUser) {
    alert('Please login first before creating a listing.');
    this.router.navigate(['/login']);
    return;
  }

  const formValue = this.listingForm.value;

  const listingData = {
    id: Date.now(),

    title: formValue.title,
    name: formValue.title,
    price: formValue.price,
    category: formValue.category,
    location: formValue.location,
    description: formValue.description,
    photoUrl: formValue.photoUrl,
    image: formValue.photoUrl,
    condition: formValue.condition || 'Good',
    sellerContact: formValue.sellerContact,

    // These are automatic, not written by the user
    sellerId: currentUser.id,
    sellerName: currentUser.name,
    seller: currentUser.name
  };

  await this.firebaseService.addListing(listingData);
  this.listingService.addListing(listingData);

  alert('Listing created successfully!');
  this.router.navigate(['/listings']);
}
  onCancel(): void {
    this.router.navigate(['/home']);
  }
}
