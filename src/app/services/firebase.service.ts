import { Injectable } from '@angular/core';

import {
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

import { db } from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  async addListing(listingData: any) {
    const dataToSave = {
      title: listingData.title,
      description: listingData.description,
      category: listingData.category,
      price: Number(String(listingData.price).replace('$', '')),
      location: listingData.location,
      imageUrl: listingData.photoUrl || listingData.image || '',
      sellerContact: listingData.sellerContact,

      // Important seller data
      sellerId: listingData.sellerId,
      sellerName: listingData.sellerName,

      status: 'available',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'listings'), dataToSave);

    console.log('Listing saved in Firebase with sellerId:', listingData.sellerId);

    return docRef;
  }
}
