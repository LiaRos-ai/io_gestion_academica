import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Nota } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotasService {
  private notasCollection = collection(this.firestore, 'notas');

  constructor(private firestore: Firestore) {}

  async getNotas(): Promise<Nota[]> {
    const snapshot = await getDocs(this.notasCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Nota }));
  }

  async getNotasByUser(userId: string): Promise<Nota[]> {
    const snapshot = await getDocs(this.notasCollection);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as Nota }))
      .filter(nota => nota.usuarioId === userId);
  }

  async getNotasByMateria(materiaId: string): Promise<Nota[]> {
    const snapshot = await getDocs(this.notasCollection);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as Nota }))
      .filter(nota => nota.materiaId === materiaId);
  }

  async addNota(nota: Omit<Nota, 'id' | 'fechaCreacion'>): Promise<string> {
    const newNota = {
      ...nota,
      fechaCreacion: new Date()
    };
    const docRef = await addDoc(this.notasCollection, newNota);
    return docRef.id;
  }

  async updateNota(id: string, nota: Partial<Nota>): Promise<void> {
    const notaDoc = doc(this.firestore, `notas/${id}`);
    await updateDoc(notaDoc, nota);
  }

  async deleteNota(id: string): Promise<void> {
    const notaDoc = doc(this.firestore, `notas/${id}`);
    await deleteDoc(notaDoc);
  }
}