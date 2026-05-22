import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ListingService, ListingItem } from '../../services/listing.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css'],
})
export class WishlistComponent implements OnInit {
  searchText = '';
  wishlistItems: ListingItem[] = [];

  constructor(
    private router: Router,
    private listingService: ListingService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.wishlistItems = this.listingService.getWishlistItems();
  }

  get filteredItems(): ListingItem[] {
    if (!this.searchText.trim()) {
      return this.wishlistItems;
    }
    return this.wishlistItems.filter((item) =>
      item.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  removeItem(id: number): void {
    this.listingService.removeFromWishlist(id);
    this.wishlistItems = this.wishlistItems.filter((item) => item.id !== id);
  }

  viewItem(item: ListingItem): void {
    this.router.navigate(['/item', item.id]);
  }
}

