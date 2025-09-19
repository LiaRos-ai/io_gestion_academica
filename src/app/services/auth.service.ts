import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged, updateProfile, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoadingController, ToastController } from '@ionic/angular';

/**
 * Interfaz que representa un usuario autenticado.
 */
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
}

/**
 * Interfaz que representa el perfil de un usuario en Firestore.
 */
export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  universidad: string;
  carrera: string;
  semestre: number;
  fechaCreacion: Date;
  ultimoAcceso: Date;
}

/**
 * Servicio de autenticación que maneja el login, registro, logout y estado del usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private storageInitialized = false;

  constructor(
  private auth: Auth,
  private firestore: Firestore,
    private storage: Storage,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    console.log('AuthService constructor called');
    console.log('Firebase Auth instance:', this.auth);
    console.log('Firestore instance:', this.firestore);
    this.initStorage();
    this.initAuthState();
  }

  /**
   * Verifica la conectividad a internet con múltiples métodos
   */
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Método 1: Usar fetch con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Network connectivity check passed');
      return true;
    } catch (error) {
      console.error('Network connectivity check failed:', error);

      // Método 2: Usar navigator.onLine como fallback
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        console.log('Navigator reports online, proceeding...');
        return true;
      }

      return false;
    }
  }

  private async initStorage() {
    await this.storage.create();
    this.storageInitialized = true;
  }

  /**
   * Inicializa el estado de autenticación del usuario.
   */
  private initAuthState() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const userData: User = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          emailVerified: user.emailVerified
        };
        this.currentUserSubject.next(userData);
        await this.updateLastAccess(user.uid);
        if (this.storageInitialized) {
          await this.storage.set('user', userData);
        }
      } else {
        this.currentUserSubject.next(null);
        if (this.storageInitialized) {
          await this.storage.remove('user');
        }
      }
    });
  }

  async login(email: string, password: string): Promise<any> {
    console.log('Starting login process for:', email);

    // Verificar conectividad antes de intentar login
    const isConnected = await this.checkNetworkConnectivity();
    if (!isConnected) {
      await this.showToast('Sin conexión a internet. Verifica tu conexión e intenta nuevamente', 'danger');
      throw new Error('No network connection');
    }

    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      console.log('Attempting Firebase sign in...');
      console.log('Auth instance:', this.auth);
      console.log('App instance:', this.auth.app);

      const result = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Firebase sign in successful');
      console.log('User:', result.user.email);

      await loading.dismiss();

      if (result.user) {
        await this.showToast('¡Bienvenido de nuevo!', 'success');
        await this.router.navigate(['/dashboard']);
        return result;
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error);

      await loading.dismiss();
      await this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * 
   * @param userData Datos del usuario para el registro.
   * @returns 
   */
  async register(userData: {
    email: string;
    password: string;
    nombre: string;
    universidad: string;
    carrera: string;
    semestre: number;
  }): Promise<any> {
    const loading = await this.loadingController.create({
      message: 'Creando cuenta...',
      spinner: 'crescent'
    });
    await loading.present();

    console.log('Starting registration process...', userData);

    // Verificar conectividad antes de intentar registro
    const isConnected = await this.checkNetworkConnectivity();
    if (!isConnected) {
      await this.showToast('Sin conexión a internet. Verifica tu conexión e intenta nuevamente', 'danger');
      throw new Error('No network connection');
    }

    try {
      console.log('Creating user with Firebase Auth...');
      const result = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      );
      console.log('Firebase Auth user created:', result.user.uid);

      if (result.user) {
        console.log('Updating user profile...');
        await updateProfile(result.user, { displayName: userData.nombre });

        const userProfile: UserProfile = {
          uid: result.user.uid,
          email: userData.email,
          nombre: userData.nombre,
          universidad: userData.universidad,
          carrera: userData.carrera,
          semestre: userData.semestre,
          fechaCreacion: new Date(),
          ultimoAcceso: new Date()
        };

        console.log('Saving user profile to Firestore...');
        const userDocRef = doc(this.firestore, `usuarios/${result.user.uid}`);
        await setDoc(userDocRef, userProfile);
        console.log('User profile saved successfully');

        await loading.dismiss();
        await this.showToast('¡Cuenta creada exitosamente!', 'success');
        console.log('Navigating to /dashboard...');
        await this.router.navigate(['/dashboard']);
        return result;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      await loading.dismiss();
      await this.handleAuthError(error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Cerrando sesión...'
    });
    await loading.present();

    try {
      await signOut(this.auth);
      await this.storage.clear(); // Limpiar datos locales
      await loading.dismiss();
      await this.router.navigate(['/login']);
      await this.showToast('Sesión cerrada exitosamente', 'success');
    } catch (error) {
      await loading.dismiss();
      await this.showToast('Error al cerrar sesión', 'danger');
    }
  }

  async resetPassword(email: string): Promise<void> {
    console.log('Starting password reset for:', email);

    // Verificar conectividad antes de intentar reset
    const isConnected = await this.checkNetworkConnectivity();
    if (!isConnected) {
      await this.showToast('Sin conexión a internet. Verifica tu conexión e intenta nuevamente', 'danger');
      throw new Error('No network connection');
    }

    const loading = await this.loadingController.create({
      message: 'Enviando email de recuperación...'
    });
    await loading.present();

    try {
      console.log('Sending password reset email...');
      await sendPasswordResetEmail(this.auth, email);
      console.log('Password reset email sent successfully');
      await loading.dismiss();
      await this.showToast('Email de recuperación enviado', 'success');
    } catch (error: any) {
      console.error('Password reset failed:', error);
      await loading.dismiss();
      await this.handleAuthError(error);
      throw error;
    }
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = this.currentUserSubject.value;
    if (user) {
      const userDocRef = doc(this.firestore, `usuarios/${user.uid}`);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists() ? userDoc.data() as UserProfile : null;
    }
    return null;
  }

  isLoggedIn(): boolean {
  // Verifica si el usuario actual no es nulo (está logueado)
  return this.currentUserSubject.value !== null;
  }

  private async updateLastAccess(uid: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `usuarios/${uid}`);
      await updateDoc(userDocRef, { ultimoAcceso: new Date() });
    } catch (error) {
      console.log('Error updating last access:', error);
    }
  }

  private async handleAuthError(error: any): Promise<void> {
    console.error('Auth error details:', {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack
    });

    // Variable para almacenar el mensaje de error
    let message = 'Ha ocurrido un error inesperado';
    // Evalúa el tipo de error recibido y asigna el mensaje correspondiente
    switch (error.code) {
      case 'auth/user-not-found': // Usuario no encontrado
        message = 'No existe una cuenta con este email';
        break;
      case 'auth/wrong-password': // Contraseña incorrecta
        message = 'Contraseña incorrecta';
        break;
      case 'auth/email-already-in-use': // Email ya registrado
        message = 'Ya existe una cuenta con este email';
        break;
      case 'auth/weak-password': // Contraseña débil
        message = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'auth/invalid-email': // Email inválido
        message = 'Email inválido';
        break;
      case 'auth/network-request-failed': // Error de red
        console.error('Network request failed. Checking connectivity...');
        console.error('This might be due to Android emulator network issues');
        console.error('Try: 1) Check emulator internet connection');
        console.error('      2) Restart Android emulator');
        console.error('      3) Check Firebase configuration');
        message = 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente. Si usas emulador, reinícialo.';
        break;
      case 'auth/too-many-requests': // Demasiadas solicitudes
        message = 'Demasiados intentos. Intenta más tarde';
        break;
      case 'auth/user-disabled': // Usuario deshabilitado
        message = 'Esta cuenta ha sido deshabilitada';
        break;
      default: // Otro error
        message = error.message || 'Error de autenticación';
        console.error('Unhandled auth error:', error);
    }
    // Muestra el mensaje de error en un toast
    await this.showToast(message, 'danger');
  }

  private async showToast(message: string, color: string): Promise<void> {
    // Crea un toast con el mensaje y color especificado
    const toast = await this.toastController.create({
      message, // Mensaje a mostrar
      duration: 3000, // Duración en milisegundos
      position: 'top', // Posición en pantalla
      color // Color del toast
    });
    // Muestra el toast en pantalla
    await toast.present();
  }
}
