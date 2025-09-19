import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Horario } from '../models';

@Injectable({
  providedIn: 'root'
})
export class HorariosService {
  private horariosCollection = collection(this.firestore, 'horarios');

  constructor(private firestore: Firestore) {}

  async getHorarios(): Promise<Horario[]> {
    const snapshot = await getDocs(this.horariosCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Horario }));
  }

  async getHorariosByUser(userId: string): Promise<Horario[]> {
    const snapshot = await getDocs(this.horariosCollection);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as Horario }))
      .filter(horario => horario.usuarioId === userId);
  }

  async getHorariosByMateria(materiaId: string): Promise<Horario[]> {
    const snapshot = await getDocs(this.horariosCollection);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as Horario }))
      .filter(horario => horario.materiaId === materiaId);
  }

  async addHorario(horario: Omit<Horario, 'id' | 'fechaCreacion'>): Promise<string> {
    const newHorario = {
      ...horario,
      fechaCreacion: new Date()
    };
    const docRef = await addDoc(this.horariosCollection, newHorario);
    return docRef.id;
  }

  async updateHorario(id: string, horario: Partial<Horario>): Promise<void> {
    const horarioDoc = doc(this.firestore, `horarios/${id}`);
    await updateDoc(horarioDoc, horario);
  }

  async deleteHorario(id: string): Promise<void> {
    const horarioDoc = doc(this.firestore, `horarios/${id}`);
    await deleteDoc(horarioDoc);
  }
}