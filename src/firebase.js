import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbeCwQhYFmwFi_8MKNVNiHq1dmbybGeZE",
  authDomain: "filmle-fcc4e.firebaseapp.com",
  databaseURL: "https://filmle-fcc4e-default-rtdb.firebaseio.com",
  projectId: "filmle-fcc4e",
  storageBucket: "filmle-fcc4e.appspot.com",
  messagingSenderId: "205358675083",
  appId: "1:205358675083:web:0ebe09aab2add38d4d108e",
  measurementId: "G-Q7JRH8WP91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app)


