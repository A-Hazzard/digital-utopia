const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK with the service account
const serviceAccount = require('./digital-utopia-3df50-firebase-adminsdk-f5y20-bc2e7b209d.json'); // Update this path

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

async function updateUsers() {
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.get();

    const batch = admin.firestore().batch();

    snapshot.forEach(doc => {
        const userData = doc.data();
        const lastWithdrawalTime = userData.lastWithdrawalTime || null; // Default to null if not set

        // Update the user document with lastWithdrawalTime
        batch.update(doc.ref, { lastWithdrawalTime: lastWithdrawalTime });
    });

    await batch.commit();
    console.log('All users updated with lastWithdrawalTime.');
}

// Run the update function
updateUsers().catch(console.error);