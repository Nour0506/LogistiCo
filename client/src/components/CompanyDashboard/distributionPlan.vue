<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import moment from 'moment-timezone';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { nextTick } from 'vue';

// Types
interface Location {
  lat: number;
  lng: number;
}

interface SalesPoint {
  _id: string;
  name: string;
  address?: string;
  location?: Location;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  totalQuantity?: number;
}

interface Warehouse {
  _id: string;
  name: string;
  storage_type: string;
  capacity: number;
  current_usage: number;
  currentStock?: number;
  distance?: number;
  location?: Location;
  products?: Array<{ product: string; quantity: number }>;
}

interface Supplier {
  _id: string;
  name: string;
  distance?: number;
  location?: Location;
  products?: Array<{ product: string; quantity: number }>;
}

interface Truck {
  _id: string;
  vehicle: string;
  type: 'A1' | 'A' | 'B' | 'B+E' | 'C' | 'C+E' | 'D' | 'D1' | 'D+E' | 'H';
  status: 'available' | 'in transit' | 'maintenance';
  capacity: number;
  company_id: string;
}

interface Transporter {
  _id: string;
  userId: string;
  companyId: string;
  CIN: string;
  phoneNumber: string;
  typeDrivingLicence: 'A1' | 'A' | 'B' | 'B+E' | 'C' | 'C+E' | 'D' | 'D1' | 'D+E' | 'H';
  profilePicture?: string;
  firstName: string;
  lastName: string;
  status: 'Available' | 'On mission' | 'On leave';
}

interface DeliveryDate {
  date: string;
  status: 'en cours' | 'livree' | 'en attente';
}

interface Contract {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  warehouse?: { id: string; name: string; quantity?: number };
  supplier?: { id: string; name: string; quantity?: number };
  salesPointIds: string[];
  salesPoints?: SalesPoint[];
  product: { id: string; name: string; totalQuantity: number };
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  deliveryDays: string[];
  deliveryDates: DeliveryDate[];
  createdAt?: string;
  updatedAt?: string;
}

interface ContractForm {
  name: string;
  startDate: string;
  endDate: string;
  salesPointIds: string[];
  productId: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  deliveryDays: string[];
  deliveryDates: { date: string; status: 'en cours' | 'livree' | 'en attente' }[];
  tonnage: number;
  warehouseId: string;
  supplierId: string;
  warehouseQuantity?: number;
  supplierQuantity?: number;
}

interface Waypoint {
  type: 'warehouse' | 'supplier' | 'salespoint' | 'warehouse-return';
  id: string;
  name: string;
  location?: Location;
  distanceFromPrevious?: number;
  cumulativeDistance?: number;
  sequence: number;
}

interface DistributionPlanEntry {
  deliveryDates: DeliveryDate[];
  dayOfWeek: string;
  contractName: string;
  warehouse: string;
  supplier?: string | null;
  salesPoints: string[];
  product: string;
  quantity: number;
  
  truck?: { 
    id: string; 
    name: string; 
    licensePlate: string;
    type: string;
  };
  transporter?: { 
    id: string; 
    firstName: string; 
    lastName?: string;
  };
  route: {
    waypoints: Waypoint[];
    totalDistance: number;
    totalTime: number;
    salesPointsVisited: number;
    totalPoints: number;
    hasSupplier: boolean;
  };
  editableTruckId?: string;
  editableTransporterId?: string;
}

interface TransporterConfig {
  workingDaysPerWeek: number;
  maxDeliveriesPerDay: number;
}

// Constants
const WEEK_DAYS = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' }
];

const STORAGE_TYPES: Record<string, string> = {
  freezer: 'Congélateur',
  refrigerated: 'Réfrigéré',
  ambient: 'Ambiance',
  controlled: 'Contrôlé'
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  biweekly: 'Bimensuelle',
  monthly: 'Mensuelle',
  custom: 'Personnalisée'
};

// API Configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
  }
});

// State
const contracts = ref<Contract[]>([]);
const selectedContracts = ref<Contract[]>([]);
const selectedContract = ref<Contract | null>(null);
const showContractDetails = ref(false);
const loading = ref({
  contracts: false,
  details: false,
  salesPoints: false,
  products: false,
  warehouses: false,
  suppliers: false,
  route: false,
  trucks: false,
  transporters: false,
  optimalWarehouse: false,
  nearestSupplier: false
});

const errors = ref({
  contracts: null,
  salesPoints: null,
  products: null,
  warehouses: null,
  suppliers: null,
  route: null,
  trucks: null,
  transporters: null
});

const salesPoints = ref<SalesPoint[]>([]);
const products = ref<Product[]>([]);
const warehouses = ref<Warehouse[]>([]);
const suppliers = ref<Supplier[]>([]);
const trucks = ref<Truck[]>([]);
const transporters = ref<Transporter[]>([]);
const distributionPlan = ref<DistributionPlanEntry[]>([]);

const showModal = ref(false);
const showConfirmation = ref(false);
const showDistributionPlan = ref(false);
const showResourceManagement = ref(false);
const saving = ref(false);
const optimizingRoute = ref(false);
const salesPointSearch = ref('');
const contractSearch = ref('');

const optimalWarehouse = ref<Warehouse | null>(null);
const selectedWarehouse = ref<Warehouse | null>(null);
const suggestedSupplier = ref<Supplier | null>(null);
const requiresSupplier = ref(false);
const detailedContract = ref<Contract | null>(null);
const mapInstance = ref<L.Map | null>(null);
const selectedRoute = ref<DistributionPlanEntry | null>(null);
const mapLoading = ref(false);
const lastCreatedContract = ref<Contract | null>(null);
const showTransporterConfig = ref(false);
const transporterConfig = ref<TransporterConfig>({
  workingDaysPerWeek: 5,
  maxDeliveriesPerDay: 2
});

const contractForm = ref<ContractForm>({
  name: '',
  startDate: '',
  endDate: '',
  salesPointIds: [],
  productId: '',
  frequency: 'weekly',
  deliveryDays: [],
  deliveryDates: [],
  tonnage: 1000,
  warehouseId: '',
  supplierId: '',
  warehouseQuantity: undefined,
  supplierQuantity: undefined
});

// Computed Properties
const filteredSalesPoints = computed(() => {
  const search = salesPointSearch.value.toLowerCase();
  return salesPoints.value.filter(
    sp =>
      sp.name.toLowerCase().includes(search) ||
      (sp.address && sp.address.toLowerCase().includes(search))
  );
});

const filteredContracts = computed(() => {
  const search = contractSearch.value.toLowerCase();
  return contracts.value.filter(
    c =>
      c.name.toLowerCase().includes(search) ||
      c.warehouse?.name?.toLowerCase().includes(search) ||
      c.supplier?.name?.toLowerCase().includes(search)
  );
});

const canOptimizeRoute = computed(() => {
  return selectedContracts.value.length > 0;
});

const productAvailableQuantity = computed(() => {
  if (!contractForm.value.warehouseId || !contractForm.value.productId) return 0;
  const warehouse = warehouses.value.find(w => w._id === contractForm.value.warehouseId);
  const product = warehouse?.products?.find(p => p.product === contractForm.value.productId);
  return product?.quantity || 0;
});

const missingQuantity = computed(() => {
  return Math.max(0, contractForm.value.tonnage - productAvailableQuantity.value);
});

const availableTrucks = computed(() => {
  return trucks.value.filter(t => t.status === 'available');
});

const availableTransporters = computed(() => {
  return transporters.value.filter(t => t.status === 'Available');
});

// Methods
const formatNumber = (num: number): string => {
  return Number(num).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
};
const updateContract = (contract: Contract) => {
  selectedContract.value = contract;
  contractForm.value = {
    name: contract.name,
    startDate: contract.startDate.split('T')[0], // Format for input[type=date]
    endDate: contract.endDate.split('T')[0], // Format for input[type=date]
    salesPointIds: contract.salesPointIds || [],
    productId: contract.product.id,
    frequency: contract.frequency,
    deliveryDays: contract.deliveryDays || [],
    deliveryDates: contract.deliveryDates?.map(dd => ({
      date: dd.date.split('T')[0], // Format for input[type=date]
      status: dd.status
    })) || [],
    tonnage: contract.product.totalQuantity,
    warehouseId: contract.warehouse?.id || '',
    supplierId: contract.supplier?.id || '',
    warehouseQuantity: contract.warehouse?.quantity,
    supplierQuantity: contract.supplier?.quantity
  };
  
  // Set optimal warehouse if exists
  if (contract.warehouse?.id) {
    optimalWarehouse.value = warehouses.value.find(w => w._id === contract.warehouse?.id) || null;
    isOptimalWarehouseLocked.value = true;
  }
  
  // Set suggested supplier if exists
  if (contract.supplier?.id) {
    suggestedSupplier.value = suppliers.value.find(s => s._id === contract.supplier?.id) || null;
    requiresSupplier.value = true;
  }
  
  // Fetch necessary data for editing
  fetchSalesPoints();
  fetchProducts();
  fetchSuppliers();
  fetchWarehouses();
  
  showModal.value = true;
};
const formatDate = (date: Date | string): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Date invalide';
  return dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatDeliveryDate = (dateInput: string | Date) => {
  if (!dateInput) return 'N/A';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Date invalide';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return 'Format invalide';
  }
};

const getTypeLabel = (type: 'warehouse' | 'supplier' | 'salespoint' | 'warehouse-return'): string => {
  const labels: Record<string, string> = {
    warehouse: 'Entrepôt',
    supplier: 'Fournisseur',
    salespoint: 'Point de Vente',
    'warehouse-return': 'Retour Entrepôt'
  };
  return labels[type] || type;
};

const formatStorageType = (type: string): string => {
  return STORAGE_TYPES[type] || type;
};

const getErrorMessage = (error: unknown, context: string): string => {
  if (axios.isAxiosError(error)) {
    switch (error.response?.status) {
      case 401: return 'Authentification requise';
      case 404: return `${context} non trouvé(s)`;
      default: return error.response?.data?.message || `Erreur ${error.response?.status}`;
    }
  }
  return `Erreur de connexion (${context})`;
};

const getContractStatus = (contract: Contract): string => {
  const now = new Date();
  const start = new Date(contract.startDate);
  const end = new Date(contract.endDate);
  if (now < start) return 'En attente';
  if (now > end) return 'Expiré';
  return 'Actif';
};

const getStatusClass = (contract: Contract): Record<string, boolean> => {
  const status = getContractStatus(contract);
  return {
    'contract-card__status--pending': status === 'En attente',
    'contract-card__status--active': status === 'Actif',
    'contract-card__status--expired': status === 'Expiré'
  };
};

const toggleDeliveryDay = (day: string) => {
  const index = contractForm.value.deliveryDays.indexOf(day);
  if (index === -1) {
    contractForm.value.deliveryDays.push(day);
  } else {
    contractForm.value.deliveryDays.splice(index, 1);
  }
};

const addDeliveryDate = () => {
  contractForm.value.deliveryDates.push({
    date: new Date().toISOString().split('T')[0],
    status: 'en attente'
  });
};

const removeDeliveryDate = (index: number) => {
  contractForm.value.deliveryDates.splice(index, 1);
};

const toggleContractSelection = (contract: Contract) => {
  const index = selectedContracts.value.findIndex(c => c._id === contract._id);
  if (index === -1) {
    selectedContracts.value.push(contract);
  } else {
    selectedContracts.value.splice(index, 1);
  }
};

const updateFrequency = () => {
  if (contractForm.value.frequency !== 'custom') {
    contractForm.value.deliveryDays = [];
  }
};

// API Calls
const fetchContracts = async () => {
  try {
    loading.value.contracts = true;
    errors.value.contracts = null;
    const response = await api.get('/contract/');
    
    contracts.value = Array.isArray(response.data.data) 
      ? response.data.data 
      : Array.isArray(response.data) 
        ? response.data 
        : [];
        
    if (contracts.value.length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'Information',
        text: 'Aucun contrat trouvé',
        confirmButtonColor: '#3b82f6'
      });
    }
  } catch (error) {
    console.error('Failed to fetch contracts:', error);
    errors.value.contracts = getErrorMessage(error, 'contrats');
    
    const isNetworkError = axios.isAxiosError(error) && !error.response;
    
    await Swal.fire({
      icon: isNetworkError ? 'warning' : 'error',
      title: isNetworkError ? 'Problème de connexion' : 'Erreur',
      text: errors.value.contracts,
      confirmButtonColor: '#3b82f6',
      showCancelButton: isNetworkError,
      cancelButtonText: 'Réessayer',
      confirmButtonText: 'OK'
    }).then((result) => {
      if (result.isDismissed && isNetworkError) {
        fetchContracts();
      }
    });
  } finally {
    loading.value.contracts = false;
  }
};
// Dans votre composant Vue

const showDetails = async (contract: Contract) => {
  try {
    loading.value.details = true;
    
    // 1. Fonction de validation simplifiée pour le frontend
    const isValidId = (id: string) => {
      return /^[0-9a-fA-F]{24}$/.test(id);
    };

    // 2. Normalisation des IDs
    const validIds = contract.salesPointIds
      .map(id => {
        // Conversion en string et extraction de l'ID si c'est un objet
        if (typeof id === 'object') {
          return id?._id || id?.id || null;
        }
        return id;
      })
      .filter(id => id && isValidId(id.toString()));

    // 3. Requête API avec les IDs normalisés
    const response = await api.get('/salePoints/getSalePointsByIds', {
      params: {
        ids: validIds.join(',')
      }
    });

    // 4. Traitement de la réponse
    detailedContract.value = {
      ...contract,
      salesPoints: response.data.data || []
    };

    showContractDetails.value = true;

  } catch (error) {
    console.error('Erreur de chargement:', error);
    
    // Fallback: utiliser les données déjà chargées si disponibles
    const cachedPoints = salesPoints.value.filter(sp => 
      contract.salesPointIds.some(id => {
        const compareId = typeof id === 'object' ? id._id || id.id : id;
        return sp._id.toString() === compareId?.toString();
      })
    );

    detailedContract.value = {
      ...contract,
      salesPoints: cachedPoints
    };

    showContractDetails.value = true;

    await Swal.fire({
      icon: 'info',
      title: 'Chargement partiel',
      html: `Contrat chargé<br>
             <small>${cachedPoints.length}/${contract.salesPointIds.length} points chargés</small>`,
      confirmButtonColor: '#3b82f6'
    });
  } finally {
    loading.value.details = false;
  }
};
const fetchSalesPoints = async () => {
  try {
    loading.value.salesPoints = true;
    errors.value.salesPoints = null;
    const response = await api.get('/salePoints/getSalePoints');
    salesPoints.value = response.data.data || response.data;
  } catch (error) {
    console.error('Échec du chargement des points de vente', error);
    errors.value.salesPoints = getErrorMessage(error, 'points de vente');
    await Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: errors.value.salesPoints,
      confirmButtonColor: '#3b82f6'
    });
  } finally {
    loading.value.salesPoints = false;
  }
};

const fetchProducts = async () => {
  try {
    loading.value.products = true;
    errors.value.products = null;
    const response = await api.get('/products/get');
    products.value = response.data.data || response.data;
  } catch (error) {
    console.error('Échec du chargement des produits', error);
    errors.value.products = getErrorMessage(error, 'produits');
    await Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: errors.value.products,
      confirmButtonColor: '#3b82f6'
    });
  } finally {
    loading.value.products = false;
  }
};

const fetchWarehouses = async () => {
  try {
    loading.value.warehouses = true;
    errors.value.warehouses = null;
    console.log('Starting fetchWarehouses');
    const response = await api.get('/warehouses/getCompanyWarehouses');
    console.log('fetchWarehouses response:', response.data);

    if (!response.data || !response.data.data) {
      throw new Error('Invalid API response: missing data');
    }

    const warehouseData = response.data.data;
    const internalWarehouses = Array.isArray(warehouseData.internal) ? warehouseData.internal : [];
    const externalWarehouses = Array.isArray(warehouseData.external) ? warehouseData.external : [];
    const allWarehouses = [...internalWarehouses, ...externalWarehouses];

    if (!allWarehouses.length) {
      console.warn('No warehouses found in API response');
      errors.value.warehouses = 'Aucun entrepôt disponible pour cette entreprise. Veuillez ajouter des entrepôts dans la configuration.';
      warehouses.value = [];
      await Swal.fire({
        icon: 'warning',
        title: 'Aucun entrepôt',
        text: errors.value.warehouses,
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    warehouses.value = allWarehouses.map(warehouse => {
      if (!warehouse._id || !warehouse.name) {
        console.warn('Invalid warehouse data:', warehouse);
        return null;
      }
      const mappedWarehouse = {
        _id: warehouse._id,
        name: warehouse.name,
        storage_type: warehouse.storage_type || 'unknown',
        capacity: Number(warehouse.capacity) || 0,
        current_usage: Number(warehouse.current_usage) || 0,
        products: Array.isArray(warehouse.products) ? warehouse.products : [],
        location: warehouse.location && typeof warehouse.location === 'object'
          ? { lat: Number(warehouse.location.lat) || 0, lng: Number(warehouse.location.lng) || 0 }
          : { lat: 0, lng: 0 },
        type: warehouse.type || 'unknown',
      };
      console.log(`Mapped warehouse ${mappedWarehouse.name}:`, mappedWarehouse);
      return mappedWarehouse;
    }).filter((w): w is Warehouse => w !== null);

    console.log('warehouses.value after mapping:', warehouses.value);
  } catch (error) {
    console.error('Erreur fetchWarehouses:', error);
    errors.value.warehouses = getErrorMessage(error, 'entrepôts');
    warehouses.value = [];
    await Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: errors.value.warehouses,
      confirmButtonColor: '#3b82f6',
    });
  } finally {
    loading.value.warehouses = false;
  }
};

const fetchSuppliers = async () => {
  try {
    loading.value.suppliers = true;
    errors.value.suppliers = null;
    const response = await api.get('/fournisseur/getFourniseurs');
    suppliers.value = response.data.data || response.data;
  } catch (error) {
    console.error('Échec du chargement des fournisseurs', error);
    errors.value.suppliers = getErrorMessage(error, 'fournisseurs');
    await Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: errors.value.suppliers,
      confirmButtonColor: '#3b82f6'
    });
  } finally {
    loading.value.suppliers = false;
  }
};

const fetchTrucks = async () => {
  try {
    loading.value.trucks = true;
    errors.value.trucks = null;
    const response = await api.get('/trucks/getTrucks');
    trucks.value = response.data.data || response.data;
  } catch (error) {
    console.error('Failed to fetch trucks:', error);
    errors.value.trucks = getErrorMessage(error, 'camions');
    await Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: errors.value.trucks,
      confirmButtonColor: '#3b82f6'
    });
  } finally {
    loading.value.trucks = false;
  }
};

const fetchTransporters = async () => {
  try {
    loading.value.transporters = true;
    errors.value.transporters = null;
    const response = await api.get('/users/transporters');
    transporters.value = response.data.data || response.data;
  } catch (error) {
    console.error('Failed to fetch transporters:', error);
    errors.value.transporters = getErrorMessage(error, 'transporteurs');
    await Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: errors.value.transporters,
      confirmButtonColor: '#3b82f6'
    });
  } finally {
    loading.value.transporters = false;
  }
};

const getProductStock = (warehouse: Warehouse, productId: string): number => {
  const product = warehouse.products?.find(p => p.product === productId);
  return product ? Number(product.quantity) || 0 : 0;
};

const isOptimalWarehouseLocked = ref(false);
const fetchOptimalWarehouse = async (force = false) => {
  if (!contractForm.value.salesPointIds?.length || !contractForm.value.productId || !contractForm.value.tonnage || contractForm.value.tonnage <= 0) {
    console.warn('fetchOptimalWarehouse: Missing data', {
      salesPointIds: contractForm.value.salesPointIds,
      productId: contractForm.value.productId,
      tonnage: contractForm.value.tonnage,
    });
    optimalWarehouse.value = null;
    contractForm.value.warehouseId = '';
    isOptimalWarehouseLocked.value = false;
    requiresSupplier.value = false;
    contractForm.value.supplierId = '';
    contractForm.value.supplierQuantity = undefined;
    contractForm.value.warehouseQuantity = undefined;
    return;
  }

  if (isOptimalWarehouseLocked.value && !force) {
    console.log('fetchOptimalWarehouse: Skipping, optimal warehouse locked:', contractForm.value.warehouseId);
    await checkWarehouseStock();
    return;
  }

  try {
    loading.value.optimalWarehouse = true;
    const payload = {
      salesPointIds: contractForm.value.salesPointIds,
      productId: contractForm.value.productId,
      requiredQuantity: Number(contractForm.value.tonnage),
    };
    console.log('fetchOptimalWarehouse: Sending to server:', payload);

    const response = await api.post('/distances/find-optimal-warehouse', payload);
    console.log('fetchOptimalWarehouse: Response:', response.data);

    if (response.data.success && response.data.optimal) {
      if (response.data.solution === 'warehouse' || response.data.solution === 'supplier') {
        const optimal = response.data.optimal;
        if (!optimal || !optimal._id || !optimal.name || !optimal.products) {
          throw new Error('Invalid warehouse data received');
        }

        optimalWarehouse.value = {
          _id: optimal._id,
          name: optimal.name,
          storage_type: optimal.storage_type || 'unknown',
          capacity: Number(optimal.capacity) || 0,
          current_usage: Number(optimal.current_usage) || 0,
          products: Array.isArray(optimal.products) ? optimal.products : [],
          location: optimal.position && typeof optimal.position === 'object'
            ? { lat: Number(optimal.position.coordinates[1]) || 0, lng: Number(optimal.position.coordinates[0]) || 0 }
            : { lat: 0, lng: 0 },
          type: optimal.type || 'unknown',
        };
        contractForm.value.warehouseId = optimal._id;
        isOptimalWarehouseLocked.value = true;
        contractForm.value.warehouseQuantity = Math.min(
          contractForm.value.tonnage,
          optimal.products?.find((p) => p.product === contractForm.value.productId)?.quantity || 0
        );

        if (!warehouses.value.some((w) => w._id === optimal._id)) {
          warehouses.value.push(optimalWarehouse.value);
        }

        await Swal.fire({
          icon: 'success',
          title: 'Entrepôt optimal trouvé',
          text: `Entrepôt suggéré : ${optimalWarehouse.value.name} (Stock : ${formatNumber(
            optimalWarehouse.value.products?.find((p) => p.product === contractForm.value.productId)?.quantity || 0
          )} kg)`,
          confirmButtonColor: '#3b82f6',
        });

        console.log('fetchOptimalWarehouse: Checking stock for supplier needs');
        await checkWarehouseStock();
      } else {
        throw new Error('Invalid solution type received');
      }
    } else {
      throw new Error(response.data.message || 'Aucune solution trouvée');
    }
  } catch (error) {
    console.error('fetchOptimalWarehouse: Error:', error);
    let message = error instanceof Error ? error.message : 'Erreur lors de la recherche de l\'entrepôt optimal';
    if (axios.isAxiosError(error) && error.response) {
      message = error.response.data.message || `Erreur ${error.response.status}`;
    }
    await Swal.fire({
      icon: 'warning',
      title: 'Erreur',
      text: message,
      confirmButtonColor: '#3b82f6',
    });

    // Fallback to local best warehouse
    let maxStock = 0;
    let bestWarehouse = null;
    warehouses.value.forEach((warehouse) => {
      const product = warehouse.products?.find((p) => p.product === contractForm.value.productId);
      const stock = product ? Number(product.quantity) || 0 : 0;
      if (stock > maxStock) {
        maxStock = stock;
        bestWarehouse = warehouse;
      }
    });

    if (bestWarehouse) {
      optimalWarehouse.value = bestWarehouse;
      contractForm.value.warehouseId = bestWarehouse._id;
      isOptimalWarehouseLocked.value = true;
      contractForm.value.warehouseQuantity = Math.min(
        contractForm.value.tonnage,
        bestWarehouse.products?.find((p) => p.product === contractForm.value.productId)?.quantity || 0
      );
      console.log('fetchOptimalWarehouse: Fallback to local warehouse', {
        warehouseId: bestWarehouse._id,
        warehouseQuantity: contractForm.value.warehouseQuantity,
      });
      await checkWarehouseStock();
    } else {
      optimalWarehouse.value = null;
      contractForm.value.warehouseId = '';
      isOptimalWarehouseLocked.value = false;
      contractForm.value.supplierQuantity = contractForm.value.tonnage;
      requiresSupplier.value = true;
      console.log('fetchOptimalWarehouse: No warehouse, skipping fetchNearestSupplier due to missing warehouseId');
      await Swal.fire({
        icon: 'warning',
        title: 'Aucun entrepôt disponible',
        text: 'Aucun entrepôt avec stock suffisant trouvé. Veuillez vérifier les paramètres.',
        confirmButtonColor: '#3b82f6',
      });
    }
  } finally {
    loading.value.optimalWarehouse = false;
    console.log('fetchOptimalWarehouse: Final state:', {
      warehouseId: contractForm.value.warehouseId,
      isOptimalWarehouseLocked: isOptimalWarehouseLocked.value,
      warehouseQuantity: contractForm.value.warehouseQuantity,
      supplierId: contractForm.value.supplierId,
      supplierQuantity: contractForm.value.supplierQuantity,
      requiresSupplier: requiresSupplier.value,
    });
  }
};

const fetchNearestSupplier = async () => {
  let payload = null;
  try {
    console.log('fetchNearestSupplier: Starting supplier fetch', {
      salesPointIds: contractForm.value.salesPointIds,
      productId: contractForm.value.productId,
      supplierQuantity: contractForm.value.supplierQuantity,
      warehouseId: contractForm.value.warehouseId,
    });

    if (!contractForm.value.supplierQuantity || contractForm.value.supplierQuantity <= 0) {
      console.error('fetchNearestSupplier: Invalid supplier quantity', {
        supplierQuantity: contractForm.value.supplierQuantity,
      });
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Quantité requise pour le fournisseur invalide ou nulle.',
        confirmButtonColor: '#3b82f6',
      });
      suggestedSupplier.value = null;
      contractForm.value.supplierId = '';
      requiresSupplier.value = true;
      return;
    }

    if (!contractForm.value.warehouseId) {
      console.error('fetchNearestSupplier: Missing warehouseId');
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Aucun entrepôt sélectionné. Veuillez sélectionner un entrepôt avant de rechercher un fournisseur.',
        confirmButtonColor: '#3b82f6',
      });
      suggestedSupplier.value = null;
      contractForm.value.supplierId = '';
      requiresSupplier.value = true;
      return;
    }

    loading.value.suppliers = true;
    payload = {
      warehouseId: contractForm.value.warehouseId,
      productId: contractForm.value.productId || '',
      requiredQuantity: Number(contractForm.value.supplierQuantity),
    };
    console.log('fetchNearestSupplier: Sending payload:', JSON.stringify(payload, null, 2));

    const response = await api.post('/distances/find-optimal', payload);
    console.log('fetchNearestSupplier: Received response:', JSON.stringify(response.data, null, 2));

    if (response.data.success && response.data.data?.optimalSupplier) {
      suggestedSupplier.value = {
        _id: response.data.data.optimalSupplier._id,
        name: response.data.data.optimalSupplier.name || 'Fournisseur sans nom',
        products: Array.isArray(response.data.data.optimalSupplier.products)
          ? response.data.data.optimalSupplier.products
          : [],
        location:
          response.data.data.optimalSupplier.position &&
          typeof response.data.data.optimalSupplier.position === 'object'
            ? {
                lat: Number(response.data.data.optimalSupplier.position.coordinates[1]) || 0,
                lng: Number(response.data.data.optimalSupplier.position.coordinates[0]) || 0,
              }
            : { lat: 0, lng: 0 },
      };
      contractForm.value.supplierId = response.data.data.optimalSupplier._id;
      requiresSupplier.value = true;

      if (!suppliers.value.some((s) => s._id === response.data.data.optimalSupplier._id)) {
        suppliers.value.push(suggestedSupplier.value);
      }

      console.log('fetchNearestSupplier: Supplier successfully suggested', {
        supplierId: contractForm.value.supplierId,
        supplierName: suggestedSupplier.value.name,
        supplierQuantity: contractForm.value.supplierQuantity,
      });

      await Swal.fire({
        icon: 'success',
        title: 'Fournisseur trouvé',
        text: `Fournisseur suggéré : ${suggestedSupplier.value.name} (Quantité : ${formatNumber(
          contractForm.value.supplierQuantity
        )} kg)`,
        confirmButtonColor: '#3b82f6',
      });
    } else {
      console.error('fetchNearestSupplier: Invalid response, no valid supplier', {
        success: response.data.success,
        supplier: response.data.data?.optimalSupplier,
        message: response.data.message,
      });
      throw new Error(response.data.message || 'Aucun fournisseur trouvé');
    }
  } catch (error) {
    console.error('fetchNearestSupplier: Error occurred:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      payload: payload ? JSON.stringify(payload, null, 2) : 'Payload not defined',
    });
    let message = 'Erreur lors de la recherche du fournisseur';
    if (axios.isAxiosError(error) && error.response) {
      const errorDetails =
        error.response.data.message || error.response.data.errors || `Erreur serveur ${error.response.status}`;
      message = `Erreur ${error.response.status}: ${errorDetails}. Vérifiez les paramètres envoyés (entrepôt, produit, quantité).`;
    }
    console.warn('fetchNearestSupplier: Showing error to user', { message });
    await Swal.fire({
      icon: 'error',
      title: 'Erreur de recherche de fournisseur',
      text: message,
      confirmButtonColor: '#3b82f6',
    });
    suggestedSupplier.value = null;
    contractForm.value.supplierId = '';
    requiresSupplier.value = true;
  } finally {
    loading.value.suppliers = false;
    console.log('fetchNearestSupplier: Final state:', {
      warehouseId: contractForm.value.warehouseId,
      isOptimalWarehouseLocked: isOptimalWarehouseLocked.value,
      warehouseQuantity: contractForm.value.warehouseQuantity,
      supplierId: contractForm.value.supplierId,
      supplierQuantity: contractForm.value.supplierQuantity,
      requiresSupplier: requiresSupplier.value,
      suppliersCount: suppliers.value.length,
    });
  }
};

const checkWarehouseStock = async () => {
  try {
    if (!contractForm.value.warehouseId || !contractForm.value.productId || !contractForm.value.tonnage) {
      console.warn('checkWarehouseStock: Missing required data', {
        warehouseId: contractForm.value.warehouseId,
        productId: contractForm.value.productId,
        tonnage: contractForm.value.tonnage,
      });
      requiresSupplier.value = false;
      contractForm.value.supplierId = '';
      contractForm.value.supplierQuantity = undefined;
      contractForm.value.warehouseQuantity = undefined;
      suggestedSupplier.value = null;
      await Swal.fire({
        icon: 'warning',
        title: 'Erreur',
        text: 'Veuillez sélectionner un entrepôt, un produit et un tonnage valide.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    const warehouse = warehouses.value.find((w) => w._id === contractForm.value.warehouseId);
    if (!warehouse) {
      console.warn('checkWarehouseStock: Warehouse not found', contractForm.value.warehouseId);
      contractForm.value.warehouseQuantity = 0;
      contractForm.value.supplierQuantity = contractForm.value.tonnage;
      requiresSupplier.value = true;
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Entrepôt non trouvé. Veuillez sélectionner un entrepôt valide.',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    const product = warehouse.products?.find((p) => p.product === contractForm.value.productId);
    const stock = product ? Number(product.quantity) || 0 : 0;

    console.log('checkWarehouseStock: Evaluating stock', {
      warehouse: warehouse.name,
      warehouseId: contractForm.value.warehouseId,
      isOptimalWarehouseLocked: isOptimalWarehouseLocked.value,
      productId: contractForm.value.productId,
      stock,
      tonnage: contractForm.value.tonnage,
    });

    contractForm.value.warehouseQuantity = Math.min(stock, contractForm.value.tonnage);
    requiresSupplier.value = stock < contractForm.value.tonnage;

    if (requiresSupplier.value) {
      contractForm.value.supplierQuantity = contractForm.value.tonnage - contractForm.value.warehouseQuantity;
      console.log('checkWarehouseStock: Supplier required, calling fetchNearestSupplier', {
        supplierQuantity: contractForm.value.supplierQuantity,
        warehouseId: contractForm.value.warehouseId,
        productId: contractForm.value.productId,
      });
      await fetchNearestSupplier();
    } else {
      console.log('checkWarehouseStock: Sufficient stock, clearing supplier');
      contractForm.value.supplierId = '';
      contractForm.value.supplierQuantity = undefined;
      suggestedSupplier.value = null;
      requiresSupplier.value = false;
    }
  } catch (error) {
    console.error('checkWarehouseStock: Error:', error);
    contractForm.value.supplierQuantity = contractForm.value.tonnage - (contractForm.value.warehouseQuantity || 0);
    requiresSupplier.value = true;
    console.log('checkWarehouseStock: Error case, triggering fetchNearestSupplier', {
      supplierQuantity: contractForm.value.supplierQuantity,
      warehouseId: contractForm.value.warehouseId,
      productId: contractForm.value.productId,
    });
    if (contractForm.value.warehouseId) {
      await fetchNearestSupplier();
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de rechercher un fournisseur sans entrepôt sélectionné.',
        confirmButtonColor: '#3b82f6',
      });
    }
  } finally {
    console.log('checkWarehouseStock: Final state:', {
      warehouseId: contractForm.value.warehouseId,
      isOptimalWarehouseLocked: isOptimalWarehouseLocked.value,
      warehouseQuantity: contractForm.value.warehouseQuantity,
      supplierId: contractForm.value.supplierId,
      supplierQuantity: contractForm.value.supplierQuantity,
      requiresSupplier: requiresSupplier.value,
      suppliersCount: suppliers.value.length,
    });
  }
};

const validateForm = async () => {
  const errors: string[] = [];

  if (!contractForm.value.name) {
    errors.push('Veuillez entrer un nom pour le contrat');
  }

  if (!contractForm.value.startDate || !contractForm.value.endDate) {
    errors.push('Veuillez sélectionner une période valide');
  } else if (new Date(contractForm.value.startDate) > new Date(contractForm.value.endDate)) {
    errors.push('La date de fin doit être postérieure à la date de début');
  }

  if (!contractForm.value.salesPointIds?.length) {
    errors.push('Veuillez sélectionner au moins un point de vente');
  }

  if (!contractForm.value.productId) {
    errors.push('Veuillez sélectionner un produit');
  }

  if (!contractForm.value.tonnage || contractForm.value.tonnage <= 0) {
    errors.push('Veuillez entrer un tonnage valide');
  }

  if (!contractForm.value.warehouseId) {
    errors.push('Veuillez sélectionner un entrepôt');
  }

  const warehouseQty = Number(contractForm.value.warehouseQuantity) || 0;
  const supplierQty = Number(contractForm.value.supplierQuantity) || 0;
  const totalQty = warehouseQty + supplierQty;

  if (totalQty !== contractForm.value.tonnage) {
    errors.push(
      `La somme des quantités (${formatNumber(totalQty)} kg) ne correspond pas au tonnage total requis (${formatNumber(
        contractForm.value.tonnage
      )} kg).`
    );
  }

  if (contractForm.value.frequency === 'custom') {
    if (!contractForm.value.deliveryDays.length) {
      errors.push('Veuillez sélectionner au moins un jour de livraison pour une fréquence personnalisée');
    }

    if (!contractForm.value.deliveryDates.length) {
      errors.push('Veuillez spécifier au moins une date de livraison');
    } else {
      contractForm.value.deliveryDates.forEach((dd, index) => {
        if (!dd.date) {
          errors.push(`La date de livraison ${index + 1} est manquante`);
        }
        if (!['en cours', 'livree', 'en attente'].includes(dd.status)) {
          errors.push(`Le statut de la date de livraison ${index + 1} est invalide`);
        }
      });
    }
  }

  if (errors.length) {
    await Swal.fire({
      icon: 'error',
      title: 'Erreur de validation',
      html: errors.join('<br>'),
      confirmButtonColor: '#3b82f6',
    });
    return false;
  }
  return true;
};

const getAvailableTrucksForEntry = (entry: DistributionPlanEntry) => {
  // Trier les camions avec l'optimal en premier
  return [...availableTrucks.value]
    .filter(t => t.status === 'available')
    .sort((a, b) => {
      // Le camion optimal vient en premier
      if (a._id === entry.optimalTruckId) return -1;
      if (b._id === entry.optimalTruckId) return 1;
      
      // Ensuite par capacité la plus adaptée
      const aFit = a.capacity - entry.quantity;
      const bFit = b.capacity - entry.quantity;
      
      // Préférer les camions avec capacité suffisante
      if (aFit >= 0 && bFit < 0) return -1;
      if (aFit < 0 && bFit >= 0) return 1;
      
      // Parmi les camions valides, prendre le plus proche de la capacité requise
      if (aFit >= 0 && bFit >= 0) return aFit - bFit;
      
      // Sinon prendre le plus grand disponible
      return b.capacity - a.capacity;
    });
};
const saveContract = async () => {
  try {
    saving.value = true;

    const isValid = await validateForm();
    if (!isValid) {
      console.error('Form validation failed');
      return;
    }

    const payload = {
      name: contractForm.value.name,
      startDate: contractForm.value.startDate,
      endDate: contractForm.value.endDate,
      salesPointIds: contractForm.value.salesPointIds,
      productId: contractForm.value.productId,
      tonnage: Number(contractForm.value.tonnage),
      frequency: contractForm.value.frequency,
      deliveryDays: contractForm.value.frequency === 'custom' 
        ? contractForm.value.deliveryDays 
        : [],
      deliveryDates: contractForm.value.frequency === 'custom'
        ? contractForm.value.deliveryDates.map(dd => ({
            date: moment(dd.date).toISOString(),
            status: dd.status
          }))
        : [],
      warehouseId: contractForm.value.warehouseId || null,
      supplierId: requiresSupplier.value ? contractForm.value.supplierId || null : null,
      warehouseQuantity: contractForm.value.warehouseQuantity !== undefined 
        ? Number(contractForm.value.warehouseQuantity) 
        : undefined,
      supplierQuantity: requiresSupplier.value && contractForm.value.supplierQuantity !== undefined 
        ? Number(contractForm.value.supplierQuantity) 
        : undefined
    };

    console.log('Saving contract with payload:', JSON.stringify(payload, null, 2));

    let response;
    if (selectedContract.value?._id) {
      response = await api.put(`/contract/${selectedContract.value._id}`, payload);
    } else {
      response = await api.post('/contract', payload);
    }

    const updatedContract = response.data.data || response.data;
    
    const index = contracts.value.findIndex(c => c._id === selectedContract.value?._id);
    if (index !== -1) {
      contracts.value[index] = updatedContract;
    } else {
      contracts.value.push(updatedContract);
    }

    showModal.value = false;
    showConfirmation.value = true;
    lastCreatedContract.value = updatedContract;

    await Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: `Contrat ${contractForm.value.name} ${selectedContract.value?._id ? 'modifié' : 'créé'} avec succès!`,
      confirmButtonColor: '#3b82f6'
    });
  } catch (error) {
    console.error('Error saving contract:', error);
    let errorMessage = 'Erreur lors de la sauvegarde du contrat';
    if (axios.isAxiosError(error) && error.response?.data) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    await Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: errorMessage,
      confirmButtonColor: '#3b82f6'
    });
  } finally {
    saving.value = false;
  }
};
const onWarehouseSelect = async () => {
  if (isOptimalWarehouseLocked.value) {
    console.warn('onWarehouseSelect: Warehouse locked, reverting to', contractForm.value.warehouseId);
    return;
  }
  selectedWarehouse.value = warehouses.value.find(w => w._id === contractForm.value.warehouseId) || null;
  if (selectedWarehouse.value) {
    await checkWarehouseStock();
  }
  console.log('onWarehouseSelect: State:', {
    warehouseId: contractForm.value.warehouseId,
    isOptimalWarehouseLocked: isOptimalWarehouseLocked.value,
    warehouseQuantity: contractForm.value.warehouseQuantity,
  });
};

const onSupplierSelect = () => {
  if (contractForm.value.supplierId) {
    contractForm.value.supplierQuantity = contractForm.value.supplierQuantity || missingQuantity.value;
  } else {
    contractForm.value.supplierQuantity = undefined;
  }
  console.log('onSupplierSelect: State:', {
    warehouseId: contractForm.value.warehouseId,
    isOptimalWarehouseLocked: isOptimalWarehouseLocked.value,
    supplierId: contractForm.value.supplierId,
    supplierQuantity: contractForm.value.supplierQuantity,
    requiresSupplier: requiresSupplier.value,
  });
};

const updateTruckForEntry = (entry: DistributionPlanEntry, truckId: string) => {
  const selectedTruck = trucks.value.find(t => t._id === truckId);
  
  if (selectedTruck) {
    // Vérifier si le transporteur actuel est toujours compatible
    if (entry.transporter && !isTransporterCompatible(
      transporters.value.find(t => t._id === entry.transporter?.id)!,
      selectedTruck.type
    )) {
      entry.transporter = undefined;
      entry.editableTransporterId = undefined;
    }
    
    entry.truck = {
      id: selectedTruck._id,
      name: selectedTruck.vehicle,
      licensePlate: selectedTruck.vehicle,
      type: selectedTruck.type,
      capacity: selectedTruck.capacity
    };
    entry.editableTruckId = truckId;
  } else {
    entry.truck = undefined;
    entry.editableTruckId = undefined;
    entry.transporter = undefined;
    entry.editableTransporterId = undefined;
  }
};

const updateTransporterForEntry = (entry: DistributionPlanEntry, transporterId: string) => {
  const selectedTransporter = transporters.value.find(t => t._id === transporterId);
  if (selectedTransporter) {
    entry.transporter = {
      id: selectedTransporter._id,
      firstName: selectedTransporter.firstName,
      lastName: selectedTransporter.lastName
    };
    entry.editableTransporterId = transporterId;
  } else {
    entry.transporter = undefined;
    entry.editableTransporterId = undefined;
  }
};
const isTransporterCompatible = (transporter: Transporter, truckType?: string): boolean => {
  if (!truckType || transporter.status !== 'Available') return false;
  
  // Définir la hiérarchie des permis
  const licenseHierarchy: Record<string, string[]> = {
    'A1': ['A1'],
    'A': ['A', 'A1'],
    'B': ['B', 'B+E', 'C', 'C+E', 'D', 'D+E', 'D1', 'H'],
    'B+E': ['B+E', 'C+E', 'D+E', 'H'],
    'C': ['C', 'C+E', 'D', 'D+E', 'D1', 'H'],
    'C+E': ['C+E', 'D+E', 'H'],
    'D': ['D', 'D+E', 'D1', 'H'],
    'D1': ['D1', 'D', 'D+E', 'H'],
    'D+E': ['D+E', 'H'],
    'H': ['H']
  };

  return licenseHierarchy[truckType]?.includes(transporter.typeDrivingLicence) || false;
};

const initMap = async (mapId: string): Promise<boolean> => {
  try {
    // Attendre que le DOM soit mis à jour
    await nextTick();
    
    const container = document.getElementById(mapId);
    if (!container) {
      console.error(`Map container '${mapId}' not found`);
      return false;
    }

    // Vérifier si la carte existe déjà
    if (mapInstance.value) {
      mapInstance.value.remove();
      mapInstance.value = null;
    }

    // Créer la carte avec des options par défaut
    mapInstance.value = L.map(mapId, {
      preferCanvas: true,
      center: [35.82, 10.64],
      zoom: 10,
      zoomControl: true
    });

    // Ajouter la couche OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(mapInstance.value);

    return true;
  } catch (error) {
    console.error('Error initializing map:', error);
    return false;
  }
};
const displayRoute = async (routes: DistributionPlanEntry[], highlightRoute: DistributionPlanEntry | null = null) => {
  if (!mapInstance.value) {
    const initialized = await initMap('distribution-map');
    if (!initialized) return;
  }

  selectedRoute.value = highlightRoute;
  mapLoading.value = true;

  try {
    // Clear existing layers except base tile layer
    mapInstance.value.eachLayer(layer => {
      if (!(layer instanceof L.TileLayer)) {
        mapInstance.value?.removeLayer(layer);
      }
    });

    // Si aucun trajet n'est sélectionné, on affiche juste la carte vide
    if (!highlightRoute) {
      mapInstance.value.setView([35.82, 10.64], 10); // Vue par défaut
      return;
    }

    // Le reste du code pour afficher le trajet sélectionné...
    const color = '#3b82f6'; // Couleur unique pour le trajet sélectionné
    const waypoints = highlightRoute.route.waypoints.filter(wp => wp.location?.lat && wp.location?.lng);
    
    if (!waypoints.length) {
      console.warn(`No valid waypoints for route ${highlightRoute.contractName}`);
      return;
    }

    // Trier les waypoints par séquence
    waypoints.sort((a, b) => a.sequence - b.sequence);

    // Créer le polyline pour le trajet
    const latlngs = waypoints.map(wp => [wp.location!.lat, wp.location!.lng]);
    const polyline = L.polyline(latlngs, {
      color: color,
      weight: 6,
      opacity: 1,
    }).addTo(mapInstance.value);

    // Ajouter des marqueurs pour chaque waypoint
    waypoints.forEach(wp => {
      const icon = L.divIcon({
        className: `map-marker map-marker--${wp.type} map-marker--highlighted`,
        html: `<div style="background-color: ${getMarkerColor(wp.type)}; 
               width: 24px; 
               height: 24px; 
               border-radius: 50%;
               display: flex;
               align-items: center;
               justify-content: center;
               color: white;
               font-weight: bold;
               border: 2px solid white;
               box-shadow: 0 0 5px rgba(0,0,0,0.3);">${wp.sequence}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([wp.location!.lat, wp.location!.lng], { icon })
        .bindPopup(`
          <div style="min-width: 200px;">
            <strong>${wp.name}</strong><br>
            <small>Type: ${getTypeLabel(wp.type)}</small><br>
            <small>Sequence: ${wp.sequence}</small>
            ${wp.distanceFromPrevious ? `<br><small>Distance: ${wp.distanceFromPrevious.toFixed(2)} km</small>` : ''}
          </div>
        `)
        .addTo(mapInstance.value);
    });

    // Ajuster la vue pour afficher tout le trajet
    mapInstance.value.fitBounds(latlngs, { 
      padding: [50, 50],
      maxZoom: 15
    });

  } catch (error) {
    console.error('Error displaying route:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Route Display Error',
      text: error instanceof Error ? error.message : 'Unable to display route on the map.',
      confirmButtonColor: '#3b82f6',
    });
  } finally {
    mapLoading.value = false;
  }
};
// Helper function for marker colors
const getMarkerColor = (type: string): string => {
  switch (type) {
    case 'warehouse': return '#3b82f6';
    case 'supplier': return '#f59e0b';
    case 'salespoint': return '#10b981';
    case 'warehouse-return': return '#0ea5e9';
    default: return '#64748b';
  }
};
const generateDistributionPlan = async (planDate = new Date()) => {
  try {
    optimizingRoute.value = true;
    distributionPlan.value = [];

    if (!selectedContracts.value?.length) {
      await Swal.fire({
        icon: 'warning',
        title: 'Aucun contrat',
        text: 'Veuillez sélectionner au moins un contrat.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    const validContracts = selectedContracts.value.filter(
      c => c._id && typeof c._id === 'string' && c._id.length === 24
    );
    
    if (!validContracts.length) {
      await Swal.fire({
        icon: 'error',
        title: 'Contrats invalides',
        text: 'Aucun contrat valide sélectionné.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Fetch les ressources nécessaires
    await Promise.all([fetchTrucks(), fetchTransporters()]);

    // Vérifier la disponibilité des ressources
    if (!trucks.value.length || !transporters.value.length) {
      await Swal.fire({
        icon: 'warning',
        title: 'Ressources manquantes',
        text: 'Aucun camion ou transporteur disponible.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    const requestData = {
      selectedContracts: validContracts.map(c => ({ 
        _id: c._id,
        productQuantity: c.product.totalQuantity // Ajout de la quantité
      })),
      planDate: moment(planDate).toISOString(),
    };

    const { data } = await api.post('/routes/optimize-greedy', requestData);

    if (!data.success) {
      throw new Error(data.message || 'Erreur lors de la génération du plan');
    }

    // Nouvelle logique de sélection des camions
    const availableTrucksSorted = [...trucks.value]
      .filter(t => t.status === 'available')
      .sort((a, b) => b.capacity - a.capacity); // Tri par capacité décroissante

    const transporterAssignments = new Map<string, { 
      dateCounts: Map<string, number>, 
      days: Set<string> 
    }>();

    distributionPlan.value = await Promise.all(data.distributionPlan.map(async (entry: any) => {
      const deliveryDates = Array.isArray(entry.deliveryDates) && entry.deliveryDates.length > 0
        ? entry.deliveryDates.map((dd: any) => ({
            date: dd.date ? new Date(dd.date) : new Date(),
            status: dd.status || 'en attente'
          }))
        : [{
            date: new Date(),
            status: 'en attente'
          }];

      // Trouver le camion le plus adapté
      let assignedTruck = availableTrucksSorted.find(t => 
        t.capacity >= entry.quantity && 
        t.status === 'available'
      );

      // Si aucun camion n'a assez de capacité, prendre le plus grand disponible
      if (!assignedTruck) {
        assignedTruck = availableTrucksSorted[0];
      }

      // Assigner un transporteur compatible
      let assignedTransporter = null;
      if (assignedTruck) {
        const deliveryDate = deliveryDates[0]?.date || new Date();
        const dateStr = moment(deliveryDate).format('YYYY-MM-DD');
        const dayOfWeek = moment(deliveryDate).format('dddd').toLowerCase();

        // Filtrer les transporteurs compatibles avec le type de camion
        const compatibleTransporters = transporters.value.filter(t => 
          isTransporterCompatible(t, assignedTruck?.type)
        );

        for (const transporter of compatibleTransporters) {
          if (!transporterAssignments.has(transporter._id)) {
            transporterAssignments.set(transporter._id, {
              dateCounts: new Map<string, number>(),
              days: new Set<string>()
            });
          }

          const assignments = transporterAssignments.get(transporter._id)!;
          const currentDateCount = assignments.dateCounts.get(dateStr) || 0;
          const uniqueDays = assignments.days;

          if (currentDateCount < transporterConfig.value.maxDeliveriesPerDay && 
              (uniqueDays.size < transporterConfig.value.workingDaysPerWeek || uniqueDays.has(dayOfWeek))) {
            
            assignedTransporter = transporter;
            assignments.dateCounts.set(dateStr, currentDateCount + 1);
            assignments.days.add(dayOfWeek);
            break;
          }
        }
      }

      return {
        ...entry,
        deliveryDates,
        truck: assignedTruck ? {
          id: assignedTruck._id,
          name: assignedTruck.vehicle,
          licensePlate: assignedTruck.vehicle,
          type: assignedTruck.type,
          capacity: assignedTruck.capacity
        } : undefined,
        transporter: assignedTransporter ? {
          id: assignedTransporter._id,
          firstName: assignedTransporter.firstName,
          lastName: assignedTransporter.lastName,
          licenseType: assignedTransporter.typeDrivingLicence
        } : undefined,
        editableTruckId: assignedTruck?._id,
        editableTransporterId: assignedTransporter?._id,
        route: entry.route || {
          waypoints: [],
          totalDistance: 0,
          totalTime: 0,
          salesPointsVisited: entry.salesPoints?.length || 0,
          totalPoints: 0,
          hasSupplier: false
        }
      };
    }));

    // Afficher les avertissements
    const unassignedTrucks = distributionPlan.value.filter(entry => !entry.truck).length;
    const unassignedTransporters = distributionPlan.value.filter(entry => entry.truck && !entry.transporter).length;
    const capacityIssues = distributionPlan.value.filter(entry => 
      entry.truck && entry.truck.capacity < entry.quantity
    ).length;

    let warningMessage = '';
    if (unassignedTrucks > 0) warningMessage += `${unassignedTrucks} livraison(s) sans camion attribué. `;
    if (unassignedTransporters > 0) {
      warningMessage += `${unassignedTransporters} livraison(s) sans transporteur compatible. `;
    }
    if (capacityIssues > 0) {
      warningMessage += `${capacityIssues} livraison(s) avec camion sous-dimensionné. `;
    }

    if (warningMessage) {
      await Swal.fire({
        icon: 'warning',
        title: 'Attention',
        html: warningMessage,
        confirmButtonColor: '#3b82f6'
      });
    }

    if (distributionPlan.value.length) {
      await nextTick();
      const mapInitialized = await initMap('distribution-map');
      if (mapInitialized) {
        await displayRoute(distributionPlan.value, null);
      }
    }

    return distributionPlan.value;
  } catch (error) {
    console.error('Erreur génération plan:', error);
    let errorMessage = 'Erreur lors de la génération du plan';
    if (error.response?.data) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    await Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: errorMessage,
      confirmButtonColor: '#3b82f6'
    });
    throw error;
  } finally {
    optimizingRoute.value = false;
  }
};
const downloadCSV = () => {
  try {
    if (!distributionPlan.value.length) {
      throw new Error('Aucun plan de distribution à exporter');
    }

    const headers = [
      'Date',
      'Statut',
      'Jour',
      'Contrat',
      'Entrepôt',
      'Fournisseur',
      'Points de Vente',
      'Produit',
      'Quantité (kg)',
      'Camion',
      'Transporteur',
      'Distance (km)',
      'Temps (min)'
    ];

    const rows = distributionPlan.value.flatMap(entry => 
      entry.deliveryDates.map(dd => [
        formatDeliveryDate(dd.date),
        dd.status,
        entry.dayOfWeek,
        entry.contractName,
        entry.warehouse,
        entry.supplier || '-',
        entry.salesPoints.join('; '),
        entry.product,
        entry.quantity,
        entry.truck ? `${entry.truck.name} (${entry.truck.type})` : 'Non attribué',
        entry.transporter 
          ? `${entry.transporter.firstName} ${entry.transporter.lastName || ''}`.trim()
          : 'Non attribué',
        entry.route.totalDistance.toFixed(2),
        entry.route.totalTime
      ])
    );

    let csvContent = headers.join(';') + '\n';
    rows.forEach(row => {
      csvContent += row.join(';') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `plan-distribution-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: 'Fichier CSV téléchargé avec succès',
      confirmButtonColor: '#3b82f6'
    });
  } catch (error) {
    console.error('Erreur lors de la génération du CSV:', error);
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: error instanceof Error ? error.message : 'Échec du téléchargement CSV',
      confirmButtonColor: '#3b82f6'
    });
  }
};

const downloadPDF = async () => {
  try {
    if (!distributionPlan.value.length) {
      throw new Error('Aucun plan de distribution à exporter');
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm'
    });

    const mainColor = '#3b82f6';
    const fontSize = 7;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = { left: 10, right: 10, top: 30, bottom: 20 };
    let currentY = margin.top;

    doc.setFontSize(16);
    doc.setTextColor(mainColor);
    doc.text('Plan de Distribution', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 22, { align: 'center' });

    const columns = [
      { header: 'Date', width: 20 },
      { header: 'Statut', width: 15 },
      { header: 'Jour', width: 15 },
      { header: 'Contrat', width: 25 },
      { header: 'Entrepôt', width: 20 },
      { header: 'Fournisseur', width: 20 },
      { header: 'Points de Vente', width: 40 },
      { header: 'Produit', width: 20 },
      { header: 'Quantité', width: 15 },
      { header: 'Camion', width: 25 },
      { header: 'Transporteur', width: 25 },
      { header: 'Distance', width: 15 },
      { header: 'Temps', width: 15 }
    ];
    const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const rowHeight = 8;
    const headerHeight = 10;

    const drawTableRow = (y: number, data: string[], isHeader = false) => {
      let x = margin.left;
      doc.setFontSize(fontSize);
      doc.setTextColor(0);
      if (isHeader) {
        doc.setFillColor(mainColor);
        doc.rect(margin.left, y, totalWidth, headerHeight, 'F');
        doc.setTextColor(255);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      columns.forEach((col, i) => {
        doc.setDrawColor(100);
        doc.rect(x, y, col.width, isHeader ? headerHeight : rowHeight);

        const text = data[i] || '';
        const maxWidth = col.width - 4;
        const textLines = doc.splitTextToSize(text, maxWidth);
        const textY = y + (isHeader ? 7 : 6);
        doc.text(textLines[0] || '', x + 2, textY);
        x += col.width;
      });
    };

    const checkPageBreak = (requiredHeight: number) => {
      if (currentY + requiredHeight >= pageHeight - margin.bottom) {
        doc.addPage();
        currentY = margin.top;
        drawTableRow(currentY, columns.map(col => col.header), true);
        currentY += headerHeight;
      }
    };

    const tableData = distributionPlan.value.flatMap(entry =>
      entry.deliveryDates.map(dd => ({
        date: formatDeliveryDate(dd.date),
        status: dd.status,
        dayOfWeek: entry.dayOfWeek,
        contractName: entry.contractName,
        warehouse: entry.warehouse,
        supplier: entry.supplier || '-',
        salesPoints: entry.salesPoints.join(', '),
        product: entry.product,
        quantity: `${entry.quantity} kg`,
        truck: entry.truck ? `${entry.truck.name} (${entry.truck.type})` : 'Non attribué',
        transporter: entry.transporter
          ? `${entry.transporter.firstName} ${entry.transporter.lastName || ''}`.trim()
          : 'Non attribué',
        distance: `${entry.route.totalDistance.toFixed(2)} km`,
        time: `${entry.route.totalTime} min`
      }))
    );

    drawTableRow(currentY, columns.map(col => col.header), true);
    currentY += headerHeight;

    tableData.forEach((row, index) => {
      checkPageBreak(rowHeight);
      drawTableRow(currentY, [
        row.date,
        row.status,
        row.dayOfWeek,
        row.contractName,
        row.warehouse,
        row.supplier,
        row.salesPoints,
        row.product,
        row.quantity,
        row.truck,
        row.transporter,
        row.distance,
        row.time
      ]);
      currentY += rowHeight;
    });

    const groupedData = distributionPlan.value.reduce((acc, entry) => {
      const key = `${entry.contractName}-${entry.warehouse}-${entry.truck?.id}`;
      if (!acc[key]) {
        acc[key] = {
          ...entry,
          dates: [...new Set(entry.deliveryDates.map(d => d.date))],
          count: 1
        };
      } else {
        entry.deliveryDates.forEach(date => {
          if (!acc[key].dates.includes(date.date)) {
            acc[key].dates.push(date.date);
          }
        });
        acc[key].count++;
      }
      return acc;
    }, {} as Record<string, any>);

    const payload = {
      distributionOrders: Object.values(groupedData).map(entry => ({
        contract: selectedContracts.value.find(c => c.name === entry.contractName)?._id,
        deliveryDates: entry.dates.map(date => ({ date, status: 'en attente' })),
        waypoints: entry.route.waypoints,
        truck: entry.truck,
        transporter: entry.transporter
      })),
      metadata: {
        savedAt: new Date().toISOString(),
        savedBy: 'current-user-id'
      }
    };

    const response = await api.post('/contract/save', payload);
    const { saved = [], skipped = [], errors = [] } = response.data.data || {};

    if (skipped.length > 0) {
      checkPageBreak(10);
      doc.setFontSize(8);
      doc.setTextColor(150, 0, 0);
      doc.text(
        `${skipped.length} distribution(s) déjà existante(s) - non sauvegardée(s)`,
        pageWidth / 2,
        currentY + 10,
        { align: 'center' }
      );
      currentY += 10;
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Page ${i}`, margin.left, pageHeight - 10);
    }

    const fileName = `plan-distribution-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    let successMessage = `
      <div>
        <p><strong>${Object.keys(groupedData).length} groupes</strong> traités</p>
        <p>Fichier PDF généré : <code>${fileName}</code></p>
    `;
    if (saved.length > 0) {
      successMessage += `<p>${saved.length} nouvelle(s) distribution(s) sauvegardée(s)</p>`;
    }
    if (skipped.length > 0) {
      successMessage += `<p>${skipped.length} distribution(s) déjà existante(s) - non sauvegardée(s)</p>`;
    }
    successMessage += `</div>`;

    await Swal.fire({
      icon: 'success',
      title: 'Export réussi',
      html: successMessage,
      confirmButtonColor: mainColor
    });
  } catch (error) {
    console.error('Erreur complète:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: error instanceof Error ? error.message : 'Échec de la génération du PDF',
      confirmButtonColor: '#ef4444'
    });
  }
};

const confirmTransporterConfig = async () => {
  showTransporterConfig.value = false;
  showDistributionPlan.value = true;
  
  if (selectedContracts.value.length > 0) {
    try {
      await generateDistributionPlan();
      if (distributionPlan.value.length) {
        await nextTick();
        await initMap('distribution-map');
        displayRoute(distributionPlan.value, null);
      }
    } catch (error) {
      console.error('Erreur génération plan:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de générer le plan',
        confirmButtonColor: '#3b82f6'
      });
    }
  }
};

const openDistributionPlan = async () => {
  showTransporterConfig.value = true;
  showDistributionPlan.value = false;
};

const openModal = () => {
  showModal.value = true;
  fetchSalesPoints();
  fetchProducts();
  fetchSuppliers();
  fetchWarehouses();
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

const closeConfirmation = () => {
  showConfirmation.value = false;
  resetForm();
  fetchContracts();
};

const resetForm = () => {
  contractForm.value = {
    name: '',
    startDate: '',
    endDate: '',
    salesPointIds: [],
    productId: '',
    frequency: 'weekly',
    deliveryDays: [],
    deliveryDates: [],
    tonnage: 1000,
    warehouseId: '',
    supplierId: '',
    warehouseQuantity: undefined,
    supplierQuantity: undefined
  };
  salesPointSearch.value = '';
  optimalWarehouse.value = null;
  selectedWarehouse.value = null;
  suggestedSupplier.value = null;
  requiresSupplier.value = false;
  selectedContract.value = null;
  isOptimalWarehouseLocked.value = false;
};

const openResourceManagement = () => {
  showResourceManagement.value = true;
  fetchTrucks();
  fetchTransporters();
};

const deleteContract = async (contractId: string) => {
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Confirmation',
    text: 'Êtes-vous sûr de vouloir supprimer ce contrat ?',
    showCancelButton: true,
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler'
  });
  
  if (!result.isConfirmed) return;
  
  try {
    loading.value.contracts = true;
    await api.delete(`/contract/${contractId}`);
    contracts.value = contracts.value.filter(c => c._id !== contractId);
    await Swal.fire({
      icon: 'success',
      title: 'Supprimé',
      text: 'Contrat supprimé avec succès',
      confirmButtonColor: '#3b82f6'
    });
  } catch (error) {
    console.error('Échec de la suppression du contrat', error);
    await Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: getErrorMessage(error, 'suppression du contrat'),
      confirmButtonColor: '#3b82f6'
    });
  } finally {
    loading.value.contracts = false;
  }
};

// Lifecycle Hooks
onMounted(() => {
  fetchContracts();
  fetchTrucks();
  fetchTransporters();
  fetchWarehouses();
});

// Watchers
watch(
  [
    () => contractForm.value.salesPointIds,
    () => contractForm.value.productId,
    () => contractForm.value.tonnage,
    () => warehouses.value,
  ],
  async ([newSalesPointIds, newProductId, newTonnage]) => {
    try {
      const conditionsMet = (
        newSalesPointIds?.length > 0 &&
        newProductId &&
        newTonnage > 0 &&
        !selectedContract.value?._id &&
        Array.isArray(warehouses.value) &&
        warehouses.value.length > 0
      );

      if (conditionsMet) {
        console.log('Conditions met for fetchOptimalWarehouse:', {
          salesPointIds: newSalesPointIds,
          productId: newProductId,
          tonnage: newTonnage,
          warehousesCount: warehouses.value.length,
        });
        await fetchOptimalWarehouse();
      } else {
        console.log('Conditions not met for fetchOptimalWarehouse:', {
          salesPointIds: newSalesPointIds?.length || 0,
          hasProductId: !!newProductId,
          tonnage: newTonnage,
          isEditing: !!selectedContract.value?._id,
          warehousesReady: Array.isArray(warehouses.value) && warehouses.value.length > 0,
        });
      }
    } catch (error) {
      console.error('Error in watch:', error);
    }
  },
  { deep: true, immediate: true }
);
</script>
<template>
  <div class="contract-manager">
    <!-- Main Content -->
    <main class="contract-manager__main">
      <!-- Header -->
      <header class="contract-manager__header">
        <div class="header__left">
          <h1 class="contract-manager__title">Contract Management</h1>
        </div>
        <div class="header__actions">
          <input
            type="text"
            v-model="contractSearch"
            placeholder="Search for a contract..."
            class="header__search"
          />
          <div class="header__buttons">
            <button class="btn btn--primary" @click="openModal">
              <span class="btn__icon">➕</span> New Contract
            </button>
            <button 
              class="btn btn--secondary" 
              @click="openDistributionPlan" 
              :disabled="!canOptimizeRoute"
            >
              <span class="btn__icon">📅</span> Distribution Plan
            </button>
            <button class="btn btn--secondary" @click="openResourceManagement">
              <span class="btn__icon">🚚</span> Resources
            </button>
            <button class="btn btn--icon" @click="fetchContracts" title="Refresh">
              <span class="btn__icon">↻</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Contracts Section -->
      <section class="contract-manager__contracts">
        <div class="section__header">
          <h2>Contracts</h2>
          <span class="section__count">{{ filteredContracts.length }} contract(s)</span>
        </div>
        
        <!-- Loading/Error/Empty States -->
        <div v-if="loading.contracts" class="loading-state">
          <div class="spinner"></div>
          <span>Loading contracts...</span>
        </div>
        <div v-else-if="errors.contracts" class="error-state">
          <span class="icon">⚠️</span>
          {{ errors.contracts }}
        </div>
        <div v-else-if="!filteredContracts.length" class="empty-state">
          <span>No contracts found.</span>
          <button class="btn btn--secondary" @click="openModal">Create a contract</button>
        </div>
        <div v-else class="contracts__grid">
          <div
            v-for="contract in filteredContracts"
            :key="contract._id"
            class="contract-card"
            :class="{ 'contract-card--selected': selectedContracts.some(c => c._id === contract._id) }"
          >
            <div class="contract-card__header">
              <h3 class="contract-card__title">{{ contract.name }}</h3>
              <span class="contract-card__status" :class="getStatusClass(contract)">
                {{ getContractStatus(contract) }}
              </span>
            </div>
            
            <div class="contract-card__details">
              <div class="detail__item">
                <span class="detail__label">Period</span>
                <span>{{ formatDate(contract.startDate) }} - {{ formatDate(contract.endDate) }}</span>
              </div>
              <div class="detail__item">
                <span class="detail__label">Warehouse</span>
                <span>{{ contract.warehouse?.name || 'Not assigned' }}</span>
              </div>
              <div v-if="contract.supplier" class="detail__item">
                <span class="detail__label">Supplier</span>
                <span>{{ contract.supplier.name }}</span>
              </div>
              <div class="detail__item">
                <span class="detail__label">Quantity</span>
                <span>{{ formatNumber(contract.product.totalQuantity) }} kg</span>
              </div>
            </div>
            
            <div class="contract-card__actions">
              <button
                class="btn btn--icon"
                @click="toggleContractSelection(contract)"
                :title="selectedContracts.some(c => c._id === contract._id) ? 'Deselect' : 'Select'"
              >
                <span class="icon">{{ selectedContracts.some(c => c._id === contract._id) ? '☑' : '☐' }}</span>
              </button>
              <button
                class="btn btn--icon"
                @click="showDetails(contract)"
                title="Details"
              >
                <span class="icon">ℹ️</span>
              </button>
              
              <button
                class="btn btn--icon btn--danger"
                @click="deleteContract(contract._id)"
                title="Delete"
              >
                <span class="icon">🗑️</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modals -->
    <!-- Contract Modal -->
    <div v-if="showModal" class="modal" @click="closeModal">
      <div class="modal__content modal__content--large" @click.stop>
        <header class="modal__header">
          <h2>{{ selectedContract?._id ? 'Edit Contract' : 'New Contract' }}</h2>
          <button class="modal__close" @click="closeModal">×</button>
        </header>
        
        <form @submit.prevent="saveContract" class="modal__body">
          <!-- General Information -->
          <div class="form-card">
            <h3>General Information</h3>
            <div class="form-group">
              <label for="contract-name">Contract Name <span class="required">*</span></label>
              <input
                id="contract-name"
                v-model="contractForm.name"
                type="text"
                placeholder="e.g., Contract Client X"
                required
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="start-date">Start Date <span class="required">*</span></label>
                <input
                  id="start-date"
                  v-model="contractForm.startDate"
                  type="date"
                  required
                />
              </div>
              <div class="form-group">
                <label for="end-date">End Date <span class="required">*</span></label>
                <input
                  id="end-date"
                  v-model="contractForm.endDate"
                  type="date"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Sales Points -->
          <div class="form-card">
            <h3>Sales Points <span class="required">*</span></h3>
            <div class="form-group">
              <input
                v-model="salesPointSearch"
                type="text"
                placeholder="Search for a sales point..."
                class="form-group__search"
              />
              <div class="selection-list" :class="{ 'selection-list--loading': loading.salesPoints }">
                <div v-if="loading.salesPoints" class="loading-state">
                  <div class="spinner"></div>
                  <span>Loading sales points...</span>
                </div>
                <div v-else-if="errors.salesPoints" class="error-state">
                  <span class="icon">⚠️</span>
                  {{ errors.salesPoints }}
                </div>
                <div v-else-if="!filteredSalesPoints.length" class="empty-state">
                  <span>No sales points found.</span>
                </div>
                <div v-else class="checkbox-list">
                  <label
                    v-for="point in filteredSalesPoints"
                    :key="point._id"
                    class="checkbox-item"
                  >
                    <input
                      type="checkbox"
                      v-model="contractForm.salesPointIds"
                      :value="point._id"
                    />
                    <span>{{ point.name }}</span>
                    <small v-if="point.address">{{ point.address }}</small>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Product & Delivery -->
          <div class="form-card">
            <h3>Product & Delivery</h3>
            <div class="form-group">
              <label for="product-select">Product <span class="required">*</span></label>
              <select
                id="product-select"
                v-model="contractForm.productId"
                required
                :disabled="selectedContract?._id"
              >
                <option value="" disabled>Select a product</option>
                <option
                  v-for="product in products"
                  :key="product._id"
                  :value="product._id"
                >
                  {{ product.name }} ({{ product.category }})
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="tonnage">Quantity (kg) <span class="required">*</span></label>
              <input
                id="tonnage"
                v-model.number="contractForm.tonnage"
                type="number"
                min="1"
                step="1"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="frequency">Delivery Frequency <span class="required">*</span></label>
              <select
                id="frequency"
                v-model="contractForm.frequency"
                @change="updateFrequency"
                required
              >
                <option
                  v-for="(label, value) in FREQUENCY_LABELS"
                  :key="value"
                  :value="value"
                >
                  {{ label }}
                </option>
              </select>
            </div>
            
            <div v-if="contractForm.frequency === 'custom'" class="form-group">
              <label>Delivery Days <span class="required">*</span></label>
              <div class="checkbox-list">
                <label
                  v-for="day in WEEK_DAYS"
                  :key="day.value"
                  class="checkbox-item"
                >
                  <input
                    type="checkbox"
                    :value="day.value"
                    v-model="contractForm.deliveryDays"
                  />
                  <span>{{ day.label }}</span>
                </label>
              </div>
            </div>

            <!-- Delivery Dates for custom frequency -->
            <div v-if="contractForm.frequency === 'custom'" class="form-group">
              <label>Delivery Dates <span class="required">*</span></label>
              <div class="delivery-dates-list">
                <div v-for="(date, index) in contractForm.deliveryDates" :key="index" class="delivery-date-item">
                  <input type="date" v-model="date.date" required />
                  <select v-model="date.status" required>
                    <option value="pending">Pending</option>
                    <option value="in progress">In Progress</option>
                    <option value="delivered">Delivered</option>
                  </select>
                  <button @click="removeDeliveryDate(index)" type="button" class="btn btn--danger btn--small">
                    Delete
                  </button>
                </div>
                <button @click="addDeliveryDate" type="button" class="btn btn--secondary btn--small">
                  Add a date
                </button>
              </div>
            </div>
          </div>

          <!-- Distribution Optimization -->
          <div class="form-card">
            <h3>Distribution Optimization</h3>

            <!-- Warehouse Selection -->
            <div class="form-group form-group--highlighted">
              <label for="warehouse-select">
                Warehouse <span class="required">*</span>
                <span v-if="loading.warehouses" class="loading-text">(Loading...)</span>
              </label>
              <select
                id="warehouse-select"
                v-model="contractForm.warehouseId"
                :disabled="loading.optimalWarehouse || loading.warehouses || !warehouses.length || isOptimalWarehouseLocked"
                required
                @change="onWarehouseSelect"
              >
                <option value="" disabled>Select a warehouse</option>
                <option
                  v-for="warehouse in warehouses"
                  :key="warehouse._id"
                  :value="warehouse._id"
                  :data-optimal="optimalWarehouse && warehouse._id === optimalWarehouse._id"
                >
                  {{ warehouse.name }} ({{ formatStorageType(warehouse.storage_type) }}, Stock: {{ formatNumber(getProductStock(warehouse, contractForm.productId)) }} kg)
                </option>
              </select>
              <div class="form-group__info">
                <div v-if="loading.optimalWarehouse" class="loading-state loading-state--inline">
                  <div class="spinner spinner--small"></div>
                  <span>Searching for optimal warehouse...</span>
                </div>
                <div v-else-if="errors.warehouses" class="error-state error-state--inline">
                  <span class="icon">⚠️</span>
                  {{ errors.warehouses }}
                </div>
                <div v-else-if="optimalWarehouse" class="optimal-info">
                  <span class="optimal-badge">Optimal</span>
                  Warehouse: {{ optimalWarehouse.name }} (Stock: {{ formatNumber(getProductStock(optimalWarehouse, contractForm.productId)) }} kg)
                  <span v-if="contractForm.warehouseId !== optimalWarehouse._id" class="warning-text">
                    Warning: Non-optimal warehouse selected.
                  </span>
                </div>
                <div v-else-if="!warehouses.length" class="warning-state">
                  No warehouses available.
                </div>
              </div>
            </div>

            <!-- Warehouse Quantity -->
            <div class="form-group" v-if="contractForm.warehouseId">
              <label for="warehouse-quantity">Quantity from Warehouse (kg)</label>
              <input
                id="warehouse-quantity"
                type="number"
                v-model.number="contractForm.warehouseQuantity"
                :disabled="!contractForm.warehouseId"
                :max="productAvailableQuantity"
                :placeholder="`Max: ${formatNumber(productAvailableQuantity)} kg`"
                min="0"
              />
              <div class="form-group__info">
                <span>Available Stock: {{ formatNumber(productAvailableQuantity) }} kg</span>
                <span v-if="productAvailableQuantity < contractForm.tonnage" class="warning-text">
                  Insufficient stock, supplier required for {{ formatNumber(missingQuantity) }} kg
                </span>
              </div>
            </div>

            <!-- Supplier Selection -->
            <div class="form-group form-group--highlighted" v-if="requiresSupplier">
              <label for="supplier-select">
                Supplier <span class="required">*</span>
                <span v-if="loading.suppliers" class="loading-text">(Loading...)</span>
              </label>
              <select
                id="supplier-select"
                v-model="contractForm.supplierId"
                :disabled="loading.suppliers || !suppliers.length"
                required
                @change="onSupplierSelect"
              >
                <option value="" disabled>Select a supplier</option>
                <option
                  v-for="supplier in suppliers"
                  :key="supplier._id"
                  :value="supplier._id"
                  :data-suggested="suggestedSupplier && supplier._id === suggestedSupplier._id"
                >
                  {{ supplier.name }} (Stock: {{ formatNumber(getProductStock(supplier, contractForm.productId)) }} kg)
                </option>
              </select>
              <div class="form-group__info">
                <div v-if="loading.suppliers" class="loading-state loading-state--inline">
                  <div class="spinner spinner--small"></div>
                  <span>Searching for supplier...</span>
                </div>
                <div v-else-if="errors.suppliers" class="error-state error-state--inline">
                  <span class="icon">⚠️</span>
                  {{ errors.suppliers }}
                </div>
                <div v-else-if="suggestedSupplier" class="optimal-info">
                  <span class="optimal-badge optimal-badge--supplier">Suggested</span>
                  Supplier: {{ suggestedSupplier.name }} (Quantity: {{ formatNumber(contractForm.supplierQuantity) }} kg)
                </div>
                <div v-else-if="requiresSupplier" class="error-state error-state--inline">
                  <span class="icon">⚠️</span>
                  No suggested supplier. Check availability for this product and quantity.
                </div>
              </div>
            </div>

            <!-- Supplier Quantity -->
            <div class="form-group" v-if="requiresSupplier && contractForm.supplierId">
              <label for="supplier-quantity">Quantity from Supplier (kg)</label>
              <input
                id="supplier-quantity"
                type="number"
                v-model.number="contractForm.supplierQuantity"
                :disabled="!contractForm.supplierId"
                :min="missingQuantity"
                :max="contractForm.tonnage"
                :placeholder="`Min: ${formatNumber(missingQuantity)} kg`"
              />
            </div>

            <!-- Summary -->
            <div class="form-group form-group--summary">
              <h4>Summary</h4>
              <div class="summary-item" v-if="contractForm.warehouseId">
                <span>Warehouse: {{ warehouses.find(w => w._id === contractForm.warehouseId)?.name || 'Not selected' }}</span>
                <span>Quantity: {{ formatNumber(contractForm.warehouseQuantity || 0) }} kg</span>
              </div>
              <div class="summary-item" v-if="contractForm.supplierId">
                <span>Supplier: {{ suppliers.find(s => s._id === contractForm.supplierId)?.name || 'Not selected' }}</span>
                <span>Quantity: {{ formatNumber(contractForm.supplierQuantity || 0) }} kg</span>
              </div>
              <div class="summary-item summary-item--total">
                <span>Total: {{ formatNumber((contractForm.warehouseQuantity || 0) + (contractForm.supplierQuantity || 0)) }} kg</span>
                <span v-if="contractForm.tonnage && (contractForm.warehouseQuantity || 0) + (contractForm.supplierQuantity || 0) !== contractForm.tonnage" class="error-text">
                  Does not match required tonnage ({{ formatNumber(contractForm.tonnage) }} kg)
                </span>
              </div>
            </div>
          </div>
          
          <footer class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="closeModal">Cancel</button>
            <button
              type="submit"
              class="btn btn--primary"
              :disabled="saving || loading.optimalWarehouse || loading.suppliers"
            >
              <span v-if="saving">
                <span class="spinner-inline"></span> Saving...
              </span>
              <span v-else>
                <span class="btn__icon">💾</span> {{ selectedContract?._id ? 'Update' : 'Create' }}
              </span>
            </button>
          </footer>
        </form>
      </div>
    </div>

    <!-- Contract Details Modal -->
    <!-- Contract Details Modal -->
<div v-if="showContractDetails && detailedContract" class="modal" @click="showContractDetails = false">
  <div class="modal__content" @click.stop>
    <header class="modal__header">
      <h2>Contract Details</h2>
      <button class="modal__close" @click="showContractDetails = false">×</button>
    </header>
    
    <div class="modal__body">
      <div class="contract-details">
        <div class="detail-section">
          <h3>General Information</h3>
          <div class="detail-row">
            <span class="detail-label">Name</span>
            <span>{{ detailedContract.name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span>{{ getContractStatus(detailedContract) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Period</span>
            <span>{{ formatDate(detailedContract.startDate) }} - {{ formatDate(detailedContract.endDate) }}</span>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>Product & Delivery</h3>
          <div class="detail-row">
            <span class="detail-label">Product</span>
            <span>{{ detailedContract.product.name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Quantity</span>
            <span>{{ formatNumber(detailedContract.product.totalQuantity) }} kg</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Frequency</span>
            <span>{{ FREQUENCY_LABELS[detailedContract.frequency] }}</span>
          </div>
          <div v-if="detailedContract.frequency === 'custom'" class="detail-row">
            <span class="detail-label">Delivery Days</span>
            <span>{{ detailedContract.deliveryDays.map(day => WEEK_DAYS.find(d => d.value === day)?.label || day).join(', ') }}</span>
          </div>
          <div v-if="detailedContract.deliveryDates?.length" class="detail-row">
            <span class="detail-label">Delivery Dates</span>
            <div class="detail-list">
              <div v-for="(date, index) in detailedContract.deliveryDates" :key="index" class="detail-list-item">
                <span>{{ formatDeliveryDate(date.date) }} ({{ date.status }})</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>Distribution</h3>
          <div class="detail-row">
            <span class="detail-label">Warehouse</span>
            <span>{{ detailedContract.warehouse?.name || 'Not assigned' }}</span>
          </div>
          <div v-if="detailedContract.supplier" class="detail-row">
            <span class="detail-label">Supplier</span>
            <span>{{ detailedContract.supplier.name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Sales Points</span>
            <div class="detail-list">
              <div v-if="loading.details" class="loading-state loading-state--inline">
                <div class="spinner spinner--small"></div>
                <span>Loading sales points...</span>
              </div>
              <div v-else-if="!detailedContract.salesPoints?.length" class="empty-state empty-state--inline">
                No sales points assigned
              </div>
              <div v-else>
                <div v-for="sp in detailedContract.salesPoints" :key="sp._id" class="detail-list-item">
                  <span>{{ sp.name }}</span>
                  <small v-if="sp.address">{{ sp.address }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <footer class="modal__footer">
      <button class="btn btn--secondary" @click="showContractDetails = false">Close</button>
      <button
        class="btn btn--primary"
        @click="updateContract(detailedContract)"
      >
        <span class="btn__icon">✏️</span> Edit
      </button>
    </footer>
  </div>
</div>

    <!-- Transporter Config Modal -->
    <div v-if="showTransporterConfig" class="modal" @click="showTransporterConfig = false">
      <div class="modal__content" @click.stop>
        <header class="modal__header">
          <h2>Transporter Configuration</h2>
          <button class="modal__close" @click="showTransporterConfig = false">×</button>
        </header>
        
        <div class="modal__body">
          <div class="form-card">
            <h3>Transporter Settings</h3>
            <p>All transporters will have the same work constraints.</p>
            
            <div class="form-group">
              <label for="working-days">Working Days per Week</label>
              <input
                id="working-days"
                v-model.number="transporterConfig.workingDaysPerWeek"
                type="number"
                min="1"
                max="7"
                step="1"
              />
              <div class="form-group__info">
                <span>Maximum number of days a transporter can work per week</span>
              </div>
            </div>
            
            <div class="form-group">
              <label for="deliveries-per-day">Maximum Deliveries per Day</label>
              <input
                id="deliveries-per-day"
                v-model.number="transporterConfig.maxDeliveriesPerDay"
                type="number"
                min="1"
                max="5"
                step="1"
              />
              <div class="form-group__info">
                <span>Maximum number of deliveries a transporter can perform in a day</span>
              </div>
            </div>
          </div>
        </div>
        
        <footer class="modal__footer">
          <button class="btn btn--secondary" @click="showTransporterConfig = false">Cancel</button>
          <button class="btn btn--primary" @click="confirmTransporterConfig">
            Confirm and Generate Plan
          </button>
        </footer>
      </div>
    </div>

    <!-- Distribution Plan Modal -->
    <div v-if="showDistributionPlan" class="modal" @click="showDistributionPlan = false">
      <div class="modal__content modal__content--large" @click.stop>
        <header class="modal__header">
          <h2>Distribution Plan</h2>
          <button class="modal__close" @click="showDistributionPlan = false">×</button>
        </header>
        
        <div class="modal__body">
          <div v-if="optimizingRoute" class="loading-state">
            <div class="spinner"></div>
            <span>Calculating plan...</span>
          </div>
          
          <div v-else-if="errors.route" class="error-state">
            <span class="icon">⚠️</span>
            {{ errors.route }}
          </div>
          
          <div v-else-if="!distributionPlan.length" class="empty-state">
            <span>No plan generated. Select contracts.</span>
            <button class="btn btn--secondary" @click="openDistributionPlan">Try Again</button>
          </div>
          
          <div v-else class="distribution-plan">
           <div class="map-container">
  <div id="distribution-map" class="map"></div>
  <div v-if="mapLoading" class="map-loading">
    <div class="spinner"></div>
    <span>Loading map...</span>
  </div>
  <div v-if="!selectedRoute" class="map-placeholder">
    <div class="placeholder-content">
      <span class="icon">🗺️</span>
      <p>Select a route from the table below to display it on the map</p>
    </div>
  </div>
</div>

            <div class="route-selection">
              <h3>Select a Route to Highlight</h3>
              <select
                v-model="selectedRoute"
                @change="displayRoute(distributionPlan, selectedRoute)"
                class="route-select"
              >
                <option :value="null">All Routes</option>
                <option v-for="(entry, index) in distributionPlan" :key="index" :value="entry">
                  {{ entry.contractName }} - {{ formatDeliveryDate(entry.deliveryDates[0]?.date) }}
                </option>
              </select>
            </div>

            <table class="distribution-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Contract</th>
                  <th>Warehouse</th>
                  <th>Supplier</th>
                  <th>Sales Points</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Truck</th>
                  <th>Transporter</th>
                  <th>Distance</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(entry, index) in distributionPlan" 
                  :key="index"
                  @click="displayRoute(distributionPlan, entry)"
                  class="route-row"
                  :class="{ 'route-row--highlighted': selectedRoute === entry }"
                >
                  <td>{{ formatDeliveryDate(entry.deliveryDates[0]?.date) || 'N/A' }}</td>
                  <td>{{ entry.dayOfWeek }}</td>
                  <td>{{ entry.contractName }}</td>
                  <td>{{ entry.warehouse }}</td>
                  <td>{{ entry.supplier || '-' }}</td>
                  <td>{{ entry.salesPoints.join(', ') }}</td>
                  <td>{{ entry.product }}</td>
                  <td>{{ formatNumber(entry.quantity) }} kg</td>
                 <td>
  <!-- Afficher le camion optimal -->
  <div v-if="entry.optimalTruckId" class="optimal-truck-display">
    <span class="optimal-truck-label">Optimal:</span>
    {{ trucks.find(t => t._id === entry.optimalTruckId)?.vehicle }}
    {{ trucks.find(t => t._id === entry.optimalTruckId)?.type }}, 
    {{ formatNumber(trucks.find(t => t._id === entry.optimalTruckId)?.capacity) }} kg
  </div>
  
  <!-- Liste déroulante pour sélectionner un camion -->
  <select 
    v-model="entry.editableTruckId"
    @change="updateTruckForEntry(entry, $event.target.value)"
    class="editable-select"
  >
    <option value="">Not Assigned</option>
    <option 
      v-for="truck in getAvailableTrucksForEntry(entry)"
      :key="truck._id"
      :value="truck._id"
      :class="{
        'optimal-truck': truck._id === entry.optimalTruckId,
        'insufficient-capacity': truck.capacity < entry.quantity,
        'sufficient-capacity': truck.capacity >= entry.quantity
      }"
    >
      {{ truck.vehicle }} ({{ truck.type }}, {{ formatNumber(truck.capacity) }} kg)
      <template v-if="truck._id === entry.optimalTruckId">
        - Optimal ★
      </template>
      <template v-else-if="truck.capacity < entry.quantity">
        - Insuffisant
      </template>
    </option>
  </select>
</td>
                  <td>
                    <select 
                      v-model="entry.editableTransporterId"
                      @change="updateTransporterForEntry(entry, $event.target.value)"
                      class="editable-select"
                      :disabled="!entry.truck"
                    >
                      <option value="">Not Assigned</option>
                      <option 
                        v-for="transporter in availableTransporters"
                        :key="transporter._id"
                        :value="transporter._id"
                        :disabled="!isTransporterCompatible(transporter, entry.truck?.type)"
                      >
                        {{ transporter.firstName }} {{ transporter.lastName }} ({{ transporter.typeDrivingLicence }})
                      </option>
                    </select>
                  </td>
                  <td>{{ formatNumber(entry.route.totalDistance) }} km</td>
                  <td>{{ formatNumber(entry.route.totalTime) }} min</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <footer class="modal__footer">
          <button
            class="btn btn--primary"
            @click="downloadPDF"
            :disabled="!distributionPlan.length"
          >
            <span class="btn__icon">📄</span> Export PDF
          </button>
          <button
            class="btn btn--primary"
            @click="downloadCSV"
            :disabled="!distributionPlan.length"
          >
            <span class="btn__icon">📊</span> Export CSV
          </button>
          <button class="btn btn--secondary" @click="showDistributionPlan = false">Close</button>
        </footer>
      </div>
    </div>

    <!-- Resource Management Modal -->
    <div v-if="showResourceManagement" class="modal" @click="showResourceManagement = false">
      <div class="modal__content modal__content--large" @click.stop>
        <header class="modal__header">
          <h2>Resource Management</h2>
          <button class="modal__close" @click="showResourceManagement = false">×</button>
        </header>
        
        <div class="modal__body">
          <div class="resource-section">
            <h3>Trucks</h3>
            <div v-if="loading.trucks" class="loading-state">
              <div class="spinner"></div>
              <span>Loading trucks...</span>
            </div>
            <div v-else-if="errors.trucks" class="error-state">
              <span class="icon">⚠️</span>
              {{ errors.trucks }}
            </div>
            <div v-else-if="!trucks.length" class="empty-state">
              <span>No trucks available.</span>
            </div>
            <div v-else class="resource-grid">
              <div v-for="truck in trucks" :key="truck._id" class="resource-card">
                <div class="resource-card__title">{{ truck.vehicle }}</div>
                <div class="resource-card__stats">
                  <span>Type: {{ truck.type }}</span>
                  <span>Capacity: {{ formatNumber(truck.capacity) }} kg</span>
                </div>
                <span
                  class="resource-card__status"
                  :class="{
                    'resource-card__status--available': truck.status === 'available',
                    'resource-card__status--in-transit': truck.status === 'in transit',
                    'resource-card__status--maintenance': truck.status === 'maintenance'
                  }"
                >
                  {{ truck.status }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="resource-section">
            <h3>Transporters</h3>
            <div v-if="loading.transporters" class="loading-state">
              <div class="spinner"></div>
              <span>Loading transporters...</span>
            </div>
            <div v-else-if="errors.transporters" class="error-state">
              <span class="icon">⚠️</span>
              {{ errors.transporters }}
            </div>
            <div v-else-if="!transporters.length" class="empty-state">
              <span>No transporters available.</span>
            </div>
            <div v-else class="resource-grid">
              <div v-for="transporter in transporters" :key="transporter._id" class="resource-card">
                <div class="resource-card__title">{{ transporter.firstName }} {{ transporter.lastName }}</div>
                <div class="resource-card__stats">
                  <span>License: {{ transporter.typeDrivingLicence }}</span>
                  <span>Phone: {{ transporter.phoneNumber }}</span>
                </div>
                <span
                  class="resource-card__status"
                  :class="{
                    'resource-card__status--available': transporter.status === 'Available',
                    'resource-card__status--on-mission': transporter.status === 'On mission',
                    'resource-card__status--on-leave': transporter.status === 'On leave'
                  }"
                >
                  {{ transporter.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <footer class="modal__footer">
          <button class="btn btn--secondary" @click="showResourceManagement = false">Close</button>
        </footer>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmation" class="modal" @click="closeConfirmation">
      <div class="modal__content" @click.stop>
        <header class="modal__header">
          <h2>Contract Saved</h2>
          <button class="modal__close" @click="closeConfirmation">×</button>
        </header>
        
        <div class="modal__body">
          <div class="success-message">
            <div class="success-icon">✓</div>
            <p>The contract <strong>{{ lastCreatedContract?.name }}</strong> has been saved successfully.</p>
          </div>
        </div>
        
        <footer class="modal__footer">
          <button class="btn btn--secondary" @click="closeConfirmation">Close</button>
          <button class="btn btn--primary" @click="showDetails(lastCreatedContract)">
            <span class="btn__icon">ℹ️</span> View Details
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>
<style scoped>
/* Layout */
.contract-manager {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f8fafc;
}

.contract-manager__header {
  background-color: white;
  padding: 15px 25px;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.header__left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.contract-manager__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #3b82f6;
  margin: 0;
}

.header__actions {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.header__search {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 15px;
  font-size: 1rem;
  min-width: 250px;
  transition: all 0.2s;
}

.header__search:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.header__buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn--primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.btn--secondary {
  background: linear-gradient(135deg, #64748b, #475569);
  color: white;
}

.btn--secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.btn--icon {
  padding: 8px;
  border-radius: 8px;
  background-color: transparent;
  color: #475569;
}

.btn--icon:hover {
  background-color: #e2e8f0;
}

.btn--sm {
  padding: 6px 12px;
  font-size: 0.875rem;
}

.btn--danger {
  color: #ef4444;
}

.btn--danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Contracts Section */
.contract-manager__contracts {
  padding: 20px;
}

.section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section__header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.section__count {
  background-color: #e2e8f0;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #475569;
}

.contracts__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* Contract Card Styles */
.contract-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.2s;
  border-left: 4px solid transparent;
}

.contract-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.contract-card--selected {
  border-left-color: #3b82f6;
}

.contract-card__header {
  padding: 20px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contract-card__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.contract-card__status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.contract-card__status--pending {
  background-color: rgba(245, 158, 11, 0.2);
  color: #9e7d0a;
}

.contract-card__status--active {
  background-color: rgba(16, 185, 129, 0.2);
  color: #1a7431;
}

.contract-card__status--expired {
  background-color: rgba(239, 68, 68, 0.2);
  color: #a71d2a;
}

.contract-card__details {
  padding: 20px;
}

.detail__item {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
}

.detail__item:last-child {
  margin-bottom: 0;
}

.detail__label {
  font-weight: 500;
  color: #94a3b8;
}

.contract-card__actions {
  padding: 15px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background-color: #e2e8f0;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal__content {
  background-color: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal__content--large {
  max-width: 90vw;
  width: 100%;
}

.modal__header {
  padding: 20px 25px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
}

.modal__close:hover {
  color: #ef4444;
}

.modal__body {
  padding: 25px;
  overflow-y: auto;
  flex: 1;
}

.modal__footer {
  padding: 20px 25px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

/* Distribution Table Styles */
.distribution-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 30px;
  font-size: 0.85rem;
  table-layout: auto;
}

.distribution-table th,
.distribution-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
  white-space: nowrap;
}

.distribution-table th:nth-child(9),
.distribution-table td:nth-child(9) {
  width: 15%;
  min-width: 120px;
}

.distribution-table th:nth-child(10),
.distribution-table td:nth-child(10) {
  width: 20%;
  min-width: 150px;
}

.distribution-table th:nth-child(1),
.distribution-table td:nth-child(1) {
  width: 8%;
  min-width: 80px;
}

.distribution-table th:nth-child(2),
.distribution-table td:nth-child(2) {
  width: 6%;
  min-width: 60px;
}

.distribution-table th:nth-child(3),
.distribution-table td:nth-child(3) {
  width: 10%;
  min-width: 100px;
}

.distribution-table th:nth-child(4),
.distribution-table td:nth-child(4) {
  width: 8%;
  min-width: 80px;
}

.distribution-table th:nth-child(5),
.distribution-table td:nth-child(5) {
  width: 8%;
  min-width: 80px;
}

.distribution-table th:nth-child(6),
.distribution-table td:nth-child(6) {
  width: 15%;
  min-width: 120px;
}

.distribution-table th:nth-child(7),
.distribution-table td:nth-child(7) {
  width: 8%;
  min-width: 80px;
}

.distribution-table th:nth-child(8),
.distribution-table td:nth-child(8) {
  width: 6%;
  min-width: 60px;
}

.distribution-table th:nth-child(11),
.distribution-table td:nth-child(11) {
  width: 8%;
  min-width: 80px;
}

.distribution-table th:nth-child(12),
.distribution-table td:nth-child(12) {
  width: 8%;
  min-width: 80px;
}

.distribution-table th {
  position: sticky;
  top: 0;
  background-color: #f8fafc;
  font-weight: 600;
  z-index: 10;
}

.distribution-table tr:last-child td {
  border-bottom: none;
}

.route-row {
  cursor: pointer;
  transition: all 0.2s;
}

.route-row:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.editable-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.85rem;
  background-color: white;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editable-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* Responsive Adjustments */
@media (max-width: 1200px) {
  .distribution-table {
    font-size: 0.8rem;
  }
  
  .modal__content--large {
    max-width: 95vw;
  }
  
  .modal__body {
    padding: 15px;
  }
  
  .distribution-table th,
  .distribution-table td {
    padding: 8px 10px;
  }
  
  .editable-select {
    font-size: 0.8rem;
    padding: 6px 8px;
  }
}

@media (max-width: 768px) {
  .modal__content--large {
    max-width: 98vw;
    padding: 10px;
  }
  
  .distribution-table {
    font-size: 0.75rem;
  }
  
  .distribution-table th,
  .distribution-table td {
    padding: 6px 8px;
  }
  
  .editable-select {
    font-size: 0.75rem;
    padding: 5px 7px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .modal__content--large {
    max-width: 92vw;
  }
}

@media (min-width: 1025px) {
  .modal__content--large {
    max-width: 90vw;
  }
}

/* Form Styles */
.form-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.form-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="date"],
.form-group select {
  width: 80%;
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.form-row {
  display: flex;
  gap: 25px;
  margin-bottom: 10px;
}

.form-row .form-group {
  flex: 50%;
  margin-bottom: 0;
}

.form-group__search {
  margin-bottom: 10px;
}

.selection-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
}

.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.checkbox-item:hover {
  background-color: #e2e8f0;
}

.checkbox-item input[type="checkbox"] {
  margin: 0;
}

.checkbox-item small {
  color: #94a3b8;
  margin-left: 10px;
}

/* Loading and Error States */
.loading-state,
.error-state,
.empty-state {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s linear infinite;
}

.spinner-inline {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  color: #ef4444;
}

.empty-state {
  color: #94a3b8;
}

.error-state .icon,
.empty-state .icon {
  font-size: 2rem;
}

/* Warehouse and Supplier Selection */
.warehouse-selection,
.supplier-selection,
.warehouse-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.warehouse-card,
.supplier-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 15px;
  border-left: 4px solid #3b82f6;
}

.supplier-card {
  border-left-color: #f59e0b;
}

.warehouse-card:hover,
.supplier-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-5px);
}

.warehouse-card__title,
.supplier-card__title {
  font-weight: 600;
  font-size: 1.125rem;
}

.warehouse-card__type {
  color: #94a3b8;
  font-size: 0.875rem;
}

.warehouse-card__stats,
.supplier-card__stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #475569;
}

.optimal-warehouse,
.optimal-supplier {
  margin-bottom: 30px;
}

.optimal-warehouse h5,
.optimal-supplier h5 {
  margin-bottom: 15px;
  font-weight: 600;
  color: #3b82f6;
}

/* Map and Route Styles */
.map-container {
  width: 100%;
  height: 400px;
  margin-bottom: 30px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.map {
  width: 100%;
  height: 100%;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.route-selection {
  margin-bottom: 20px;
}

.route-select {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 10px;
}

/* Resource Management */
.resource-section {
  margin-bottom: 30px;
}

.resource-section h3 {
  margin-bottom: 20px;
  font-weight: 600;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.resource-card {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-left: 4px solid #3b82f6;
}

.resource-card__title {
  font-weight: 600;
  font-size: 1rem;
}

.resource-card__status {
  align-self: flex-start;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-top: 5px;
}

/* Contract Details */
.contract-details {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.detail-section {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.detail-section h3 {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 500;
  color: #94a3b8;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-list-item {
  padding: 10px;
  background-color: #e2e8f0;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.detail-list-item small {
  color: #94a3b8;
}

/* Success Message */
.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 40px;
  text-align: center;
}

.success-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #10b981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .contract-manager__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header__actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  
  .header__search {
    width: 100%;
  }
  
  .header__buttons {
    width: 100%;
    justify-content: space-between;
  }
  
  .form-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .contracts__grid {
    grid-template-columns: 1fr;
  }
  
  .distribution-table {
    display: block;
    overflow-x: auto;
  }
  
  .resource-grid {
    grid-template-columns: 1fr;
  }
  
  .modal__content {
    width: 100%;
    max-height: 95vh;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .contracts__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .warehouse-selection,
  .supplier-selection,
  .resource-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .contracts__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Leaflet Overrides */
:global(.map-marker) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px !important;
  height: 24px !important;
  font-weight: bold;
  color: white;
  border-radius: 50%;
}

:global(.map-marker--warehouse) {
  background-color: #3b82f6;
}

:global(.map-marker--supplier) {
  background-color: #f59e0b;
}

:global(.map-marker--salespoint) {
  background-color: #10b981;
}

:global(.map-marker--warehouse-return) {
  background-color: #0ea5e9;
}

:global(.map-marker--highlighted) {
  box-shadow: 0 0 0 3px white, 0 0 0 6px #3b82f6;
  z-index: 1000 !important;
}

:global(.map-popup) {
  padding: 10px;
  font-family: inherit;
}

:global(.route-label) {
  background: none !important;
  border: none !important;
}

:global(.route-label__text) {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  font-family: inherit;
}

:global(.osrm-route) {
  transition: all 0.2s;
}

/* Highlight optimal warehouse in select */
select option[data-optimal="true"] {
  background-color: rgba(59, 130, 246, 0.1);
  font-weight: 600;
}

/* Highlight suggested supplier in select */
select option[data-suggested="true"] {
  background-color: rgba(245, 158, 11, 0.1);
  font-weight: 600;
}

/* Form Group Enhancements */
.form-group--highlighted {
  background-color: rgba(59, 130, 246, 0.05);
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid #3b82f6;
  margin-bottom: 25px;
}

.form-group--highlighted label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.required {
  color: #ef4444;
  font-size: 0.9rem;
}

.loading-text {
  font-size: 0.9rem;
  color: #94a3b8;
}

.form-group__info {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #475569;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group__info .loading-state--inline,
.form-group__info .error-state--inline {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.spinner--small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.optimal-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.optimal-badge {
  background-color: #3b82f6;
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.optimal-badge--supplier {
  background-color: #f59e0b;
}

.tooltip {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-left: 10px;
}

.warning-state {
  color: #f59e0b;
  font-size: 0.9rem;
}

.warning-text {
  color: #f59e0b;
}

.error-text {
  color: #ef4444;
  font-size: 0.9rem;
}

/* Summary Section */
.form-group--summary {
  background-color: #e2e8f0;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.form-group--summary h4 {
  margin-bottom: 15px;
  font-weight: 600;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item--total {
  font-weight: 600;
  margin-top: 10px;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .form-group--highlighted {
    padding: 10px;
  }

  .form-group__info {
    font-size: 0.85rem;
  }

  .optimal-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
/* Transporter Config Styles */
.config-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.config-card h3 {
  margin-bottom: 15px;
  font-weight: 600;
}

.config-card p {
  color: #64748b;
  margin-bottom: 20px;
}

.config-slider {
  width: 100%;
  margin: 20px 0;
}

.config-slider-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.config-slider-value {
  font-weight: 600;
  color: #3b82f6;
}

/* Range Input Styles */
input[type="range"] {
  -webkit-appearance: none;
  width: 80%;
  height: 8px;
  border-radius: 4px;
  background: #e2e8f0;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}
.map-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(248, 250, 252, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}

.placeholder-content {
  text-align: center;
  padding: 20px;
  max-width: 300px;
}

.placeholder-content .icon {
  font-size: 3rem;
  margin-bottom: 15px;
  display: block;
}

.placeholder-content p {
  color: #64748b;
  line-height: 1.5;
}
</style>