import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Materia } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MateriasService {

  constructor(private databaseService: DatabaseService) {}

  async getMaterias(): Promise<Materia[]> {
    const sql = 'SELECT * FROM materias ORDER BY nombre ASC';
    const results = await this.databaseService.query(sql);

    return results.map(row => ({
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      creditos: row.creditos,
      docente: row.docente,
      periodo: row.periodo,
      color: row.color,
      usuarioId: row.usuarioId,
      fechaCreacion: row.fechaCreacion ? new Date(row.fechaCreacion) : undefined,
      activa: Boolean(row.activa)
    }));
  }

  async getMateriasByUser(userId: string): Promise<Materia[]> {
    const sql = 'SELECT * FROM materias WHERE usuarioId = ? ORDER BY nombre ASC';
    const results = await this.databaseService.query(sql, [userId]);

    return results.map(row => ({
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      creditos: row.creditos,
      docente: row.docente,
      periodo: row.periodo,
      color: row.color,
      usuarioId: row.usuarioId,
      fechaCreacion: row.fechaCreacion ? new Date(row.fechaCreacion) : undefined,
      activa: Boolean(row.activa)
    }));
  }

  async addMateria(materia: Omit<Materia, 'id' | 'fechaCreacion'>): Promise<string> {
    const id = this.generateId();
    const fechaCreacion = new Date().toISOString();

    const sql = `
      INSERT INTO materias (id, codigo, nombre, creditos, docente, periodo, color, usuarioId, fechaCreacion, activa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      materia.codigo,
      materia.nombre,
      materia.creditos,
      materia.docente,
      materia.periodo,
      materia.color || '#2196F3',
      materia.usuarioId,
      fechaCreacion,
      materia.activa ? 1 : 0
    ];

    await this.databaseService.execute(sql, params);
    return id;
  }

  async updateMateria(id: string, materia: Partial<Materia>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (materia.codigo !== undefined) {
      updates.push('codigo = ?');
      params.push(materia.codigo);
    }
    if (materia.nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(materia.nombre);
    }
    if (materia.creditos !== undefined) {
      updates.push('creditos = ?');
      params.push(materia.creditos);
    }
    if (materia.docente !== undefined) {
      updates.push('docente = ?');
      params.push(materia.docente);
    }
    if (materia.periodo !== undefined) {
      updates.push('periodo = ?');
      params.push(materia.periodo);
    }
    if (materia.color !== undefined) {
      updates.push('color = ?');
      params.push(materia.color);
    }
    if (materia.activa !== undefined) {
      updates.push('activa = ?');
      params.push(materia.activa ? 1 : 0);
    }

    if (updates.length === 0) return;

    const sql = `UPDATE materias SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);

    await this.databaseService.execute(sql, params);
  }

  async deleteMateria(id: string): Promise<void> {
    const sql = 'DELETE FROM materias WHERE id = ?';
    await this.databaseService.execute(sql, [id]);
  }

  async getMateriaById(id: string): Promise<Materia | null> {
    const sql = 'SELECT * FROM materias WHERE id = ?';
    const results = await this.databaseService.query(sql, [id]);

    if (results.length === 0) return null;

    const row = results[0];
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      creditos: row.creditos,
      docente: row.docente,
      periodo: row.periodo,
      color: row.color,
      usuarioId: row.usuarioId,
      fechaCreacion: row.fechaCreacion ? new Date(row.fechaCreacion) : undefined,
      activa: Boolean(row.activa)
    };
  }

  private generateId(): string {
    return 'materia_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
