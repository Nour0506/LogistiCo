import axios from 'axios';

const API_URL = 'http://localhost:3000/api/salepoints'; // Remplace avec ton URL si besoin

export default {
  // Charger la liste des points de vente
  fetchSalePoints() {
    return axios.get(`${API_URL}/getSalePoints`);
  },

  // Récupérer un point de vente par ID
  getSalePoint(id) {
    return axios.get(`${API_URL}/${id}`);
  },

  // Ajouter un nouveau point de vente
  addSalePoint(data) {
    return axios.post(`${API_URL}/addSalePoint`, data);
  },

  // Modifier un point de vente
  updateSalePoint(id, data) {
    return axios.put(`${API_URL}/update/${id}`, data);
  },

  // Supprimer un point de vente
  deleteSalePoint(id) {
    return axios.delete(`${API_URL}/deleteFournisseur/${id}`);
  }
};