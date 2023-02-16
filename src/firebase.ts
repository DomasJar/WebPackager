
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {

   apiKey: "AIzaSyBFl2Q9t55OngIHk6VHfESEabbwdpYbazM",
 
   authDomain: "mcpackager.firebaseapp.com",
 
   projectId: "mcpackager",
 
   storageBucket: "mcpackager.appspot.com",
 
   messagingSenderId: "352446645499",
 
   appId: "1:352446645499:web:573a52d0427ca4ea6e9c5e",
 
   measurementId: "G-NBY7Y6PT0X"
 
 };
 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { auth, analytics };
