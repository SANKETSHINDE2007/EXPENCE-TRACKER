// app.js (ES module) - FINAL, CORRECTED VERSION
// Full application logic: auth + firestore + UI

// IMPORT INITIALIZED FIREBASE INSTANCES from local file
import { auth, db } from './firebase-config.js'; 

// IMPORT ALL METHODS from Firebase CDN URLs and assign them names (Auth/Firestore)
import * as Auth from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import * as Firestore from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* Helper to show message in small UI areas */
function showMsg(el, text) {
  if (!el) return;
  el.innerText = text;
  setTimeout(()=> el.innerText = '', 5000);
}

/* -------------------
   Signup logic
   ------------------- */
const signupBtn = document.getElementById('signupBtn');
if (signupBtn) {
  signupBtn.addEventListener('click', async () => {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pass = document.getElementById('signupPass').value;
    const msgEl = document.getElementById('signupMsg');

    if (!name || !email || !pass) {
      showMsg(msgEl, 'Please fill all fields');
      return;
    }

    try {
      // PREFIXED: Auth.createUserWithEmailAndPassword
      const cred = await Auth.createUserWithEmailAndPassword(auth, email, pass);
      const user = cred.user;

      // PREFIXED: Auth.updateProfile
      await Auth.updateProfile(user, { displayName: name });

      // PREFIXED: Firestore.setDoc, Firestore.doc, Firestore.serverTimestamp
      await Firestore.setDoc(Firestore.doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: "user",
        createdAt: Firestore.serverTimestamp()
      });

      localStorage.setItem('loggedInUser', user.uid);
      window.location.href = "index.html";
    } catch (err) {
      showMsg(msgEl, err.message || err.code);
    }
  });
}

/* -------------------
   Login logic
   ------------------- */
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    const msgEl = document.getElementById('loginMsg');

    if (!email || !pass) { showMsg(msgEl, 'Fill email & password'); return; }

    try {
      // PREFIXED: Auth.signInWithEmailAndPassword
      const cred = await Auth.signInWithEmailAndPassword(auth, email, pass);
      const user = cred.user;

      localStorage.setItem('loggedInUser', user.uid);

      // PREFIXED: Firestore.getDoc, Firestore.doc
      const userDoc = await Firestore.getDoc(Firestore.doc(db, "users", user.uid));
      const role = userDoc.exists() ? userDoc.data().role : 'user';

      if (role === 'admin') {
        window.location.href = "admin.html";
      } else {
        window.location.href = "index.html";
      }
    } catch (err) {
      showMsg(msgEl, err.message || 'Login failed');
    }
  });
}

/* -------------------
   Password reset
   ------------------- */
const forgotLink = document.getElementById('forgotLink');
if (forgotLink) {
  forgotLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = prompt('Enter your account email to receive password reset link:');
    if (!email) return;
    try {
      // PREFIXED: Auth.sendPasswordResetEmail
      await Auth.sendPasswordResetEmail(auth, email);
      alert('Password reset email sent — check your inbox.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
}

/* -------------------
   Index (user) page logic
   ------------------- */
const form = document.getElementById('form');
const listEl = document.getElementById('list');
const balanceEl = document.getElementById('balance');
const moneyPlusEl = document.getElementById('money-plus');
const moneyMinusEl = document.getElementById('money-minus');
const welcomeEl = document.getElementById('welcome');
const profileBtn = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');
const profileNameEl = document.getElementById('profileName');
const profileEmailEl = document.getElementById('profileEmail');
const logoutBtn = document.getElementById('logoutBtn');

if (profileBtn) {
  profileBtn.addEventListener('click', () => {
    profileMenu.style.display = profileMenu.style.display === 'block' ? 'none' : 'block';
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    // PREFIXED: Auth.signOut
    await Auth.signOut(auth);
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
  });
}

// load app (user dashboard)
async function loadApp() {
  const uid = localStorage.getItem('loggedInUser');
  if (!uid) { window.location.href = 'login.html'; return; }

  // PREFIXED: Firestore.getDoc, Firestore.doc
  const userSnap = await Firestore.getDoc(Firestore.doc(db, "users", uid));
  const userData = userSnap.exists() ? userSnap.data() : null;
  welcomeEl.innerText = `Welcome, ${userData?.name || 'User'}!`;
  if (profileNameEl) profileNameEl.innerText = `👤 ${userData?.name || ''}`;
  if (profileEmailEl) profileEmailEl.innerText = userData?.email || '';

  // PREFIXED: Firestore.collection, Firestore.query, Firestore.orderBy, Firestore.onSnapshot
  const transCol = Firestore.collection(db, "users", uid, "transactions");
  const q = Firestore.query(transCol, Firestore.orderBy("createdAt", "desc"));
  Firestore.onSnapshot(q, (snapshot) => {
    const arr = [];
    snapshot.forEach(d => arr.push({ id: d.id, ...d.data() }));
    renderTransactions(arr);
  });
}

function renderTransactions(transactions) {
  if (!listEl) return;
  listEl.innerHTML = '';

  const amounts = transactions.map(t => t.amount || 0);
  const total = (amounts.reduce((a,b)=>a+(b||0), 0) || 0).toFixed(2);
  const income = (amounts.filter(x=>x>0).reduce((a,b)=>a+b,0) || 0).toFixed(2);
  const expense = (amounts.filter(x=>x<0).reduce((a,b)=>a+b,0) * -1 || 0).toFixed(2);

  balanceEl.innerText = `₹${total}`;
  moneyPlusEl.innerText = `₹${income}`;
  moneyMinusEl.innerText = `₹${expense}`;

  transactions.forEach(t => {
    const li = document.createElement('li');
    li.classList.add(t.amount < 0 ? 'minus' : 'plus');
    li.innerHTML = `
      <div style="flex:1">
        <strong>${t.text}</strong>
        <div style="font-size:0.85rem;color:#ccc">${t.createdAt ? new Date(t.createdAt.toDate ? t.createdAt.toDate() : t.createdAt).toLocaleString() : ''}</div>
      </div>
      <div style="text-align:right; min-width:120px">
        <div style="font-weight:700">${t.amount < 0 ? '-' : '+'}₹${Math.abs(t.amount)}</div>
        <button class="btn-delete" onclick="deleteTransaction('${t.id}')">Delete</button>
      </div>
    `;
    listEl.appendChild(li);
  });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const uid = localStorage.getItem('loggedInUser');
    if (!uid) { alert('Not logged in'); window.location.href='login.html'; return; }

    const text = document.getElementById('text').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    if (!text || isNaN(amount)) { alert('Enter valid values'); return; }

    try {
      // PREFIXED: Firestore.addDoc, Firestore.collection, Firestore.serverTimestamp
      await Firestore.addDoc(Firestore.collection(db, "users", uid, "transactions"), {
        text, amount,
        createdAt: Firestore.serverTimestamp()
      });
      document.getElementById('text').value = '';
      document.getElementById('amount').value = '';
    } catch (err) {
      alert('Add failed: ' + err.message);
    }
  });
}

// delete transaction (user scope)
window.deleteTransaction = async function(transId) {
  const uid = localStorage.getItem('loggedInUser');
  if (!uid) return alert('Not logged in');
  try {
    // PREFIXED: Firestore.deleteDoc, Firestore.doc
    await Firestore.deleteDoc(Firestore.doc(db, "users", uid, "transactions", transId));
  } catch (err) {
    alert('Delete error: ' + err.message);
  }
};

/* -------------------
   Admin page logic
   ------------------- */
async function loadAdmin() {
  const uid = localStorage.getItem('loggedInUser');
  if (!uid) { window.location.href='login.html'; return; }
  // PREFIXED: Firestore.getDoc, Firestore.doc
  const me = await Firestore.getDoc(Firestore.doc(db, "users", uid));
  if (!me.exists() || me.data().role !== 'admin') {
    alert('Admin access required');
    window.location.href='index.html';
    return;
  }

  // list users
  // PREFIXED: Firestore.getDocs, Firestore.collection
  const usersSnap = await Firestore.getDocs(Firestore.collection(db, "users"));
  const usersListEl = document.getElementById('usersList');
  usersListEl.innerHTML = '';
  usersSnap.forEach(u => {
    const d = u.data();
    const div = document.createElement('div');
    div.style.padding = '10px';
    div.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
    div.innerHTML = `<strong>${d.name || '(no name)'}</strong> • ${d.email || ''} • Admin: ${d.role === 'admin' ? 'Yes' : 'No'}
      <div style="margin-top:6px">
        <button onclick="viewUserTransactions('${u.id}')" style="margin-right:8px" class="primary"">View Tx</button>
        <button onclick="toggleAdminFlag('${u.id}', '${d.role === 'admin' ? 'user' : 'admin'}')">${d.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}</button>
        <button onclick="deleteUser('${u.id}')" style="margin-left:8px">Delete User</button>
      </div>`;
    usersListEl.appendChild(div);
  });

  // aggregate all transactions (simple)
  const allTransEl = document.getElementById('allTrans');
  allTransEl.innerHTML = '';
  // Use a promise array to wait for all transaction fetches
  const txPromises = [];
  usersSnap.forEach((u) => {
    const uid = u.id;
    const userData = u.data();
    // PREFIXED: Firestore.getDocs, Firestore.collection
    txPromises.push(
        Firestore.getDocs(Firestore.collection(db, "users", uid, "transactions")).then(txSnap => {
            txSnap.forEach(t => {
                const tt = t.data();
                const div = document.createElement('div');
                div.style.padding = '10px';
                div.style.border = '1px solid rgba(255,255,255,0.04)';
                div.style.margin = '8px 0';
                div.innerHTML = `<strong>${tt.text}</strong> • ₹${tt.amount} • <small>${userData.email}</small> • ${tt.createdAt ? new Date(tt.createdAt.toDate ? tt.createdAt.toDate() : tt.createdAt).toLocaleString() : '' }
                  <div style="margin-top:6px"><button onclick="deleteTransactionAdmin('${uid}','${t.id}')">Delete</button></div>`;
                allTransEl.appendChild(div);
            });
        })
    );
  });
  await Promise.all(txPromises);
}

// view user's transactions in a new window
window.viewUserTransactions = async function(uid) {
  // PREFIXED: Firestore.getDocs, Firestore.collection
  const txSnap = await Firestore.getDocs(Firestore.collection(db, "users", uid, "transactions"));
  let html = `<div style="padding:12px;font-family:Arial;color:#fff;background:#111">`;
  txSnap.forEach(d => {
    const tt = d.data();
    html += `<div style="padding:8px;border-bottom:1px solid #222">${tt.text} — ₹${tt.amount} — ${tt.createdAt ? new Date(tt.createdAt.toDate ? tt.createdAt.toDate() : tt.createdAt).toLocaleString() : ''}</div>`;
  });
  html += `</div>`;
  const w = window.open("", "_blank");
  w.document.body.style.background = "#111";
  w.document.body.style.color = "#fff";
  w.document.body.innerHTML = html;
};

// toggle admin role
window.toggleAdminFlag = async function(uid, newRole) {
  try {
    // PREFIXED: Firestore.updateDoc, Firestore.doc
    await Firestore.updateDoc(Firestore.doc(db, "users", uid), { role: newRole });
    alert('Updated role');
    loadAdmin();
  } catch (err) { alert('Error: '+err.message); }
};

// delete user (only deletes Firestore doc & transactions — cannot delete Auth account from client)
window.deleteUser = async function(uid) {
  if (!confirm('Delete user and their transactions from Firestore? This does NOT delete their Firebase Auth account.')) return;
  try {
    // PREFIXED: Firestore.getDocs, Firestore.collection
    const txSnap = await Firestore.getDocs(Firestore.collection(db, "users", uid, "transactions"));
    for (const d of txSnap.docs) {
      // PREFIXED: Firestore.deleteDoc, Firestore.doc
      await Firestore.deleteDoc(Firestore.doc(db, "users", uid, "transactions", d.id));
    }
    // PREFIXED: Firestore.deleteDoc, Firestore.doc
    await Firestore.deleteDoc(Firestore.doc(db, "users", uid));
    alert('User data deleted from Firestore. To delete Firebase Auth account, remove it from Firebase Console.');
    loadAdmin();
  } catch (err) { alert('Delete failed: '+err.message); }
};

// delete transaction as admin (for a specific user's trans)
window.deleteTransactionAdmin = async function(userUid, transId) {
  try {
    // PREFIXED: Firestore.deleteDoc, Firestore.doc
    await Firestore.deleteDoc(Firestore.doc(db, "users", userUid, "transactions", transId));
    alert('Deleted');
    loadAdmin();
  } catch (err) { alert('Error: ' + err.message); }
};

/* -------------------
   Page initialization
   ------------------- */
window.addEventListener('DOMContentLoaded', () => {

  // PREFIXED: Auth.onAuthStateChanged
  Auth.onAuthStateChanged(auth, (user) => {
    if (user) {
      localStorage.setItem('loggedInUser', user.uid);
    } else {
      localStorage.removeItem('loggedInUser');
    }
  });
  
  // index page
  if (document.getElementById('welcome')) {
    loadApp();
  }
  // admin page
  if (document.getElementById('adminTitle')) {
    loadAdmin();
  }
});