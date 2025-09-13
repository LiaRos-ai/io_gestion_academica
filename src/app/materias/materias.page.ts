import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { MateriasService } from '../services/materias.service';
import { AuthService } from '../services/auth.service';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';

export interface Materia {
  id?: string;
  codigo: string;
  nombre: string;
  creditos: number;
  docente: string;
  periodo: string;
  color?: string;
  usuarioId?: string;
  fechaCreacion?: Date;
  activa?: boolean;
}

@Component({
  selector: 'app-materias',
  template: `
<ion-header>
  <ion-toolbar>
    <ion-title>Materias</ion-title>
    <ion-buttons slot="end">
      <ion-button color="medium" (click)="cerrarSesion()">
        <ion-icon name="log-out-outline"></ion-icon>
        Cerrar sesión
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-list>
    <ion-item *ngFor="let materia of materias">
      <ion-label>
        <h2>{{ materia.nombre }}</h2>
        <p>Docente: {{ materia.docente }}</p>
        <p>Créditos: {{ materia.creditos }}</p>
        <p>Periodo: {{ materia.periodo }}</p>
      </ion-label>
      <ion-button color="primary" [disabled]="!materia.id" (click)="actualizarMateria(materia.id!)">Actualizar</ion-button>
      <ion-button color="danger" [disabled]="!materia.id" (click)="eliminarMateria(materia.id!)">Eliminar</ion-button>
    </ion-item>
  </ion-list>

  <ion-button expand="block" (click)="agregarMateria()">Agregar materia de ejemplo</ion-button>
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
  IonIcon
  ],
  standalone: true,
  providers: [ModalController]
})
export class MateriasPage implements OnInit {
  async inicializarMateriasDemo() {
    // Verifica si la colección está vacía y agrega un documento de ejemplo
    const materias = await this.materiasService.getMaterias();
    if (materias.length === 0) {
      const demoMateria = {
        codigo: 'ING101',
        nombre: 'Matemáticas Básicas',
        creditos: 3,
        docente: 'Juan Pérez',
        periodo: '2024-1',
        color: '#2196F3',
        usuarioId: 'demo',
        fechaCreacion: new Date(),
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

  constructor(
    private materiasService: MateriasService,
    private authService: AuthService,
    private alertController: AlertController,
    private modalController: ModalController,
    private toastController: ToastController
  ) {}

  ngOnInit(): void {
  this.loadMaterias();
  this.inicializarMateriasDemo();
  }

  async loadMaterias() {
    this.isLoading = true;
    try {
      this.materias = await this.materiasService.getMaterias();
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
    const nuevaMateria: Materia = {
      codigo: data.codigo.toUpperCase(),
      nombre: data.nombre,
      creditos: parseInt(data.creditos),
      docente: data.docente,
      periodo: this.periodoActual,
      color: '#2196F3',
      usuarioId: 'ID_USUARIO',
      fechaCreacion: new Date(),
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


