// src/app/pages/materias-sqlite/materias-sqlite.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonList, IonItem, IonLabel, IonInput, IonIcon, IonCheckbox, IonSegment, IonSegmentButton, IonText } from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { SQLiteService, Materia, MateriaConPromedio } from '../../services/sqlite.service';
import { SQLite } from '@ionic-native/sqlite/ngx';

@Component({
  selector: 'app-materias-sqlite',
  templateUrl: './materias-sqlite.page.html',
  styleUrls: ['./materias-sqlite.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonIcon,
    IonCheckbox,
    IonSegment,
    IonSegmentButton,
    IonText
  ],
})
export class MateriasSqlitePage implements OnInit {
  materias: MateriaConPromedio[] = [];
  materiaForm: FormGroup;
  isEditing = false;
  editingId: number | null = null;
  loading = false;
  currentUserId = 1; // En una app real, esto vendría del servicio de autenticación

  // Filtros
  searchTerm = '';
  selectedPeriodo = '';
  periodos = ['2024-1', '2024-2', '2024-3', '2025-1'];

  // Colores disponibles
  availableColors = [
    '#3880ff', '#10dc60', '#ffce00', '#f04141',
    '#7044ff', '#00d2ff', '#ff6b6b', '#4ecdc4',
    '#45b7d1', '#f9ca24', '#6c5ce7', '#a55eea'
  ];

  constructor(
    private fb: FormBuilder,
    private sqliteService: SQLiteService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    this.materiaForm = this.fb.group({
      codigo: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(10),
        Validators.pattern(/^[A-Z0-9]+$/) // Solo mayúsculas y números
      ]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      creditos: [3, [Validators.required, Validators.min(1), Validators.max(6)]],
      docente: ['', [Validators.required]],
      periodo: ['2024-2', [Validators.required]],
      color: ['#3880ff']
    });
  }

  async ngOnInit() {
    await this.loadMaterias();
  }

  async ionViewWillEnter() {
    await this.loadMaterias();
  }

  async loadMaterias() {
    const loading = await this.loadingController.create({
      message: 'Cargando materias desde SQLite...'
    });
    await loading.present();

    try {
      // Usar el método que incluye promedios calculados con SQL
      this.materias = await this.sqliteService.getMateriasConPromedio(this.currentUserId);
      console.log('Materias loaded from SQLite:', this.materias.length);
    } catch (error) {
      console.error('Error loading materias:', error);
      await this.showToast('Error cargando materias desde SQLite', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async onSubmit() {
    if (this.materiaForm.invalid) {
      await this.showToast('Por favor completa todos los campos correctamente', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditing ? 'Actualizando materia...' : 'Creando materia...'
    });
    await loading.present();

    const materiaData: Materia = {
      ...this.materiaForm.value,
      usuario_id: this.currentUserId
    };

    try {
      if (this.isEditing && this.editingId) {
        await this.sqliteService.updateMateria(this.editingId, materiaData);
        await this.showToast('Materia actualizada en SQLite exitosamente', 'success');
      } else {
        await this.sqliteService.createMateria(materiaData);
        await this.showToast('Materia creada en SQLite exitosamente', 'success');
      }

      this.resetForm();
      await this.loadMaterias();
    } catch (error: any) {
      console.error('Error saving materia:', error);
      if (error.message.includes('Ya existe una materia con código')) {
        await this.showToast('Ya tienes una materia con ese código', 'warning');
      } else {
        await this.showToast(error.message || 'Error guardando materia en SQLite', 'danger');
      }
    } finally {
      await loading.dismiss();
    }
  }

  editMateria(materia: MateriaConPromedio) {
    this.isEditing = true;
    this.editingId = materia.id!;
    this.materiaForm.patchValue({
      codigo: materia.codigo,
      nombre: materia.nombre,
      creditos: materia.creditos,
      docente: materia.docente,
      periodo: materia.periodo,
      color: materia.color
    });

    // Scroll al formulario
    document.getElementById('materia-form')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  }

  async deleteMateria(materia: MateriaConPromedio) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `
        <div style="text-align: left;">
          <p>¿Estás seguro de eliminar la materia <strong>"${materia.nombre}"</strong>?</p>
          <br>
          <p><strong>Esta acción:</strong></p>
          <ul>
            <li>Eliminará la materia de SQLite</li>
            <li>Eliminará todas las ${materia.cantidad_notas || 0} notas asociadas</li>
            <li>Eliminará los horarios configurados</li>
            <li>No se puede deshacer</li>
          </ul>
        </div>
      `,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Eliminando materia de SQLite...'
            });
            await loading.present();

            try {
              const deleted = await this.sqliteService.deleteMateria(materia.id!);
              if (deleted) {
                await this.showToast('Materia eliminada de SQLite exitosamente', 'success');
                await this.loadMaterias();
              } else {
                await this.showToast('No se pudo eliminar la materia', 'warning');
              }
            } catch (error) {
              console.error('Error deleting materia:', error);
              await this.showToast('Error eliminando materia de SQLite', 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  resetForm() {
    this.materiaForm.reset({
      codigo: '',
      nombre: '',
      creditos: 3,
      docente: '',
      periodo: '2024-2',
      color: '#3880ff'
    });
    this.isEditing = false;
    this.editingId = null;
  }

  cancelEdit() {
    this.resetForm();
  }

  // Filtrado de materias
  get filteredMaterias() {
    return this.materias.filter(materia => {
      const matchesSearch = !this.searchTerm || 
        materia.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        materia.codigo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        materia.docente?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesPeriodo = !this.selectedPeriodo || 
        materia.periodo === this.selectedPeriodo;

      return matchesSearch && matchesPeriodo;
    });
  }

  // Validación personalizada para código de materia
  async validateCodigo() {
    const codigo = this.materiaForm.get('codigo')?.value?.toUpperCase();
    if (!codigo) return;

    this.materiaForm.patchValue({ codigo: codigo });

    // Solo validar si no estamos editando o si el código cambió
    if (this.isEditing) {
      const currentMateria = this.materias.find(m => m.id === this.editingId);
      if (currentMateria && currentMateria.codigo === codigo) {
        return; // No validar si es el mismo código
      }
    }

    const exists = this.materias.find(m => m.codigo === codigo);
    if (exists) {
      this.materiaForm.get('codigo')?.setErrors({ duplicate: true });
      await this.showToast('Ya existe una materia con este código', 'warning');
    }
  }

  // Métodos auxiliares para validación
  getFormError(fieldName: string): string {
    const field = this.materiaForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${minLength} caracteres`;
    }
    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} no puede exceder ${maxLength} caracteres`;
    }
    if (field?.hasError('min')) {
      const min = field.errors?.['min'].min;
      return `${this.getFieldLabel(fieldName)} debe ser al menos ${min}`;
    }
    if (field?.hasError('max')) {
      const max = field.errors?.['max'].max;
      return `${this.getFieldLabel(fieldName)} no puede ser mayor a ${max}`;
    }
    if (field?.hasError('pattern')) {
      return 'Código debe contener solo letras mayúsculas y números';
    }
    if (field?.hasError('duplicate')) {
      return 'Ya existe una materia con este código';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      codigo: 'Código',
      nombre: 'Nombre',
      creditos: 'Créditos',
      docente: 'Docente',
      periodo: 'Período',
      color: 'Color'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.materiaForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Métodos para estadísticas usando datos de SQLite
  getTotalCreditos(): number {
    return this.materias.reduce((total, materia) => total + (materia.creditos || 3), 0);
  }

  getPromedioGeneral(): number {
    const materiasConNotas = this.materias.filter(m => (m.promedio || 0) > 0);
    if (materiasConNotas.length === 0) return 0;

    const totalPonderado = materiasConNotas.reduce((sum, materia) => {
      return sum + ((materia.promedio || 0) * (materia.creditos || 3));
    }, 0);

    const totalCreditos = materiasConNotas.reduce((sum, materia) => {
      return sum + (materia.creditos || 3);
    }, 0);

    return totalCreditos > 0 ? Math.round((totalPonderado / totalCreditos) * 100) / 100 : 0;
  }

  getMateriasByPeriodo() {
    const materiasPorPeriodo: { [key: string]: number } = {};
    this.materias.forEach(materia => {
      const periodo = materia.periodo || 'Sin período';
      materiasPorPeriodo[periodo] = (materiasPorPeriodo[periodo] || 0) + 1;
    });
    return materiasPorPeriodo;
  }

  async viewMateriaDetails(materia: MateriaConPromedio) {
    const notas = await this.sqliteService.getNotasByMateriaId(materia.id!);
    
    const alert = await this.alertController.create({
      header: materia.nombre,
      subHeader: `${materia.codigo} - ${materia.docente}`,
      message: `
        <div style="text-align: left;">
          <p><strong>Créditos:</strong> ${materia.creditos}</p>
          <p><strong>Período:</strong> ${materia.periodo}</p>
          <p><strong>Promedio actual:</strong> ${(materia.promedio || 0).toFixed(2)}</p>
          <p><strong>Notas registradas:</strong> ${materia.cantidad_notas || 0}</p>
          <p><strong>Porcentaje completado:</strong> ${materia.porcentaje_total || 0}%</p>
          <p><strong>Estado de sync:</strong> ${materia.sync_status}</p>
          <p><strong>Almacenado en:</strong> SQLite (Base de datos local)</p>
        </div>
      `,
      buttons: [
        {
          text: 'Ver Notas',
          handler: () => {
            // Navegar a página de notas con filtro de materia
            // this.router.navigate(['/notas-sqlite'], { queryParams: { materia: materia.id } });
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

  // Utilidad para el template
  trackByMateria(index: number, item: MateriaConPromedio): any {
    return item.id;
  }

  getStatusColor(promedio: number): string {
    if (promedio >= 4.0) return 'success';
    if (promedio >= 3.0) return 'warning';
    if (promedio > 0) return 'danger';
    return 'medium';
  }
}