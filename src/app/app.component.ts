import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

import { AuthService } from './services/auth.service';
import { NotificationService, AppNotification } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="app-layout">
      <app-header></app-header>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <app-footer></app-footer>

      <!-- Bottom-right message notification -->
      <div class="message-toast" *ngIf="showMessageToast">
        <button class="toast-close" (click)="closeMessageToast()">×</button>

        <div class="toast-content" (click)="openMessageNotification()">
          <strong>{{ toastTitle }}</strong>
          <p>{{ toastMessage }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #ffffff;
    }

    .main-content {
      flex: 1;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 28px 20px 0;
    }

    .message-toast {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: 330px;
      background: white;
      border-left: 5px solid #0065ff;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      padding: 16px 18px;
      z-index: 9999;
      animation: slideUp 0.3s ease;
    }

    .toast-content {
      cursor: pointer;
    }

    .message-toast strong {
      display: block;
      color: #07164f;
      font-size: 16px;
      margin-bottom: 6px;
    }

    .message-toast p {
      margin: 0;
      color: #52649a;
      font-size: 14px;
      line-height: 1.4;
    }

    .toast-close {
      position: absolute;
      top: 8px;
      right: 10px;
      border: none;
      background: transparent;
      color: #52649a;
      font-size: 20px;
      cursor: pointer;
    }

    .toast-close:hover {
      color: #07164f;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(18px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  showMessageToast = false;
  toastTitle = '';
  toastMessage = '';

  private currentNotification: AppNotification | null = null;
  private notificationSub?: Subscription;
  private lastShownNotificationId = '';
  private activeUserId = '';
  private checkUserInterval: any;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkCurrentUser();

    this.checkUserInterval = setInterval(() => {
      this.checkCurrentUser();
    }, 1000);
  }

  checkCurrentUser(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.activeUserId = '';
      this.notificationSub?.unsubscribe();
      return;
    }

    if (this.activeUserId === currentUser.id) {
      return;
    }

    this.activeUserId = currentUser.id;
    this.notificationSub?.unsubscribe();

    this.notificationSub = this.notificationService
      .getUserNotifications(currentUser.id)
      .subscribe((notifications: AppNotification[]) => {
        const unreadMessageNotification = notifications.find(
          (n: AppNotification) => n.type === 'message' && !n.read
        );

        if (
          unreadMessageNotification &&
          unreadMessageNotification.id !== this.lastShownNotificationId
        ) {
          this.lastShownNotificationId = unreadMessageNotification.id || '';
          this.currentNotification = unreadMessageNotification;

          this.toastTitle = unreadMessageNotification.title;
          this.toastMessage = unreadMessageNotification.message;
          this.showMessageToast = true;

          setTimeout(() => {
            this.showMessageToast = false;
          }, 5000);
        }
      });
  }

  openMessageNotification(): void {
    if (this.currentNotification?.id) {
      this.notificationService.markAsRead(this.currentNotification.id);
    }

    this.showMessageToast = false;
    this.router.navigate(['/messages']);
  }

  closeMessageToast(): void {
    this.showMessageToast = false;
  }

  ngOnDestroy(): void {
    this.notificationSub?.unsubscribe();

    if (this.checkUserInterval) {
      clearInterval(this.checkUserInterval);
    }
  }
}
