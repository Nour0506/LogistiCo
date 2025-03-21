<template>
  
  <div class="container">
    <!-- Header -->
    <h1 class="page-title">Vehicles</h1>
    <p class="page-subtitle">Manage and track your fleet</p>

    <!-- Search Bar -->
    <div class="search-bar">
      <input v-model="search" type="text" placeholder="Search vehicles..." />
      <button class="btn-add">+ Add Vehicle</button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-container">
      <div class="stat">
        <p class="stat-number">8</p>
        <p>Total Vehicles</p>
      </div>
      <div class="stat active">
        <p class="stat-number">6</p>
        <p>Active</p>
      </div>
      <div class="stat maintenance">
        <p class="stat-number">1</p>
        <p>In Maintenance</p>
      </div>
      <div class="stat loading">
        <p class="stat-number">1</p>
        <p>Loading</p>
      </div>
    </div>

    <!-- Vehicles Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Vehicle</th>
            <th>Type</th>
            <th>Driver</th>
            <th>Status</th>
            <th>Location</th>
            <th>Fuel</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(vehicle, index) in filteredVehicles" :key="index">
            <td>{{ vehicle.id }}</td>
            <td class="bold">{{ vehicle.name }}</td>
            <td>{{ vehicle.type }}</td>
            <td>{{ vehicle.driver }}</td>
            <td :class="statusClass(vehicle.status)">{{ vehicle.status }}</td>
            <td>{{ vehicle.location }}</td>
            <td>
              <div class="fuel-bar">
                <div class="fuel" :class="fuelClass(vehicle.fuel)" :style="{ width: vehicle.fuel + '%' }"></div>
              </div>
            </td>
            <td>
              <a href="#" class="action view">View</a> |
              <a href="#" class="action edit">Edit</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "Vehicles",
  data() {
    return {
      search: "",
      vehicles: [
        { id: "V001", name: "Truck 101", type: "Truck", driver: "Jean Dupont", status: "In Transit", location: "48.86, 2.35", fuel: 68 },
        { id: "V002", name: "Delivery Van 202", type: "Van", driver: "Marie Laurent", status: "Available", location: "48.86, 2.29", fuel: 92 },
        { id: "V003", name: "Truck 303", type: "Truck", driver: "Paul Bernard", status: "Loading", location: "45.76, 4.84", fuel: 45 },
        { id: "V004", name: "Cargo Van 404", type: "Van", driver: "Sophie Martin", status: "Maintenance", location: "43.30, 5.37", fuel: 12 },
      ]
    };
  },
  computed: {
    filteredVehicles() {
      return this.vehicles.filter(v =>
        v.name.toLowerCase().includes(this.search.toLowerCase()) ||
        v.driver.toLowerCase().includes(this.search.toLowerCase()) ||
        v.status.toLowerCase().includes(this.search.toLowerCase())
      );
    }
  },
  methods: {
    statusClass(status) {
      return {
        "status in-transit": status === "In Transit",
        "status available": status === "Available",
        "status maintenance": status === "Maintenance",
        "status loading": status === "Loading"
      };
    },
    fuelClass(fuel) {
      if (fuel > 75) return "fuel-green";
      if (fuel > 50) return "fuel-yellow";
      if (fuel > 25) return "fuel-orange";
      return "fuel-red";
    }
  }
};
</script>

<style scoped>
 .container-wrapper {
    display: flex;
    min-height: 100vh;
    width: auto;
  }
  .container {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
}
.page-subtitle {
  font-size: 0.875rem;
  color: #6B7280;
  /* margin-top: 0.25rem; */
}
.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  /* margin: 0; */
  color: #111827;
}

/* Search Bar */
.search-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-bar input {
  width: 30%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.btn-add {
  background: blue;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Stats Cards */
.stats-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.stat {
  flex: 1;
  background: white;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
}

.active { color: green; }
.maintenance { color: orange; }
.loading { color: purple; }

/* Table */
.table-container {
  background: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.bold {
  font-weight: bold;
}

/* Status */
.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.in-transit { background: lightblue; color: blue; }
.available { background: lightgreen; color: green; }
.maintenance { background: lightgoldenrodyellow; color: orange; }
.loading { background: lavender; color: purple; }

/* Fuel Bar */
.fuel-bar {
  width: 80px;
  height: 6px;
  background: #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.fuel {
  height: 100%;
}

.fuel-green { background: green; }
.fuel-yellow { background: yellow; }
.fuel-orange { background: orange; }
.fuel-red { background: red; }

/* Actions */
.action {
  text-decoration: none;
  font-size: 14px;
}


.view { color: blue; }
.edit { color: gray; }
</style>
