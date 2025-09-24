import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonList, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonFab, IonFabButton, IonIcon, IonLoading, IonToast, IonModal, IonInput, IonTextarea, IonDatetime } from '@ionic/angular/standalone';
import { GoogleCalendarService, CalendarEvent } from '../services/google-calendar.service';
import { addIcons } from 'ionicons';
import { add, refresh, logOut, logIn, location, arrowBack, barChartOutline } from 'ionicons/icons';

/**
 * Componente de página para Google Calendar
 *
 * Funcionalidades principales:
 * - Autenticación con Google Calendar
 * - Visualización de eventos existentes
 * - Creación de nuevos eventos académicos
 * - Navegación de regreso al dashboard
 *
 * Estados manejados:
 * - Autenticación (conectado/desconectado)
 * - Carga de datos (loading states)
 * - Mensajes de feedback (toasts)
 * - Modal de creación de eventos
 */
@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonList, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonFab, IonFabButton, IonIcon, IonLoading, IonToast, IonModal, IonInput, IonTextarea, IonDatetime, CommonModule, FormsModule, HttpClientModule],
  providers: [GoogleCalendarService]
})
export class CalendarPage implements OnInit {
  // Estado de autenticación con Google Calendar
  isAuthenticated = false;
  
  // Array de eventos cargados desde Google Calendar
  events: CalendarEvent[] = [];
  
  // Lista de calendarios disponibles del usuario
  calendars: any[] = [];
  
  // Estado de carga para mostrar spinners
  loading = false;
  
  // Control de visibilidad del toast de notificaciones
  showToast = false;
  toastMessage = '';
  toastColor: 'success' | 'danger' | 'warning' = 'success';

  // Control del modal para crear eventos
  showCreateModal = false;
  
  // Objeto para almacenar datos del nuevo evento
  newEvent: CalendarEvent = {
    summary: '',                                    // Título del evento
    description: '',                                // Descripción opcional
    start: { dateTime: '', timeZone: 'America/La_Paz' },  // Fecha/hora inicio
    end: { dateTime: '', timeZone: 'America/La_Paz' }     // Fecha/hora fin
  };

  constructor(
    private calendarService: GoogleCalendarService,
    private router: Router
  ) {
    // Registrar iconos de Ionicons para uso en la página
    // Necesario en componentes standalone de Ionic
    addIcons({
      add,                          // Icono + para crear eventos
      refresh,                      // Icono de actualizar
      'log-out': logOut,           // Icono de desconectar
      'log-in': logIn,             // Icono de conectar
      location,                     // Icono de ubicación
      'arrow-back': arrowBack,     // Icono de regresar
      'bar-chart-outline': barChartOutline  // Icono de gráficos
    });
  }

  /**
   * Inicialización del componente
   * Se ejecuta después de que Angular inicializa las propiedades del componente
   */
  ngOnInit() {
    this.checkAuthStatus();
  }

  /**
   * Verifica el estado de autenticación y carga datos iniciales
   * Fuerza autenticación a true ya que usamos token hardcodeado
   */
  async checkAuthStatus() {
    this.isAuthenticated = this.calendarService.isAuthenticated();
    console.log('Auth status:', this.isAuthenticated);
    
    // Forzar autenticación a true ya que tenemos token hardcodeado
    this.isAuthenticated = true;
    
    if (this.isAuthenticated) {
      await this.loadCalendars();
      await this.loadEvents();
    }
  }

  /**
   * Maneja el proceso de inicio de sesión con Google
   * Carga calendarios y eventos después de autenticación exitosa
   */
  async signIn() {
    this.loading = true;
    try {
      await this.calendarService.signIn();
      this.isAuthenticated = true;
      await this.loadCalendars();
      await this.loadEvents();
      this.showToastMessage('Conectado exitosamente a Google Calendar', 'success');
    } catch (error) {
      console.error('Error signing in:', error);
      this.showToastMessage('Error al conectar con Google', 'danger');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Maneja el proceso de cierre de sesión
   * Limpia datos locales y actualiza el estado de la UI
   */
  async signOut() {
    try {
      await this.calendarService.signOut();
      this.isAuthenticated = false;
      this.events = [];           // Limpiar eventos cargados
      this.calendars = [];        // Limpiar calendarios cargados
      this.showToastMessage('Desconectado de Google Calendar', 'success');
    } catch (error) {
      console.error('Error signing out:', error);
      this.showToastMessage('Error al desconectar', 'danger');
    }
  }

  /**
   * Carga la lista de calendarios disponibles del usuario
   * Usa suscripción reactiva para manejar la respuesta asíncrona
   */
  async loadCalendars() {
    try {
      this.calendarService.getCalendars().subscribe({
        next: (calendars) => {
          console.log('Calendars loaded:', calendars);
          this.calendars = calendars || [];
        },
        error: (error) => {
          console.error('Error loading calendars:', error);
          this.showToastMessage('Error al cargar calendarios', 'danger');
        }
      });
    } catch (error) {
      console.error('Error in loadCalendars:', error);
      this.showToastMessage('Error al cargar calendarios', 'danger');
    }
  }

  /**
   * Carga eventos del calendario principal
   * Sin filtros de fecha para mostrar todos los eventos disponibles
   */
  async loadEvents() {
    this.loading = true;
    try {
      console.log('Loading all events without date filters...');
      
      // Cargar todos los eventos sin filtros de fecha
      this.calendarService.getEvents('primary').subscribe({
        next: (events) => {
          console.log('Events loaded:', events);
          this.events = events || [];
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.showToastMessage('Error al cargar eventos', 'danger');
          this.loading = false;
        }
      });
    } catch (error) {
      console.error('Error in loadEvents:', error);
      this.showToastMessage('Error al cargar eventos', 'danger');
      this.loading = false;
    }
  }

  /**
   * Crea un nuevo evento en Google Calendar
   * Valida campos requeridos y formatea fechas correctamente
   */
  async createEvent() {
    // Validar que los campos requeridos estén completos
    if (!this.newEvent.summary || !this.newEvent.start?.dateTime || !this.newEvent.end?.dateTime) {
      this.showToastMessage('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    this.loading = true;
    try {
      // Formatear datos del evento para Google Calendar API
      // Las fechas deben estar en formato ISO 8601
      const eventData: CalendarEvent = {
        summary: this.newEvent.summary,
        description: this.newEvent.description || '',
        start: {
          dateTime: new Date(this.newEvent.start.dateTime).toISOString(),
          timeZone: 'America/La_Paz'
        },
        end: {
          dateTime: new Date(this.newEvent.end.dateTime).toISOString(),
          timeZone: 'America/La_Paz'
        }
      };
      
      console.log('Creating event with formatted data:', eventData);
      
      this.calendarService.createEvent('primary', eventData).subscribe({
        next: (createdEvent) => {
          console.log('Event created successfully:', createdEvent);
          this.showCreateModal = false;    // Cerrar modal
          this.resetNewEvent();            // Limpiar formulario
          this.loadEvents();               // Recargar eventos
          this.showToastMessage('Evento creado exitosamente', 'success');
          this.loading = false;
        },
        error: (error) => {
          console.error('Error creating event:', error);
          console.error('Error details:', error.error);
          this.showToastMessage('Error al crear el evento: ' + (error.error?.error?.message || 'Error desconocido'), 'danger');
          this.loading = false;
        }
      });
    } catch (error) {
      console.error('Error in createEvent:', error);
      this.showToastMessage('Error al crear el evento', 'danger');
      this.loading = false;
    }
  }

  /**
   * Reinicia el formulario de nuevo evento a sus valores por defecto
   */
  resetNewEvent() {
    this.newEvent = {
      summary: '',
      description: '',
      start: { dateTime: '', timeZone: 'America/La_Paz' },
      end: { dateTime: '', timeZone: 'America/La_Paz' }
    };
  }

  /**
   * Formatea una fecha ISO para mostrar en la UI
   * @param dateTime - Fecha en formato ISO string
   * @returns Fecha formateada en español
   */
  formatDate(dateTime: string): string {
    return new Date(dateTime).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Muestra un mensaje toast al usuario
   * @param message - Mensaje a mostrar
   * @param color - Color del toast (success, danger, warning)
   */
  private showToastMessage(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    this.toastMessage = message;
    this.toastColor = color;
    this.showToast = true;
  }

  /**
   * Maneja el evento de cierre del toast
   */
  onToastDismiss() {
    this.showToast = false;
  }

  /**
   * Navega de regreso al dashboard principal
   * Usa Angular Router para navegación programática
   */
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
