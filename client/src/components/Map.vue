<template>
    <div>
      <button @click="showLocation">Afficher la localisation</button>
      <div ref="mapContainer" style="height: 400px; width: 100%; margin-top: 20px;"></div>
    </div>
  </template>
  
  <script>
  import { getCompanyAddress } from '../services/api';
  
  export default {
    data() {
      return {
        companyId: "12345", // Remplacez par l'ID de l'entreprise dynamiquement
        map: null,
        marker: null,
      };
    },
    methods: {
      async showLocation() {
        try {
          const address = await getCompanyAddress(this.companyId);
          this.initMap(address);
        } catch (error) {
          alert("Impossible de récupérer l'adresse.");
        }
      },
      initMap(address) {
        const geocoder = new google.maps.Geocoder();
        const mapContainer = this.$refs.mapContainer;
  
        this.map = new google.maps.Map(mapContainer, {
          zoom: 12,
          center: { lat: 0, lng: 0 },
        });
  
        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK" && results[0]) {
            this.map.setCenter(results[0].geometry.location);
            if (this.marker) {
              this.marker.setMap(null);
            }
            this.marker = new google.maps.Marker({
              map: this.map,
              position: results[0].geometry.location,
            });
          } else {
            alert("Impossible de localiser l'adresse: " + status);
          }
        });
      },
    },
    mounted() {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.VUE_APP_GOOGLE_MAPS_API_KEY}&callback=initMap`;
      script.async = true;
      document.head.appendChild(script);
    },
  };
  </script>