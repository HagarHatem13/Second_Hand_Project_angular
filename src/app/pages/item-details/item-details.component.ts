import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ListingService, ListingItem } from '../../services/listing.service';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';

interface Feedback {
  itemId: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}


@Component({
  selector: 'app-item-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.css']
})
export class ItemDetailsComponent implements OnInit {
  item: ListingItem | null = null;
  isInWishlist = false;
  showMessageModal = false;
  messageText = '';
  messageSent = false;
  relatedItems: ListingItem[] = [];
  showToast = false;
  toastMessage = '';

  // Rating and feedback
  selectedRating = 0;
  feedbackText = '';
  feedbackList: Feedback[] = [];
  averageRating = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadItem(id);
    });
  }

  loadItem(id: number): void {
    const found = this.listingService.getItemById(id);
    this.item = found || this.listingService.listings[0];

    if (this.item) {
      this.relatedItems = this.listingService.listings
        .filter(item => item.id !== this.item?.id)
        .slice(0, 3);

      this.isInWishlist = this.listingService.isInWishlist(this.item.id);
      this.loadFeedback();
    }
  }

  toggleWishlist(): void {
  const currentUser = this.authService.getCurrentUser();

  if (!currentUser) {
    this.router.navigate(['/login']);
    return;
  }

  if (!this.item) return;

  if (this.isInWishlist) {
    this.listingService.removeFromWishlist(this.item.id);
    this.isInWishlist = false;
    this.showLocalNotification('Item removed from wishlist');
  } else {
    this.listingService.addToWishlist(this.item.id);
    this.isInWishlist = true;
    this.showLocalNotification('Item added to wishlist successfully');
  }
}

showLocalNotification(message: string): void {
  this.toastMessage = message;
  this.showToast = true;

  setTimeout(() => {
    this.showToast = false;
  }, 3000);
}

  openMessageModal(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.showMessageModal = true;
  }

  closeMessageModal(): void {
    this.showMessageModal = false;
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.item) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      alert('Please log in to send a message');
      return;
    }

      const sellerId = this.item.sellerId || this.item.seller;
      const sellerName = this.item.sellerName || this.item.seller;

      this.messageService.sendMessage(
        currentUser.id,
        currentUser.name,
        sellerId,
        sellerName,
        this.item.id,
        this.item.name,
        this.messageText
      ).then(() => {
      this.messageSent = true;
      this.messageText = '';

      setTimeout(() => {
        this.messageSent = false;
        this.closeMessageModal();
      }, 2000);
    }).catch(error => {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    });
  }

  // Rating and feedback functions
  setRating(value: number): void {
    this.selectedRating = value;
  }

  submitFeedback(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.item) return;

    if (this.selectedRating === 0) {
      alert('Please select a rating first.');
      return;
    }

    if (!this.feedbackText.trim()) {
      alert('Please write your feedback.');
      return;
    }

    const currentUser = this.authService.getCurrentUser();

    const newFeedback: Feedback = {
      itemId: this.item.id,
      userName: currentUser?.name || 'User',
      rating: this.selectedRating,
      comment: this.feedbackText,
      date: new Date().toLocaleDateString()
    };

    const saved = localStorage.getItem('feedbacks');
    const allFeedbacks: Feedback[] = saved ? JSON.parse(saved) : [];

    allFeedbacks.push(newFeedback);
    localStorage.setItem('feedbacks', JSON.stringify(allFeedbacks));

    this.feedbackText = '';
    this.selectedRating = 0;

    this.loadFeedback();
    alert('Feedback submitted successfully!');
  }

  loadFeedback(): void {
    if (!this.item) return;

    const saved = localStorage.getItem('feedbacks');
    const allFeedbacks: Feedback[] = saved ? JSON.parse(saved) : [];

    this.feedbackList = allFeedbacks.filter(
      feedback => feedback.itemId === this.item?.id
    );

    if (this.feedbackList.length > 0) {
      const total = this.feedbackList.reduce(
        (sum, feedback) => sum + feedback.rating,
        0
      );
      this.averageRating = total / this.feedbackList.length;
    } else {
      this.averageRating = 0;
    }
  }

  viewRelatedItem(item: ListingItem): void {
    this.router.navigate(['/item', item.id]);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  viewMyMessages(): void {
    this.router.navigate(['/seller-inbox']);
  }
}

