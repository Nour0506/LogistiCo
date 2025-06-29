import { createStore } from 'vuex'
import auth from './auth'
import company from './CompanyStore'

const store = createStore({
    modules: {
        auth,
        company
    }
})

export default store
