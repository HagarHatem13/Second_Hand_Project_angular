import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

import { db } from '../firebase.config';

export interface Conversation {
  id?: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  itemId: number;
  itemName: string;
  participants: string[];
  lastMessage: string;
  updatedAt: any;
}

export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  itemId: number;
  itemName: string;
  messageText: string;
  createdAt: any;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private ngZone: NgZone) {}
  async sendMessage(
    buyerId: string,
    buyerName: string,
    sellerId: string,
    sellerName: string,
    itemId: number,
    itemName: string,
    messageText: string
  ): Promise<void> {

    const conversationsRef = collection(db, 'conversations');

    const q = query(
      conversationsRef,
      where('buyerId', '==', buyerId),
      where('sellerId', '==', sellerId),
      where('itemId', '==', itemId),
      limit(1)
    );

    const snapshot = await getDocs(q);

    let conversationId = '';

    if (snapshot.empty) {
      const conversationDoc = await addDoc(conversationsRef, {
        buyerId,
        buyerName,
        sellerId,
        sellerName,
        itemId,
        itemName,
        participants: [buyerId, sellerId],
        lastMessage: messageText,
        updatedAt: serverTimestamp()
      });

      conversationId = conversationDoc.id;
    } else {
      conversationId = snapshot.docs[0].id;

      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: messageText,
        updatedAt: serverTimestamp()
      });
    }

    await addDoc(collection(db, 'messages'), {
      conversationId,
      senderId: buyerId,
      senderName: buyerName,
      receiverId: sellerId,
      receiverName: sellerName,
      itemId,
      itemName,
      messageText,
      createdAt: serverTimestamp(),
      read: false
    });
    
   await addDoc(collection(db, 'notifications'), {
    userId: sellerId,
    title: 'New Message',
    message: 'You have a new message.',
    type: 'message',
    relatedId: conversationId,
    read: false,
    createdAt: serverTimestamp()
  });
  }

 getUserConversations(userId: string): Observable<Conversation[]> {
  return new Observable(observer => {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const conversations: Conversation[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Conversation));

      conversations.sort((a, b) => {
        const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
        const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
        return bTime - aTime;
      });

      this.ngZone.run(() => {
        observer.next(conversations);
      });
    });

    return () => unsubscribe();
  });
}

  getConversationMessages(conversationId: string): Observable<Message[]> {
  return new Observable(observer => {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId)
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const messages: Message[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Message));

      messages.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return aTime - bTime;
      });

      this.ngZone.run(() => {
        observer.next(messages);
      });
    });

    return () => unsubscribe();
  });
}

  async replyToConversation(
    conversation: Conversation,
    senderId: string,
    senderName: string,
    messageText: string
  ): Promise<void> {

    if (!conversation.id) return;

    const receiverId =
      senderId === conversation.buyerId
        ? conversation.sellerId
        : conversation.buyerId;

    const receiverName =
      senderId === conversation.buyerId
        ? conversation.sellerName
        : conversation.buyerName;

    await addDoc(collection(db, 'messages'), {
      conversationId: conversation.id,
      senderId,
      senderName,
      receiverId,
      receiverName,
      itemId: conversation.itemId,
      itemName: conversation.itemName,
      messageText,
      createdAt: serverTimestamp(),
      read: false
    });

    await updateDoc(doc(db, 'conversations', conversation.id), {
      lastMessage: messageText,
      updatedAt: serverTimestamp()
    });
    await addDoc(collection(db, 'notifications'), {
    userId: receiverId,
    title: 'New Message',
    message: 'You have a new message.',
    type: 'message',
    relatedId: conversation.id,
    read: false,
    createdAt: serverTimestamp()
  });
  }
}
