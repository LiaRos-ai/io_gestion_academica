import { Injectable } from '@angular/core';
import { SQLiteService } from './sqlite.service';
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
    private toastController: ToastController,
    private sqliteService: SQLiteService
  ) {
    this.initStorage();
    this.initAuthState();
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
    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      await loading.dismiss();

      if (result.user) {
        // Guardar usuario en SQLite si no existe
        const usuario = {
          email: result.user.email || '',
          nombre: result.user.displayName || '',
          firebase_uid: result.user.uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_status: 'pending'
        };
        // Verificar si el usuario ya existe en SQLite
        const usuarios = await this.sqliteService.getUsuarios();
        const existe = usuarios.find(u => u.email === usuario.email);
        if (!existe) {
          await this.sqliteService.createUsuario(usuario);
        }
        await this.showToast('¡Bienvenido de nuevo!', 'success');
        await this.router.navigate(['/materias-sqlite']);
        return result;
      }
    } catch (error: any) {
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
    password: string; // Solo para compatibilidad, no se usará en SQLite
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

    try {
      // Guardar usuario en SQLite
      const usuario = {
        email: userData.email,
        nombre: userData.nombre,
        firebase_uid: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 'pending',
        // Puedes agregar universidad, carrera, semestre si tu tabla usuarios lo permite
      };
      // @ts-ignore: SQLiteService debe estar disponible como propiedad
      const createdUser = await this.sqliteService.createUsuario(usuario);
      await loading.dismiss();
      await this.showToast('¡Cuenta creada exitosamente en SQLite!', 'success');
      await this.router.navigate(['/materias-sqlite']);
      return createdUser;
    } catch (error: any) {
      await loading.dismiss();
      await this.showToast('Error al crear usuario en SQLite', 'danger');
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
    const loading = await this.loadingController.create({
      message: 'Enviando email de recuperación...'
    });
    await loading.present();

    try {
      await sendPasswordResetEmail(this.auth, email);
      await loading.dismiss();
      await this.showToast('Email de recuperación enviado', 'success');
    } catch (error: any) {
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
        message = 'Error de conexión. Verifica tu internet';
        break;
      default: // Otro error
        message = error.message || 'Error de autenticación';
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
