<script setup lang="ts">
import model_custom from '../assets/model_custom.json'
import model_customSlim from '../assets/model_customSlim.json'
import { ref, onMounted, watch } from 'vue'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, Object3D, Color, TextureLoader } from 'three';


const props = defineProps(['show', 'skin', 'type'])
defineEmits(['update:show'])

watch(() => props.show, (val) => {
  if (val) {
    updateScene()
  }
})

const threeViewCanvas = ref<HTMLElement>();
// const container = document.querySelector("#canvas-container");

let modelCustom = model_custom
let modelCustomBlob = new Blob([JSON.stringify(modelCustom, null, 2)], { type: "application/gltf" })
let modelCustomURL = URL.createObjectURL(modelCustomBlob)

let modelCustomSlim = model_customSlim
let modelCustomSlimBlob = new Blob([JSON.stringify(modelCustomSlim, null, 2)], { type: "application/gltf" })
let modelCustomSlimURL = URL.createObjectURL(modelCustomSlimBlob)


const scene = new Scene()
const camera = new PerspectiveCamera(
  75,
  4 / 3,
  0.1,
  1000
)

const texLoader = new TextureLoader()
const renderer = new WebGLRenderer({ antialias: true })
const light = new AmbientLight('hsl(0, 100%, 100%)')
const controls = new OrbitControls( camera, renderer.domElement )
var model: Object3D
var customModel: Object3D
var customSlimModel: Object3D
var speed = 0.01
var loadedType: string

onMounted(async () => {
  await initScene()
  await updateScene("custom")
  animate()
})

async function initScene() {
  customModel = await loadModel(modelCustomURL)
  customSlimModel = await loadModel(modelCustomSlimURL)

  scene.add(camera)
  scene.add(light)
  scene.background = new Color('gray')

  renderer.setSize(800, 600)
  camera.position.y = 1
  camera.position.z = 3

  controls.enableDamping = true
	controls.dampingFactor = 0.05
	controls.target.y = 1
  controls.enablePan = false
  controls.update()

  if (threeViewCanvas.value) {
    threeViewCanvas.value.appendChild(renderer.domElement)
  }
}

async function updateScene(type?: string) {
  if ((loadedType != props.type) || type) {
    let newType = props.type || type
    switch (newType) {
      case "custom":
        if(model) model.parent?.remove(model)
        model = customModel
        loadedType = newType
        break;
      case "customSlim":
        if(model) model.parent?.remove(model)
        model = customSlimModel
        loadedType = newType
      default:
        break;
    }
    
    scene.add(model)
    
  }

  if(props.skin){
    let newTex = await texLoader.loadAsync(props.skin);
    newTex.magFilter = 1003;
    newTex.minFilter = 1003;

    model.traverse(child => {
      //@ts-ignore
      if (child.material) {
      //@ts-ignore
        child.material.map = newTex;
      }
    });
  }
  model.rotation.y = 160
}

function animate() {
  requestAnimationFrame(animate)
  model.rotation.y += speed
  controls.update();
  renderer.render(scene, camera)
}

function loadModel(url: string): Promise<Object3D> {
  return new Promise(async (resolve, reject) => {
    try {
      const loader = new GLTFLoader();
      let result = await loader.loadAsync(url)
      resolve(result.scene.children[0])
    } catch (error) {
      console.log(error);
      reject(error)
    }
  })
}

</script>

<template>
  <v-dialog id="dialog" :model-value="show" @update:model-value="$emit('update:show', $event)" width="800">
    <v-card>
      <v-btn class="flex-grow-0" @click="$emit('update:show', false)">Close</v-btn>
      <div ref="threeViewCanvas"></div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
