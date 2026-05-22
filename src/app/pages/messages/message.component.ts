import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { MessageService, Conversation, Message } from '../../services/message.service';

interface Contact {
  id: string;
  name: string;
  message: string;
  time: string;
  active: boolean;
  conversation: Conversation;
}

interface ChatMessage {
  text: string;
  time: string;
  type: 'sent' | 'received';
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css'],
})
export class MessageComponent implements OnInit, OnDestroy {
  newMessage = '';
  searchText = '';

  contacts: Contact[] = [];
  messages: ChatMessage[] = [];
  activeContact: Contact | null = null;

  currentUserId = '';
  currentUserName = '';

  private conversationsSub?: Subscription;
  private messagesSub?: Subscription;

  constructor(
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
  const currentUser = this.authService.getCurrentUser();

  if (!currentUser) {
    alert('Please login first to view messages.');
    return;
  }

  this.currentUserId = currentUser.id;
  this.currentUserName = currentUser.name;

  this.conversationsSub = this.messageService
    .getUserConversations(this.currentUserId)
    .subscribe(conversations => {

      this.contacts = conversations.map(conv => {
        const otherName =
          conv.buyerId === this.currentUserId
            ? conv.sellerName
            : conv.buyerName;

        return {
          id: conv.id || '',
          name: otherName || 'Unknown User',
          message: conv.lastMessage || '',
          time: this.formatTime(conv.updatedAt),
          active: false,
          conversation: conv
        };
      });

      if (this.contacts.length > 0) {
        const selected =
          this.contacts.find(c => c.id === this.activeContact?.id) ||
          this.contacts[0];

        this.selectContact(selected);
      } else {
        this.activeContact = null;
        this.messages = [];
      }
    });
}

  selectContact(contact: Contact): void {
    this.contacts.forEach(c => c.active = false);
    contact.active = true;
    this.activeContact = contact;

    this.messagesSub?.unsubscribe();

    this.messagesSub = this.messageService
      .getConversationMessages(contact.id)
      .subscribe(firebaseMessages => {
        this.messages = firebaseMessages.map(msg => ({
          text: msg.messageText,
          time: this.formatTime(msg.createdAt),
          type: msg.senderId === this.currentUserId ? 'sent' : 'received'
        }));
      });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeContact) return;

    const text = this.newMessage;
    this.newMessage = '';

    this.messageService.replyToConversation(
      this.activeContact.conversation,
      this.currentUserId,
      this.currentUserName,
      text
    ).catch(error => {
      console.error('Reply error:', error);
      alert('Failed to send message.');
    });
  }

  get filteredContacts(): Contact[] {
    return this.contacts.filter(c =>
      c.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  formatTime(value: any): string {
    if (!value) return '';

    const date = value.toDate ? value.toDate() : new Date(value);

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  ngOnDestroy(): void {
    this.conversationsSub?.unsubscribe();
    this.messagesSub?.unsubscribe();
  }
}
