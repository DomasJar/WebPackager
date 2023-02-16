<script setup lang="ts">
import { ref } from 'vue'
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { router } from '../router';


var valid = ref(false);
var email = ref("");
var password = ref("");
var repeatPassword = ref("");

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,4})+$/.test(v) || 'E-mail must be valid'
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 8 || 'Password must be at least 8 characters',
]

const passwordRepeatRules = [
  (v: string) => v == password.value || 'Passwords do not match',
  (v: string) => !!v || 'Password is required'
]

async function submit(event: any) {
  try {
    const results = await event
    if (results.valid) {
      createUserWithEmailAndPassword(auth, email.value, repeatPassword.value)
        .then((userCredential) => {
          // Signed in 
          const user = userCredential.user;
          router.push('/WebPackager/');
          // ...
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          alert(errorMessage);
        });
    }
  } catch (error) {
    alert(error);
  }
}

function login() {
  router.push('login')
}

</script>

<template>
  <v-sheet width="400" class="flex-grow-0 justify-self-center pa-5" rounded="sm">
    <v-form class="d-flex flex-column" v-model="valid" validate-on="submit" @submit.prevent="submit">
      <div class="text-h2  mb-5">Register</div>
      <v-text-field class="ma-2" type="email" variant="outlined" :rules="emailRules" v-model="email"
        label="Email Address" />
      <v-text-field class="ma-2" type="password" variant="outlined" :rules="passwordRules" v-model="password"
        label="Paswword" />
      <v-text-field class="ma-2" type="password" variant="outlined" :rules="passwordRepeatRules" v-model="repeatPassword"
        label="Repeat Paswword" />
      <v-btn class="flex-grow-1 ma-2" type="submit" variant="outlined" >Register</v-btn>
      <v-btn class="flex-grow-1 ma-2" variant="plain" @click="login" >Login</v-btn>
    
      
    </v-form>
  </v-sheet>
</template>

<style scoped lang="scss"></style>
