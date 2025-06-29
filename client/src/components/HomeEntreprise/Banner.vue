<template>
  <section id="banner">
    <!-- Background Video -->
    <video autoplay loop muted playsinline class="background-video">
      <source src="../../assets/Video/background.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>

    <!-- Content -->
    <div class="inner">
      <h1>Welcome to LogistiCO!</h1>
      <p>Simplifying storage, streamlining operations, and optimizing your business.</p>
    </div>
  </section>
</template>

<script lang="ts">
export default {
  name: 'BannerPage',
}
</script>

<style scoped>
/* Banner Section */
#banner {
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 0;
  min-height: 100vh;
  width: 100%;
  position: relative;
  text-align: center;
  overflow: hidden;
  background-color: white;
}

/* Background Video */
#banner .background-video {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: translate(-50%, -50%);
  z-index: 0; /* Ensure video stays behind the content */
 
}

/* Inner Content */
#banner .inner {
  transform: scale(1);
  transition:
    opacity 1s ease,
    transform 1s ease;
  opacity: 1;
  position: relative;
  z-index: 2; /* Ensure content stays above the video */
}

#banner h1 {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #fff;
}

#banner p {
  color: rgba(255, 255, 255, 0.65);
  font-size: 1.5rem;
  margin-bottom: 3rem;
}

#banner a {
  color: #fff;
  text-decoration: none;
}

/* Overlay */
#banner:before {
  content: '';
  display: block;
  background-color: rgba(0, 0, 0, 0.75);
  height: 100%;
  left: 0;
  opacity: 0.45;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 1; /* Ensure overlay stays between video and content */
}

/* Responsive Design */
@media screen and (max-width: 1280px) {
  #banner .background-video {
    display: block; /* Show video for medium screens */
  }

  #banner {
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
  }

  /* Ensure video height matches the viewport height */
  #banner .background-video {
    height: 100vh;
  }
}

@media screen and (max-width: 736px) {
  #banner {
    min-height: auto;
    height: auto;
    padding: 6rem 2rem 4rem 2rem;
  }

  #banner .inner {
    width: 100%;
    padding: 0 2rem; /* Add padding for small screens */
  }

  #banner h1 {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }

  #banner p {
    font-size: 1.25rem;
  }

  #banner br {
    display: none;
  }

  #banner .button {
    width: 100%;
  }
}

@media screen and (max-width: 200px) {
  #banner p {
    font-size: 1rem;
  }
}

/* Loading State */
body.is-loading #banner .inner {
  transform: scale(0.99);
  opacity: 0;
}

body.is-loading #banner:before {
  opacity: 1;
}

</style>
