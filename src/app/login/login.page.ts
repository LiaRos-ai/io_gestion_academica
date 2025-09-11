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
      usuario: ['usuario_demo', [Validators.required]],
      password: ['demo123', [Validators.required, Validators.minLength(6)]]
    });
    this.mensajeBienvenida = 'Mensaje de bienvenida de prueba';
    this.mensajeError = 'Mensaje de error de prueba';
    this.submitted = true;
  }

  ngOnInit() {}

  onLogin() {
    this.submitted = true;
    if (this.loginForm.valid) {
      const { usuario, password } = this.loginForm.value;
      this.mensajeBienvenida = `¡Bienvenido, ${usuario}!`;
      this.mensajeError = '';
      console.log('Login attempt:', { usuario, password });
    } else {
      this.mensajeBienvenida = '';
      this.mensajeError = 'Usuario o contraseña inválidos. Por favor verifica los datos.';
    }
  }
}
