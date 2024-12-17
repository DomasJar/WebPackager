<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue'
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { v4 as uuidv4 } from 'uuid';

import draggable from 'vuedraggable';
import ModelViewerDialog from './ModelViewerDialog.vue'
import ModelView from './ModelView.vue'

interface marketImage {
  fileName: string,
  url: string,
  file: File
  w: number,
  h: number
}

interface skinsJson {
  serialize_name: string,
  localization_name: string,
  skins: Array<{ localization_name: string, geometry: string, texture: string, type: string }>
}

interface manifestJson {
  header: {
    name: string,
    version: [number, number, number],
    uuid: string
  },
  modules: [
    {
      version: [number, number, number],
      type: string,
      uuid: string
    }
  ],
  format_version: number
}

interface skin { name: string, type: "custom" | "customSlim", fileName: string, url: string, file: File, paid: true }


let keyArt = reactive({}) as marketImage
let keyArtHD = reactive({}) as marketImage
let partnerArt = reactive({}) as marketImage

const pack_name = ref("Skinpack")
const pack_version = ref("1.0.0")
const keyArtInput = ref(null)
let isPackaging = ref(false)
let drag = ref(false)
let modelViewOpen = ref(false)
let modelViewSkin = ref("")
let modelViewType = ref("")


let skins = reactive<Array<skin>>([])
let storeImages = reactive<Array<marketImage>>([])
let inputImages = reactive<Array<File>>([])

onBeforeMount(async () => {
  var storedArt = localStorage.getItem('partner_art');
  if (storedArt) {
    var partnerArtImg = JSON.parse(storedArt);
    partnerArtImg.file = dataURLtoFile(partnerArtImg.url, partnerArtImg.fileName);
    Object.assign(partnerArt, partnerArtImg);
  }

})

async function packageSkins() {
  try {
    isPackaging.value = true;
    let content = await generateZip()
    FileSaver.saveAs(content, `${pack_name.value.replaceAll(" ", "")}_${pack_version.value}.zip`);
    isPackaging.value = false;
  } catch (error) {
    console.log(error);
    isPackaging.value = false;
  }
}

function generateZip() {
  return new Promise<Blob>(async (resolve, reject) => {
    try {
      let ver_digits = pack_version.value.split(".").map((item) => {
        return parseInt(item, 10);
      });
      let packNameProccesed = pack_name.value.trim().replace(/([^\w]| )/g, "");
      
      let langFileContent = `skinpack.${packNameProccesed}=${pack_name.value}`;
      let skinsJsonContent: skinsJson = {
        localization_name: packNameProccesed,
        serialize_name: packNameProccesed,
        skins: []
      }
      let manifestJsonContent: manifestJson = {
        format_version: 1,
        header: {
          name: "pack.name",
          version: [ver_digits[0], ver_digits[1], ver_digits[2]],
          uuid: uuidv4()
        },
        modules: [
          {
            type: "skin_pack",
            version: [ver_digits[0], ver_digits[1], ver_digits[2]],
            uuid: uuidv4()
          }
        ]
      }
      const zip = new JSZip();
      for (const [i, skin] of skins.entries()) {
        let skinFileNameLang = `${i + 1}_${skin.type}`
        let skinFileName = `${i + 1}_${skin.type}.png`
        await zip.file(`Content/skin_pack/${skinFileName}`, skin.file)
        langFileContent += `\nskin.${packNameProccesed}.${skinFileNameLang}=${skin.name}`
        skinsJsonContent.skins.push({
          localization_name: skinFileNameLang,
          geometry: `geometry.humanoid.${skin.type}`,
          texture: skinFileName,
          type: skin.paid ? "paid" : "free",
        })
      }
      zip.file(`Store Art/${packNameProccesed}_Thumbnail_0.jpg`, keyArt.file);
      zip.file(`Marketing Art/${packNameProccesed}_PartnerArt.jpg`, partnerArt.file);
      zip.file(`Marketing Art/${packNameProccesed}_MarketingKeyArt.jpg`, keyArtHD.file);
      zip.file('Content/skin_pack/skins.json', JSON.stringify(skinsJsonContent, null, 4));
      zip.file('Content/skin_pack/manifest.json', JSON.stringify(manifestJsonContent, null, 4));
      zip.file('Content/skin_pack/texts/en_US.lang', langFileContent);
      zip.file('Content/skin_pack/texts/languages.json', '["en_US"]');
      let content = await zip.generateAsync({ type: 'blob' })
      resolve(content)
    } catch (error) {
      console.log(error);
      reject()
    }
  })
}

async function sortImages(event: Event) {
  const target = (<HTMLInputElement>event.target);

  let entries: File[] = []
  if (target && target.files) {
    try {
      function readFile(file: File) {
        return new Promise<string>((resolve, reject) => {
          var fr = new FileReader();
          fr.onload = () => {
            resolve(String(fr.result))
          };
          fr.onerror = reject;
          fr.readAsDataURL(file);
        });
      }

      entries = Object.values(target.files);
      for (const val of entries) {
        let imgUrl = await readFile(val)
        if (val.type == "image/png") {
          skins.push({
            fileName: val.name,
            name: val.name.replace(/\.[^/.]+$/, ""),
            url: imgUrl,
            file: val,
            type: await getSkinType(imgUrl),
            paid: true
          })
        } else if (val.type == "image/jpeg") {
          let size = await getImgSize(imgUrl)
          storeImages.push({
            file: val,
            fileName: val.name.replace(/\.[^/.]+$/, ""),
            url: imgUrl,
            w: size.width,
            h: size.height
          })
        }
      }
      inputImages = [];
    } catch (error) {
      inputImages = [];
      console.error(error);

    }

  }
}

// async function displayskins(event: Event) {
//   const target = (<HTMLInputElement>event.target)
//   let entries: File[] = []
//   if (target && target.files) {
//     entries = Object.values(target.files);
//     for (const val of entries) {
//       skins.push({
//         fileName: val.name,
//         name: val.name.replace(/\.[^/.]+$/, ""),
//         url: URL.createObjectURL(val),
//         file: val,
//         type: await getSkinType(URL.createObjectURL(val))
//       })
//     }
//   }
// }

function getSkinType(imageUrl: string): Promise<"custom" | "customSlim"> {
  return new Promise(async (resolve, reject) => {
    let img = new (window as any).Image();
    img.crossOrigin = `Anonymous`;

    img.src = imageUrl;
    img.onload = function () {

      let canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx: CanvasRenderingContext2D = canvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      ctx.drawImage(img, 0, 0);

      let resolutionMultiplier = img.height / 64;
      let handData = ctx.getImageData(50 * resolutionMultiplier, 16 * resolutionMultiplier, 2 * resolutionMultiplier, 4 * resolutionMultiplier);
      let armData = ctx.getImageData(54 * resolutionMultiplier, 20 * resolutionMultiplier, 2 * resolutionMultiplier, 12 * resolutionMultiplier);

      for (let i = 0; i < armData.data.length; i += 4) {
        if (armData.data[i + 3] > 0) {
          resolve("custom")
        }
      }

      for (let i = 0; i < handData.data.length; i += 4) {
        if (handData.data[i + 3] > 0) {
          resolve("custom")
        }
      }

      resolve("customSlim")
    };
  })
}

function checkGhostPixels(imageUrl: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    let img = new (window as any).Image();
    img.crossOrigin = `Anonymous`;

    img.src = imageUrl;
    img.onload = function () {

      let canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx: CanvasRenderingContext2D = canvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;
      ctx.drawImage(img, 0, 0);

      let resolutionMultiplier = img.height / 64;
      let headData_1 = ctx.getImageData(0 * resolutionMultiplier, 0 * resolutionMultiplier, 8 * resolutionMultiplier, 8 * resolutionMultiplier);
      let headData_2 = ctx.getImageData(24 * resolutionMultiplier, 0 * resolutionMultiplier, 16 * resolutionMultiplier, 8 * resolutionMultiplier);
      let headData_3 = ctx.getImageData(56 * resolutionMultiplier, 0 * resolutionMultiplier, 8 * resolutionMultiplier, 8 * resolutionMultiplier);

      // let handData = ctx.getImageData(50 * resolutionMultiplier, 16 * resolutionMultiplier, 2 * resolutionMultiplier, 4 * resolutionMultiplier);
      // let armData = ctx.getImageData(54 * resolutionMultiplier, 20 * resolutionMultiplier, 2 * resolutionMultiplier, 12 * resolutionMultiplier);

      for (let i = 0; i < headData_1.data.length; i += 4) {
        if (headData_1.data[i + 3] > 0) {
          resolve(true)
        }
      }

      for (let i = 0; i < headData_2.data.length; i += 4) {
        if (headData_2.data[i + 3] > 0) {
          resolve(true)
        }
      }

      resolve(false)
    };
  })
}

function resizeImg(imgFile: File, src: string, width: number, height: number): Promise<{ newImgFile: File, imgUrl: string }> {
  return new Promise(async (resolve, reject) => {
    const newImg = new Image();

    newImg.onload = async function () {
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      if (!ctx) return reject();
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(newImg, 0, 0, width, height);
      const dataUrl = canvas.toDataURL(imgFile.type);
      const newImgBlob = await new Promise((resolve: BlobCallback) => {
        canvas.toBlob(resolve, imgFile.type);
      });
      if (!newImgBlob) return reject();
      var newImgFile = new File([newImgBlob], `resized_${imgFile.name}`, { type: imgFile.type });
      resolve({ newImgFile: newImgFile, imgUrl: dataUrl });
    };

    newImg.src = src; // this must be done AFTER setting onload
  })
}

function getImgSize(src: string): Promise<{ width: number, height: number }> {
  return new Promise(async (resolve, reject) => {
    const newImg = new Image();

    newImg.onload = function () {
      const height = newImg.height;
      const width = newImg.width;
      resolve({ width, height })
    };

    newImg.src = src; // this must be done AFTER setting onload
  })
}

function dragstart(event: DragEvent, item: marketImage) {
  if (event.dataTransfer != null) {
    event.dataTransfer.dropEffect = 'move'
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.items.add(item.url, "image/url")
  }
}

async function onDrop(event: DragEvent, imgType: string) {
  if (event.dataTransfer != null) {
    let imgUrl = event.dataTransfer.getData("image/url");
    let img = storeImages.find(img => img.url == imgUrl);
    if (!img && event.dataTransfer.files.length > 0) {
      img = await fileToImg(event.dataTransfer.files[0]);
    }

    

    if (img != null) {
      if (img.file.type != "image/jpeg" && img.file.type != "image/png") {
        console.log(`Error: Image format not supported - ${img.file.type}`);
        return;
      }

      switch (imgType) {
        case "key_art":
          if (img.w == 800 && img.h == 450) {
            if (img.file.type != 'image/jpeg'){
              let newImg = await changeImgFormat(img.file, img.url);
              img.file = newImg.newImgFile;
              img.url = newImg.imgUrl;
            }
            Object.assign(keyArt, img)
          }
          break;
        case "key_art_hd":
          if (img.w == 1920 && img.h == 1080) {
            if (img.file.type != 'image/jpeg'){
              let newImg = await changeImgFormat(img.file, img.url);
              img.file = newImg.newImgFile;
              img.url = newImg.imgUrl;
            }
            var scaled_image = await resizeImg(img.file, img.url, 800, 450);
            var keyartImg = {
              file: scaled_image.newImgFile,
              fileName: scaled_image.newImgFile.name,
              url: scaled_image.imgUrl,
              w: 800,
              h: 450
            };
            Object.assign(keyArt, keyartImg);
            Object.assign(keyArtHD, img);
          }
          break;
        case "partner_art":
          if (img.w == 1920 && img.h == 1080) {
            
            if (img.file.type != 'image/jpeg'){
              let newImg = await changeImgFormat(img.file, img.url);
              img.file = newImg.newImgFile;
              img.url = newImg.imgUrl;
            }
            Object.assign(partnerArt, img);
            localStorage.setItem('partner_art', JSON.stringify(img))
          }
          break;
        default:
          break;
      }
      // storeImages.splice(storeImages.indexOf(img), 1)
    }
  }

}

async function fileToImg(file: File): Promise<marketImage> {
  return new Promise(async (resolve, reject) => {
    try {
      function readFile(file: File) {
        return new Promise<string>((resolve, reject) => {
          var fr = new FileReader();
          fr.onload = () => {
            resolve(String(fr.result));
          };
          fr.onerror = reject;
          fr.readAsDataURL(file);
        });
      }

      let imgUrl = await readFile(file)
      let size = await getImgSize(imgUrl);
      var img = {
        file: file,
        fileName: file.name,
        url: imgUrl,
        w: size.width,
        h: size.height
      };
      resolve(img)

    } catch (error) {
      reject(error)
    }
  })
}

function changeImgFormat(file: File, fileSrc: string, type: string = 'image/jpeg'): Promise<{newImgFile: File, imgUrl: string}> {
  return new Promise(async (resolve, reject) => {
    const newImg = new Image();

    newImg.onload = async function () {
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      if (!ctx) return reject();
      canvas.width = newImg.width;
      canvas.height = newImg.height;
      ctx.drawImage(newImg, 0, 0);

      const dataUrl = canvas.toDataURL(type);
      const newImgBlob = await new Promise((resolve: BlobCallback) => {
        canvas.toBlob(resolve,type);
      });
      if (!newImgBlob) return reject();
      var newImgFile = new File([newImgBlob], `resized_${file.name}`, { type: type });
      resolve({ newImgFile: newImgFile, imgUrl: dataUrl });
    };

    newImg.src = fileSrc; // this must be done AFTER setting onload
  })
}

async function handleFileChange(event: Event, inputType: string) {
  const target = (<HTMLInputElement>event.target)

  let entries: File[] = []
  if (target && target.files) {
    try {
      function readFile(file: File) {
        return new Promise<string>((resolve, reject) => {
          var fr = new FileReader();
          fr.onload = () => {
            resolve(String(fr.result));
          };
          fr.onerror = reject;
          fr.readAsDataURL(file);
        });
      }

      entries = Object.values(target.files);
      for (const val of entries) {
        let imgUrl = await readFile(val)
        let size = await getImgSize(imgUrl);
        switch (inputType) {
          case 'key_art_hd':
            if (size.width != 1920 || size.height != 1080) break
            var keyartHDImg = {
              file: val,
              fileName: val.name,
              url: imgUrl,
              w: size.width,
              h: size.height
            };
            Object.assign(keyArtHD, keyartHDImg);

            var scaled_image = await resizeImg(keyartHDImg.file, keyartHDImg.url, 800, 450);
            var keyartImg = {
              file: scaled_image.newImgFile,
              fileName: scaled_image.newImgFile.name,
              url: scaled_image.imgUrl,
              w: 800,
              h: 450
            };
            Object.assign(keyArt, keyartImg);
            break;
          case 'partner_art':
            if (size.width != 1920 || size.height != 1080) break
            var partnerImg = {
              file: val,
              fileName: val.name,
              url: imgUrl,
              w: size.width,
              h: size.height
            };
            Object.assign(partnerArt, partnerImg);
            break;

          default:
            break;
        }
      }
    } catch (error) {
      console.error(error);

    }
  }
}

function dataURLtoFile(dataurl: string, filename: string) {
  var arr = dataurl.split(',');
  
  if (arr.length > 0 && arr[0] != null) {
    var mimeRaw = arr[0].match(/:(.*?);/)
    var mime = mimeRaw != null && mimeRaw.length > 1? mimeRaw[1] : '' ;
  } else return {}
  var bstr = atob(arr[arr.length - 1]);
  var n = bstr.length;
  var u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

function showModelView(skin: skin) {
  modelViewOpen.value = true;
  modelViewSkin.value = skin.url;
  modelViewType.value = skin.type;
}

function removeSkin(skin: skin) {
  skins.splice(skins.indexOf(skin), 1)
}

</script>

<template>
  <div class="flex-grow-1">
    <canvas hidden id="myCanvas"></canvas>
    <model-viewer-dialog eager :show="modelViewOpen" @update:show="val => modelViewOpen = val" :skin="modelViewSkin"
      :type="modelViewType"></model-viewer-dialog>
    <v-row>
      <v-col>
        <h1>Skin Packager</h1>
      </v-col>

    </v-row>
    <v-row>
      <v-col>
        <v-text-field variant="outlined" label="Skinpack name" v-model.trim="pack_name"></v-text-field>
      </v-col>
      <v-col>
        <v-text-field variant="outlined" label="Version" v-model.trim="pack_version"></v-text-field>
      </v-col>
      <v-col>
        <v-file-input variant="outlined" label="Images" clearable multiple accept="image/png, image/jpeg"
          v-model="inputImages" @change="sortImages($event)"></v-file-input>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="d-flex justify-center" v-for="img in storeImages">
        <v-card draggable="true" @dragstart="dragstart($event, img)" class="flex-grow-0 ma-5">
          <v-card-subtitle>{{ `${img.fileName} ${img.w}x${img.h}` }}</v-card-subtitle>
          <v-img width="450" :src="img.url"></v-img>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="mx-10">
      <v-col>
        <v-card @drop="onDrop($event, 'key_art')" @dragenter.prevent @dragover.prevent>
          <v-card-title>Store Art</v-card-title>
          <v-card-subtitle>800x450</v-card-subtitle>
          <v-card-text class="d-flex">
            <v-card class="flex-grow-1" v-if="keyArt.url">
              <v-img :src="keyArt.url"></v-img>
            </v-card>
            <div class="drop-area flex-grow-1 pa-10 " v-else>Auto-generated</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col>
        <input ref="keyArtInput" class="d-none" type="file" accept="image/png, image/jpeg"
          @change="handleFileChange($event, 'key_art_hd')" />
        <v-card @drop.prevent="onDrop($event, 'key_art_hd')" @dragenter.prevent @dragover.prevent>
          <v-card-title>Marketing Art</v-card-title>
          <v-card-subtitle>1920x1080</v-card-subtitle>
          <v-card-text class="d-flex">
            <v-card class="flex-grow-1" v-if="keyArtHD.url">
              <v-img :src="keyArtHD.url"></v-img>
            </v-card>
            <div class="drop-area flex-grow-1 pa-10" v-else>Drag an image here</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col>
        <input ref="partnerArtInput" class="d-none" type="file" accept="image/png, image/jpeg"
          @change="handleFileChange($event, 'partner_art')" />
        <v-card @drop.prevent="onDrop($event, 'partner_art')" @dragenter.prevent @dragover.prevent>
          <v-card-title>Partner Art</v-card-title>
          <v-card-subtitle>1920x1080</v-card-subtitle>
          <v-card-text class="d-flex">
            <v-card class="flex-grow-1" v-if="partnerArt.url">
              <v-img :src="partnerArt.url"></v-img>
            </v-card>
            <div class="drop-area flex-grow-1 pa-10" v-else>Drag an image here</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <draggable class="d-flex align-center justify-center row flex-wrap" ghost-class="moving-card" :list="skins"
          group="people" :animation="200" @start="drag = true" @end="drag = false" item-key="element.url">
          <template #item="{ element }">
            <v-card rounded="lg" class="flex-grow-0 ma-5" :key="element.url">
              <v-card-title class="d-flex align-center justify-space-between">
                {{ (skins.indexOf(element) + 1) + "_" + element.type }}
                <v-btn variant="flat" icon="mdi-magnify-plus" @click="showModelView(element)"></v-btn>
                <v-btn variant="flat" icon="mdi-delete" @click="removeSkin(element)"></v-btn>
              </v-card-title>
              <v-text-field label="Character name" v-model="element.name"></v-text-field>

              <model-view v-bind:type="element.type" v-bind:skin="element.url"></model-view>
            </v-card>
          </template>
        </draggable>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="d-flex">
        <v-btn class="flex-grow-1" @click="packageSkins" variant="outlined" size="large" :loading="isPackaging">
          Pack
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="scss">
.moving-card {
  opacity: 0.5;
  background-color: gray;
  /* @apply opacity-50 bg-gray-100 border border-blue-500; */
}

.drop-area {
  border: 4px dashed gray;
  border-radius: 5px;
  opacity: 0.6;
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
