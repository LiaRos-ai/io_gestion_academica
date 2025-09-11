import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
  ,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton
  ],
  standalone: true
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;

  mensajeBienvenida: string = '';
  mensajeError: string = '';
  submitted: boolean = false;

  get mensajeBienvenidaMostrar(): string {
    return this.mensajeBienvenida;
  }

  get mensajeErrorMostrar(): string {
    return this.mensajeError && this.submitted ? this.mensajeError : '';
  }

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['demo@email.com', [Validators.required, Validators.email]],
      password: ['demo123', [Validators.required, Validators.minLength(6)]]
    });
  this.mensajeBienvenida = '';
  this.mensajeError = '';
  this.submitted = false;
  }

  ngOnInit() {}

  onLogin() {
    this.submitted = true;
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.mensajeBienvenida = `¡Bienvenido, ${email}!`;
      this.mensajeError = '';
      console.log('Login attempt:', { email, password });
    } else {
      this.mensajeBienvenida = '';
      if (this.loginForm.get('email')?.errors?.['required']) {
        this.mensajeError = 'El email es obligatorio.';
      } else if (this.loginForm.get('email')?.errors?.['email']) {
        this.mensajeError = 'El email no es válido.';
      } else if (this.loginForm.get('password')?.errors?.['required']) {
        this.mensajeError = 'La contraseña es obligatoria.';
      } else if (this.loginForm.get('password')?.errors?.['minlength']) {
        this.mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
      } else {
        this.mensajeError = 'Email o contraseña inválidos. Por favor verifica los datos.';
      }
    }
  }
}
