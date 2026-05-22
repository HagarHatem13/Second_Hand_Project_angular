import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface StoredUser {
  id: string;
  email: string;
  password: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'analytics_auth';
  private readonly USERS_KEY = 'analytics_users';
  
  private userSignal = signal<User | null>(null);
  private loadingSignal = signal<boolean>(true);
  
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly isLoading = this.loadingSignal.asReadonly();

  constructor(private router: Router) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.user) {
          this.userSignal.set(parsed.user);
        }
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private getStoredUsers(): StoredUser[] {
    try {
      const stored = localStorage.getItem(this.USERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveUser(email: string, password: string, name: string): StoredUser {
    const users = this.getStoredUsers();
    const userId = this.generateId();
    const newUser: StoredUser = { id: userId, email, password, name };
    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    return newUser;
  }

  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    this.loadingSignal.set(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const users = this.getStoredUsers();
      const existingUser = users.find(u => u.email === email);
      
      if (!existingUser) {
        return { success: false, message: 'No account found with this email. Please sign up.' };
      }
      
      if (existingUser.password !== password) {
        return { success: false, message: 'Incorrect password. Please try again.' };
      }
      
      const user: User = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name
      };
      
      this.userSignal.set(user);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ user }));
      
      return { success: true, message: 'Login successful!' };
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async signup(name: string, email: string, password: string): Promise<{ success: boolean; message: string }> {
    this.loadingSignal.set(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const users = this.getStoredUsers();
      
      if (users.some(u => u.email === email)) {
        return { success: false, message: 'An account with this email already exists.' };
      }
      
      const savedUser = this.saveUser(email, password, name);
      
      const user: User = {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name
      };
      
      this.userSignal.set(user);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ user }));
      
      return { success: true, message: 'Account created successfully!' };
    } finally {
      this.loadingSignal.set(false);
    }
  }

  logout(): void {
    this.userSignal.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.userSignal();
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
