"use client";
import { useUser } from "@/context/UserContext";
import { auth, storage } from "@/lib/firebase";
import { Avatar, Button, Input, ModalBody, ModalHeader, ModalContent, Modal, Spinner, ModalFooter } from "@nextui-org/react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import React, { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProfileSettingsModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isUpdateUsernameDisabled, setIsUpdateUsernameDisabled] = useState(true);
  const {
    setUsername: setUsernameFromContext,
    setAvatar: setAvatarFromContext,
  } = useUser();
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setNewUsername(user.displayName?.trim() || "");
        setLocalAvatar(user.photoURL);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace("@", "").trim();
    setNewUsername(value);
    const isValid = value.length >= 3;
    setIsUpdateUsernameDisabled(!isValid);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await updateProfile(auth.currentUser, {
        displayName: newUsername,
        photoURL: localAvatar,
      });
      setUsernameFromContext(newUsername);
      toast.success("Username updated successfully!");
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username. Please try again.");
    }
  };

  const validatePassword = (password: string) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPasswordError("");
    setPasswordError("");
    setConfirmPasswordError("");

    const user = auth.currentUser;
    if (!user) {
      toast.error("User not authenticated.");
      return;
    }

    if (!currentPassword) {
      setCurrentPasswordError("Please enter your current password.");
      return;
    }

    try {
      if (user.email) {
        await signInWithEmailAndPassword(auth, user.email, currentPassword);
        setIsCurrentPasswordValid(true);
      } else {
        throw new Error("User email is not available");
      }
    } catch (_) { 
      console.error("Error signing in with current password:", _);
      setCurrentPasswordError("Current password is incorrect.");
      setIsCurrentPasswordValid(false);
      return;
    }

    if (!validatePassword(newPassword)) {
      setPasswordError("New password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    try {
      await updatePassword(user, newPassword);
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (_) { 
      console.error("Error updating password:", _);
      toast.error("Failed to update password. Please try again.");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && auth.currentUser) {
      const storageRef = ref(
        storage,
        `avatars/${auth.currentUser.uid}/${file.name}`
      );
      try {
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);
        await updateProfile(auth.currentUser, { photoURL });
        setLocalAvatar(photoURL);
        setAvatarFromContext(photoURL);
        toast.success("Avatar updated successfully!");
      } catch (error) {
        console.error("Error updating avatar:", error);
        toast.error("Failed to update avatar. Please try again.");
      }
    }
  };

  const handleDeleteAvatar = async () => {
    const user = auth.currentUser;

    if (user && user.photoURL) {
      try {
        const storageRef = ref(storage, user.photoURL);

        await deleteObject(storageRef);
        await updateProfile(user, {
          photoURL: '/avatar.svg',
        });

        setLocalAvatar(null);

        setAvatarFromContext(null);

        toast.success("Avatar deleted successfully!");
      } catch (error) {
        console.error("Error deleting avatar:", error);
        toast.error("Failed to delete avatar. Please try again.");
      }
    } else {
      toast.error("User not authenticated or no avatar to delete.");
    }
  };

  const handleCurrentPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setCurrentPassword(value);
    
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(async () => {
      const user = auth.currentUser;
      if (user && value && user.email) {
        try {
          await signInWithEmailAndPassword(auth, user.email, value);
          setIsCurrentPasswordValid(true);
          setCurrentPasswordError("");
        } catch (error) {
          setIsCurrentPasswordValid(false);
          setCurrentPasswordError("Current password is incorrect.");
          console.error("Error signing in with current password:", error);
        }
      } else {
        setIsCurrentPasswordValid(false);
      }
    }, 1000);
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);

    if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
        if (!validatePassword(value)) {
            setPasswordError("New password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character.");
        } else {
            setPasswordError("");
        }
    }, 1000);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (value !== newPassword) {
        setConfirmPasswordError("Passwords do not match.");
    } else {
        setConfirmPasswordError("");
    }
  };

  const isPasswordUpdateButtonDisabled =
    !isCurrentPasswordValid ||
    !validatePassword(newPassword) ||
    newPassword !== confirmPassword ||
    !currentPassword;

  const needsReauth = () => {
    const user = auth.currentUser;
    if (!user?.metadata.lastSignInTime) return true;
    
    const lastSignIn = new Date(user.metadata.lastSignInTime);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return lastSignIn < fiveMinutesAgo;
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user?.email) {
      toast.error("No user found");
      return;
    }

    try {
      // Check if reauth is needed
      if (needsReauth()) {
        const credential = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(user, credential);
      }

      // Delete user data from collections
      const batch = writeBatch(db);
      const collections = [
        "users",
        "profits",
        "trades",
        "invoices",
        "deposits",
        "withdrawals",
        "withdrawalRequests",
        "wallets",
      ];

      for (const collectionName of collections) {
        // Delete by userEmail
        const q1 = query(
          collection(db, collectionName),
          where("userEmail", "==", user.email)
        );
        const querySnapshot1 = await getDocs(q1);
        querySnapshot1.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Delete by email
        const q2 = query(
          collection(db, collectionName),
          where("email", "==", user.email)
        );
        const querySnapshot2 = await getDocs(q2);
        querySnapshot2.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Delete document with email as ID
        const docRef = doc(db, collectionName, user.email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          batch.delete(docRef);
        }
      }

      await batch.commit();

      // Delete the user account
      await user.delete();
      
      toast.success("Account deleted successfully");
      router.push("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError("Failed to delete account. Please check your password and try again.");
    }
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <Spinner size="md" />
        </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-dark text-light p-6 rounded-lg w-full h-full md:w-auto md:h-auto xl:w-[40vw] 2xl:w-[30vw] md:max-w-md overflow-y-auto">
          <hr className="border-gray mb-4" />
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Profile Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-light text-2xl"
            >
              &times;
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 items-center mb-4">
            <div>
              <Avatar
                src={localAvatar || "/avatar.svg"}
                alt="Avatar"
                className="w-20 h-20 rounded-full mb-2 object-cover"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => document.getElementById("avatarInput")?.click()}
                className="bg-orange hover:bg-orange-500 text-light w-full sm:w-auto"
              >
                Change Picture
              </Button>
              <Button
                onClick={handleDeleteAvatar}
                className="bg-light hover:bg-red-600 text-red-500 hover:text-light w-full sm:w-auto"
              >
                Delete Picture
              </Button>
            </div>
          </div>

          <input
            id="avatarInput"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />

          <form onSubmit={handleSaveChanges} className="space-y-4">
            <div>
              <label className="block mb-1">Username</label>
              <Input
                variant="bordered"
                type="text"
                placeholder={`@ ${newUsername}`}
                onChange={handleUsernameChange}
                className="-ml-3 w-full rounded px-3 py-2 text-light"
              />
            </div>
            <Button
              type="submit"
              className={`w-fit ${
                isUpdateUsernameDisabled
                  ? "bg-gray text-light cursor-not-allowed"
                  : "bg-orange hover:bg-orange-500 text-light"
              } px-4 py-2 rounded`}
              disabled={isUpdateUsernameDisabled}
            >
              Update Username
            </Button>
          </form>

          <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold mb-2">Update Password</h3>
            <Input
              variant="bordered"
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={handleCurrentPasswordChange}
              className="-ml-3 w-full rounded px-3 py-2 text-gray"
              classNames={{
                input: "text-light",
              }}
              required
            />
            {currentPasswordError && (
              <p className="text-red-500">{currentPasswordError}</p>
            )}

            <Input
              variant="bordered"
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={handleNewPasswordChange}
              className="-ml-3 w-full rounded px-3 py-2 text-gray"
              classNames={{
                input: "text-light",
              }}
              required
            />
            {passwordError && <p className="text-red-500">{passwordError}</p>}

            <Input
              variant="bordered"
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className="-ml-3 w-full rounded px-3 py-2 text-gray"
              classNames={{
                input: "text-light",
              }}
              required
            />
            {confirmPasswordError && (
              <p className="text-red-500">{confirmPasswordError}</p>
            )}

            <Button
              type="submit"
              className={`px-4 py-2 rounded w-fit ${
                isPasswordUpdateButtonDisabled
                  ? "bg-gray text-light cursor-not-allowed"
                  : "bg-orange hover:bg-orange-500 text-light"
              }`}
              disabled={isPasswordUpdateButtonDisabled}
            >
              Update Password
            </Button>
          </form>

          <hr className="border-gray my-6" />

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>
            <Button
              className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-light w-full"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletePassword("");
          setDeleteError("");
        }}
        classNames={{
          base: "bg-darker border border-readonly/30",
          header: "border-b border-readonly/30",
          body: "text-light py-6",
          footer: "border-t border-readonly/30"
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-bold text-light">Delete Account</h2>
          </ModalHeader>
          <ModalBody>
            <p className="text-light mb-4">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <Input
              type="password"
              label="Confirm your password"
              placeholder="Enter your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="mb-2"
              classNames={{
                input: "text-light",
                label: "text-light"
              }}
            />
            {deleteError && <p className="text-red-500 text-sm">{deleteError}</p>}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletePassword("");
                setDeleteError("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 text-light"
              onClick={handleDeleteAccount}
              disabled={!deletePassword}
            >
              Delete Account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
