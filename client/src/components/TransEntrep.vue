<template>
  <div class="vue-app">
    <div class="container">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="page-title">Transporters</h1>
          <p class="page-subtitle">Partner companies and service providers</p>
        </div>
        <button class="button-primary button-add">
          <span class="plus-icon">+</span>
          Add Transporter
        </button>
      </div>

      <div class="filter-container">
        <div class="search-wrapper">
          <input
            type="text"
            class="search-input"
            placeholder="Search transporters..."
            v-model="searchTerm"
          />
        </div>
        <div class="flex gap-2">
          <button class="button-filter">
            <span class="filter-icon">⚙️</span>
            Filter
          </button>
          <button class="button-filter">All Statuses</button>
        </div>
      </div>

      <div class="grid-container">
        <div v-for="transporter in filteredTransporters" :key="transporter.id" class="card">
          <div class="flex justify-between items-start">
            <div class="flex items-start gap-3">
              <div class="user-icon">👤</div>
              <div>
                <h3 class="transporter-name">{{ transporter.name }}</h3>
                <p class="transporter-id">ID: {{ transporter.id }}</p>
              </div>
            </div>
            <span :class="getStatusClass(transporter.status)">{{ transporter.status }}</span>
          </div>

          <div class="contact-info">
            <p class="contact-label">Contact Person:</p>
            <p class="contact-name">{{ transporter.contactPerson }}</p>
            
            <div class="contact-item">
              <span class="email-icon">✉️</span>
              <a :href="'mailto:' + transporter.email" class="link">{{ transporter.email }}</a>
            </div>
            
            <div class="contact-item">
              <span class="phone-icon">📱</span>
              <p>{{ transporter.phone }}</p>
            </div>
          </div>

          <div class="metrics-container">
            <div class="metric-box">
              <p class="metric-label">Active Vehicles</p>
              <p class="metric-value">{{ transporter.activeVehicles }}</p>
            </div>
            <div class="metric-box">
              <p class="metric-label">Performance Score</p>
              <p :class="getScoreClass(transporter.performanceScore)">{{ transporter.performanceScore }}%</p>
            </div>
          </div>

          <div class="card-footer">
            <div class="performance-link">
              <span class="chart-icon">📊</span>
              <span>Performance</span>
            </div>
            <button class="details-button">View Details</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Transporters',
  data() {
    return {
      searchTerm: '',
      transporters: [
        {
          id: "T001",
          name: "TransFrance Logistics",
          contactPerson: "Pierre Martin",
          email: "pierre.martin@transfrance.com",
          phone: "+33 1 23 45 67 89",
          activeVehicles: 15,
          performanceScore: 92,
          status: "Active"
        },
        {
          id: "T002",
          name: "Rapid Delivery Services",
          contactPerson: "Isabelle Dubois",
          email: "i.dubois@rapiddelivery.fr",
          phone: "+33 6 12 34 56 78",
          activeVehicles: 8,
          performanceScore: 87,
          status: "Active"
        },
        {
          id: "T003",
          name: "EuroTrans",
          contactPerson: "Jacques Lefevre",
          email: "j.lefevre@eurotrans.eu",
          phone: "+33 4 56 78 90 12",
          activeVehicles: 22,
          performanceScore: 95,
          status: "Active"
        },
        {
          id: "T004",
          name: "South Freight Co.",
          contactPerson: "Marie Moreau",
          email: "marie.m@southfreight.com",
          phone: "+33 7 89 01 23 45",
          activeVehicles: 0,
          performanceScore: 79,
          status: "Inactive"
        },
        {
          id: "T005",
          name: "AlpineRoutes",
          contactPerson: "Thomas Bernard",
          email: "t.bernard@alpineroutes.fr",
          phone: "+33 5 67 89 01 23",
          activeVehicles: 5,
          performanceScore: 88,
          status: "On Hold"
        }
      ]
    };
  },
  computed: {
    filteredTransporters() {
      return this.transporters.filter(transporter => 
        transporter.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        transporter.id.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  },
  methods: {
    getStatusClass(status) {
      switch (status) {
        case "Active": return "status-badge status-active";
        case "Inactive": return "status-badge status-inactive";
        case "On Hold": return "status-badge status-onhold";
        default: return "status-badge";
      }
    },
    getScoreClass(score) {
      if (score >= 90) return "performance-score score-high";
      if (score >= 80) return "performance-score score-medium";
      return "performance-score score-low";
    }
  }
};
</script>

<style scoped>
.vue-app {
  font-family: 'Inter', sans-serif;
  color: #333;
  background-color: white;
  min-height: 100vh;
  padding: 2rem 0;
}

.container {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  /* margin: 0; */
  color: #111827;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6B7280;
  margin-top: 0.25rem;
}

.button-primary {
  background-color: #2563EB;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.625rem 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-primary:hover {
  background-color: #1D4ED8;
}

.button-add {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.plus-icon {
  font-size: 1rem;
  font-weight: bold;
}

.filter-container {
  display: flex;
  justify-content: space-between;
  margin: 1.5rem 0;
}

.search-input {
  width: 18rem;
  padding: 0.625rem 1rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
}

.search-input:focus {
  border-color: #2563EB;
}

.button-filter {
  padding: 0.625rem 1rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  background-color: white;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.button-filter:hover {
  background-color: #F9FAFB;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
  border: 1px solid #E5E7EB;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-start {
  align-items: flex-start;
}

.gap-3 {
  gap: 0.75rem;
}

.user-icon {
  height: 2.5rem;
  width: 2.5rem;
  border-radius: 9999px;
  background-color: #EFF6FF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.transporter-name {
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0;
}

.transporter-id {
  font-size: 0.875rem;
  color: #6B7280;
  margin: 0.25rem 0 0 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-active {
  background-color: #DCFCE7;
  color: #166534;
}

.status-inactive {
  background-color: #F3F4F6;
  color: #4B5563;
}

.status-onhold {
  background-color: #FEF3C7;
  color: #92400E;
}

.contact-info {
  margin-top: 1rem;
}

.contact-label {
  font-size: 0.875rem;
  color: #6B7280;
  margin: 0;
}

.contact-name {
  font-weight: 500;
  margin: 0.25rem 0 0.5rem 0;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

.email-icon, .phone-icon {
  font-size: 0.875rem;
}

.link {
  color: #2563EB;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.metrics-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1.5rem;
}

.metric-box {
  background-color: #F9FAFB;
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.metric-label {
  font-size: 0.75rem;
  color: #6B7280;
  margin: 0;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0.25rem 0 0 0;
}

.performance-score {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0.25rem 0 0 0;
}

.score-high {
  color: #059669;
}

.score-medium {
  color: #D97706;
}

.score-low {
  color: #DC2626;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
}

.performance-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6B7280;
}

.chart-icon {
  font-size: 1rem;
}

.details-button {
  background-color: white;
  border: 1px solid #E5E7EB;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.details-button:hover {
  background-color: #F9FAFB;
}
</style>
