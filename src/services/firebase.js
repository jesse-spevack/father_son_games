/**
 * Firebase configuration using CDN (compat) SDK.
 * Scripts loaded in index.html provide global 'firebase' object.
 */

const firebaseConfig = {
  apiKey: "AIzaSyBfdD6tFGx_UsAATcMCczrbuLZL8qGXFT8",
  authDomain: "father-son-games.firebaseapp.com",
  databaseURL: "https://father-son-games-default-rtdb.firebaseio.com",
  projectId: "father-son-games",
  storageBucket: "father-son-games.firebasestorage.app",
  messagingSenderId: "658229070597",
  appId: "1:658229070597:web:7339fcf39e566f8464456c",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

export { database };
