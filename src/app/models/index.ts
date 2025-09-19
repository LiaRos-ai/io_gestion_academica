export interface Materia {
  id?: string;
  codigo: string;
  nombre: string;
  creditos: number;
  docente: string;
  periodo: string;
  color?: string;
  usuarioId: string;
  fechaCreacion?: Date;
  activa?: boolean;
}

export interface Nota {
  id?: string;
  materiaId: string;
  usuarioId: string;
  tipo: 'parcial' | 'final' | 'practica' | 'tarea';
  descripcion: string;
  calificacion: number;
  fecha: Date;
  fechaCreacion?: Date;
}

export interface Horario {
  id?: string;
  materiaId: string;
  usuarioId: string;
  diaSemana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  horaInicio: string; // HH:MM format
  horaFin: string; // HH:MM format
  aula?: string;
  fechaCreacion?: Date;
}