import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from './services/database.service';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {

  constructor(private databaseService: DatabaseService) {}

  async ngOnInit() {
    console.log('🔍 Plataforma detectada:', Capacitor.getPlatform());
    console.log('📱 Capacitor está disponible:', Capacitor.isNativePlatform());

    // Esperar a que Capacitor esté listo
    if (Capacitor.isNativePlatform()) {
      try {
        console.log('🚀 Inicializando aplicación híbrida con SQLite...');

        // Pequeño delay para asegurar que Capacitor esté completamente listo
        await new Promise(resolve => setTimeout(resolve, 100));

        await this.databaseService.initializeDatabase();

        // Verificar que la base de datos esté lista
        const isReady = this.databaseService.isReady();
        console.log('✅ Base de datos SQLite inicializada correctamente. Estado:', isReady);

        // Obtener estadísticas para verificar
        const stats = await this.databaseService.getDatabaseStats();
        console.log('📊 Estadísticas de BD:', stats);

      } catch (error) {
        console.error('❌ Error inicializando la base de datos:', error);

        // Intentar inicializar nuevamente después de un delay
        console.log('🔄 Reintentando inicialización en 2 segundos...');
        setTimeout(async () => {
          try {
            await this.databaseService.initializeDatabase();
            console.log('✅ Base de datos SQLite inicializada en segundo intento');
          } catch (retryError) {
            console.error('❌ Error en segundo intento:', retryError);
          }
        }, 2000);
      }
    } else {
      console.log('🌐 Ejecutando en web - SQLite no disponible, usando localStorage como fallback');
    }
  }
}
