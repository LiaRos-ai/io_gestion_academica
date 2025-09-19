import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { NotasService } from '../services/notas.service';
import { MateriasService } from '../services/materias.service';
import { AuthService } from '../services/auth.service';
import { Nota, Materia } from '../models';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonBackButton, IonCard, IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-notas',
  template: `
<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/tabs/materias"></ion-back-button>
      <ion-button color="primary" fill="clear" (click)="irADashboard()">
        <ion-icon name="home-outline"></ion-icon>
        Dashboard
      </ion-button>
    </ion-buttons>
    <ion-title>{{ selectedMateria ? selectedMateria.nombre + ' - Notas' : 'Notas' }}</ion-title>
    <ion-buttons slot="end">
      <ion-button color="medium" (click)="cerrarSesion()">
        <ion-icon name="log-out-outline"></ion-icon>
        Cerrar sesión
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-list *ngIf="notas.length > 0; else noNotas">
    <ion-item *ngFor="let nota of notas">
      <ion-label>
        <h2>{{ getMateriaNombre(nota.materiaId) }}</h2>
        <p>Tipo: {{ nota.tipo }}</p>
        <p>Descripción: {{ nota.descripcion }}</p>
        <p>Calificación: {{ nota.calificacion }}/100</p>
        <p>Fecha: {{ nota.fecha | date:'short' }}</p>
      </ion-label>
      <ion-buttons slot="end">
        <ion-button color="primary" fill="outline" [disabled]="!nota.id" (click)="actualizarNota(nota.id!)">
          <ion-icon name="create-outline"></ion-icon>
          Editar
        </ion-button>
        <ion-button color="danger" fill="outline" [disabled]="!nota.id" (click)="eliminarNota(nota.id!)">
          <ion-icon name="trash-outline"></ion-icon>
          Eliminar
        </ion-button>
      </ion-buttons>
    </ion-item>
  </ion-list>

  <ng-template #noNotas>
    <ion-card>
      <ion-card-content>
        <ion-icon name="document-text-outline" size="large" color="medium"></ion-icon>
        <h2>No hay notas registradas</h2>
        <p>Agrega tu primera nota para comenzar a gestionar tus calificaciones.</p>
      </ion-card-content>
    </ion-card>
  </ng-template>

  <ion-button expand="block" (click)="agregarNota()">Agregar Nota</ion-button>
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
    IonBackButton,
    IonCard,
    IonCardContent
  ],
  standalone: true
})
export class NotasPage implements OnInit {
  notas: Nota[] = [];
  materias: Materia[] = [];
  currentUserId: string = '';
  selectedMateria: Materia | null = null;
  selectedMateriaId: string | null = null;

  constructor(
    private notasService: NotasService,
    private materiasService: MateriasService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    // Verificar si el usuario está autenticado
    if (!this.authService.isLoggedIn()) {
      console.log('User not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    const user = await this.authService.getCurrentUserProfile();
    if (user) {
      this.currentUserId = user.uid;

      // Leer parámetros de la ruta
      this.route.queryParams.subscribe(params => {
        this.selectedMateriaId = params['materiaId'] || null;
      });

      await this.loadMaterias();
      await this.loadNotas();
    }
  }

  async cerrarSesion() {
    await this.authService.logout();
  }

  async loadMaterias() {
    try {
      this.materias = await this.materiasService.getMateriasByUser(this.currentUserId);
      // Encontrar la materia seleccionada si viene por parámetro
      if (this.selectedMateriaId) {
        this.selectedMateria = this.materias.find(m => m.id === this.selectedMateriaId) || null;
      }
    } catch (error) {
      console.error('Error loading materias:', error);
    }
  }

  async loadNotas() {
    try {
      if (this.selectedMateriaId) {
        // Si viene de una materia específica, cargar solo las notas de esa materia
        this.notas = await this.notasService.getNotasByMateria(this.selectedMateriaId);
      } else {
        // Si no hay materia seleccionada, cargar todas las notas del usuario
        this.notas = await this.notasService.getNotasByUser(this.currentUserId);
      }
    } catch (error) {
      await this.toastController.create({
        message: 'Error al cargar notas',
        color: 'danger',
        duration: 3000,
        position: 'top'
      }).then(toast => toast.present());
    }
  }

  getMateriaNombre(materiaId: string): string {
    const materia = this.materias.find(m => m.id === materiaId);
    return materia ? materia.nombre : 'Materia no encontrada';
  }

  async agregarNota() {
    const alert = await this.alertController.create({
      header: 'Nueva Nota',
      inputs: [
        {
          name: 'materiaId',
          type: 'text',
          placeholder: 'ID de la materia',
          value: this.selectedMateriaId || (this.materias.length > 0 ? this.materias[0].id : '')
        },
        {
          name: 'tipo',
          type: 'text',
          placeholder: 'Tipo (parcial, final, practica, tarea)'
        },
        {
          name: 'descripcion',
          type: 'text',
          placeholder: 'Descripción'
        },
        {
          name: 'calificacion',
          type: 'number',
          placeholder: 'Calificación (0-100)',
          min: 0,
          max: 100
        },
        {
          name: 'fecha',
          type: 'date',
          placeholder: 'Fecha'
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
            if (this.validateNotaData(data)) {
              await this.createNota(data);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private validateNotaData(data: any): boolean {
    if (!data.materiaId || !data.tipo || !data.descripcion || data.calificacion === undefined || !data.fecha) {
      return false;
    }
    const calif = parseFloat(data.calificacion);
    if (isNaN(calif) || calif < 0 || calif > 100) {
      return false;
    }
    return true;
  }

  private async createNota(data: any) {
    const nuevaNota: Omit<Nota, 'id' | 'fechaCreacion'> = {
      materiaId: data.materiaId,
      usuarioId: this.currentUserId,
      tipo: data.tipo,
      descripcion: data.descripcion,
      calificacion: parseFloat(data.calificacion),
      fecha: new Date(data.fecha)
    };
    await this.notasService.addNota(nuevaNota);
    await this.loadNotas();
  }

  async actualizarNota(id: string) {
    const nota = this.notas.find(n => n.id === id);
    if (!nota) return;

    const alert = await this.alertController.create({
      header: 'Editar Nota',
      inputs: [
        {
          name: 'materiaId',
          type: 'text',
          placeholder: 'ID de la materia',
          value: nota.materiaId
        },
        {
          name: 'tipo',
          type: 'text',
          placeholder: 'Tipo (parcial, final, practica, tarea)',
          value: nota.tipo
        },
        {
          name: 'descripcion',
          type: 'text',
          placeholder: 'Descripción',
          value: nota.descripcion
        },
        {
          name: 'calificacion',
          type: 'number',
          placeholder: 'Calificación (0-100)',
          value: nota.calificacion.toString(),
          min: 0,
          max: 100
        },
        {
          name: 'fecha',
          type: 'date',
          placeholder: 'Fecha',
          value: nota.fecha.toISOString().split('T')[0]
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
            if (this.validateNotaData(data)) {
              await this.updateNota(id, data);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async updateNota(id: string, data: any) {
    const notaActualizada: Partial<Nota> = {
      materiaId: data.materiaId,
      tipo: data.tipo,
      descripcion: data.descripcion,
      calificacion: parseFloat(data.calificacion),
      fecha: new Date(data.fecha)
    };

    try {
      await this.notasService.updateNota(id, notaActualizada);
      await this.loadNotas();
      await this.toastController.create({
        message: 'Nota actualizada exitosamente',
        color: 'success',
        duration: 3000,
        position: 'top'
      }).then(toast => toast.present());
    } catch (error) {
      await this.toastController.create({
        message: 'Error al actualizar la nota',
        color: 'danger',
        duration: 3000,
        position: 'top'
      }).then(toast => toast.present());
    }
  }

  async eliminarNota(id: string) {
    await this.notasService.deleteNota(id);
    await this.loadNotas();
  }

  irADashboard() {
    this.router.navigate(['/dashboard']);
  }
}