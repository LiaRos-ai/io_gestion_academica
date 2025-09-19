import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { MateriasService } from '../services/materias.service';
import { AuthService } from '../services/auth.service';
import { Materia } from '../models';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonCard, IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-materias',
  template: `
<ion-header>
  <ion-toolbar>
    <ion-title>Materias</ion-title>
    <ion-buttons slot="start">
      <ion-button color="primary" fill="clear" (click)="irADashboard()">
        <ion-icon name="home-outline"></ion-icon>
        Dashboard
      </ion-button>
    </ion-buttons>
    <ion-buttons slot="end">
      <ion-button color="medium" (click)="cerrarSesion()">
        <ion-icon name="log-out-outline"></ion-icon>
        Cerrar sesión
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-list *ngIf="materias.length > 0; else noMaterias">
    <ion-item *ngFor="let materia of materias">
      <ion-label>
        <h2>{{ materia.nombre }}</h2>
        <p>Docente: {{ materia.docente }}</p>
        <p>Créditos: {{ materia.creditos }}</p>
        <p>Periodo: {{ materia.periodo }}</p>
      </ion-label>
      <ion-buttons slot="end">
        <ion-button color="secondary" fill="outline" (click)="verNotas(materia.id!)">
          <ion-icon name="document-text-outline"></ion-icon>
          Notas
        </ion-button>
        <ion-button color="tertiary" fill="outline" (click)="verHorarios(materia.id!)">
          <ion-icon name="time-outline"></ion-icon>
          Horarios
        </ion-button>
        <ion-button color="primary" fill="outline" (click)="actualizarMateria(materia.id!)">
          <ion-icon name="create-outline"></ion-icon>
          Editar
        </ion-button>
        <ion-button color="danger" fill="outline" (click)="eliminarMateria(materia.id!)">
          <ion-icon name="trash-outline"></ion-icon>
          Eliminar
        </ion-button>
      </ion-buttons>
    </ion-item>
  </ion-list>

  <ng-template #noMaterias>
    <ion-card>
      <ion-card-content>
        <ion-icon name="school-outline" size="large" color="medium"></ion-icon>
        <h2>No hay materias registradas</h2>
        <p>Agrega tu primera materia para comenzar a gestionar tu rendimiento académico.</p>
      </ion-card-content>
    </ion-card>
  </ng-template>

  <ion-button expand="block" (click)="agregarMateria()">Agregar Materia</ion-button>
</ion-content>
`,
  imports: [
  CommonModule,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent
  ],
  standalone: true,
  providers: [ModalController]
})
export class MateriasPage implements OnInit {
  async inicializarMateriasDemo() {
    // Only create demo data if user is logged in
    if (!this.currentUserId) return;

    // Verifica si el usuario tiene materias y agrega un documento de ejemplo
    const userMaterias = await this.materiasService.getMateriasByUser(this.currentUserId);
    if (userMaterias.length === 0) {
      const demoMateria: Omit<Materia, 'id' | 'fechaCreacion'> = {
        codigo: 'ING101',
        nombre: 'Matemáticas Básicas',
        creditos: 3,
        docente: 'Juan Pérez',
        periodo: '2024-1',
        color: '#2196F3',
        usuarioId: this.currentUserId,
        activa: true
      };
      await this.materiasService.addMateria(demoMateria);
      await this.loadMaterias();
      await this.toastController.create({
        message: 'Colección creada con materia de ejemplo',
        color: 'success',
        duration: 3000,
        position: 'top'
      }).then(toast => toast.present());
    }
  }
  async cerrarSesion() {
    await this.authService.logout();
  }

  materias: Materia[] = [];
  filteredMaterias: Materia[] = [];
  searchTerm: string = '';
  periodoActual: string = '2024-1';
  isLoading = false;
  currentUserId: string = '';

  constructor(
    private materiasService: MateriasService,
    private authService: AuthService,
    private alertController: AlertController,
    private modalController: ModalController,
    private toastController: ToastController,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    // Verificar si el usuario está autenticado
    if (!this.authService.isLoggedIn()) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    const user = await this.authService.getCurrentUserProfile();
    if (user) {
      this.currentUserId = user.uid;
    }
    await this.loadMaterias();
    await this.inicializarMateriasDemo();
  }

  async loadMaterias() {
    this.isLoading = true;
    try {
      if (this.currentUserId) {
        this.materias = await this.materiasService.getMateriasByUser(this.currentUserId);
      } else {
        this.materias = [];
      }
      this.filteredMaterias = this.materias;
    } catch (error) {
      await this.toastController.create({
        message: 'Error al cargar materias',
        color: 'danger',
        duration: 3000,
        position: 'top'
      }).then(toast => toast.present());
      this.materias = [];
      this.filteredMaterias = [];
    }
    this.isLoading = false;
  }

  agregarMateria() {
    this.addMateria();
  }

  verNotas(materiaId: string) {
    this.router.navigate(['/tabs/notas'], { queryParams: { materiaId } });
  }

  verHorarios(materiaId: string) {
    this.router.navigate(['/tabs/horarios'], { queryParams: { materiaId } });
  }

  irADashboard() {
    this.router.navigate(['/dashboard']);
  }

  async actualizarMateria(id: string) {
    // Lógica para actualizar una materia
    console.log('Actualizar materia', id);
  }

  async eliminarMateria(id: string) {
    await this.materiasService.deleteMateria(id);
    await this.loadMaterias();
  }

  private validateMateriaData(data: any): boolean {
    if (!data.codigo || !data.nombre || !data.docente) {
      return false;
    }
    return true;
  }

  private async createMateria(data: any) {
    const nuevaMateria: Omit<Materia, 'id' | 'fechaCreacion'> = {
      codigo: data.codigo.toUpperCase(),
      nombre: data.nombre,
      creditos: parseInt(data.creditos),
      docente: data.docente,
      periodo: this.periodoActual,
      color: '#2196F3',
      usuarioId: this.currentUserId,
      activa: true
    };
    await this.materiasService.addMateria(nuevaMateria);
    await this.loadMaterias();
  }

  async addMateria() {
    const alert = await this.alertController.create({
      header: 'Nueva Materia',
      inputs: [
        {
          name: 'codigo',
          type: 'text',
          placeholder: 'Código (ej: ING301)'
        },
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre de la materia'
        },
        {
          name: 'creditos',
          type: 'number',
          placeholder: 'Créditos',
          value: '3'
        },
        {
          name: 'docente',
          type: 'text',
          placeholder: 'Nombre del docente'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (this.validateMateriaData(data)) {
              await this.createMateria(data);
            }
          }
        }
      ]
    });
    await alert.present();
  }
}


