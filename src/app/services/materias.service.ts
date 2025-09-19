import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Materia } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MateriasService {
  private materiasCollection = collection(this.firestore, 'materias');

  constructor(private firestore: Firestore) {}

  async getMaterias(): Promise<Materia[]> {
    const snapshot = await getDocs(this.materiasCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Materia }));
  }

  async getMateriasByUser(userId: string): Promise<Materia[]> {
    const snapshot = await getDocs(this.materiasCollection);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as Materia }))
      .filter(materia => materia.usuarioId === userId);
  }

  async addMateria(materia: Omit<Materia, 'id' | 'fechaCreacion'>): Promise<string> {
    const newMateria = {
      ...materia,
      fechaCreacion: new Date(),
      activa: true
    };
    const docRef = await addDoc(this.materiasCollection, newMateria);
    return docRef.id;
  }

  async updateMateria(id: string, materia: Partial<Materia>): Promise<void> {
    const materiaDoc = doc(this.firestore, `materias/${id}`);
    await updateDoc(materiaDoc, materia);
  }

  async deleteMateria(id: string): Promise<void> {
    const materiaDoc = doc(this.firestore, `materias/${id}`);
    await deleteDoc(materiaDoc);
  }
}
