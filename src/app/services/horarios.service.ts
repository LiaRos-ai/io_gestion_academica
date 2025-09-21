import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Horario } from '../models';

@Injectable({
  providedIn: 'root'
})
export class HorariosService {

  constructor(private databaseService: DatabaseService) {}

  async getHorarios(): Promise<Horario[]> {
    const sql = 'SELECT * FROM horarios ORDER BY diaSemana ASC, horaInicio ASC';
    const results = await this.databaseService.query(sql);

    return results.map(row => ({
      id: row.id,
      materiaId: row.materiaId,
      usuarioId: row.usuarioId,
      diaSemana: row.diaSemana,
      horaInicio: row.horaInicio,
      horaFin: row.horaFin,
      aula: row.aula,
      fechaCreacion: row.fechaCreacion ? new Date(row.fechaCreacion) : undefined
    }));
  }

  async getHorariosByUser(userId: string): Promise<Horario[]> {
    const sql = 'SELECT * FROM horarios WHERE usuarioId = ? ORDER BY diaSemana ASC, horaInicio ASC';
    const results = await this.databaseService.query(sql, [userId]);

    return results.map(row => ({
      id: row.id,
      materiaId: row.materiaId,
      usuarioId: row.usuarioId,
      diaSemana: row.diaSemana,
      horaInicio: row.horaInicio,
      horaFin: row.horaFin,
      aula: row.aula,
      fechaCreacion: row.fechaCreacion ? new Date(row.fechaCreacion) : undefined
    }));
  }

  async getHorariosByMateria(materiaId: string): Promise<Horario[]> {
    const sql = 'SELECT * FROM horarios WHERE materiaId = ? ORDER BY diaSemana ASC, horaInicio ASC';
    const results = await this.databaseService.query(sql, [materiaId]);

    return results.map(row => ({
      id: row.id,
      materiaId: row.materiaId,
      usuarioId: row.usuarioId,
      diaSemana: row.diaSemana,
      horaInicio: row.horaInicio,
      horaFin: row.horaFin,
      aula: row.aula,
      fechaCreacion: row.fechaCreacion ? new Date(row.fechaCreacion) : undefined
    }));
  }

  async addHorario(horario: Omit<Horario, 'id' | 'fechaCreacion'>): Promise<string> {
    const id = this.generateId();
    const fechaCreacion = new Date().toISOString();

    const sql = `
      INSERT INTO horarios (id, materiaId, usuarioId, diaSemana, horaInicio, horaFin, aula, fechaCreacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      id,
      horario.materiaId,
      horario.usuarioId,
      horario.diaSemana,
      horario.horaInicio,
      horario.horaFin,
      horario.aula || null,
      fechaCreacion
    ];

    await this.databaseService.execute(sql, params);
    return id;
  }

  async updateHorario(id: string, horario: Partial<Horario>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (horario.diaSemana !== undefined) {
      updates.push('diaSemana = ?');
      params.push(horario.diaSemana);
    }
    if (horario.horaInicio !== undefined) {
      updates.push('horaInicio = ?');
      params.push(horario.horaInicio);
    }
    if (horario.horaFin !== undefined) {
      updates.push('horaFin = ?');
      params.push(horario.horaFin);
    }
    if (horario.aula !== undefined) {
      updates.push('aula = ?');
      params.push(horario.aula);
    }

    if (updates.length === 0) return;

    const sql = `UPDATE horarios SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);

    await this.databaseService.execute(sql, params);
  }

  async deleteHorario(id: string): Promise<void> {
    const sql = 'DELETE FROM horarios WHERE id = ?';
    await this.databaseService.execute(sql, [id]);
  }

  async getHorarioById(id: string): Promise<Horario | null> {
    const sql = 'SELECT * FROM horarios WHERE id = ?';
    const results = await this.databaseService.query(sql, [id]);

    if (results.length === 0) return null;

    const row = results[0];
    return {
      id: row.id,
      materiaId: row.materiaId,
      usuarioId: row.usuarioId,
      diaSemana: row.diaSemana,
      horaInicio: row.horaInicio,
      horaFin: row.horaFin,
      aula: row.aula,
      fechaCreacion: row.fechaCreacion ? new Date(row.fechaCreacion) : undefined
    };
  }

  async getHorariosByDia(diaSemana: string, userId: string): Promise<Horario[]> {
    const sql = 'SELECT * FROM horarios WHERE diaSemana = ? AND usuarioId = ? ORDER BY horaInicio ASC';
    const results = await this.databaseService.query(sql, [diaSemana, userId]);

    return results.map(row => ({
      id: row.id,
      materiaId: row.materiaId,
      usuarioId: row.usuarioId,
      diaSemana: row.diaSemana,
      horaInicio: row.horaInicio,
      horaFin: row.horaFin,
      aula: row.aula,
      fechaCreacion: row.fechaCreacion ? new Date(row.fechaCreacion) : undefined
    }));
  }

  private generateId(): string {
    return 'horario_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}