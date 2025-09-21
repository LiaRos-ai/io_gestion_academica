import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

// Servicio alternativo para web usando localStorage
class WebDatabaseService {
  private storageKey = 'gestion_academica_data';

  private getData(): any {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : {
      usuarios: [],
      materias: [],
      notas: [],
      horarios: []
    };
  }

  private saveData(data: any): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    console.log('🌐 WebDB Query:', sql, params);

    const data = this.getData();

    // Simular consultas básicas
    if (sql.includes('SELECT * FROM usuarios')) {
      return data.usuarios;
    }
    if (sql.includes('SELECT * FROM materias')) {
      if (sql.includes('WHERE usuarioId = ?')) {
        return data.materias.filter((m: any) => m.usuarioId === params[0]);
      }
      return data.materias;
    }
    if (sql.includes('SELECT * FROM notas')) {
      if (sql.includes('WHERE usuarioId = ?')) {
        return data.notas.filter((n: any) => n.usuarioId === params[0]);
      }
      if (sql.includes('WHERE materiaId = ?')) {
        return data.notas.filter((n: any) => n.materiaId === params[0]);
      }
      return data.notas;
    }
    if (sql.includes('SELECT * FROM horarios')) {
      if (sql.includes('WHERE usuarioId = ?')) {
        return data.horarios.filter((h: any) => h.usuarioId === params[0]);
      }
      if (sql.includes('WHERE materiaId = ?')) {
        return data.horarios.filter((h: any) => h.materiaId === params[0]);
      }
      return data.horarios;
    }

    return [];
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    console.log('🌐 WebDB Execute:', sql, params);

    const data = this.getData();

    if (sql.includes('INSERT INTO usuarios')) {
      const newUser = {
        id: params[0],
        email: params[1],
        nombre: params[2],
        universidad: params[3] || '',
        carrera: params[4] || '',
        semestre: params[5] || 1,
        fechaCreacion: params[6],
        ultimoAcceso: params[7]
      };
      data.usuarios.push(newUser);
    }

    if (sql.includes('INSERT INTO materias')) {
      const newMateria = {
        id: params[0],
        codigo: params[1],
        nombre: params[2],
        creditos: params[3],
        docente: params[4],
        periodo: params[5],
        color: params[6],
        usuarioId: params[7],
        fechaCreacion: params[8],
        activa: params[9] ? 1 : 0
      };
      data.materias.push(newMateria);
    }

    if (sql.includes('INSERT INTO notas')) {
      const newNota = {
        id: params[0],
        materiaId: params[1],
        usuarioId: params[2],
        tipo: params[3],
        descripcion: params[4],
        calificacion: params[5],
        fecha: params[6],
        fechaCreacion: params[7]
      };
      data.notas.push(newNota);
    }

    if (sql.includes('INSERT INTO horarios')) {
      const newHorario = {
        id: params[0],
        materiaId: params[1],
        usuarioId: params[2],
        diaSemana: params[3],
        horaInicio: params[4],
        horaFin: params[5],
        aula: params[6],
        fechaCreacion: params[7]
      };
      data.horarios.push(newHorario);
    }

    if (sql.includes('UPDATE')) {
      // Implementar lógica de actualización según la tabla
      const table = sql.match(/UPDATE (\w+)/)?.[1];
      const id = params[params.length - 1]; // Último parámetro es el ID

      if (table === 'materias') {
        const index = data.materias.findIndex((m: any) => m.id === id);
        if (index !== -1) {
          // Actualizar campos
          if (sql.includes('codigo = ?')) data.materias[index].codigo = params[0];
          if (sql.includes('nombre = ?')) data.materias[index].nombre = params[1];
          if (sql.includes('creditos = ?')) data.materias[index].creditos = params[2];
          if (sql.includes('docente = ?')) data.materias[index].docente = params[3];
          if (sql.includes('periodo = ?')) data.materias[index].periodo = params[4];
          if (sql.includes('color = ?')) data.materias[index].color = params[5];
          if (sql.includes('activa = ?')) data.materias[index].activa = params[6];
        }
      }
    }

    if (sql.includes('DELETE FROM')) {
      const table = sql.match(/DELETE FROM (\w+)/)?.[1];
      const id = params[0];

      if (table === 'materias') {
        data.materias = data.materias.filter((m: any) => m.id !== id);
      }
      if (table === 'notas') {
        data.notas = data.notas.filter((n: any) => n.id !== id);
      }
      if (table === 'horarios') {
        data.horarios = data.horarios.filter((h: any) => h.id !== id);
      }
    }

    this.saveData(data);
    return { changes: 1 };
  }

  isReady(): boolean {
    return true; // localStorage siempre está disponible
  }

  async ensureDatabaseReady(): Promise<boolean> {
    return true;
  }

  async closeConnection(): Promise<void> {
    // No hay conexión que cerrar en localStorage
  }

  async clearAllData(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  async getDatabaseStats(): Promise<any> {
    const data = this.getData();
    return {
      usuarios: data.usuarios.length,
      materias: data.materias.length,
      notas: data.notas.length,
      horarios: data.horarios.length
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private dbName = 'gestion_academica.db';
  private webDb: WebDatabaseService | null = null;
  private isWebPlatform = false;

  constructor() {
    this.isWebPlatform = Capacitor.getPlatform() === 'web';
    if (this.isWebPlatform) {
      this.webDb = new WebDatabaseService();
    }
  }

  async initializeDatabase(): Promise<void> {
    try {
      console.log('🔍 Verificando plataforma para base de datos...');

      // Verificar si estamos en una plataforma móvil
      const platform = Capacitor.getPlatform();
      console.log('📱 Plataforma detectada:', platform);

      if (this.isWebPlatform) {
        console.log('🌐 Usando localStorage para web');
        // Para web, no necesitamos inicialización adicional
        console.log('✅ Base de datos web (localStorage) lista');
        return;
      }

      // Verificar si Capacitor está disponible
      if (!Capacitor.isNativePlatform()) {
        console.log('⚠️ Capacitor no está disponible, usando localStorage como fallback');
        this.isWebPlatform = true;
        this.webDb = new WebDatabaseService();
        return;
      }

      console.log('🚀 Creando conexión a base de datos SQLite...');

      // Crear conexión a la base de datos
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false,
        'no-encryption',
        1,
        false
      );

      console.log('🔗 Conexión creada, abriendo base de datos...');

      // Abrir la conexión
      await this.db.open();

      console.log('📋 Creando tablas...');

      // Crear las tablas
      await this.createTables();

      console.log('✅ Base de datos SQLite inicializada correctamente');
      console.log('📊 Estado de la BD:', this.isReady());

    } catch (error) {
      console.error('❌ Error inicializando la base de datos:', error);
      if (error instanceof Error) {
        console.error('🔍 Detalles del error:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }

      // Si hay error con SQLite, fallback a localStorage
      console.log('🔄 Cambiando a localStorage como fallback...');
      this.isWebPlatform = true;
      this.webDb = new WebDatabaseService();
      console.log('✅ Fallback a localStorage completado');
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    // Tabla de usuarios (para datos adicionales del usuario autenticado)
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        nombre TEXT,
        universidad TEXT,
        carrera TEXT,
        semestre INTEGER,
        fechaCreacion TEXT,
        ultimoAcceso TEXT
      );
    `;

    // Tabla de materias
    const createMateriasTable = `
      CREATE TABLE IF NOT EXISTS materias (
        id TEXT PRIMARY KEY,
        codigo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        creditos INTEGER NOT NULL,
        docente TEXT NOT NULL,
        periodo TEXT NOT NULL,
        color TEXT,
        usuarioId TEXT NOT NULL,
        fechaCreacion TEXT,
        activa INTEGER DEFAULT 1,
        FOREIGN KEY (usuarioId) REFERENCES usuarios (id)
      );
    `;

    // Tabla de notas
    const createNotasTable = `
      CREATE TABLE IF NOT EXISTS notas (
        id TEXT PRIMARY KEY,
        materiaId TEXT NOT NULL,
        usuarioId TEXT NOT NULL,
        tipo TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        calificacion REAL NOT NULL,
        fecha TEXT NOT NULL,
        fechaCreacion TEXT,
        FOREIGN KEY (materiaId) REFERENCES materias (id) ON DELETE CASCADE,
        FOREIGN KEY (usuarioId) REFERENCES usuarios (id)
      );
    `;

    // Tabla de horarios
    const createHorariosTable = `
      CREATE TABLE IF NOT EXISTS horarios (
        id TEXT PRIMARY KEY,
        materiaId TEXT NOT NULL,
        usuarioId TEXT NOT NULL,
        diaSemana TEXT NOT NULL,
        horaInicio TEXT NOT NULL,
        horaFin TEXT NOT NULL,
        aula TEXT,
        fechaCreacion TEXT,
        FOREIGN KEY (materiaId) REFERENCES materias (id) ON DELETE CASCADE,
        FOREIGN KEY (usuarioId) REFERENCES usuarios (id)
      );
    `;

    try {
      console.log('📋 Creando tabla usuarios...');
      await this.db.execute(createUsersTable);

      console.log('📋 Creando tabla materias...');
      await this.db.execute(createMateriasTable);

      console.log('📋 Creando tabla notas...');
      await this.db.execute(createNotasTable);

      console.log('📋 Creando tabla horarios...');
      await this.db.execute(createHorariosTable);

      console.log('✅ Todas las tablas creadas correctamente');
    } catch (error) {
      console.error('❌ Error creando tablas:', error);
      if (error instanceof Error) {
        console.error('🔍 Detalles del error de tablas:', {
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  // Método para ejecutar consultas SELECT
  async query(sql: string, params: any[] = []): Promise<any[]> {
    // Usar servicio web si estamos en plataforma web
    if (this.isWebPlatform && this.webDb) {
      return this.webDb.query(sql, params);
    }

    if (!this.db) {
      console.warn('⚠️ Base de datos no inicializada, intentando inicializar...');

      // Intentar inicializar la base de datos si no está lista
      try {
        await this.initializeDatabase();
      } catch (initError) {
        console.error('❌ Error al inicializar BD en consulta:', initError);
        return [];
      }

      // Verificar nuevamente después de la inicialización
      if (!this.db) {
        console.warn('⚠️ Base de datos sigue sin inicializarse, retornando array vacío');
        return [];
      }
    }

    try {
      console.log('🔍 Ejecutando consulta:', sql, params);
      const result = await this.db.query(sql, params);
      const values = result.values || [];
      console.log('✅ Consulta exitosa, resultados:', values.length);
      return values;
    } catch (error) {
      console.error('❌ Error en consulta SQL:', sql);
      console.error('❌ Parámetros:', params);
      console.error('❌ Error detallado:', error);
      throw error;
    }
  }

  // Método para ejecutar consultas INSERT, UPDATE, DELETE
  async execute(sql: string, params: any[] = []): Promise<any> {
    // Usar servicio web si estamos en plataforma web
    if (this.isWebPlatform && this.webDb) {
      return this.webDb.execute(sql, params);
    }

    if (!this.db) {
      console.warn('⚠️ Base de datos no inicializada, intentando inicializar...');

      // Intentar inicializar la base de datos si no está lista
      try {
        await this.initializeDatabase();
      } catch (initError) {
        console.error('❌ Error al inicializar BD en ejecución:', initError);
        return null;
      }

      // Verificar nuevamente después de la inicialización
      if (!this.db) {
        console.warn('⚠️ Base de datos sigue sin inicializarse');
        return null;
      }
    }

    try {
      console.log('⚡ Ejecutando comando SQL:', sql, params);
      const result = await this.db.run(sql, params);
      console.log('✅ Comando SQL ejecutado exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error ejecutando comando SQL:', sql);
      console.error('❌ Parámetros:', params);
      console.error('❌ Error detallado:', error);
      throw error;
    }
  }

  // Método para verificar si la base de datos está lista
  isReady(): boolean {
    if (this.isWebPlatform) {
      return this.webDb !== null;
    }
    return this.db !== null;
  }

  // Método para asegurar que la base de datos esté inicializada
  async ensureDatabaseReady(): Promise<boolean> {
    if (this.isWebPlatform && this.webDb) {
      return true;
    }

    if (this.isReady()) {
      return true;
    }

    try {
      console.log('🔄 Asegurando que la BD esté lista...');
      await this.initializeDatabase();
      return this.isReady();
    } catch (error) {
      console.error('❌ Error asegurando BD lista:', error);
      return false;
    }
  }

  // Método para cerrar la conexión
  async closeConnection(): Promise<void> {
    if (this.isWebPlatform && this.webDb) {
      await this.webDb.closeConnection();
      return;
    }

    if (this.db) {
      try {
        await this.db.close();
        this.db = null;
        console.log('✅ Conexión a base de datos cerrada');
      } catch (error) {
        console.error('❌ Error cerrando conexión:', error);
      }
    }
  }

  // Método para limpiar todas las tablas (útil para testing)
  async clearAllData(): Promise<void> {
    if (this.isWebPlatform && this.webDb) {
      await this.webDb.clearAllData();
      return;
    }

    if (!this.db) return;

    try {
      await this.db.execute('DELETE FROM notas');
      await this.db.execute('DELETE FROM horarios');
      await this.db.execute('DELETE FROM materias');
      await this.db.execute('DELETE FROM usuarios');
      console.log('✅ Todos los datos eliminados');
    } catch (error) {
      console.error('❌ Error limpiando datos:', error);
      throw error;
    }
  }

  // Método para obtener estadísticas de la base de datos
  async getDatabaseStats(): Promise<any> {
    if (this.isWebPlatform && this.webDb) {
      return this.webDb.getDatabaseStats();
    }

    if (!this.db) return null;

    try {
      const stats = {
        usuarios: (await this.query('SELECT COUNT(*) as count FROM usuarios'))[0]?.count || 0,
        materias: (await this.query('SELECT COUNT(*) as count FROM materias'))[0]?.count || 0,
        notas: (await this.query('SELECT COUNT(*) as count FROM notas'))[0]?.count || 0,
        horarios: (await this.query('SELECT COUNT(*) as count FROM horarios'))[0]?.count || 0
      };

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }
}