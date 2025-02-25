<template>
  <div>
    <HeaderPage />
    <Banner />
    <SectionOne />
    <SectionTwo />
    <FooterPage />
    <ContactSection />
  </div>
</template>

<script lang="ts">
import Header from '../components/HomeEntreprise/Header.vue'
import Banner from '../components/HomeEntreprise/Banner.vue'
import SectionOne from '../components/HomeEntreprise/SectionOne.vue'
import SectionTwo from '../components/HomeEntreprise/SectionTwo.vue'
import Contact from '../components/HomeEntreprise/Contact.vue'
import Footer from '../components/HomeEntreprise/Footer.vue'

export default {
  components: {
    HeaderPage: Header,
    Banner,
    SectionOne,
    SectionTwo,
    ContactSection: Contact,
    FooterPage: Footer,
  },
}
</script>

<style scoped>
/* Styles spécifiques pour HomeEntreprise */
</style>
