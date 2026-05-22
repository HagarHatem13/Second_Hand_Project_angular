import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { db } from '../../firebase.config';

import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

interface ProfileListing {
  id: number;
  title: string;
  price: string;
  image: string;
  status?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  isEditMode = false;

  user = {
    fullName: '',
    email: '',
    phone: '01012345678',
    location: 'Cairo, Egypt',
    bio: 'I like buying and selling second-hand items.'
  };

  listings: ProfileListing[] = [];

  stats = {
    listings: 0,
    sold: 0,
    wishlist: 0
  };

  profileForm: FormGroup;

  private unsubscribeListings?: () => void;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.profileForm = this.fb.group({
      fullName: [this.user.fullName, Validators.required],
      email: [this.user.email, [Validators.required, Validators.email]],
      phone: [this.user.phone, [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      location: [this.user.location],
      bio: [this.user.bio]
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.user.email = currentUser.email;
    this.user.fullName = currentUser.name;

    this.profileForm.patchValue({
      email: currentUser.email,
      fullName: currentUser.name
    });

    this.loadWishlistCount();
    this.loadMyListingsFromFirebase(currentUser.id);
  }

  loadWishlistCount(): void {
    const wishlist = localStorage.getItem('wishlist');
    this.stats.wishlist = wishlist ? JSON.parse(wishlist).length : 0;
  }

  loadMyListingsFromFirebase(userId: string): void {
    const listingsRef = collection(db, 'listings');

    const q = query(
      listingsRef,
      where('sellerId', '==', userId)
    );

    this.unsubscribeListings = onSnapshot(q, snapshot => {
      const myListings: ProfileListing[] = snapshot.docs.map(docSnap => {
        const data: any = docSnap.data();

        return {
          id: data.id || 0,
          title: data.title || 'Untitled Item',
          price: `$${data.price || 0}`,
          image: data.imageUrl || data.photoUrl || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=900',
          status: data.status || 'available'
        };
      });

      this.ngZone.run(() => {
        this.listings = myListings;

        this.stats.listings = myListings.length;

        this.stats.sold = myListings.filter(
          item => item.status?.toLowerCase() === 'sold'
        ).length;
      });
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return control ? control.invalid && control.touched : false;
  }

  editProfile(): void {
    this.isEditMode = true;
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.user = {
      ...this.user,
      ...this.profileForm.value
    };

    this.isEditMode = false;
  }

  onCancel(): void {
    this.profileForm.patchValue(this.user);
    this.isEditMode = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  viewListing(item: ProfileListing): void {
    if (!item.id) {
      alert('This old listing does not have an item ID. Please test with a new listing created after the update.');
      return;
    }

    this.router.navigate(['/item', item.id]);
  }

  ngOnDestroy(): void {
    if (this.unsubscribeListings) {
      this.unsubscribeListings();
    }
  }
}
