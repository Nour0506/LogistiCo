import { defineStore } from "pinia";
import axios from "axios";

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: "http://localhost:3000/api", // Base URL for all requests
});

export const useSalePointStore = defineStore("salePoint", {
  state: () => ({
    salePoints: [],
    loading: false,
    error: null,
  }),

  actions: {
    async addSalePoint(newSalePoint) {
      try {
        this.loading = true;
        this.error = null;
        console.log("Sending data:", newSalePoint); // Log the data for debugging
        
        // Make the POST request using the configured axios instance
        const response = await api.post("/salepoints/add", newSalePoint);

        // Check if the response contains the expected data
        if (response.data) {
          // Push the new sale point or update the state as needed
          this.salePoints.push(response.data);  // Or refetch all sale points if needed
        }
        await this.fetchSalePoints();

        return response.data;  // Return the response data
      } catch (error) {
        this.error = error.response?.data?.message || "Error adding sales point";
        console.error("Error:", error); // Log the error for debugging
        throw error;
      } finally {
        this.loading = false; // Set loading to false after the request is complete
      }

    },

    // Optional: Fetch all sale points if you need to update the state after adding a new one
    async fetchSalePoints() {
      try {
        this.loading = true;
        this.error = null;
        
        const response = await api.get("/salepoints");

        // Update the state with the fetched sale points
        this.salePoints = response.data;
      } catch (error) {
        this.error = error.response?.data?.message || "Error fetching sales points";
        console.error("Error:", error); // Log the error for debugging
        throw error;
      } finally {
        this.loading = false; // Set loading to false
      }
    },
   
    
    
  },
});
