import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { HorariosService } from '../services/horarios.service';
import { MateriasService } from '../services/materias.service';
import { AuthService } from '../services/auth.service';
import { Horario, Materia } from '../models';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons, IonIcon, IonBackButton, IonCard, IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-horarios',
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
    <ion-title>{{ selectedMateria ? selectedMateria.nombre + ' - Horarios' : 'Horarios' }}</ion-title>
    <ion-buttons slot="end">
      <ion-button color="medium" (click)="cerrarSesion()">
        <ion-icon name="log-out-outline"></ion-icon>
        Cerrar sesión
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-list *ngIf="horarios.length > 0; else noHorarios">
    <ion-item *ngFor="let horario of horarios">
      <ion-label>
        <h2>{{ getMateriaNombre(horario.materiaId) }}</h2>
        <p>Día: {{ horario.diaSemana }}</p>
        <p>Hora: {{ horario.horaInicio }} - {{ horario.horaFin }}</p>
        <p *ngIf="horario.aula">Aula: {{ horario.aula }}</p>
      </ion-label>
      <ion-buttons slot="end">
        <ion-button color="primary" fill="outline" [disabled]="!horario.id" (click)="actualizarHorario(horario.id!)">
          <ion-icon name="create-outline"></ion-icon>
          Editar
        </ion-button>
        <ion-button color="danger" fill="outline" [disabled]="!horario.id" (click)="eliminarHorario(horario.id!)">
          <ion-icon name="trash-outline"></ion-icon>
          Eliminar
        </ion-button>
      </ion-buttons>
    </ion-item>
  </ion-list>

  <ng-template #noHorarios>
    <ion-card>
      <ion-card-content>
        <ion-icon name="time-outline" size="large" color="medium"></ion-icon>
        <h2>No hay horarios registrados</h2>
        <p>Agrega tu primer horario para organizar tus clases.</p>
      </ion-card-content>
    </ion-card>
  </ng-template>

  <ion-button expand="block" (click)="agregarHorario()">Agregar Horario</ion-button>
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
export class HorariosPage implements OnInit {
  horarios: Horario[] = [];
  materias: Materia[] = [];
  currentUserId: string = '';
  selectedMateria: Materia | null = null;
  selectedMateriaId: string | null = null;

  constructor(
    private horariosService: HorariosService,
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
      await this.loadHorarios();
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

  async loadHorarios() {
    try {
      if (this.selectedMateriaId) {
        // Si viene de una materia específica, cargar solo los horarios de esa materia
        this.horarios = await this.horariosService.getHorariosByMateria(this.selectedMateriaId);
      } else {
        // Si no hay materia seleccionada, cargar todos los horarios del usuario
        this.horarios = await this.horariosService.getHorariosByUser(this.currentUserId);
      }
    } catch (error) {
      await this.toastController.create({
        message: 'Error al cargar horarios',
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

  async agregarHorario() {
    const alert = await this.alertController.create({
      header: 'Nuevo Horario',
      inputs: [
        {
          name: 'materiaId',
          type: 'text',
          placeholder: 'ID de la materia',
          value: this.selectedMateriaId || (this.materias.length > 0 ? this.materias[0].id : '')
        },
        {
          name: 'diaSemana',
          type: 'text',
          placeholder: 'Día de la semana (lunes, martes, etc.)'
        },
        {
          name: 'horaInicio',
          type: 'time',
          placeholder: 'Hora de inicio'
        },
        {
          name: 'horaFin',
          type: 'time',
          placeholder: 'Hora de fin'
        },
        {
          name: 'aula',
          type: 'text',
          placeholder: 'Aula (opcional)'
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
            if (this.validateHorarioData(data)) {
              await this.createHorario(data);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private validateHorarioData(data: any): boolean {
    if (!data.materiaId || !data.diaSemana || !data.horaInicio || !data.horaFin) {
      return false;
    }
    const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    if (!diasValidos.includes(data.diaSemana.toLowerCase())) {
      return false;
    }
    return true;
  }

  private async createHorario(data: any) {
    const nuevoHorario: Omit<Horario, 'id' | 'fechaCreacion'> = {
      materiaId: data.materiaId,
      usuarioId: this.currentUserId,
      diaSemana: data.diaSemana.toLowerCase(),
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
      aula: data.aula || undefined
    };
    await this.horariosService.addHorario(nuevoHorario);
    await this.loadHorarios();
  }

  async actualizarHorario(id: string) {
    const horario = this.horarios.find(h => h.id === id);
    if (!horario) return;

    const alert = await this.alertController.create({
      header: 'Editar Horario',
      inputs: [
        {
          name: 'materiaId',
          type: 'text',
          placeholder: 'ID de la materia',
          value: horario.materiaId
        },
        {
          name: 'diaSemana',
          type: 'text',
          placeholder: 'Día de la semana (lunes, martes, etc.)',
          value: horario.diaSemana
        },
        {
          name: 'horaInicio',
          type: 'time',
          placeholder: 'Hora de inicio',
          value: horario.horaInicio
        },
        {
          name: 'horaFin',
          type: 'time',
          placeholder: 'Hora de fin',
          value: horario.horaFin
        },
        {
          name: 'aula',
          type: 'text',
          placeholder: 'Aula (opcional)',
          value: horario.aula || ''
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
            if (this.validateHorarioData(data)) {
              await this.updateHorario(id, data);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async updateHorario(id: string, data: any) {
    const horarioActualizado: Partial<Horario> = {
      materiaId: data.materiaId,
      diaSemana: data.diaSemana.toLowerCase(),
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
      aula: data.aula || undefined
    };

    try {
      await this.horariosService.updateHorario(id, horarioActualizado);
      await this.loadHorarios();
      await this.toastController.create({
        message: 'Horario actualizado exitosamente',
        color: 'success',
        duration: 3000,
        position: 'top'
      }).then(toast => toast.present());
    } catch (error) {
      await this.toastController.create({
        message: 'Error al actualizar el horario',
        color: 'danger',
        duration: 3000,
        position: 'top'
      }).then(toast => toast.present());
    }
  }

  async eliminarHorario(id: string) {
    await this.horariosService.deleteHorario(id);
    await this.loadHorarios();
  }

  irADashboard() {
    this.router.navigate(['/dashboard']);
  }
}