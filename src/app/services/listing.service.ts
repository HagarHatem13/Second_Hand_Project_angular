import { Injectable, signal } from '@angular/core';

export interface ListingItem {
  id: number;
  name: string;
  title?: string;
  price: string;
  image: string;
  photoUrl?: string;
  condition: string;
  location: string;
  category: string;
  seller: string;
  sellerId?: string;
  sellerName?: string;
  sellerContact?: string;
  description: string;
  createdAt?: string;
}
@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private defaultItems: ListingItem[] = [
    {
      id: 1,
      name: 'Laptop',
      price: '$250',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900',
      condition: 'Like New',
      location: 'Cairo, Egypt',
      category: 'Electronics',
      seller: 'Ahmed Ali',
      description: 'This laptop is in like-new condition with no scratches or dents. It has been gently used and well maintained. Comes with original charger. All features work perfectly. Ready for a new owner!'
    },
    {
      id: 2,
      name: 'Sofa',
      price: '$150',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900',
      condition: 'Good',
      location: 'Alexandria, Egypt',
      category: 'Furniture',
      seller: 'Sara Mohamed',
      description: 'Comfortable 3-seater sofa in good condition. Minor wear on armrests but overall very comfortable. Great for living room or office. Must be picked up.'
    },
    {
      id: 3,
      name: 'Camera',
      price: '$200',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900',
      condition: 'Excellent',
      location: 'Giza, Egypt',
      category: 'Electronics',
      seller: 'Omar Hassan',
      description: 'Professional DSLR camera in excellent working condition. Includes 18-55mm lens, battery, charger, and camera bag. Perfect for photography enthusiasts.'
    },
    {
      id: 4,
      name: 'Books',
      price: '$30',
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=900',
      condition: 'Good',
      location: 'Cairo, Egypt',
      category: 'Books',
      seller: 'Fatima Ali',
      description: 'Collection of classic literature books. Includes works by various authors. Some highlighting in a few books but overall in good readable condition.'
    },
    {
      id: 5,
      name: 'Vintage Watch',
      price: '$180',
      image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=900',
      condition: 'Good',
      location: 'Cairo, Egypt',
      category: 'Electronics',
      seller: 'Mohamed Youssef',
      description: 'Classic vintage watch in working condition. Beautiful design with leather strap. Battery recently replaced.'
    },
    {
      id: 6,
      name: 'Bicycle',
      price: '$120',
      image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=900',
      condition: 'Good',
      location: 'Giza, Egypt',
      category: 'Sports',
      seller: 'Laila Ahmed',
      description: 'Mountain bike in good condition. New tires and recently serviced. Perfect for city commuting or weekend rides.'
    }
  ];

  private listingsSignal = signal<ListingItem[]>([]);
  private wishlistSignal = signal<number[]>([]);

  constructor() {
    this.loadListings();
    this.loadWishlist();
  }

  private loadListings(): void {
    const saved = localStorage.getItem('userListings');
    const userListings = saved ? JSON.parse(saved) : [];
    
    // Merge user listings with default items
    const merged = [...this.defaultItems];
    
    userListings.forEach((item: any) => {
      merged.push({
        id: item.id,
        name: item.title || item.name,
        title: item.title,
        price: typeof item.price === 'number' ? `$${item.price}` : item.price,
        image: item.photoUrl || item.image || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=900',
        photoUrl: item.photoUrl,
        condition: item.condition || 'Good',
        location: item.location,
        category: item.category,
        seller: item.sellerName || 'You',
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        sellerContact: item.sellerContact,
        description: item.description,
        createdAt: item.createdAt
      });
    });
    
    this.listingsSignal.set(merged);
  }

  private loadWishlist(): void {
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      this.wishlistSignal.set(JSON.parse(saved));
    }
  }

  get listings(): ListingItem[] {
    return this.listingsSignal();
  }

  get wishlist(): number[] {
    return this.wishlistSignal();
  }

  getItemById(id: number): ListingItem | undefined {
    return this.listingsSignal().find(item => item.id === id);
  }

  getWishlistItems(): ListingItem[] {
    const wishlistIds = this.wishlistSignal();
    return this.listingsSignal().filter(item => wishlistIds.includes(item.id));
  }

  addToWishlist(itemId: number): void {
    const current = this.wishlistSignal();
    if (!current.includes(itemId)) {
      const updated = [...current, itemId];
      this.wishlistSignal.set(updated);
      localStorage.setItem('wishlist', JSON.stringify(updated));
    }
  }

  removeFromWishlist(itemId: number): void {
    const current = this.wishlistSignal();
    const updated = current.filter(id => id !== itemId);
    this.wishlistSignal.set(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  }

  isInWishlist(itemId: number): boolean {
    return this.wishlistSignal().includes(itemId);
  }

  addListing(listing: Partial<ListingItem>): ListingItem {
    const newItem: ListingItem = {
  id: Date.now(),
  name: listing.title || listing.name || 'New Item',
  title: listing.title,
  price: typeof listing.price === 'number' ? `$${listing.price}` : (listing.price || '$0'),
  image: listing.photoUrl || listing.image || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=900',
  photoUrl: listing.photoUrl,
  condition: listing.condition || 'Good',
  location: listing.location || '',
  category: listing.category || 'Other',

  // Important seller data
  seller: listing.sellerName || listing.seller || 'You',
  sellerId: listing.sellerId,
  sellerName: listing.sellerName,

  sellerContact: listing.sellerContact,
  description: listing.description || '',
  createdAt: new Date().toISOString()
};

    // Save to user listings in localStorage
    const saved = localStorage.getItem('userListings');
    const userListings = saved ? JSON.parse(saved) : [];
    userListings.push({
      id: newItem.id,
      title: newItem.name,
      price: newItem.price.replace('$', ''),
      photoUrl: newItem.image,
      condition: newItem.condition,
      location: newItem.location,
      category: newItem.category,

      sellerId: newItem.sellerId,
      sellerName: newItem.sellerName,

      sellerContact: newItem.sellerContact,
      description: newItem.description,
      createdAt: newItem.createdAt
    });
    localStorage.setItem('userListings', JSON.stringify(userListings));

    // Update signal
    const current = this.listingsSignal();
    this.listingsSignal.set([...current, newItem]);

    return newItem;
  }

  searchListings(query: string): ListingItem[] {
    const q = query.toLowerCase();
    return this.listingsSignal().filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  }

  getByCategory(category: string): ListingItem[] {
    return this.listingsSignal().filter(item =>
      item.category.toLowerCase() === category.toLowerCase()
    );
  }

  refreshListings(): void {
    this.loadListings();
  }
}
