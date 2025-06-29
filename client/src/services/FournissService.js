import axios from 'axios';

const API_URL = 'http://localhost:3000/api/fournisseurs'; // Remplace avec ton URL si besoin

export default {
  // Charger la liste des fournisseurs
  fetchFournisseurs() {
    return axios.get(`${API_URL}/getFournisseurs`);
  },

  // Récupérer un fournisseur par ID
  getFournisseur(id) {
    return axios.get(`${API_URL}/getFournisseur/${id}`);
  },

  // Ajouter un nouveau fournisseur
  addFournisseur(data) {
    return axios.post(`${API_URL}/addFournisseur`, data);
  },

  // Modifier un fournisseur
  updateFournisseur(id, data) {
    return axios.put(`${API_URL}/update/${id}`, data);
  },

  // Supprimer un fournisseur
  deleteFournisseur(id) {
    return axios.delete(`${API_URL}/deleteFournisseur/${id}`);
  }
};