import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import React from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";

// When i sign in, check if user exists
// If not, create db references and docs and collection for it like this:
// users / displayName (name, bio, reviews, watched) /favourites (movieid, isfav) / reviews (movieid, review) /watched(movieid, iswatched)/watchlist

export const SignInWithGoogle = () => {
  const signInWithGoogle = async () => {
    if (!auth || !db) {
      return;
    }

    const authInstance = auth;
    const dbInstance = db;
    let provider = new GoogleAuthProvider();

    await signInWithPopup(authInstance, provider)
      .then(async () => {
        // verify if user exists in firestore db
        const userDoc = await getDoc(
          doc(dbInstance, "users/" + authInstance?.currentUser?.uid)
        );

        // create a new doc reference for the new user
        if (!userDoc.exists()) {
          await addNewUserToDB();
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(
          "error while signing in with google account: ",
          errorCode,
          errorMessage
        );
      });
  };

  const addNewUserToDB = async () => {
    if (!auth || !db || !auth.currentUser) return;

    const authInstance = auth;
    const dbInstance = db;
    const currentUser = authInstance.currentUser;
    if (!currentUser) return;

    await setDoc(doc(dbInstance, "users", currentUser.uid), {
      name: currentUser.displayName,
      uid: currentUser.uid,
      bio: "My movie watching journey, on clonnerboxd :)",
      photoUrl: currentUser.photoURL,
      reviews: [],
      watched: [],
      favourites: [],
    }).catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(
        "could not create a new firebase doc: ",
        errorCode,
        errorMessage
      );
    });
  };

  return (
    <p
      className="sans-serif text-sh-grey md:hover:text-p-white z-50 mx-3 font-bold uppercase tracking-widest md:mx-0 md:ml-4 md:text-xs md:hover:cursor-pointer"
      onClick={signInWithGoogle}
    >
      Google
    </p>
  );
};
