// firebase-config.js (The final, clean, and correct file structure)

// Import the functions using the full CDN URLs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


// Your web app's Firebase configuration (The block you copied from the Console)

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDiZ7zdoSaJmlxdWvk99iJ4q3wpjC-FFc",
  authDomain: "expence-tracker-89548.firebaseapp.com",
  projectId: "expence-tracker-89548",
  storageBucket: "expence-tracker-89548.firebasestorage.app",
  messagingSenderId: "754501712545",
  appId: "1:754501712545:web:f0cba4f28dc9a81cc54ee0",
  measurementId: "G-257JVW5J32"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);



// 2. Initialize Auth and Firestore services (ONLY ONCE)
const auth = getAuth(app);
const db = getFirestore(app);


// 3. EXPORT all instances for app.js to use
export { app, auth, db, firebaseConfig };