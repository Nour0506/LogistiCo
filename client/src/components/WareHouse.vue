<template>
  <div class="warehouse-container">
    <!-- En-tête avec statistiques -->
    <div class="stats-header">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-warehouse"></i>
        </div>
        <div class="stat-content">
          <h3>Total Entrepôts</h3>
          <div class="stat-value">{{ warehouses.length }}</div>
          <div class="stat-trend positive">
            <i class="fas fa-arrow-up"></i> +2 ce mois
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-box"></i>
        </div>
        <div class="stat-content">
          <h3>Capacité Totale</h3>
          <div class="stat-value">{{ totalCapacity }}</div>
          <div class="stat-trend neutral">
            <i class="fas fa-minus"></i> Stable
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-cubes"></i>
        </div>
        <div class="stat-content">
          <h3>Stock Total</h3>
          <div class="stat-value">{{ totalStock }}</div>
          <div class="stat-trend positive">
            <i class="fas fa-arrow-up"></i> +15% ce mois
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chart-pie"></i>
        </div>
        <div class="stat-content">
          <h3>Taux d'Occupation</h3>
          <div class="stat-value">{{ averageOccupancy }}%</div>
          <div class="stat-trend" :class="occupancyTrendClass">
            <i :class="occupancyTrendIcon"></i> {{ occupancyTrendText }}
          </div>
        </div>
      </div>
    </div>


    <!-- Barre d'actions -->
    <div class="actions-bar">
      <div class="search-wrapper">
        <i class="fas fa-search search-icon"></i>
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="Rechercher par nom, adresse..."
          class="search-input"
        >
        <span v-if="searchTerm" class="clear-search" @click="searchTerm = ''">
          <i class="fas fa-times"></i>
        </span>
      </div>

      <div class="filters">
        <select v-model="statusFilter" class="filter-select">
          <option value="">Tous les statuts</option>
          <option value="Operational">Opérationnel</option>
          <option value="Maintenance">En maintenance</option>
          <option value="Understaffed">Sous-effectif</option>
        </select>

        <select v-model="sortBy" class="filter-select">
          <option value="name">Nom</option>
          <option value="occupancy">Occupation</option>
          <option value="capacity">Capacité</option>
        </select>
      </div>

      <button class="action-btn primary" @click="showAddWarehouse = true">
        <i class="fas fa-plus"></i>
        Nouvel Entrepôt
      </button>
    </div>

    <!-- Grille des entrepôts -->
    <div class="warehouse-grid">
      <div v-for="warehouse in sortedWarehouses" 
           :key="warehouse.id" 
           class="warehouse-card"
           :class="{ 'high-occupancy': warehouse.occupancy > 90 }">
        <div class="card-header">
          <div class="warehouse-icon">
            <i class="fas fa-warehouse"></i>
          </div>
          <div class="warehouse-info">
            <h3>{{ warehouse.name }}</h3>
            <span class="warehouse-id">{{ warehouse.id }}</span>
          </div>
          <div class="card-actions">
            <button class="icon-button" title="Éditer">
              <i class="fas fa-edit"></i>
            </button>
            <button class="icon-button" title="Plus d'options">
              <i class="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>

        <div class="card-body">
          <div class="location-info">
            <i class="fas fa-location-dot location-icon"></i>
            <span>{{ warehouse.address }}</span>
          </div>

          <div class="status-section">
            <span :class="['status-badge', getStatusClasses(warehouse.status)]">
              <span class="status-dot" :class="getStatusDotClass(warehouse.status)"></span>
              {{ warehouse.status }}
            </span>
          </div>

          <div class="capacity-section">
            <div class="capacity-header">
              <span>Capacité d'occupation</span>
              <span class="capacity-value">{{ warehouse.currentStock }} / {{ warehouse.capacity }}</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: warehouse.occupancy + '%' }"
                  :class="getOccupancyColorClass(warehouse.occupancy)"
                ></div>
              </div>
              <span class="occupancy-percentage">{{ warehouse.occupancy }}%</span>
            </div>
          </div>

          <div class="metrics-grid">
            <div class="metric-item">
              <span class="metric-label">Entrées aujourd'hui</span>
              <span class="metric-value">{{ warehouse.dailyIn || 0 }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Sorties aujourd'hui</span>
              <span class="metric-value">{{ warehouse.dailyOut || 0 }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Température</span>
              <span class="metric-value">{{ warehouse.temperature || '20°C' }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Humidité</span>
              <span class="metric-value">{{ warehouse.humidity || '45%' }}</span>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <button class="details-button">
            <i class="fas fa-eye"></i>
            <span>Voir les détails</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchTerm: '',
      statusFilter: '',
      sortBy: 'name',
      showAddWarehouse: false,
      warehouses: [
        { 
          id: "W001", 
          name: "Paris Central Warehouse", 
          address: "123 Rue de Rivoli, 75001 Paris", 
          status: "Operational", 
          currentStock: 3800, 
          capacity: 5000, 
          occupancy: 76,
          dailyIn: 245,
          dailyOut: 189,
          temperature: "18°C",
          humidity: "42%"
        },
        { 
          id: "W002", 
          name: "Lyon Distribution Center", 
          address: "456 Avenue Jean Jaurès, 69007 Lyon", 
          status: "Operational", 
          currentStock: 2200, 
          capacity: 3500, 
          occupancy: 63,
          dailyIn: 156,
          dailyOut: 142,
          temperature: "19°C",
          humidity: "45%"
        },
        { 
          id: "W003", 
          name: "Marseille Coastal Warehouse", 
          address: "789 Boulevard du Littoral, 13002 Marseille", 
          status: "Understaffed", 
          currentStock: 3900, 
          capacity: 4000, 
          occupancy: 98,
          dailyIn: 89,
          dailyOut: 95,
          temperature: "22°C",
          humidity: "58%"
        },
        { 
          id: "W004", 
          name: "Toulouse Logistics Hub", 
          address: "101 Rue du Taur, 31000 Toulouse", 
          status: "Operational", 
          currentStock: 1800, 
          capacity: 3000, 
          occupancy: 60,
          dailyIn: 178,
          dailyOut: 165,
          temperature: "20°C",
          humidity: "44%"
        },
        { 
          id: "W005", 
          name: "Bordeaux Storage Facility", 
          address: "202 Cours de la Marne, 33800 Bordeaux", 
          status: "Maintenance", 
          currentStock: 1000, 
          capacity: 2500, 
          occupancy: 40,
          dailyIn: 0,
          dailyOut: 0,
          temperature: "21°C",
          humidity: "46%"
        }
      ]
    }
  },
  computed: {
    filteredWarehouses() {
      return this.warehouses.filter(warehouse => {
        const matchesSearch = warehouse.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                            warehouse.address.toLowerCase().includes(this.searchTerm.toLowerCase());
        const matchesStatus = !this.statusFilter || warehouse.status === this.statusFilter;
        return matchesSearch && matchesStatus;
      });
    },
    sortedWarehouses() {
      return [...this.filteredWarehouses].sort((a, b) => {
        if (this.sortBy === 'occupancy') return b.occupancy - a.occupancy;
        if (this.sortBy === 'capacity') return b.capacity - a.capacity;
        return a.name.localeCompare(b.name);
      });
    },
    totalCapacity() {
      return this.warehouses.reduce((sum, w) => sum + w.capacity, 0).toLocaleString();
    },
    totalStock() {
      return this.warehouses.reduce((sum, w) => sum + w.currentStock, 0).toLocaleString();
    },
    averageOccupancy() {
      return Math.round(this.warehouses.reduce((sum, w) => sum + w.occupancy, 0) / this.warehouses.length);
    },
    occupancyTrendClass() {
      return this.averageOccupancy > 80 ? 'negative' : this.averageOccupancy > 60 ? 'neutral' : 'positive';
    },
    occupancyTrendIcon() {
      return this.averageOccupancy > 80 ? 'fas fa-arrow-up' : 
             this.averageOccupancy > 60 ? 'fas fa-minus' : 'fas fa-arrow-down';
    },
    occupancyTrendText() {
      return this.averageOccupancy > 80 ? 'Critique' : 
             this.averageOccupancy > 60 ? 'Normal' : 'Optimal';
    }
  },
  methods: {
    getStatusClasses(status) {
      switch (status) {
        case 'Operational':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'Maintenance':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Understaffed':
          return 'bg-red-100 text-red-800 border-red-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    },
    getStatusDotClass(status) {
      switch (status) {
        case 'Operational': return 'bg-green-500';
        case 'Maintenance': return 'bg-yellow-500';
        case 'Understaffed': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    },
    getOccupancyColorClass(occupancy) {
      if (occupancy > 90) return 'bg-red-500';
      if (occupancy > 75) return 'bg-yellow-500';
      return 'bg-green-500';
    }
  }
}
</script>

<style scoped>
.warehouse-container {
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
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #e0e7ff;
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.stat-content {
  flex: 1;
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
  line-height: 1;
}

.stat-trend {
  margin-top: 8px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 4px;
}
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

.action-btn.primary {
  background-color: #6366f1;
  color: white;
  border: none;
}

.action-btn.primary:hover {
  background-color: #4f46e5;
}

.warehouse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.warehouse-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.warehouse-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* .warehouse-card.high-occupancy {
  border-color: #dc2626;
} */

.card-header {
  padding: 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
}

.warehouse-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #e0e7ff;
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.warehouse-info {
  flex: 1;
}

.warehouse-info h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.warehouse-id {
  font-size: 0.875rem;
  color: #6b7280;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.icon-button {
  padding: 8px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.icon-button:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.card-body {
  padding: 16px;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 16px;
}

.location-icon {
  color: #6366f1;
}

.status-section {
  margin-bottom: 16px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

.capacity-section {
  margin-bottom: 16px;
}

.capacity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.875rem;
  color: #6b7280;
}

.capacity-value {
  font-weight: 500;
  color: #374151;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.occupancy-percentage {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  min-width: 48px;
  text-align: right;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.metric-item {
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.card-footer {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.details-button {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6366f1;
  font-size: 0.875rem;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.details-button:hover {
  color: #4f46e5;
}

@media (max-width: 1024px) {
  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    max-width: none;
  }

  .filters {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .stats-header {
    grid-template-columns: 1fr;
  }

  .warehouse-grid {
    grid-template-columns: 1fr;
  }
}
</style>