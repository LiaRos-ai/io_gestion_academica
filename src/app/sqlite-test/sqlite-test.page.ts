// src/app/sqlite-test/sqlite-test.page.ts
import { Component, OnInit } from '@angular/core';
import { SQLiteService, Usuario, Materia, Nota } from '../../services/sqlite.service';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Platform } from '@ionic/angular';

interface TestResult {
  test: string;
  sql: string;
  result: any;
  status: 'success' | 'error';
  timestamp: Date;
  duration: number;
}

@Component({
  selector: 'app-sqlite-test',
  templateUrl: './sqlite-test.page.html',
  styleUrls: ['./sqlite-test.page.scss'],
})
export class SqliteTestPage implements OnInit {
  testResults: TestResult[] = [];
  loading = false;
  databaseReady = false;

  // Datos para testing
  testUsuario: Usuario = {
    email: 'test@sqlite.com',
    nombre: 'Test SQLite User'
  };

  testMateria: Materia = {
    codigo: 'SQL001',
    nombre: 'Testing SQLite',
    creditos: 3,
    docente: 'Prof. Database',
    periodo: '2024-2',
    usuario_id: 1
  };

  testNota: Nota = {
    materia_id: 1,
    tipo_evaluacion: 'Test SQL',
    nota: 4.5,
    porcentaje: 25
  };

  constructor(
    private sqliteService: SQLiteService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private platform: Platform
  ) { }

  async ngOnInit() {
    await this.checkDatabaseReady();
  }

  async checkDatabaseReady() {
    try {
      this.loading = true;
      await this.platform.ready();
      
      // Verificar que SQLite está funcionando
      const tableInfo = await this.sqliteService.getTableInfo();
      
      if (tableInfo && Object.keys(tableInfo).length > 0) {
        this.databaseReady = true;
        this.addTestResult('Database Check', 'PRAGMA table_info(usuarios)', tableInfo, 'success', 0);
      } else {
        this.databaseReady = false;
        throw new Error('No se pudieron obtener las tablas');
      }
      
    } catch (error) {
      this.databaseReady = false;
      this.addTestResult('Database Check', 'Initial connection', error, 'error', 0);
    } finally {
      this.loading = false;
    }
  }

  // ==================== TESTS BÁSICOS ====================

  async testCreateUsuario() {
    const startTime = Date.now();
    try {
      const usuario = await this.sqliteService.createUsuario(this.testUsuario);
      const duration = Date.now() - startTime;
      
      this.addTestResult(
        'Create Usuario', 
        `INSERT INTO usuarios (email, nombre, firebase_uid) VALUES ('${this.testUsuario.email}', '${this.testUsuario.nombre}', NULL)`,
        usuario,
        'success',
        duration
      );
      
      await this.showToast('Usuario creado exitosamente', 'success');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult('Create Usuario', 'INSERT INTO usuarios...', error, 'error', duration);
      await this.showToast('Error creando usuario', 'danger');
    }
  }

  async testReadUsuarios() {
    const startTime = Date.now();
    try {
      const usuarios = await this.sqliteService.getUsuarios();
      const duration = Date.now() - startTime;
      
      this.addTestResult(
        'Read Usuarios',
        'SELECT * FROM usuarios ORDER BY created_at DESC',
        usuarios,
        'success',
        duration
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult('Read Usuarios', 'SELECT * FROM usuarios...', error, 'error', duration);
    }
  }

  async testCreateMateria() {
    const startTime = Date.now();
    try {
      const materia = await this.sqliteService.createMateria(this.testMateria);
      const duration = Date.now() - startTime;
      
      this.addTestResult(
        'Create Materia',
        `INSERT INTO materias (codigo, nombre, creditos, docente, usuario_id) VALUES ('${this.testMateria.codigo}', '${this.testMateria.nombre}', ${this.testMateria.creditos}, '${this.testMateria.docente}', ${this.testMateria.usuario_id})`,
        materia,
        'success',
        duration
      );
      
      await this.showToast('Materia creada exitosamente', 'success');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult('Create Materia', 'INSERT INTO materias...', error, 'error', duration);
      await this.showToast('Error creando materia', 'danger');
    }
  }

  async testCreateNota() {
    const startTime = Date.now();
    try {
      const nota = await this.sqliteService.createNota(this.testNota);
      const duration = Date.now() - startTime;
      
      this.addTestResult(
        'Create Nota',
        `INSERT INTO notas (materia_id, tipo_evaluacion, nota, porcentaje) VALUES (${this.testNota.materia_id}, '${this.testNota.tipo_evaluacion}', ${this.testNota.nota}, ${this.testNota.porcentaje})`,
        nota,
        'success',
        duration
      );
      
      await this.showToast('Nota creada exitosamente', 'success');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult('Create Nota', 'INSERT INTO notas...', error, 'error', duration);
      await this.showToast('Error creando nota', 'danger');
    }
  }

  // ==================== TESTS AVANZADOS ====================

  async testCalculoPromedio() {
    const startTime = Date.now();
    try {
      const promedio = await this.sqliteService.calcularPromedioMateria(1);
      const duration = Date.now() - startTime;
      
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
        FROM notas WHERE materia_id = 1
      `;
      
      this.addTestResult('Cálculo Promedio', sql, { promedio }, 'success', duration);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult('Cálculo Promedio', 'Complex SQL calculation', error, 'error', duration);
    }
  }

  async testMateriasConPromedio() {
    const startTime = Date.now();
    try {
      const materias = await this.sqliteService.getMateriasConPromedio(1);
      const duration = Date.now() - startTime;
      
      const sql = `
        SELECT 
          m.*,
          COALESCE(ROUND(SUM(n.nota * n.porcentaje / 100.0) / NULLIF(SUM(n.porcentaje) / 100.0, 0), 2), 0) as promedio,
          COALESCE(SUM(n.porcentaje), 0) as porcentaje_total
        FROM materias m
        LEFT JOIN notas n ON m.id = n.materia_id
        WHERE m.usuario_id = 1
        GROUP BY m.id
      `;
      
      this.addTestResult('Materias con Promedio', sql, materias, 'success', duration);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult('Materias con Promedio', 'Complex JOIN query', error, 'error', duration);
    }
  }

  async testConstraints() {
    const startTime = Date.now();
    try {
      // Test constraint de nota inválida
      await this.sqliteService.createNota({
        materia_id: 1,
        tipo_evaluacion: 'Test Constraint',
        nota: 6.0, // Inválido (> 5.0)
        porcentaje: 10
      });
      
      // Si llega aquí, el constraint falló
      const duration = Date.now() - startTime;
      this.addTestResult('Test Constraints', 'INSERT with invalid nota > 5.0', 'CONSTRAINT FAILED', 'error', duration);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      // Esto es lo esperado
      this.addTestResult('Test Constraints', 'INSERT with invalid nota > 5.0', 'Constraint working correctly', 'success', duration);
    }
  }

  async testForeignKeyConstraint() {
    const startTime = Date.now();
    try {
      // Intentar crear nota para materia inexistente
      await this.sqliteService.createNota({
        materia_id: 99999, // No existe
        tipo_evaluacion: 'Test FK',
        nota: 4.0,
        porcentaje: 10
      });
      
      const duration = Date.now() - startTime;
      this.addTestResult('Test FK Constraint', 'INSERT with non-existent materia_id', 'FK CONSTRAINT FAILED', 'error', duration);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult('Test FK Constraint', 'INSERT with non-existent materia_id', 'FK working correctly', 'success', duration);
    }
  }

  // ==================== TESTS DE PERFORMANCE ====================

  async testBulkInsert() {
    const startTime = Date.now();
    try {
      // Crear 50 notas
      for (let i = 0; i < 50; i++) {
        await this.sqliteService.createNota({
          materia_id: 1,
          tipo_evaluacion: `Bulk Test ${i}`,
          nota: Math.random() * 5,
          porcentaje: 1
        });
      }
      
      const duration = Date.now() - startTime;
      this.addTestResult('Bulk Insert', '50 INSERT statements', `50 records in ${duration}ms`, 'success', duration);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addTestResult('Bulk Insert', '50 INSERT statements', error, 'error', duration);
    }
  }

  // ==================== UTILIDADES ====================

  async insertTestData() {
    const loading = await this.loadingController.create({
      message: 'Insertando datos de prueba...'
    });
    await loading.present();

    try {
      await this.sqliteService.insertTestData();
      await this.showToast('Datos de prueba insertados', 'success');
    } catch (error) {
      await this.showToast('Error insertando datos de prueba', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async clearAllData() {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: 'Esta acción eliminará TODOS los datos de SQLite. ¿Estás seguro?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar Todo',
          cssClass: 'danger',
          handler: async () => {
            try {
              await this.sqliteService.clearAllData();
              this.addTestResult('Clear All Data', 'DELETE FROM all tables', 'All data cleared', 'success', 0);
              await this.showToast('Todos los datos eliminados', 'success');
            } catch (error) {
              await this.showToast('Error eliminando datos', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async runAllTests() {
    const loading = await this.loadingController.create({
      message: 'Ejecutando suite completa de pruebas SQLite...'
    });
    await loading.present();

    try {
      this.testResults = []; // Limpiar resultados anteriores
      
      // Ejecutar tests en secuencia
      await this.testCreateUsuario();
      await this.delay(500);
      
      await this.testReadUsuarios();
      await this.delay(500);
      
      await this.testCreateMateria();
      await this.delay(500);
      
      await this.testCreateNota();
      await this.delay(500);
      
      await this.testCalculoPromedio();
      await this.delay(500);
      
      await this.testMateriasConPromedio();
      await this.delay(500);
      
      await this.testConstraints();
      await this.delay(500);
      
      await this.testForeignKeyConstraint();
      
      await this.showToast('Suite de pruebas completada', 'success');
      
    } catch (error) {
      await this.showToast('Error en suite de pruebas', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private addTestResult(test: string, sql: string, result: any, status: 'success' | 'error', duration: number) {
    this.testResults.unshift({
      test,
      sql,
      result,
      status,
      timestamp: new Date(),
      duration
    });
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

  clearTestResults() {
    this.testResults = [];
  }

  // Getters para el template
  get totalTests(): number {
    return this.testResults.length;
  }

  get successfulTests(): number {
    return this.testResults.filter(r => r.status === 'success').length;
  }

  get failedTests(): number {
    return this.testResults.filter(r => r.status === 'error').length;
  }

  get averageDuration(): number {
    if (this.testResults.length === 0) return 0;
    const total = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    return Math.round(total / this.testResults.length);
  }
}