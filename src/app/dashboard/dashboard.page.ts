import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonButtons, IonIcon, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';

@Component({
  selector: 'app-dashboard',
  template: `
<ion-header>
  <ion-toolbar>
    <ion-title>Gestión Académica</ion-title>
    <ion-buttons slot="end">
      <ion-button color="medium" (click)="cerrarSesion()">
        <ion-icon name="log-out-outline"></ion-icon>
        Cerrar sesión
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-grid>
    <ion-row>
      <ion-col size="12" size-md="6">
        <ion-card button (click)="irAMaterias()">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="school-outline" color="primary"></ion-icon>
              Materias
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            Gestiona tus asignaturas, agrega nuevas materias, edita información y elimina las que ya no necesites.
          </ion-card-content>
        </ion-card>
      </ion-col>

      <ion-col size="12" size-md="6">
        <ion-card button (click)="irANotas()">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="document-text-outline" color="secondary"></ion-icon>
              Notas
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            Registra y administra las calificaciones de tus materias. Visualiza tu rendimiento académico.
          </ion-card-content>
        </ion-card>
      </ion-col>
    </ion-row>

    <ion-row>
      <ion-col size="12" size-md="6">
        <ion-card button (click)="irAHorarios()">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="time-outline" color="tertiary"></ion-icon>
              Horarios
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            Organiza tus horarios de clases. Mantén un registro de tus sesiones académicas.
          </ion-card-content>
        </ion-card>
      </ion-col>

      <ion-col size="12" size-md="6">
        <ion-card button (click)="irAEstadisticas()">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="bar-chart-outline" color="success"></ion-icon>
              Estadísticas
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            Visualiza estadísticas y análisis de tu rendimiento académico.
          </ion-card-content>
        </ion-card>
      </ion-col>
    </ion-row>
  </ion-grid>
</ion-content>
  `,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol
  ],
  standalone: true
})
export class DashboardPage implements OnInit {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    // Verificar si el usuario está autenticado
    if (!this.authService.isLoggedIn()) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
    }
  }

  async cerrarSesion() {
    await this.authService.logout();
  }

  irAMaterias() {
    this.router.navigate(['/tabs/materias']);
  }

  irANotas() {
    this.router.navigate(['/tabs/notas']);
  }

  irAHorarios() {
    this.router.navigate(['/tabs/horarios']);
  }

  irAEstadisticas() {
    // Por ahora redirigir a materias, se puede implementar después
    this.router.navigate(['/tabs/materias']);
  }
}