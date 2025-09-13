import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { AlertController, Platform, ToastController } from '@ionic/angular';

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
    this.initializeForms();
  }

  ngOnInit() {
    // Verificar si ya está logueado
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/tabs/materias']);
    }
  }

  private initializeForms() {
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
        await this.showToast('Error al iniciar sesión', 'danger');
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
    if (this.registerForm.valid) {
      const formData = this.registerForm.value;
      delete formData.confirmPassword; // No enviar confirmPassword
      delete formData.acceptTerms; // No enviar acceptTerms
      try {
        await this.authService.register(formData);
        this.registerForm.reset();
        await this.showToast('¡Registro exitoso!', 'success');
        this.isLoginMode = true; // Cambia a modo login
      } catch (error) {
        await this.showToast('Error al registrar usuario', 'danger');
        console.error('Register error:', error);
      }
    } else {
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
    return email?.invalid && email?.touched;
  }

  get passwordError() {
    const password = this.loginForm.get('password');
    return password?.invalid && password?.touched;
  }

  // Getters para registro
  get regEmailError() {
    const email = this.registerForm.get('email');
    return email?.invalid && email?.touched;
  }

  get regPasswordError() {
    const password = this.registerForm.get('password');
    return password?.invalid && password?.touched;
  }

  get confirmPasswordError() {
    return this.registerForm.get('confirmPassword')?.invalid && 
           this.registerForm.get('confirmPassword')?.touched;
  }

  get passwordMismatch() {
    return this.registerForm.hasError('passwordMismatch') && 
           this.registerForm.get('confirmPassword')?.touched;
  }
}
