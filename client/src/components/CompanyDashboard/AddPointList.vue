<template>
    <div class="modal-overlay">
      <div class="modal-content">
        <h2>Add Sales Point</h2>
        <form @submit.prevent="addSalePoint">
          <label>Name:</label>
          <input type="text" v-model="newPoint.name" required />
  
          <label>Type:</label>
          <select v-model="newPoint.type" required>
            <option value="Store">Store</option>
            <option value="Pickup Point">Pickup Point</option>
            <option value="Distribution Center">Distribution Center</option>
          </select>
  
          <label>Address:</label>
          <input type="text" v-model="newPoint.address" required />
  
          <label>Status:</label>
          <select v-model="newPoint.status" required>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Limited Hours">Limited Hours</option>
          </select>
  
          <div class="modal-buttons">
            <button type="submit" class="button-primary">Add</button>
            <button type="button" class="button-secondary" @click="$emit('close')">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import Swal from "sweetalert2";
  import axios from "axios";
  
  export default {
    data() {
      return {
        newPoint: {
          name: "",
          type: "Store",
          address: "",
          status: "Open"
        }
      };
    },
    methods: {
      async addSalePoint() {
        try {
          await axios.post("http://localhost:5000/api/salePoints", this.newPoint);
          Swal.fire("Success", "Point de vente ajouté !", "success");
          this.$emit("added");
          this.$emit("close");
        } catch (error) {
          console.error("Erreur lors de l'ajout :", error);
          Swal.fire("Error", "Échec de l'ajout", "error");
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 400px;
    text-align: center;
  }
  
  .modal-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
  }
  
  .button-primary {
    background-color: #2563EB;
    color: white;
    border: none;
    padding: 10px 15px;
    cursor: pointer;
    border-radius: 5px;
  }
  
  .button-secondary {
    background-color: #ccc;
    border: none;
    padding: 10px 15px;
    cursor: pointer;
    border-radius: 5px;
  }
  </style>
  