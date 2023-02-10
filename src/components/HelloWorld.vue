<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ 
  src: string,
  name: string
}>()

const count = ref(0)
</script>

<template>
  <v-flex xs4>
      <v-card class="mx-4">
        <v-img :src="src"></v-img>
        <v-card-title primary-title>
          <div>{{name}}</div>
        </v-card-title>
      </v-card>
    </v-flex>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
