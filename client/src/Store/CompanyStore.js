// store/modules/company.js
const state = {
    company: null, // Informations de l'entreprise
  };
  
  const mutations = {
    setCompany(state, company) {
      state.company = company; // Mets à jour l'entreprise dans l'état
    },
  };
  
  const actions = {
    setCompany({ commit }, company) {
      commit('setCompany', company); // Déclenche la mutation pour mettre à jour l'entreprise
    },
  };
  
  const getters = {
    company: (state) => state.company, // Accès aux informations de l'entreprise
  };
  
  export default {
    namespaced: true, // Permet de rendre ce module "namespace" pour éviter les collisions
    state,
    mutations,
    actions,
    getters,
  };
  
