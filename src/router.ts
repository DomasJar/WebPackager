
import { createRouter, createWebHistory } from 'vue-router';
import { auth } from './firebase';

import SkinPackager from "./components/SkinPackager.vue"
import Login from "./views/Login.vue"
import Register from "./views/Register.vue"
import NotFound from "./views/NotFound.vue"

const routes = [
  { path: '/WebPackager/login', component: Login, meta: { requiresAuth: false } },
  { path: '/WebPackager/register', component: Register, meta: { requiresAuth: false } },
  { path: '/WebPackager', component: SkinPackager, meta: { requiresAuth: false } },
  { path: "/:catchAll(.*)", component: NotFound,  },
]

const router = createRouter({
  history: createWebHistory(),
  routes, // short for `routes: routes`
})

router.beforeEach((to, from, next) => {
  if(to.matched.some(record => record.meta.requiresAuth)){
    //Check if not logged in
    if(!auth.currentUser){
      next('/')
    }else{
      next()
    }
  } else if (to.matched.some(record => record.meta.requiresGuest)){
    //Check if logged in
    if(auth.currentUser){
      next('/')
    }else{
      next()
    }
  } else {
    next()
  }
})

export { router }