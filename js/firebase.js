// 日時をいい感じの形式にする関数
function convertFromFirestoreTimestampToDatetime(timestamp) {
    const _d = timestamp ? new Date(timestamp * 1000) : new Date();
    const Y = _d.getFullYear();
    const m = (_d.getMonth() + 1).toString().padStart(2, '0');
    const d = _d.getDate().toString().padStart(2, '0');
    const H = _d.getHours().toString().padStart(2, '0');
    const i = _d.getMinutes().toString().padStart(2, '0');
    const s = _d.getSeconds().toString().padStart(2, '0');
    return `${Y}/${m}/${d} ${H}:${i}:${s}`;
}

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.2.0/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import {
    ref,
    onValue,
} from "https://www.gstatic.com/firebasejs/9.2.0/firebase-database.js";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.2.0/firebase-firestore.js";
// Your web app's Firebase configuration
const firebaseConfig = {
    
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export {
    convertFromFirestoreTimestampToDatetime,
    getFirestore,
    collection,
    ref,
    onValue,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot,
    db,
}