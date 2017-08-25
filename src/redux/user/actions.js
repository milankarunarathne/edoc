/**
 * User Actions
 *
 * React Native Starter App
 * https://github.com/mcnamee/react-native-starter-app
 */
import { AsyncStorage } from 'react-native';
import { ErrorMessages, Firebase, FirebaseRef } from '@constants/';
import * as RecipeActions from '../recipes/actions';

/**
  * Get Login Credentials from AsyncStorage
  */
async function getCredentialsFromStorage() {
  const values = await AsyncStorage.getItem('api/credentials');
  const jsonValues = JSON.parse(values);

  // Return credentials from storage, or an empty object
  if (jsonValues.email || jsonValues.password) return jsonValues;
  return {};
}

/**
  * Save Login Credentials to AsyncStorage
  */
async function saveCredentialsToStorage(email = '', password = '') {
  await AsyncStorage.setItem('api/credentials', JSON.stringify({ email, password }));
}

/**
  * Remove Login Credentials from AsyncStorage
  */
async function removeCredentialsFromStorage() {
  await AsyncStorage.removeItem('api/credentials');
}

async function getPatientIdFromStorage() {
  const values = await AsyncStorage.getItem('api/patientId');
  let jsonValues = {};
  if (values) {
    jsonValues = JSON.parse(values);
  }

  if (jsonValues.patientId) return jsonValues.patientId;
  return 0;
}

async function savePatientIdToStorage(patientId = 0) {
  await AsyncStorage.setItem('api/patientId', JSON.stringify({ patientId }));
}

/**
  * Save this User's Details
  */
async function saveUserData(userData) {
  await AsyncStorage.setItem(`api/patient/${userData.email}`, JSON.stringify(userData));
}

/**
  * Get this User's Details
  */
async function getUserData(email) {
  const values = await AsyncStorage.getItem(`api/patient/${email}`);
  const userData = JSON.parse(values);

  if (userData.patientId) return userData;
  return {};
}

/**
  * Login to Firebase with Email/Password
  */
export function login(formData = {}) {
  console.log('login', formData);
  return () => new Promise((resolve, reject) => {
    // Reassign variables for eslint ;)
    const email = formData.Email || '';
    const password = formData.Password || '';

    if (!email || !password) {
      reject({ message: 'Need username and password.' });
    }
    // Update Login Creds in AsyncStorage
    if (email && password) {
      getUserData(email).then((userData) => {
        console.log('111', userData);
        const emailValid = userData.email;
        const passwordValid = userData.password;
        if (email === emailValid && password === passwordValid) {
          saveCredentialsToStorage(emailValid, passwordValid);
          resolve({
            type: 'USER_LOGIN',
            data: userData,
          });
        } else {
          reject({ message: 'Invalid credentials !' });
        }
      }).catch(() => {
        reject({ message: 'User isnt Registered' });
      });
    }
  });
}

/**
  * Sign Up to Firebase
  */
export function signUp(formData = {}) {
  console.log('signUp', formData);
  return () => new Promise((resolve) => {
    const email = formData.Email || '';
    const password = formData.Password || '';
    const firstName = formData.FirstName || '';
    const lastName = formData.LastName || '';

    const patientId = getPatientIdFromStorage() + 1;
    saveUserData({
      patientId,
      email,
      password,
      firstName,
      lastName,
    });
    savePatientIdToStorage(patientId).then(() => {
      resolve({ message: 'Successfully Registered !.' });
    }).catch(() => {
      resolve({ message: 'Cant save user.' });
    });
  });
}

/**
  * Reset Password
  */
export function resetPassword(formData = {}) {
  if (Firebase === null) {
    return () => new Promise((resolve, reject) =>
      reject({ message: ErrorMessages.invalidFirebase }));
  }

  const email = formData.Email || '';
  return () => Firebase.auth().sendPasswordResetEmail(email);
}

/**
  * Update Profile
  */
export function updateProfile(formData = {}) {
  if (Firebase === null) {
    return () => new Promise((resolve, reject) =>
      reject({ message: ErrorMessages.invalidFirebase }));
  }

  const UID = Firebase.auth().currentUser.uid;
  if (!UID) return false;

  const email = formData.Email || '';
  const firstName = formData.FirstName || '';
  const lastName = formData.LastName || '';

  // Set the email against user account
  return () => Firebase.auth().currentUser
    .updateEmail(email)
      .then(() => {
        // Then update user in DB
        FirebaseRef.child(`users/${UID}`).update({
          firstName, lastName,
        });
      });
}

/**
  * Logout
  */
export function logout() {
  if (Firebase === null) {
    return () => new Promise((resolve, reject) =>
      reject({ message: ErrorMessages.invalidFirebase }));
  }

  return dispatch => Firebase.auth()
    .signOut()
    .then(() => {
      removeCredentialsFromStorage();
      RecipeActions.resetFavourites(dispatch);
      dispatch({ type: 'USER_LOGOUT' });
    });
}
