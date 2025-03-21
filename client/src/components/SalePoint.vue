<template>
  <div class="vue-app">
    <div class="container">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="page-title">Sales Points</h1>
          <p class="page-subtitle">Manage retail and distribution locations</p>
        </div>
        <button class="button-primary button-add" @click="handleAlertClick">
          <span class="plus-icon">+</span>
          Add Sales Point
        </button>
      </div>

      <div class="filter-container">
        <div class="search-wrapper">
          <input
            type="text"
            class="search-input"
            placeholder="Search locations..."
            v-model="searchTerm"
          />
        </div>
        <div class="flex gap-2">
          <button class="button-filter">
            <i class="fas fa-filter"></i>
            Filter
          </button>
          <button class="button-filter" @click="fetchAllSalePoints">All Types</button>
          <button class="button-filter">Status</button>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>TYPE</th>
              <th>ADDRESS</th>
              <th>STATUS</th>
              <th>LOCATION</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="point in salePoints" :key="point.id">
              <td>
                <div class="flex items-center">
                  <div class="store-icon">🏪</div>
                  <div>
                    <div class="point-name">{{ point.name }}</div>
                    <div class="point-id">{{ point.id }}</div>
                  </div>
                </div>
              </td>
              <td>{{ point.type }}</td>
              <td>{{ point.address }}</td>
              <td>
                <span :class="getStatusClass(point.status)">{{ point.status }}</span>
              </td>
              <td>
                <button class="map-button">
                  <span class="map-icon">📍</span>
                  Map
                </button>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="action-button view-button">View</button>
                  <button class="action-button edit-button" @click="handleEditClick(point)">Edit</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <p class="results-info">Showing 1 to {{ salePoints.length }} of {{ salePoints.length }} results</p>
        <div class="pagination-buttons">
          <button class="pagination-button" disabled>Previous</button>
          <button class="pagination-button" disabled>Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useSalePointStore } from "../Store/adminStore";
import Swal from "sweetalert2";
import salePointService from '../services/SalePointService';

export default {
  data() {
    return {
      salePoints: [], // Liste des points de vente
      searchTerm: '', // Terme de recherche (optionnel pour un futur filtre)
    };
  },
  methods: {
    async loadSalePoints() {
      try {
        const response = await salePointService.fetchSalePoints();
        this.salePoints = response.data; // Charge les points de vente
      } catch (error) {
        console.error('Erreur lors du chargement des points de vente :', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors du chargement des points de vente.',
        });
      }
    },
    getStatusClass(status) {
      switch (status) {
        case 'Open':
          return 'status-open';
        case 'Closed':
          return 'status-closed';
        case 'Limited':
          return 'status-limited';
        default:
          return '';
      }
    },
    handleAlertClick() {
  Swal.fire({
    title: 'Nouveau Point de Vente',
    width: '600px',
    padding: '0',
    html: `
      <div class="form-container">
        <div class="form-section">
          <div class="input-group">
            <i class="fas fa-store input-icon"></i>
            <input 
              id="name" 
              class="form-input" 
              placeholder="Nom du point de vente"
            >
          </div>
          
          <div class="input-group">
            <i class="fas fa-tag input-icon"></i>
            <select id="type" class="form-input">
              <option value="" disabled selected>Type de point de vente</option>
              <option value="Store">Magasin</option>
              <option value="Pickup Point">Point de retrait</option>
              <option value="Distribution Center">Centre de distribution</option>
            </select>
          </div>
          
          <div class="input-group">
            <i class="fas fa-map-marker-alt input-icon"></i>
            <input 
              id="address" 
              class="form-input" 
              placeholder="Adresse complète"
            >
          </div>
          
          <div class="input-group">
            <i class="fas fa-circle-dot input-icon"></i>
            <select id="status" class="form-input">
              <option value="" disabled selected>Statut</option>
              <option value="Open">Ouvert</option>
              <option value="Closed">Fermé</option>
              <option value="Limited Hours">Horaires limités</option>
            </select>
          </div>
          
          <div class="input-group">
            <i class="fas fa-location-dot input-icon"></i>
            <input 
              id="location" 
              class="form-input" 
              placeholder="Coordonnées GPS"
            >
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Ajouter',
    cancelButtonText: 'Annuler',
    customClass: {
      popup: 'custom-popup',
      title: 'custom-title',
      htmlContainer: 'custom-html-container',
      confirmButton: 'custom-confirm-button',
      cancelButton: 'custom-cancel-button',
      validationMessage: 'custom-validation'
    },
    didOpen: () => {
      const style = document.createElement('style');
      style.textContent = `
        .custom-popup {
          border-radius: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .custom-title {
          padding: 1.5rem;
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .custom-html-container {
          padding: 0 !important;
          margin: 0 !important;
        }
        
        .form-container {
          padding: 1.5rem;
        }
        
        .form-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .input-icon {
          position: absolute;
          left: 1rem;
          color: #6b7280;
          font-size: 1rem;
        }
        
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #1f2937;
          background-color: #fff;
          transition: all 0.2s ease;
        }
        
        .form-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          outline: none;
        }
        
        .form-input::placeholder {
          color: #9ca3af;
        }
        
        select.form-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.75rem center;
          background-repeat: no-repeat;
          background-size: 1.25rem;
          padding-right: 2.5rem;
        }
        
        .swal2-actions {
          padding: 1.25rem;
          border-top: 1px solid #e5e7eb;
          gap: 0.75rem;
        }
        
        .custom-confirm-button {
          padding: 0.625rem 1.5rem !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          background-color: #6366f1 !important;
          border-radius: 8px !important;
        }
        
        .custom-confirm-button:hover {
          background-color: #4f46e5 !important;
        }
        
        .custom-cancel-button {
          padding: 0.625rem 1.5rem !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          color: #374151 !important;
          background-color: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
        }
        
        .custom-cancel-button:hover {
          background-color: #f9fafb !important;
        }
        
        .custom-validation {
          margin-top: 1rem !important;
          padding: 0.75rem !important;
          border-radius: 8px !important;
          background-color: #fee2e2 !important;
          color: #991b1b !important;
          font-size: 0.875rem !important;
        }
      `;
      document.head.appendChild(style);
    },
    preConfirm: () => {
      const name = Swal.getPopup().querySelector('#name').value;
      const type = Swal.getPopup().querySelector('#type').value;
      const address = Swal.getPopup().querySelector('#address').value;
      const status = Swal.getPopup().querySelector('#status').value;
      const location = Swal.getPopup().querySelector('#location').value;

      if (!name || !type || !address || !status || !location) {
        Swal.showValidationMessage('Veuillez remplir tous les champs');
        return false;
      }

      return { name, type, address, status, location };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const newSalePoint = result.value;
      // Ajouter le point de vente à votre liste
      
      Swal.fire({
        icon: 'success',
        title: 'Point de vente ajouté',
        text: 'Le point de vente a été créé avec succès',
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: 'custom-popup',
          title: 'custom-title'
        }
      });
    }
  });
  },
  async addSalePoint(newSalePoint) {
    try {
      await salePointService.addSalePoint(newSalePoint);
      this.loadSalePoints(); // Recharger la liste des points de vente

      Swal.fire({
        icon: 'success',
        title: 'Point de vente ajouté',
        text: 'Le point de vente a été ajouté avec succès.',
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du point de vente :', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Une erreur est survenue lors de l\'ajout du point de vente.',
      });
    }},
//     handleEditClick(point) {
//   Swal.fire({
//     title: 'Modifier le point de vente',
//     html:
//       `<input id="name" class="swal2-input" placeholder="Nom" value="${point.name}">` +
//       `<input id="type" class="swal2-input" placeholder="Type" value="${point.type}">` +
//       `<input id="address" class="swal2-input" placeholder="Adresse" value="${point.address}">` +
//       `<input id="status" class="swal2-input" placeholder="Statut" value="${point.status}">` +
//       `<input id="location" class="swal2-input" placeholder="Localisation" value="${point.location}">`,
//     focusConfirm: false,
//     preConfirm: () => {
//       const name = Swal.getPopup().querySelector('#name').value;
//       const type = Swal.getPopup().querySelector('#type').value;
//       const address = Swal.getPopup().querySelector('#address').value;
//       const status = Swal.getPopup().querySelector('#status').value;
//       const location = Swal.getPopup().querySelector('#location').value;

//       if (!name || !type || !address || !status || !location) {
//         Swal.showValidationMessage('Veuillez remplir tous les champs');
//         return false;
//       }

//       return { id: point.id, name, type, address, status, location };
//     },
//   }).then((result) => {
//     if (result.isConfirmed) {
//       const updatedData = result.value;
//       this.updateSalePoint(updatedData); // Appeler la méthode pour mettre à jour le point de vente
//     }
//   });
// },
  async updateSalePoint(updatedData) {
    try {
      await salePointService.updateSalePoint(updatedData.id, updatedData);
      this.loadSalePoints(); // Recharger la liste des points de vente

      Swal.fire({
        icon: 'success',
        title: 'Point de vente modifié',
        text: 'Le point de vente a été modifié avec succès.',
      });
    } catch (error) {
      console.error('Erreur lors de la modification du point de vente :', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Une erreur est survenue lors de la modification du point de vente.',
      });
    }
  },
  
    fetchAllSalePoints() {
      // Logique pour récupérer tous les points de vente
      this.loadSalePoints();
    },
  },
  mounted() {
    this.loadSalePoints(); // Charge les points de vente au montage du composant
  },
};



    // Ajouter un point de vente
  //   async addSalePoint() {
  //     try {
  //       await salePointService.addSalePoint(this.newSalePoint);
  //       this.newSalePoint = { name: '', type: '', address: '', status: '', location: '' }; // Réinitialiser le formulaire
  //       this.loadSalePoints(); // Recharger la liste

  //       // Afficher une alerte de succès
  //       Swal.fire({
  //         icon: 'success',
  //         title: 'Point de vente ajouté',
  //         text: 'Le point de vente a été ajouté avec succès.',
  //       });
  //     } catch (error) {
  //       console.error('Erreur lors de l\'ajout du point de vente :', error);

  //       // Afficher une alerte d'erreur
  //       Swal.fire({
  //         icon: 'error',
  //         title: 'Erreur',
  //         text: 'Une erreur est survenue lors de l\'ajout du point de vente.',
  //       });
  //     }
  //   },

  //   // Modifier un point de vente
  //   async editSalePoint(id, updatedData) {
  //     try {
  //       await salePointService.updateSalePoint(id, updatedData);
  //       this.loadSalePoints();

  //       // Afficher une alerte de succès
  //       Swal.fire({
  //         icon: 'success',
  //         title: 'Point de vente modifié',
  //         text: 'Le point de vente a été modifié avec succès.',
  //       });
  //     } catch (error) {
  //       console.error('Erreur lors de la modification du point de vente :', error);

  //       // Afficher une alerte d'erreur
  //       Swal.fire({
  //         icon: 'error',
  //         title: 'Erreur',
  //         text: 'Une erreur est survenue lors de la modification du point de vente.',
  //       });
  //     }
  //   },

  //   // Supprimer un point de vente
  //   async removeSalePoint(id) {
  //     // Afficher une alerte de confirmation avant de supprimer
  //     const result = await Swal.fire({
  //       icon: 'warning',
  //       title: 'Êtes-vous sûr ?',
  //       text: 'Êtes-vous sûr de vouloir supprimer ce point de vente ?',
  //       showCancelButton: true,
  //       confirmButtonText: 'Supprimer',
  //       cancelButtonText: 'Annuler',
  //     });

  //     if (result.isConfirmed) {
  //       try {
  //         await salePointService.deleteSalePoint(id);
  //         this.loadSalePoints();

  //         // Afficher une alerte de succès après suppression
  //         Swal.fire({
  //           icon: 'success',
  //           title: 'Point de vente supprimé',
  //           text: 'Le point de vente a été supprimé avec succès.',
  //         });
  //       } catch (error) {
  //         console.error('Erreur lors de la suppression du point de vente :', error);

  //         // Afficher une alerte d'erreur
  //         Swal.fire({
  //           icon: 'error',
  //           title: 'Erreur',
  //           text: 'Une erreur est survenue lors de la suppression du point de vente.',
  //         });
  //       }
  //     }
  //   }
  // },
 
</script>

<style scoped>
.vue-app {
  font-family: "Inter", sans-serif;
  color: #333;
  background-color: white;
  min-height: 100vh;
  padding: 2rem 0;
  display: flex;
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
  margin: 0;
  color: #111827;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.button-primary {
  background-color: #2563eb;
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
  background-color: #1d4ed8;
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
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
}

.search-input:focus {
  border-color: #2563eb;
}

.button-filter {
  padding: 0.625rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.button-filter:hover {
  background-color: #f9fafb;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 0.5rem;
}

.table-container {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 500;
  font-size: 0.75rem;
  color: #6b7280;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  text-transform: uppercase;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.data-table tr:hover {
  background-color: #f9fafb;
}

.store-icon {
  height: 2rem;
  width: 2rem;
  border-radius: 9999px;
  background-color: #ecfdf5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  margin-right: 0.75rem;
}

.point-name {
  font-weight: 500;
}

.point-id {
  font-size: 0.75rem;
  color: #6b7280;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-open {
  background-color: #dcfce7;
  color: #166534;
}

.status-closed {
  background-color: #fee2e2;
  color: #b91c1c;
}

.status-limited {
  background-color: #fef3c7;
  color: #92400e;
}

.map-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.map-button:hover {
  background-color: #f9fafb;
}

.map-icon {
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  border-radius: 0.25rem;
}

.view-button {
  color: #2563eb;
}

.edit-button {
  color: #6b7280;
}

.action-button:hover {
  background-color: #f3f4f6;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
}

.results-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.pagination-buttons {
  display: flex;
  gap: 0.5rem;
}

.pagination-button {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  font-size: 0.875rem;
  cursor: pointer;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f9fafb;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
/* Style de base pour tous les champs (input et select) */
.swal2-input, .swal2-select {
  width: 100%;
  padding: 12px; /* Augmenter le padding pour plus d'espace */
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 8px; /* Coins plus arrondis */
  font-size: 16px;
  color: #333; /* Couleur de texte plus foncée */
  background-color: #fff;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-sizing: border-box; /* Inclure le padding dans la largeur */
  font-family: 'Arial', sans-serif; /* Police uniforme */
}

/* Style au focus */
.swal2-input:focus, .swal2-select:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.3); /* Ombre plus douce */
}

/* Style spécifique pour les listes déroulantes */
.swal2-select {
  appearance: none; /* Supprime le style par défaut du navigateur */
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E"); /* Flèche personnalisée */
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 14px;
  cursor: pointer; /* Curseur pointer pour indiquer que c'est cliquable */
}

/* Style de base pour tous les champs (input et select) */
.swal2-input, .swal2-select {
  width: 100%; /* Largeur identique */
  padding: 12px; /* Padding identique */
  margin: 10px 0; /* Marge identique */
  border: 1px solid #ccc; /* Bordure identique */
  border-radius: 8px; /* Coins arrondis identiques */
  font-size: 16px; /* Taille de police identique */
  color: #333; /* Couleur de texte identique */
  background-color: #fff; /* Fond identique */
  transition: border-color 0.3s ease, box-shadow 0.3s ease; /* Transition identique */
  box-sizing: border-box; /* Inclure le padding dans la largeur */
  font-family: 'Arial', sans-serif; /* Police identique */
  height: 48px; /* Hauteur fixe pour tous les champs */
}

/* Style au focus */
.swal2-input:focus, .swal2-select:focus {
  border-color: #007bff; /* Bordure bleue au focus */
  outline: none; /* Supprimer le contour par défaut */
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.3); /* Ombre douce au focus */
}

/* Style spécifique pour les listes déroulantes */
.swal2-select {
  appearance: none; /* Supprimer le style par défaut du navigateur */
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E"); /* Flèche personnalisée */
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 14px;
  cursor: pointer; /* Curseur pointer pour indiquer que c'est cliquable */
}

/* Style pour les options des listes déroulantes */
.swal2-select option {
  padding: 10px;
  font-size: 16px;
  background-color: #fff;
  color: #333;
}
</style>
