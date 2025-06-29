import axios from 'axios'

const state = () => ({
    company: null,
    warehouses: [],
})

const getters = {
    company: state => state.company,
    warehouses: state => state.warehouses,
}

const actions = {
    async fetchCompany({ commit }) {
        try {
            const response = await axios.get('/api/company') // adapte l'URL
            commit('setCompany', response.data)
        } catch (error) {
            console.error('Erreur API:', error)
        }
    },
    async fetchWarehouses({ commit }) {
        try {
            const response = await axios.get('/api/warehouses') // adapte l'URL
            commit('setWarehouses', response.data)
        } catch (error) {
            console.error('Erreur API:', error)
        }
    }
}

const mutations = {
    setCompany(state, company) {
        state.company = company
    },
    setWarehouses(state, warehouses) {
        state.warehouses = warehouses
    }
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
