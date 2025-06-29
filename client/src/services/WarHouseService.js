import axios from 'axios';

const warehouseService = {
  getInternalDepots(params) {
    return axios.get('/api/warehouse/getInternalDepots', { params });
  }}

export default warehouseService;
