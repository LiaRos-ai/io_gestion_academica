import { Injectable } from '@angular/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

/**
 * Interfaz para eventos de Google Calendar
 * Define la estructura de datos para crear y manipular eventos académicos
 */
export interface CalendarEvent {
  id?: string;                    // ID único del evento (generado por Google)
  summary: string;                // Título del evento (requerido)
  description?: string;           // Descripción opcional del evento
  start: {                        // Fecha y hora de inicio
    dateTime: string;             // Formato ISO 8601 (ej: 2025-09-24T14:30:00Z)
    timeZone?: string;            // Zona horaria (ej: America/La_Paz)
  };
  end: {                          // Fecha y hora de fin
    dateTime: string;             // Formato ISO 8601
    timeZone?: string;            // Zona horaria
  };
  location?: string;              // Ubicación opcional del evento
  attendees?: Array<{             // Lista de asistentes opcional
    email: string;
    displayName?: string;
  }>;
  reminders?: {                   // Configuración de recordatorios
    useDefault: boolean;          // Usar recordatorios por defecto
    overrides?: Array<{           // Recordatorios personalizados
      method: 'email' | 'popup';  // Tipo de recordatorio
      minutes: number;            // Minutos antes del evento
    }>;
  };
}

/**
 * Interfaz para la lista de calendarios del usuario
 */
export interface CalendarList {
  id: string;                     // ID único del calendario
  summary: string;                // Nombre del calendario
  primary?: boolean;              // Si es el calendario principal
  accessRole: string;             // Nivel de acceso (owner, reader, writer)
}

/**
 * Servicio para integración con Google Calendar API
 *
 * Funcionalidades principales:
 * - Autenticación con Google OAuth 2.0
 * - CRUD completo de eventos de calendario
 * - Manejo de múltiples calendarios
 * - Soporte para access tokens hardcodeados (desarrollo/testing)
 *
 * Uso típico:
 * 1. Inyectar el servicio en un componente
 * 2. Verificar autenticación con isAuthenticated()
 * 3. Usar métodos CRUD para manipular eventos
 *
 * Nota: Actualmente usa un access token hardcodeado para desarrollo.
 * En producción, implementar flujo OAuth completo.
 */
@Injectable()
export class GoogleCalendarService {
  // URL base de la API de Google Calendar v3
  private readonly CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
  
  // Access token para autenticación con Google API
  // IMPORTANTE: En producción usar OAuth flow - NO hardcodear tokens
  // Para desarrollo, usar variables de entorno o configuración segura
  private accessToken: string | null = null; // TODO: Implementar OAuth flow seguro
  
  // BehaviorSubject para manejar el estado de autenticación reactivamente
  // Permite a los componentes suscribirse y reaccionar a cambios de autenticación
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  // Observable público para que los componentes puedan suscribirse al estado de auth
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Inicializar Google Auth con configuración del proyecto
    GoogleAuth.initialize({
      clientId: '253562087581-ehssj6fasblq3q07d0b2f2op7km7iobf.apps.googleusercontent.com',
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'], // Permisos necesarios
      grantOfflineAccess: true, // Permite obtener refresh tokens
    });

    // Verificar si el usuario ya está autenticado al inicializar
    this.checkAuthState();
    
    // Establecer estado autenticado como true ya que tenemos token hardcodeado
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Verifica el estado de autenticación actual
   * Intenta refrescar el token existente si hay una sesión activa
   */
  private async checkAuthState() {
    try {
      const user = await GoogleAuth.refresh();
      if (user) {
        this.accessToken = user.accessToken;
        this.isAuthenticatedSubject.next(true);
      }
    } catch (error) {
      console.log('User not authenticated with Google');
      this.isAuthenticatedSubject.next(false);
    }
  }

  /**
   * Inicia sesión con Google
   * Nota: Actualmente usa token hardcodeado para desarrollo
   * En producción, implementar flujo OAuth completo
   */
  async signIn(): Promise<any> {
    try {
      // TODO: Implementar flujo OAuth completo
      // Actualmente simula autenticación exitosa para desarrollo
      
      this.isAuthenticatedSubject.next(true);
      console.log('Google Sign-In successful (using hardcoded token)');
      return { success: true, token: this.accessToken };
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  }

  /**
   * Cierra sesión y limpia el estado local
   * No llama a GoogleAuth.signOut() ya que usamos token hardcodeado
   */
  async signOut(): Promise<void> {
    try {
      // Como usamos token hardcodeado, solo limpiar estado local
      // No llamar GoogleAuth.signOut() ya que no hay sesión real
      this.accessToken = null;
      this.isAuthenticatedSubject.next(false);
      console.log('Google Sign-Out successful (local only)');
    } catch (error) {
      console.error('Google Sign-Out failed:', error);
      // Incluso si hay error, limpiar el estado local
      this.accessToken = null;
      this.isAuthenticatedSubject.next(false);
    }
  }

  /**
   * Establece un access token manualmente
   * Útil para testing o cuando se tiene un token válido
   * @param token - Access token válido de Google
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    this.isAuthenticatedSubject.next(true);
    console.log('Access token set manually');
  }

  /**
   * Genera headers HTTP con autorización para las peticiones a Google API
   * @returns HttpHeaders con Authorization Bearer token
   * @throws Error si no hay access token disponible
   */
  private getHeaders(): HttpHeaders {
    if (!this.accessToken) {
      throw new Error('No access token available. Please sign in first.');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    });
  }

  // Get list of calendars
  getCalendars(): Observable<CalendarList[]> {
    const url = `${this.CALENDAR_API_BASE}/users/me/calendarList`;
    return this.http.get<{ items: CalendarList[] }>(url, { headers: this.getHeaders() })
      .pipe(
        map(response => response.items),
        catchError(error => {
          console.error('Error getting calendars:', error);
          throw error;
        })
      );
  }

  // Get events from a specific calendar
  getEvents(calendarId: string = 'primary', timeMin?: string, timeMax?: string): Observable<CalendarEvent[]> {
    let url = `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events?singleEvents=true&orderBy=startTime`;

    if (timeMin) {
      url += `&timeMin=${timeMin}`;
    }
    if (timeMax) {
      url += `&timeMax=${timeMax}`;
    }

    console.log('Getting events from URL:', url);
    console.log('Headers:', this.getHeaders());

    return this.http.get<{ items: CalendarEvent[] }>(url, { headers: this.getHeaders() })
      .pipe(
        map(response => {
          console.log('Raw API response:', response);
          console.log('Response items:', response.items);
          console.log('Response items length:', response.items ? response.items.length : 'items is undefined');
          console.log('All response keys:', Object.keys(response));
          
          if (!response.items) {
            console.warn('No items property in response, returning empty array');
            return [];
          }
          
          return response.items;
        }),
        catchError(error => {
          console.error('Error getting events:', error);
          console.error('Error status:', error.status);
          console.error('Error details:', error.error);
          
          if (error.status === 403) {
            console.error('403 Error - Access token may be expired or insufficient permissions');
          }
          
          throw error;
        })
      );
  }

  // Create a new event
  createEvent(calendarId: string = 'primary', event: CalendarEvent): Observable<CalendarEvent> {
    const url = `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events`;
    console.log('Creating event with URL:', url);
    console.log('Event data:', event);
    console.log('Headers:', this.getHeaders());
    
    return this.http.post<CalendarEvent>(url, event, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error creating event:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error details:', error.error);
          
          if (error.status === 403) {
            console.error('403 Error - Possible causes:');
            console.error('1. Access token expired');
            console.error('2. Insufficient permissions (missing calendar write scope)');
            console.error('3. Calendar access denied');
          }
          
          throw error;
        })
      );
  }

  // Update an existing event
  updateEvent(calendarId: string = 'primary', eventId: string, event: CalendarEvent): Observable<CalendarEvent> {
    const url = `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`;
    return this.http.put<CalendarEvent>(url, event, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error updating event:', error);
          throw error;
        })
      );
  }

  // Delete an event
  deleteEvent(calendarId: string = 'primary', eventId: string): Observable<void> {
    const url = `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`;
    return this.http.delete<void>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error deleting event:', error);
          throw error;
        })
      );
  }

  // Get a specific event
  getEvent(calendarId: string = 'primary', eventId: string): Observable<CalendarEvent> {
    const url = `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`;
    return this.http.get<CalendarEvent>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error getting event:', error);
          throw error;
        })
      );
  }

  // Helper method to create a quick event
  createQuickEvent(calendarId: string = 'primary', text: string): Observable<CalendarEvent> {
    const url = `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events/quickAdd`;
    const params = { text };
    return this.http.post<CalendarEvent>(url, null, {
      headers: this.getHeaders(),
      params
    }).pipe(
      catchError(error => {
        console.error('Error creating quick event:', error);
        throw error;
      })
    );
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Get current user info
  async getCurrentUser() {
    try {
      return await GoogleAuth.refresh();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}