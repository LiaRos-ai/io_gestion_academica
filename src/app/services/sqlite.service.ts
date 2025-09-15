// src/app/services/sqlite.service.ts
import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { Platform } from '@ionic/angular';

export interface Usuario {
  id?: number;
  email: string;
  nombre: string;
  firebase_uid?: string;
  created_at?: string;
  updated_at?: string;
  sync_status?: string;
}

export interface Materia {
  id?: number;
  codigo: string;
  nombre: string;
  creditos?: number;
  docente?: string;
  periodo?: string;
  color?: string;
  usuario_id?: number;
  sync_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Nota {
  id?: number;
  materia_id: number;
  tipo_evaluacion: string;
  nota: number;
  porcentaje: number;
  fecha?: string;
  observaciones?: string;
  sync_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Horario {
  id?: number;
  materia_id: number;
  dia_semana: number; // 1=Lunes, 7=Domingo
  hora_inicio: string;
  hora_fin: string;
  aula?: string;
  sync_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MateriaConPromedio extends Materia {
  promedio?: number;
  porcentaje_total?: number;
  cantidad_notas?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SQLiteService {
  private db: SQLiteObject | null = null;
  private isReady = false;

  constructor(
    private sqlite: SQLite,
    private platform: Platform
  ) {
    // Espera a que la plataforma esté lista antes de inicializar la base de datos
    this.platform.ready().then(() => {
      // Solo inicializa SQLite si la app corre en un dispositivo móvil (Cordova/Capacitor)
      if (this.platform.is('cordova') || this.platform.is('capacitor')) {
        // Inicializa la base de datos SQLite
        this.initializeDatabase();
      } else {
        // En entorno web, muestra advertencia y no inicializa SQLite
        console.warn('SQLite solo está disponible en dispositivos móviles.');
      }
    });
  }

  async initializeDatabase(): Promise<void> {
    try {
      await this.platform.ready();
      
      // Crear/abrir base de datos SQLite real
      this.db = await this.sqlite.create({
        name: 'gestion_academica.db',
        location: 'default'
      });

      console.log('SQLite database created successfully');

      await this.createTables();
      await this.createTriggers();
      this.isReady = true;
      
      console.log('SQLite database initialized completely');
      
    } catch (error) {
      console.error('Error initializing SQLite database:', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Tabla usuarios
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          nombre TEXT NOT NULL,
          firebase_uid TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error'))
        )
      `);

      // Tabla materias
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS materias (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT NOT NULL,
          nombre TEXT NOT NULL,
          creditos INTEGER DEFAULT 3 CHECK (creditos >= 1 AND creditos <= 6),
          docente TEXT,
          periodo TEXT,
          color TEXT DEFAULT '#3880ff',
          usuario_id INTEGER NOT NULL,
          sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
          UNIQUE(codigo, usuario_id)
        )
      `);

      // Tabla notas
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS notas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          materia_id INTEGER NOT NULL,
          tipo_evaluacion TEXT NOT NULL,
          nota REAL NOT NULL CHECK (nota >= 0.0 AND nota <= 5.0),
          porcentaje REAL NOT NULL CHECK (porcentaje > 0.0 AND porcentaje <= 100.0),
          fecha DATE DEFAULT (date('now')),
          observaciones TEXT,
          sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE CASCADE
        )
      `);

      // Tabla horarios
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS horarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          materia_id INTEGER NOT NULL,
          dia_semana INTEGER NOT NULL CHECK (dia_semana >= 1 AND dia_semana <= 7),
          hora_inicio TIME NOT NULL,
          hora_fin TIME NOT NULL,
          aula TEXT,
          sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (materia_id) REFERENCES materias (id) ON DELETE CASCADE,
          UNIQUE(materia_id, dia_semana, hora_inicio)
        )
      `);

      // Crear índices para optimización
      await this.createIndexes();

      console.log('All SQLite tables created successfully');
      
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_firebase_uid ON usuarios(firebase_uid)',
      'CREATE INDEX IF NOT EXISTS idx_materias_usuario ON materias(usuario_id)',
      'CREATE INDEX IF NOT EXISTS idx_materias_periodo ON materias(periodo)',
      'CREATE INDEX IF NOT EXISTS idx_materias_sync ON materias(sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_notas_materia ON notas(materia_id)',
      'CREATE INDEX IF NOT EXISTS idx_notas_fecha ON notas(fecha)',
      'CREATE INDEX IF NOT EXISTS idx_notas_sync ON notas(sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_horarios_materia ON horarios(materia_id)',
      'CREATE INDEX IF NOT EXISTS idx_horarios_dia ON horarios(dia_semana)'
    ];

    for (const indexSql of indexes) {
      await this.db.executeSql(indexSql);
    }

    console.log('SQLite indexes created successfully');
  }

  private async createTriggers(): Promise<void> {
    if (!this.db) return;

    // Trigger para actualizar timestamp en materias
    await this.db.executeSql(`
      CREATE TRIGGER IF NOT EXISTS update_materias_timestamp 
      AFTER UPDATE ON materias
      BEGIN
        UPDATE materias 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END
    `);

    // Trigger para actualizar timestamp en notas
    await this.db.executeSql(`
      CREATE TRIGGER IF NOT EXISTS update_notas_timestamp 
      AFTER UPDATE ON notas
      BEGIN
        UPDATE notas 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
      END
    `);

    console.log('SQLite triggers created successfully');
  }

  private async ensureReady(): Promise<void> {
    if (!this.isReady || !this.db) {
      await this.initializeDatabase();
    }
  }

  // ==================== CRUD USUARIOS ====================
  
  async createUsuario(usuario: Usuario): Promise<Usuario> {
    await this.ensureReady();

    const sql = `
      INSERT INTO usuarios (email, nombre, firebase_uid, sync_status) 
      VALUES (?, ?, ?, 'pending')
    `;
    
    const result = await this.db!.executeSql(sql, [
      usuario.email,
      usuario.nombre,
      usuario.firebase_uid || null
    ]);

    const createdUser = await this.getUsuarioById(result.insertId);
    console.log('Usuario created with SQL:', createdUser);
    return createdUser!;
  }

  async getUsuarios(): Promise<Usuario[]> {
    await this.ensureReady();

    const sql = 'SELECT * FROM usuarios ORDER BY created_at DESC';
    const result = await this.db!.executeSql(sql, []);
    
    const usuarios: Usuario[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      usuarios.push(result.rows.item(i));
    }
    
    return usuarios;
  }

  async getUsuarioById(id: number): Promise<Usuario | null> {
    await this.ensureReady();

    const sql = 'SELECT * FROM usuarios WHERE id = ?';
    const result = await this.db!.executeSql(sql, [id]);
    
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  async getUsuarioByEmail(email: string): Promise<Usuario | null> {
    await this.ensureReady();

    const sql = 'SELECT * FROM usuarios WHERE email = ?';
    const result = await this.db!.executeSql(sql, [email]);
    
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  async updateUsuario(id: number, updates: Partial<Usuario>): Promise<Usuario | null> {
    await this.ensureReady();

    const fields = Object.keys(updates).filter(key => key !== 'id');
    if (fields.length === 0) return this.getUsuarioById(id);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof Usuario]);

    const sql = `
      UPDATE usuarios 
      SET ${setClause}, sync_status = 'pending'
      WHERE id = ?
    `;

    await this.db!.executeSql(sql, [...values, id]);
    return this.getUsuarioById(id);
  }

  async deleteMateria(id: number): Promise<boolean> {
    await this.ensureReady();

    const sql = 'DELETE FROM materias WHERE id = ?';
    const result = await this.db!.executeSql(sql, [id]);
    
    console.log('Materia deleted, affected rows:', result.rowsAffected);
    return result.rowsAffected > 0;
  }

  // ==================== CRUD NOTAS ====================
  
  async createNota(nota: Nota): Promise<Nota> {
    await this.ensureReady();

    // Validar que la materia existe
    const materiaExists = await this.db!.executeSql(
      'SELECT COUNT(*) as count FROM materias WHERE id = ?',
      [nota.materia_id]
    );

    if (materiaExists.rows.item(0).count === 0) {
      throw new Error('La materia especificada no existe');
    }

    // Validar que el porcentaje total no exceda 100%
    const currentTotal = await this.db!.executeSql(
      'SELECT COALESCE(SUM(porcentaje), 0) as total FROM notas WHERE materia_id = ?',
      [nota.materia_id]
    );

    const newTotal = currentTotal.rows.item(0).total + nota.porcentaje;
    if (newTotal > 100) {
      throw new Error(`El porcentaje total sería ${newTotal}%. Máximo permitido: 100%`);
    }

    const sql = `
      INSERT INTO notas (materia_id, tipo_evaluacion, nota, porcentaje, fecha, observaciones, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;
    
    const result = await this.db!.executeSql(sql, [
      nota.materia_id,
      nota.tipo_evaluacion,
      nota.nota,
      nota.porcentaje,
      nota.fecha || new Date().toISOString().split('T')[0],
      nota.observaciones || null
    ]);

    const createdNota = await this.getNotaById(result.insertId);
    console.log('Nota created with SQL:', createdNota);
    return createdNota!;
  }

  async getNotasByMateriaId(materiaId: number): Promise<Nota[]> {
    await this.ensureReady();

    const sql = `
      SELECT * FROM notas 
      WHERE materia_id = ? 
      ORDER BY fecha DESC, created_at DESC
    `;
    const result = await this.db!.executeSql(sql, [materiaId]);
    
    const notas: Nota[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      notas.push(result.rows.item(i));
    }
    
    return notas;
  }

  async getNotaById(id: number): Promise<Nota | null> {
    await this.ensureReady();

    const sql = 'SELECT * FROM notas WHERE id = ?';
    const result = await this.db!.executeSql(sql, [id]);
    
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  async updateNota(id: number, updates: Partial<Nota>): Promise<Nota | null> {
    await this.ensureReady();

    // Validar porcentaje total si se está actualizando
    if (updates.porcentaje !== undefined) {
      const currentNota = await this.getNotaById(id);
      if (currentNota) {
        const otherNotesTotal = await this.db!.executeSql(
          'SELECT COALESCE(SUM(porcentaje), 0) as total FROM notas WHERE materia_id = ? AND id != ?',
          [currentNota.materia_id, id]
        );

        const newTotal = otherNotesTotal.rows.item(0).total + updates.porcentaje;
        if (newTotal > 100) {
          throw new Error(`El porcentaje total sería ${newTotal}%. Máximo permitido: 100%`);
        }
      }
    }

    const fields = Object.keys(updates).filter(key => key !== 'id');
    if (fields.length === 0) return this.getNotaById(id);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof Nota]);
    
    const sql = `
      UPDATE notas 
      SET ${setClause}, sync_status = 'pending'
      WHERE id = ?
    `;
    
    await this.db!.executeSql(sql, [...values, id]);
    return this.getNotaById(id);
  }

  async deleteNota(id: number): Promise<boolean> {
    await this.ensureReady();

    const sql = 'DELETE FROM notas WHERE id = ?';
    const result = await this.db!.executeSql(sql, [id]);
    
    return result.rowsAffected > 0;
  }

  // ==================== CÁLCULOS CON SQL ====================
  
  async calcularPromedioMateria(materiaId: number): Promise<number> {
    await this.ensureReady();

    const sql = `
      SELECT 
        COALESCE(
          ROUND(
            SUM(nota * porcentaje / 100.0) / 
            NULLIF(SUM(porcentaje) / 100.0, 0), 
            2
          ), 
          0
        ) as promedio
      FROM notas 
      WHERE materia_id = ?
    `;
    
    const result = await this.db!.executeSql(sql, [materiaId]);
    
    if (result.rows.length > 0) {
      return result.rows.item(0).promedio || 0;
    }
    
    return 0;
  }

  async calcularPromedioGeneral(userId: number): Promise<number> {
    await this.ensureReady();

    const sql = `
      SELECT 
        COALESCE(
          ROUND(
            SUM(promedios.promedio * m.creditos) / 
            NULLIF(SUM(m.creditos), 0), 
            2
          ), 
          0
        ) as promedio_general
      FROM materias m
      INNER JOIN (
        SELECT 
          materia_id,
          SUM(nota * porcentaje / 100.0) / 
          NULLIF(SUM(porcentaje) / 100.0, 0) as promedio
        FROM notas 
        GROUP BY materia_id
        HAVING SUM(porcentaje) > 0
      ) promedios ON m.id = promedios.materia_id
      WHERE m.usuario_id = ?
    `;
    
    const result = await this.db!.executeSql(sql, [userId]);
    
    if (result.rows.length > 0) {
      return result.rows.item(0).promedio_general || 0;
    }
    
    return 0;
  }

  async getMateriasFaltantePorcentaje(userId: number): Promise<any[]> {
    await this.ensureReady();

    const sql = `
      SELECT 
        m.id,
        m.nombre,
        m.codigo,
        100 - COALESCE(SUM(n.porcentaje), 0) as porcentaje_faltante
      FROM materias m
      LEFT JOIN notas n ON m.id = n.materia_id
      WHERE m.usuario_id = ?
      GROUP BY m.id
      HAVING porcentaje_faltante > 0
      ORDER BY porcentaje_faltante DESC
    `;
    
    const result = await this.db!.executeSql(sql, [userId]);
    
    const materias = [];
    for (let i = 0; i < result.rows.length; i++) {
      materias.push(result.rows.item(i));
    }
    
    return materias;
  }

  // ==================== CRUD HORARIOS ====================
  
  async createHorario(horario: Horario): Promise<Horario> {
    await this.ensureReady();

    // Validar que la materia existe
    const materiaExists = await this.db!.executeSql(
      'SELECT COUNT(*) as count FROM materias WHERE id = ?',
      [horario.materia_id]
    );

    if (materiaExists.rows.item(0).count === 0) {
      throw new Error('La materia especificada no existe');
    }

    const sql = `
      INSERT INTO horarios (materia_id, dia_semana, hora_inicio, hora_fin, aula, sync_status) 
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;
    
    const result = await this.db!.executeSql(sql, [
      horario.materia_id,
      horario.dia_semana,
      horario.hora_inicio,
      horario.hora_fin,
      horario.aula || null
    ]);

    const createdHorario = await this.getHorarioById(result.insertId);
    console.log('Horario created with SQL:', createdHorario);
    return createdHorario!;
  }

  async getHorariosByUserId(userId: number): Promise<any[]> {
    await this.ensureReady();

    const sql = `
      SELECT 
        h.*,
        m.nombre as materia_nombre,
        m.codigo,
        m.docente,
        m.color,
        CASE h.dia_semana
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
          WHEN 7 THEN 'Domingo'
        END as dia_nombre
      FROM horarios h
      INNER JOIN materias m ON h.materia_id = m.id
      WHERE m.usuario_id = ?
      ORDER BY h.dia_semana, h.hora_inicio
    `;
    
    const result = await this.db!.executeSql(sql, [userId]);
    
    const horarios = [];
    for (let i = 0; i < result.rows.length; i++) {
      horarios.push(result.rows.item(i));
    }
    
    return horarios;
  }

  async getHorarioById(id: number): Promise<Horario | null> {
    await this.ensureReady();

    const sql = 'SELECT * FROM horarios WHERE id = ?';
    const result = await this.db!.executeSql(sql, [id]);
    
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  // ==================== MÉTODOS DE SYNC ====================
  
  async getItemsWithSyncStatus(table: string, status: string): Promise<any[]> {
    await this.ensureReady();

    const validTables = ['usuarios', 'materias', 'notas', 'horarios'];
    if (!validTables.includes(table)) {
      throw new Error(`Invalid table: ${table}`);
    }

    const sql = `SELECT * FROM ${table} WHERE sync_status = ?`;
    const result = await this.db!.executeSql(sql, [status]);
    
    const items: any[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      items.push(result.rows.item(i));
    }
    
    return items;
  }

  async updateSyncStatus(table: string, id: number, status: string): Promise<void> {
    await this.ensureReady();

    const validTables = ['usuarios', 'materias', 'notas', 'horarios'];
    if (!validTables.includes(table)) {
      throw new Error(`Invalid table: ${table}`);
    }

    const validStatuses = ['pending', 'synced', 'error'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid sync status: ${status}`);
    }

    const sql = `UPDATE ${table} SET sync_status = ? WHERE id = ?`;
    await this.db!.executeSql(sql, [status, id]);
  }

  // ==================== UTILIDADES ====================
  
  async clearAllData(): Promise<void> {
    await this.ensureReady();

    // Orden importante por las FK constraints
    await this.db!.executeSql('DELETE FROM horarios');
    await this.db!.executeSql('DELETE FROM notas');
    await this.db!.executeSql('DELETE FROM materias');
    await this.db!.executeSql('DELETE FROM usuarios');
    
    console.log('All SQLite data cleared');
  }

  async exportData(): Promise<any> {
    await this.ensureReady();

    const usuarios = await this.getUsuarios();
    const materias: Materia[] = [];
    const notas: Nota[] = [];
    const horarios: any[] = [];
    
    // Obtener todos los datos relacionados
    for (const usuario of usuarios) {
      const userMaterias = await this.getMateriasByUserId(usuario.id!);
      materias.push(...userMaterias);
      
      for (const materia of userMaterias) {
        const materiaNotas = await this.getNotasByMateriaId(materia.id!);
        notas.push(...materiaNotas);
      }
      
      const userHorarios = await this.getHorariosByUserId(usuario.id!);
      horarios.push(...userHorarios);
    }
    
    return {
      usuarios,
      materias,
      notas,
      horarios,
      export_timestamp: new Date().toISOString()
    };
  }

  async getTableInfo(): Promise<any> {
    await this.ensureReady();

    const tables = ['usuarios', 'materias', 'notas', 'horarios'];
    const info: any = {};
    
    for (const table of tables) {
      const sql = `PRAGMA table_info(${table})`;
      const result = await this.db!.executeSql(sql, []);
      
      const columns = [];
      for (let i = 0; i < result.rows.length; i++) {
        columns.push(result.rows.item(i));
      }
      
      info[table] = columns;
    }
    
    return info;
  }

  async insertTestData(): Promise<void> {
    await this.ensureReady();

    console.log('Inserting SQLite test data...');

    try {
      // Usuario de prueba
      const usuario = await this.createUsuario({
        email: 'estudiante@test.com',
        nombre: 'Juan Pérez',
        firebase_uid: 'test_firebase_uid_123'
      });

      // Materias de prueba
      const materia1 = await this.createMateria({
        codigo: 'ING301',
        nombre: 'Aplicaciones Móviles I',
        creditos: 3,
        docente: 'Prof. García',
        periodo: '2024-2',
        usuario_id: usuario.id!
      });

      const materia2 = await this.createMateria({
        codigo: 'MAT201',
        nombre: 'Cálculo II',
        creditos: 4,
        docente: 'Prof. Rodríguez',
        periodo: '2024-2',
        usuario_id: usuario.id!
      });

      // Notas de prueba
      await this.createNota({
        materia_id: materia1.id!,
        tipo_evaluacion: 'Parcial 1',
        nota: 4.2,
        porcentaje: 30
      });

      await this.createNota({
        materia_id: materia1.id!,
        tipo_evaluacion: 'Quiz 1',
        nota: 3.8,
        porcentaje: 10
      });

      await this.createNota({
        materia_id: materia2.id!,
        tipo_evaluacion: 'Parcial 1',
        nota: 3.5,
        porcentaje: 35
      });

      // Horarios de prueba
      await this.createHorario({
        materia_id: materia1.id!,
        dia_semana: 1, // Lunes
        hora_inicio: '08:00',
        hora_fin: '10:00',
        aula: 'A101'
      });

      await this.createHorario({
        materia_id: materia2.id!,
        dia_semana: 2, // Martes
        hora_inicio: '10:00',
        hora_fin: '12:00',
        aula: 'B205'
      });

      console.log('SQLite test data inserted successfully');

    } catch (error) {
      console.error('Error inserting test data:', error);
      throw error;
    }
  }

  // ==================== CRUD MATERIAS ====================
  
  async createMateria(materia: Materia): Promise<Materia> {
    await this.ensureReady();

    // Validar duplicados con SQL
    const existsResult = await this.db!.executeSql(
      'SELECT COUNT(*) as count FROM materias WHERE codigo = ? AND usuario_id = ?',
      [materia.codigo, materia.usuario_id]
    );

    if (existsResult.rows.item(0).count > 0) {
      throw new Error(`Ya existe una materia con código ${materia.codigo}`);
    }

    const sql = `
      INSERT INTO materias (codigo, nombre, creditos, docente, periodo, color, usuario_id, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `;
    
    const result = await this.db!.executeSql(sql, [
      materia.codigo,
      materia.nombre,
      materia.creditos || 3,
      materia.docente || null,
      materia.periodo || null,
      materia.color || '#3880ff',
      materia.usuario_id
    ]);

    const createdMateria = await this.getMateriaById(result.insertId);
    console.log('Materia created with SQL:', createdMateria);
    return createdMateria!;
  }

  async getMateriasByUserId(userId: number): Promise<Materia[]> {
    await this.ensureReady();

    const sql = `
      SELECT * FROM materias 
      WHERE usuario_id = ? 
      ORDER BY periodo DESC, nombre ASC
    `;
    const result = await this.db!.executeSql(sql, [userId]);
    
    const materias: Materia[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      materias.push(result.rows.item(i));
    }
    
    return materias;
  }

  async getMateriaById(id: number): Promise<Materia | null> {
    await this.ensureReady();

    const sql = 'SELECT * FROM materias WHERE id = ?';
    const result = await this.db!.executeSql(sql, [id]);
    
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  async getMateriasConPromedio(userId: number): Promise<MateriaConPromedio[]> {
    await this.ensureReady();

    const sql = `
      SELECT 
        m.*,
        COALESCE(
          ROUND(
            SUM(n.nota * n.porcentaje / 100.0) / 
            NULLIF(SUM(n.porcentaje) / 100.0, 0), 
            2
          ), 
          0
        ) as promedio,
        COALESCE(SUM(n.porcentaje), 0) as porcentaje_total,
        COUNT(n.id) as cantidad_notas
      FROM materias m
      LEFT JOIN notas n ON m.id = n.materia_id
      WHERE m.usuario_id = ?
      GROUP BY m.id
      ORDER BY m.periodo DESC, m.nombre ASC
    `;
    
    const result = await this.db!.executeSql(sql, [userId]);
    
    const materias: MateriaConPromedio[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      materias.push(result.rows.item(i));
    }
    
    return materias;
  }

  async updateMateria(id: number, updates: Partial<Materia>): Promise<Materia | null> {
    await this.ensureReady();

    // Validar duplicados si se está cambiando el código
    if (updates.codigo) {
      const current = await this.getMateriaById(id);
      if (current && current.codigo !== updates.codigo) {
        const existsResult = await this.db!.executeSql(
          'SELECT COUNT(*) as count FROM materias WHERE codigo = ? AND usuario_id = ? AND id != ?',
          [updates.codigo, current.usuario_id, id]
        );
        if (existsResult.rows.item(0).count > 0) {
          throw new Error(`Ya existe una materia con código ${updates.codigo}`);
        }
      }
    }

    const fields = Object.keys(updates).filter(key => key !== 'id');
    if (fields.length === 0) return this.getMateriaById(id);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof Materia]);

    const sql = `
      UPDATE materias
      SET ${setClause}, sync_status = 'pending'
      WHERE id = ?
    `;

    await this.db!.executeSql(sql, [...values, id]);
    return this.getMateriaById(id);
  }
}