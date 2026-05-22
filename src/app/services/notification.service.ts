import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc
} from 'firebase/firestore';

import { db } from '../firebase.config';

export interface AppNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'message';
  relatedId: string;
  read: boolean;
  createdAt: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private ngZone: NgZone) {}

  getUserNotifications(userId: string): Observable<AppNotification[]> {
    return new Observable<AppNotification[]>(observer => {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );

      const unsubscribe = onSnapshot(q, snapshot => {
        const notifications: AppNotification[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as AppNotification));

        notifications.sort((a: AppNotification, b: AppNotification) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });

        this.ngZone.run(() => {
          observer.next(notifications);
        });
      });

      return () => unsubscribe();
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
  }
}
