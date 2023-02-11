<script setup lang="ts">
import { ref, reactive } from 'vue'
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import draggable from 'vuedraggable';
import { v4 as uuidv4 } from 'uuid';

interface marketImage {
  fileName: string,
  url: string,
  file: File
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


const pack_name = ref("Skinpack")
let isPackaging = ref(false)
let drag = ref(false)
let skins = reactive<Array<{ name: string, type: "custom" | "customSlim", fileName: string, url: string, file: File }>>([])
let keyArt = <marketImage>{}

async function packageSkins() {
  try {
    isPackaging.value = true;
    let content = await generateZip()
    FileSaver.saveAs(content, `${pack_name.value.replace(" ", "")}.zip`);
    isPackaging.value = false;
  } catch (error) {
    console.log(error);
    isPackaging.value = false;
  }
}

function generateZip() {
  return new Promise<Blob>(async (resolve, reject) => {
    try {
      let packNameProccesed = pack_name.value.trim().replace(" ", "");
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
          version: [1, 0, 0],
          uuid: uuidv4()
        },
        modules: [
          {
            type: "skin_pack",
            version: [1, 0, 0],
            uuid: uuidv4()
          }
        ]
      }
      const zip = new JSZip();
      for (const [i, skin] of skins.entries()) {
        let skinFileName = `${i + 1}_${skin.type}.png`
        await zip.file(`Content/skin_pack/${skinFileName}`, skin.file)
        langFileContent += `\nskin.${packNameProccesed}.${skinFileName}=${skin.name}`
        skinsJsonContent.skins.push({
          localization_name: skinFileName,
          geometry: `geometry.humanoid.${skinFileName}`,
          texture: `${skinFileName}.png`,
          type: "paid"
        })
      }
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
  const target = (<HTMLInputElement>event.target)
  let entries: File[] = []
  if (target && target.files) {
    try {
      entries = Object.values(target.files);
      for (const val of entries) {
        let imgUrl = URL.createObjectURL(val)
        if (val.type == "image/png") {
          skins.push({
            fileName: val.name,
            name: val.name.replace(/\.[^/.]+$/, ""),
            url: imgUrl,
            file: val,
            type: await getSkinType(imgUrl)
          })
        } else if (val.type == "image/jpeg") {
          let size = await getImgSize(imgUrl)
          if (size.width == 800 && size.height == 450) {
            keyArt.file = val,
              keyArt.fileName = val.name,
              keyArt.url = imgUrl
          } else if (size.width == 1920 && size.height == 1080) {
            console.log(val);

          }
        }
      }
      console.log(keyArt);
    } catch (error) {
      console.error(error);

    }

  }
}

async function displayskins(event: Event) {
  const target = (<HTMLInputElement>event.target)
  let entries: File[] = []
  if (target && target.files) {
    entries = Object.values(target.files);
    for (const val of entries) {
      skins.push({
        fileName: val.name,
        name: val.name.replace(/\.[^/.]+$/, ""),
        url: URL.createObjectURL(val),
        file: val,
        type: await getSkinType(URL.createObjectURL(val))
      })
    }
  }
}

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

</script>

<template>
  <div class="flex-grow-1">
    <canvas hidden id="myCanvas"></canvas>
    <v-row>
      <v-col>
        <h1>Skin Packager</h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-text-field variant="outlined" label="Skinpack name" v-model="pack_name"></v-text-field>
        <v-file-input variant="outlined" label="Images" multiple accept="image/png, image/jpeg"
          @change="sortImages"></v-file-input>
      </v-col>
    </v-row><v-row>
      <v-col cols="12">
        <draggable class="d-flex align-center justify-center row flex-wrap" ghost-class="moving-card" :list="skins"
          group="people" :animation="200" @start="drag = true" @end="drag = false" item-key="element.url">
          <template #item="{ element }">
            <v-card rounded="lg" class="flex-grow-0 ma-5">
              <v-card-title>
                {{ skins.indexOf(element) + "_" + element.type }}
              </v-card-title>
              <v-text-field label="Character name" v-model="element.name"></v-text-field>
              <v-img width="300" :src="element.url"></v-img>
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
</style>
