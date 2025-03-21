<template>
    <div class="suppliers-container">
      <!-- Header avec statistiques -->
      <div class="stats-header">
        <div class="stat-card">
          <h3>Total Fournisseurs</h3>
          <div class="stat-value">{{ suppliers.length }}</div>
          <div class="stat-trend positive">+5% ce mois</div>
        </div>
        <div class="stat-card">
          <h3>Fournisseurs Actifs</h3>
          <div class="stat-value">{{ activeCount }}</div>
          <div class="stat-trend positive">+2% ce mois</div>
        </div>
        <div class="stat-card">
          <h3>En Attente</h3>
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-trend neutral">Stable</div>
        </div>
        <div class="stat-card">
          <h3>Inactifs</h3>
          <div class="stat-value">{{ inactiveCount }}</div>
          <div class="stat-trend negative">-1% ce mois</div>
        </div>
      </div>
  
      <!-- Barre de recherche et filtres -->
      <div class="actions-bar">
        <div class="search-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="Rechercher par nom, catégorie, adresse..."
            class="search-input"
          >
          <span v-if="searchTerm" class="clear-search" @click="searchTerm = ''">
            <i class="fas fa-times"></i>
          </span>
        </div>
        <div class="filters">
          <div class="filter-dropdown">
            <select v-model="selectedCategory" class="filter-select">
              <option value="">Toutes les catégories</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          <div class="filter-dropdown">
            <select v-model="selectedStatus" class="filter-select">
              <option value="">Tous les statuts</option>
              <option value="Actif">Actif</option>
              <option value="En attente">En attente</option>
              <option value="Inactif">Inactif</option>
            </select>
          </div>
        </div>
        <div class="right-actions">
          <button class="action-btn">
            <i class="fas fa-filter"></i>
            Filtres avancés
          </button>
          <button class="action-btn primary">
            <i class="fas fa-plus"></i>
            Nouveau Fournisseur
          </button>
        </div>
      </div>
  
      <!-- Vue tableau -->
      <div class="table-container">
        <table class="suppliers-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll">
              </th>
              <th>ID</th>
              <th>FOURNISSEUR</th>
              <th>CONTACT</th>
              <th>CATÉGORIE</th>
              <th>DERNIÈRE COMMANDE</th>
              <th>PERFORMANCE</th>
              <th>STATUT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="supplier in paginatedSuppliers" :key="supplier.id" :class="{ 'selected': selectedSuppliers.includes(supplier.id) }">
              <td>
                <input 
                  type="checkbox" 
                  :value="supplier.id" 
                  v-model="selectedSuppliers"
                >
              </td>
              <td class="id-cell">#{{ supplier.id }}</td>
              <td class="supplier-cell">
                <div class="supplier-info">
                  <img :src="supplier.avatar" :alt="supplier.name" class="supplier-avatar">
                  <div class="supplier-details">
                    <span class="supplier-name">{{ supplier.name }}</span>
                    <span class="supplier-location">{{ supplier.address }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="contact-info">
                  <span class="contact-email">{{ supplier.email }}</span>
                  <span class="contact-phone">{{ supplier.phone }}</span>
                </div>
              </td>
              <td>
                <span class="category-tag">{{ supplier.category }}</span>
              </td>
              <td>
                <div class="order-info">
                  <span class="order-date">{{ supplier.lastOrder.date }}</span>
                  <span class="order-amount">{{ supplier.lastOrder.amount }}€</span>
                </div>
              </td>
              <td>
                <div class="performance-indicator">
                  <div class="progress-bar" :style="{ width: supplier.performance + '%' }"></div>
                  <span>{{ supplier.performance }}%</span>
                </div>
              </td>
              <td>
                <span :class="['status-badge', supplier.status.toLowerCase()]">
                  {{ supplier.status }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="icon-btn" title="Voir détails">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="icon-btn" title="Modifier">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn" title="Plus d'options">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Pagination -->
      <div class="pagination-container">
        <div class="pagination-info">
          {{ selectedSuppliers.length }} sélectionné(s) sur {{ filteredSuppliers.length }} fournisseurs
        </div>
        <div class="pagination-controls">
          <button 
            class="pagination-btn" 
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">
            Page {{ currentPage }} sur {{ totalPages }}
          </span>
          <button 
            class="pagination-btn" 
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="items-per-page">
          <select v-model="itemsPerPage" class="items-select">
            <option :value="5">5 par page</option>
            <option :value="10">10 par page</option>
            <option :value="20">20 par page</option>
            <option :value="50">50 par page</option>
          </select>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        searchTerm: "",
        currentPage: 1,
        itemsPerPage: 10,
        selectedCategory: "",
        selectedStatus: "",
        selectedSuppliers: [],
        selectAll: false,
        suppliers: [
          {
            id: "19855",
            name: "Martin Dupont",
            avatar: "https://ui-avatars.com/api/?name=MD&background=6366f1&color=fff",
            email: "martin.dupont@email.com",
            phone: "+33 6 12 34 56 78",
            address: "Paris, FR",
            category: "Électronique",
            lastOrder: {
              date: "2024-02-15",
              amount: "12,500"
            },
            performance: 92,
            status: "Actif"
          },
          {
            id: "19843",
            name: "Sophie Laurent",
            avatar: "https://ui-avatars.com/api/?name=SL&background=8b5cf6&color=fff",
            email: "sophie.laurent@email.com",
            phone: "+33 6 23 45 67 89",
            address: "Lyon, FR",
            category: "Papeterie",
            lastOrder: {
              date: "2024-02-12",
              amount: "8,750"
            },
            performance: 88,
            status: "En attente"
          },
          {
            id: "19853",
            name: "Pierre Martin",
            avatar: "https://ui-avatars.com/api/?name=PM&background=ec4899&color=fff",
            email: "pierre.martin@email.com",
            phone: "+33 6 34 56 78 90",
            address: "Marseille, FR",
            category: "Mobilier",
            lastOrder: {
              date: "2024-02-10",
              amount: "15,200"
            },
            performance: 95,
            status: "Actif"
          },
          {
            id: "19238",
            name: "Julie Dubois",
            avatar: "https://ui-avatars.com/api/?name=JD&background=f43f5e&color=fff",
            email: "julie.dubois@email.com",
            phone: "+33 6 45 67 89 01",
            address: "Bordeaux, FR",
            category: "Électronique",
            lastOrder: {
              date: "2024-02-08",
              amount: "6,300"
            },
            performance: 78,
            status: "Inactif"
          }
        ]
      };
    },
    computed: {
      categories() {
        return [...new Set(this.suppliers.map(s => s.category))];
      },
      filteredSuppliers() {
        return this.suppliers.filter(supplier => {
          const matchesSearch = this.searchTerm.toLowerCase() === '' || 
            supplier.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            supplier.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            supplier.category.toLowerCase().includes(this.searchTerm.toLowerCase());
  
          const matchesCategory = this.selectedCategory === '' || 
            supplier.category === this.selectedCategory;
  
          const matchesStatus = this.selectedStatus === '' || 
            supplier.status === this.selectedStatus;
  
          return matchesSearch && matchesCategory && matchesStatus;
        });
      },
      paginatedSuppliers() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.filteredSuppliers.slice(start, end);
      },
      totalPages() {
        return Math.ceil(this.filteredSuppliers.length / this.itemsPerPage);
      },
      activeCount() {
        return this.suppliers.filter(s => s.status === "Actif").length;
      },
      pendingCount() {
        return this.suppliers.filter(s => s.status === "En attente").length;
      },
      inactiveCount() {
        return this.suppliers.filter(s => s.status === "Inactif").length;
      }
    },
    methods: {
      toggleSelectAll() {
        if (this.selectAll) {
          this.selectedSuppliers = this.paginatedSuppliers.map(s => s.id);
        } else {
          this.selectedSuppliers = [];
        }
      }
    },
    watch: {
      currentPage() {
        this.selectAll = false;
        this.selectedSuppliers = [];
      }
    }
  };
  </script>
  
  <style scoped>
  .suppliers-container {
    padding: 24px;
    background-color: #f8f9fa;
    min-height: 100vh;
  }
  
  .stats-header {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }
  
  .stat-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .stat-card h3 {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0 0 8px 0;
  }
  
  .stat-value {
    font-size: 1.875rem;
    font-weight: 600;
    color: #111827;
  }
  
  .stat-trend {
    margin-top: 8px;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
  }
  
  .stat-trend.positive { color: #059669; }
  .stat-trend.negative { color: #dc2626; }
  .stat-trend.neutral { color: #6b7280; }
  
  .actions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }
  
  .search-wrapper {
    position: relative;
    flex: 1;
    max-width: 400px;
  }
  
  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
  }
  
  .search-input {
    width: 100%;
    padding: 10px 16px 10px 40px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  .clear-search {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: #6b7280;
  }
  
  .filters {
    display: flex;
    gap: 12px;
  }
  
  .filter-select {
    padding: 8px 32px 8px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #374151;
    background-color: white;
    cursor: pointer;
  }
  
  .action-btn {
    padding: 8px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: white;
    color: #374151;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .action-btn:hover {
    background-color: #f9fafb;
  }
  
  .action-btn.primary {
    background-color: #6366f1;
    color: white;
    border: none;
  }
  
  .action-btn.primary:hover {
    background-color: #4f46e5;
  }
  
  .table-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
    margin-bottom: 24px;
  }
  
  .suppliers-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .suppliers-table th,
  .suppliers-table td {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .suppliers-table th {
    background-color: #f9fafb;
    font-weight: 500;
    color: #6b7280;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .suppliers-table tr:hover {
    background-color: #f9fafb;
  }
  
  .supplier-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .supplier-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
  
  .supplier-details {
    display: flex;
    flex-direction: column;
  }
  
  .supplier-name {
    font-weight: 500;
    color: #111827;
  }
  
  .supplier-location {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .contact-email {
    color: #6366f1;
  }
  
  .contact-phone {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .category-tag {
    background-color: #f3f4f6;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 0.875rem;
    color: #374151;
  }
  
  .order-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .order-date {
    color: #374151;
  }
  
  .order-amount {
    font-size: 0.875rem;
    color: #059669;
    font-weight: 500;
  }
  
  .performance-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .progress-bar {
    height: 4px;
    background-color: #6366f1;
    border-radius: 2px;
  }
  
  .status-badge {
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .status-badge.actif {
    background-color: #dcfce7;
    color: #059669;
  }
  
  .status-badge.inactif {
    background-color: #fee2e2;
    color: #dc2626;
  }
  
  .status-badge.en.attente {
    background-color: #fef3c7;
    color: #d97706;
  }
  
  .actions-cell {
    display: flex;
    gap: 8px;
  }
  
  .icon-btn {
    padding: 6px;
    border: none;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .icon-btn:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
  
  .pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .pagination-info {
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .pagination-btn {
    padding: 6px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: white;
    color: #374151;
    cursor: pointer;
  }
  
  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .page-info {
    color: #374151;
    font-size: 0.875rem;
  }
  
  .items-per-page select {
    padding: 6px 32px 6px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #374151;
    background-color: white;
  }
  
  @media (max-width: 1024px) {
    .actions-bar {
      flex-direction: column;
      align-items: stretch;
    }
  
    .search-wrapper {
      max-width: none;
    }
  
    .right-actions {
      justify-content: flex-end;
    }
  }
  
  @media (max-width: 768px) {
    .stats-header {
      grid-template-columns: 1fr;
    }
  
    .filters {
      flex-wrap: wrap;
    }
  
    .pagination-container {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
      text-align: center;
    }
  }
  </style>