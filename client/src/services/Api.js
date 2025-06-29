// src/services/api.js

import axios from 'axios';

const API_URL = 'http://votre-api-url.com'; // Remplacez par l'URL de votre serveur API

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}` // Assurez-vous de gérer l'authentification
  }
});

// Fonction pour obtenir tous les dépôts internes
export const getInternalDepots = async (params) => {
  try {
    const response = await api.get('/getInternalDepots', { params });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des dépôts internes:', error);
    throw error;
  }
};

// Fonction pour créer un dépôt interne
export const addInternalDepot = async (depotData) => {
  try {
    const response = await api.post('/addInternalDepot', depotData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du dépôt interne:', error);
    throw error;
  }
};

// Fonction pour mettre à jour un dépôt interne
export const updateInternalDepot = async (id, depotData) => {
  try {
    const response = await api.put(`/updateInternalDepot/${id}`, depotData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du dépôt interne:', error);
    throw error;
  }
};

// Fonction pour supprimer un dépôt interne
export const deleteInternalDepot = async (id) => {
  try {
    const response = await api.delete(`/deleteInternalDepot/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression du dépôt interne:', error);
    throw error;
  }
};
