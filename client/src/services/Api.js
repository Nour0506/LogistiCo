import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api',
});

export const getCompanyAddress = async (companyId) => {
  try {
    const response = await api.get(`/company/${companyId}/address`);
    return response.data.address;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'adresse:", error);
    throw error;
  }
};

export default api;