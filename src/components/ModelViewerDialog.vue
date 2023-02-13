<script setup lang="ts">
import model_custom from '../assets/model_custom.json'
import model_customSlim from '../assets/model_customSlim.json'
import { ref } from 'vue'
import { Camera, Renderer, Scene, GltfModel, AmbientLight, Object3D, PhongMaterial, Texture, PerspectiveCamera } from 'troisjs';
import { TextureLoader } from 'three'


const props = defineProps(['show', 'skin', 'type'])
defineEmits(['update:show'])

const camera = ref<typeof PerspectiveCamera>();

let modelCustom = model_custom
let modelCustomBlob = new Blob([JSON.stringify(modelCustom, null, 2)], { type: "application/gltf" })
let modelCustomURL = URL.createObjectURL(modelCustomBlob)

let modelCustomSlim = model_customSlim
let modelCustomSlimBlob = new Blob([JSON.stringify(modelCustomSlim, null, 2)], { type: "application/gltf" })
let modelCustomSlimURL = URL.createObjectURL(modelCustomSlimBlob)

function onReady(model: typeof Object3D) {
  if(props.skin === "") return
  let newTex = new TextureLoader().load(props.skin);
  newTex.magFilter = 1003;
  newTex.minFilter = 1003;
  
  //@ts-ignore
  model.scene.traverse(child => {
    if(child.material && (child.material.map.name === 'steve.png' || child.material.map.name === 'alex.png')){
      child.material.map = newTex;
    }
    // if (child.material && child.material.name === 'placeholder.png') {
    //   console.log("FOUND");
    //   console.log(child.material);
      
    //   child.material.map = newTex;
    // }
  });
  if (camera.value != null){
    console.log(camera.value.camera);

    // camera.value.camera.lookAt({x: 0, y: 10, z:0}
    // camera.value.camera.autoRotate()
    // camera.value.camera.target = {x: 0, y: 10, z: 0};
  }
  

}

</script>

<template>
  <v-dialog :model-value="show" @update:model-value="$emit('update:show', $event)"  width="800">
    <v-card >
      <Renderer :orbit-ctrl="true" :antialias="true">
        <Camera ref="camera" :position="{ y: 2,z: 3 }" :lookAt="{y: 15}" />
        <Scene background="#555555">
          <AmbientLight :position="{ y: 100, z: 50 }" />
          <GltfModel v-if="type == 'custom'" :src="modelCustomURL" @load="onReady" />
          <GltfModel v-else-if="type == 'customSlim'" :src="modelCustomSlimURL" @load="onReady" />
        </Scene>
      </Renderer>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
