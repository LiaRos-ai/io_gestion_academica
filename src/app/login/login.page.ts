import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { AlertController, Platform, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  eyeOutline,
  eyeOffOutline,
  schoolOutline,
  mailOutline,
  lockClosedOutline,
  logInOutline,
  personOutline,
  libraryOutline,
  calendarOutline,
  personAddOutline
} from 'ionicons/icons';

import {
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonIcon,
  IonInput,
  IonText,
  IonButton,
  IonCheckbox,
  IonToolbar,
  IonTitle,
  IonHeader
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonIcon,
    IonInput,
    IonText,
    IonButton,
    IonCheckbox,
    IonToolbar,
    IonTitle,
    IonHeader
  ],
  standalone: true
})
export class LoginPage implements OnInit {
  loginForm: FormGroup = new FormGroup({});
  registerForm: FormGroup = new FormGroup({});
  isLoginMode = true;
  showPassword = false;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private platform: Platform,
    private toastController: ToastController
  ) {
    addIcons({
      eyeOutline,
      eyeOffOutline,
      schoolOutline,
      mailOutline,
      lockClosedOutline,
      logInOutline,
      personOutline,
      libraryOutline,
      calendarOutline,
      personAddOutline
    });
    this.initializeForms();
  }

  ngOnInit() {
    console.log('LoginPage ngOnInit called');
    console.log('isLoginMode:', this.isLoginMode);
    console.log('loginForm valid:', this.loginForm?.valid);
    console.log('registerForm valid:', this.registerForm?.valid);

    // Verificar si ya está logueado
    if (this.authService.isLoggedIn()) {
      console.log('User is already logged in, navigating to /dashboard');
      this.router.navigate(['/dashboard']);
    }
  }

  private initializeForms() {
    console.log('Initializing forms...');

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      universidad: ['', [Validators.required]],
      carrera: ['', [Validators.required]],
      semestre: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });

    console.log('Login form created:', this.loginForm);
    console.log('Register form created:', this.registerForm);
    console.log('Login form valid initially:', this.loginForm.valid);
    console.log('Register form valid initially:', this.registerForm.valid);
  }

  // Validador personalizado para contraseñas
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  async onLogin() {
    if (this.loginForm.valid) {
      const { email, password, rememberMe } = this.loginForm.value;
      try {
        await this.authService.login(email, password);
        await this.showToast('¡Bienvenido!', 'success');
      } catch (error) {
        // Error is already handled by AuthService.handleAuthError()
        console.error('Login error:', error);
      }
    } else {
      this.markFormGroupTouched(this.loginForm);
      await this.showToast('Verifica tus datos de acceso', 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  async onRegister() {
    console.log('onRegister called');
    console.log('Form valid:', this.registerForm.valid);
    console.log('Form value:', this.registerForm.value);
    console.log('Form errors:', this.registerForm.errors);

    if (this.registerForm.valid) {
      const formData = this.registerForm.value;
      delete formData.confirmPassword; // No enviar confirmPassword
      delete formData.acceptTerms; // No enviar acceptTerms
      console.log('Form data to send:', formData);

      try {
        console.log('Calling authService.register...');
        await this.authService.register(formData);
        console.log('Registration successful');
        this.registerForm.reset();
        await this.showToast('¡Registro exitoso!', 'success');
        this.isLoginMode = true; // Cambia a modo login
      } catch (error) {
        console.error('Register error in component:', error);
        await this.showToast('Error al registrar usuario', 'danger');
      }
    } else {
      console.log('Form is invalid, marking fields as touched');
      this.markFormGroupTouched(this.registerForm);
      await this.showToast('Verifica los datos del registro', 'danger');
    }
  }

  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Recuperar Contraseña',
      message: 'Ingresa tu email para recibir las instrucciones:',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'tu@email.com'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: async (data) => {
            if (data.email) {
              try {
                await this.authService.resetPassword(data.email);
                await this.showToast('Email de recuperación enviado', 'success');
              } catch (error) {
                await this.showToast('Error al enviar recuperación', 'danger');
                console.error('Reset password error:', error);
              }
            } else {
              await this.showToast('Ingresa un email válido', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.loginForm.reset();
    this.registerForm.reset();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  // Getters para validación en template
  get emailError() {
    const email = this.loginForm.get('email');
    const hasError = email?.invalid && email?.touched;
    console.log('emailError:', hasError, 'invalid:', email?.invalid, 'touched:', email?.touched, 'value:', email?.value);
    return hasError;
  }

  get passwordError() {
    const password = this.loginForm.get('password');
    const hasError = password?.invalid && password?.touched;
    console.log('passwordError:', hasError, 'invalid:', password?.invalid, 'touched:', password?.touched, 'value:', password?.value);
    return hasError;
  }

  // Getters para registro
  get regEmailError() {
    const email = this.registerForm.get('email');
    const hasError = email?.invalid && email?.touched;
    console.log('regEmailError:', hasError, 'invalid:', email?.invalid, 'touched:', email?.touched, 'value:', email?.value);
    return hasError;
  }

  get regPasswordError() {
    const password = this.registerForm.get('password');
    const hasError = password?.invalid && password?.touched;
    console.log('regPasswordError:', hasError, 'invalid:', password?.invalid, 'touched:', password?.touched, 'value:', password?.value);
    return hasError;
  }

  get confirmPasswordError() {
    const confirmPassword = this.registerForm.get('confirmPassword');
    const hasError = confirmPassword?.invalid && confirmPassword?.touched;
    console.log('confirmPasswordError:', hasError, 'invalid:', confirmPassword?.invalid, 'touched:', confirmPassword?.touched, 'value:', confirmPassword?.value);
    return hasError;
  }

  get passwordMismatch() {
    const hasMismatch = this.registerForm.hasError('passwordMismatch') &&
           this.registerForm.get('confirmPassword')?.touched;
    console.log('passwordMismatch:', hasMismatch, 'form has error:', this.registerForm.hasError('passwordMismatch'));
    return hasMismatch;
  }
}
