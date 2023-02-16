<script setup lang="ts">
import model_custom from '../assets/model_custom.json'
import model_customSlim from '../assets/model_customSlim.json'
import { ref, watch } from 'vue'
import { Camera, Renderer, Scene, GltfModel, AmbientLight, Object3D, PhongMaterial, Texture, PerspectiveCamera } from 'troisjs';
import { TextureLoader } from 'three'


const props = defineProps(['skin', 'type'])

const camera = ref<typeof PerspectiveCamera>()
var loadedModel: typeof Object3D

watch(() => props.skin, (val) => {
  if(val) onReady(loadedModel)
  
})

let modelCustom = model_custom
let modelCustomBlob = new Blob([JSON.stringify(modelCustom, null, 2)], { type: "application/gltf" })
let modelCustomURL = URL.createObjectURL(modelCustomBlob)

let modelCustomSlim = model_customSlim
let modelCustomSlimBlob = new Blob([JSON.stringify(modelCustomSlim, null, 2)], { type: "application/gltf" })
let modelCustomSlimURL = URL.createObjectURL(modelCustomSlimBlob)

async function onReady(model: typeof Object3D) {
  loadedModel = model
  
  if(props.skin === "") return
  let newTex = await new TextureLoader().loadAsync(props.skin);
  newTex.magFilter = 1003;
  newTex.minFilter = 1003;
  
  //@ts-ignore
  model.scene.traverse(child => {
    if(child.material && child.material.map){
      child.material.map = newTex;
    }
  });
  

}

</script>

<template>
  <v-card>
    <!-- <v-img width="300" :src="skin"></v-img> -->
    <renderer ref="renderer">
      <Camera ref="camera" :position="{ y: 1,z: -3 }" :look-at="{ y: 1, z: 0}"></Camera>
      <scene background="#555555">
        <ambient-light :position="{x: 0, y:0}"></ambient-light>
        <gltf-model v-if="type == 'customSlim'" :src="modelCustomSlimURL" @load="onReady"></gltf-model>
        <gltf-model v-else-if="type == 'custom'" :src="modelCustomURL" @load="onReady"></gltf-model>
      </scene>
    </renderer>
  </v-card>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
