<script setup lang="ts">
import { ref } from 'vue'
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { router } from '../router';


var valid = ref(false);
var email = ref("");
var password = ref("");


const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,4})+$/.test(v) || 'E-mail must be valid'
]

const passwordRules = [
  (v: string) => !!v || 'Password is required'
]

async function submit(event: any) {
  try {
    const results = await event
    if (results.valid) {
      signInWithEmailAndPassword(auth, email.value, password.value)
      .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        router.push('/WebPackager/')
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        alert(errorMessage)
      });
    }
  } catch (error) {

  }
}

function register() {
  router.push('register')
}
</script>

<template>
  <v-sheet width="400" class="flex-grow-0 justify-self-center pa-5" rounded="sm">
    <v-form class="d-flex flex-column" v-model="valid" validate-on="submit" @submit.prevent="submit">
      <div class="text-h2 mb-5">Login</div>
      <v-text-field class="ma-2" type="email" variant="outlined" :rules="emailRules" v-model="email" label="Email Address"/>
      <v-text-field class="ma-2" type="password" variant="outlined" :rules="passwordRules" v-model="password" label="Paswword"/>
      <v-btn class="flex-grow-1 ma-2" type="submit" variant="outlined" >Login</v-btn>
      <v-btn class="flex-grow-1 ma-2" variant="plain" @click="register" >Register</v-btn>
    </v-form>
  </v-sheet>
</template>

<style scoped lang="scss"></style>
