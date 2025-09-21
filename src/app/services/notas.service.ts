import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Nota } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotasService {

  constructor(private databaseService: DatabaseService) {}

  async getNotas(): Promise<Nota[]> {
    const sql = 'SELECT * FROM notas ORDER BY fecha DESC';
    const results = await this.databaseService.query(sql);

    return results.map(row => ({
      id: row.id,
      materiaId: row.materiaId,
      usuarioId: row.usuarioId,
      tipo: row.tipo,
      descripcion: row.descripcion,
      calificacion: row.calificacion,
      fecha: new Date(row.fecha),
      fechaCreacion: row.fechaCreacion ? new Date(row.fechaCreacion) : undefined
    }));
  }

  async getNotasByUser(userId: string): Promise<Nota[]> {
    const sql = 'SELECT * FROM notas WHERE usuarioId = ? ORDER BY fecha DESC';
    const results = await this.databaseService.query(sql, [userId]);

    return results.map(row => ({
      id: row.id,
      materiaId: row.materiaId,
      usuarioId: row.usuarioId,
      tipo: row.tipo,
      descripcion: row.descripcion,
      calificacion: row.calificacion,
      fecha: new Date(row.fecha),
      fechaCreacion: row.fechaCreacion ? new Date(row.fechaCreacion) : undefined
    }));
  }

  async getNotasByMateria(materiaId: string): Promise<Nota[]> {
    const sql = 'SELECT * FROM notas WHERE materiaId = ? ORDER BY fecha DESC';
    const results = await this.databaseService.query(sql, [materiaId]);

    return results.map(row => ({
      id: row.id,
      materiaId: row.materiaId,
      usuarioId: row.usuarioId,
      tipo: row.tipo,
      descripcion: row.descripcion,
      calificacion: row.calificacion,
      fecha: new Date(row.fecha),
      fechaCreacion: row.fechaCreacion ? new Date(row.fechaCreacion) : undefined
    }));
  }

  async addNota(nota: Omit<Nota, 'id' | 'fechaCreacion'>): Promise<string> {
    const id = this.generateId();
    const fechaCreacion = new Date().toISOString();

    const sql = `
      INSERT INTO notas (id, materiaId, usuarioId, tipo, descripcion, calificacion, fecha, fechaCreacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      nota.materiaId,
      nota.usuarioId,
      nota.tipo,
      nota.descripcion,
      nota.calificacion,
      nota.fecha.toISOString(),
      fechaCreacion
    ];

    await this.databaseService.execute(sql, params);
    return id;
  }

  async updateNota(id: string, nota: Partial<Nota>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (nota.tipo !== undefined) {
      updates.push('tipo = ?');
      params.push(nota.tipo);
    }
    if (nota.descripcion !== undefined) {
      updates.push('descripcion = ?');
      params.push(nota.descripcion);
    }
    if (nota.calificacion !== undefined) {
      updates.push('calificacion = ?');
      params.push(nota.calificacion);
    }
    if (nota.fecha !== undefined) {
      updates.push('fecha = ?');
      params.push(nota.fecha.toISOString());
    }

    if (updates.length === 0) return;

    const sql = `UPDATE notas SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);

    await this.databaseService.execute(sql, params);
  }

  async deleteNota(id: string): Promise<void> {
    const sql = 'DELETE FROM notas WHERE id = ?';
    await this.databaseService.execute(sql, [id]);
  }

  async getNotaById(id: string): Promise<Nota | null> {
    const sql = 'SELECT * FROM notas WHERE id = ?';
    const results = await this.databaseService.query(sql, [id]);

    if (results.length === 0) return null;

    const row = results[0];
    return {
      id: row.id,
      materiaId: row.materiaId,
      usuarioId: row.usuarioId,
      tipo: row.tipo,
      descripcion: row.descripcion,
      calificacion: row.calificacion,
      fecha: new Date(row.fecha),
      fechaCreacion: row.fechaCreacion ? new Date(row.fechaCreacion) : undefined
    };
  }

  async getPromedioByMateria(materiaId: string): Promise<number> {
    const sql = 'SELECT AVG(calificacion) as promedio FROM notas WHERE materiaId = ?';
    const results = await this.databaseService.query(sql, [materiaId]);

    return results[0]?.promedio || 0;
  }

  private generateId(): string {
    return 'nota_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}