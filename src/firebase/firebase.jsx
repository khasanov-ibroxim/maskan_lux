import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyD7YOgkZUfCeAl4mPl4GyqRwq6Y6JfYI4A",
    authDomain: "maskan-e9837.firebaseapp.com",
    projectId: "maskan-e9837",
    storageBucket: "maskan-e9837.appspot.com",
    messagingSenderId: "966119335566",
    appId: "1:966119335566:web:57147e57a345f489370bdf",
    measurementId: "G-7WYKKPN9FR"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
