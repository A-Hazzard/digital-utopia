"use client";
import React, { useState, useEffect, useRef } from "react";
import { auth, storage } from "@/lib/firebase";
import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  uploadBytes,
  getDownloadURL,
  ref,
  deleteObject,
} from "firebase/storage";
import { Avatar, Button, Input } from "@nextui-org/react";
import { useUser } from "@/context/UserContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [passwordError, setPasswordError] = useState(""); // New state for password error messages
  const [confirmPasswordError, setConfirmPasswordError] = useState(""); // New state for confirm password error messages

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
      console.error("Error updating username:", error); // Added error logging
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
    setPasswordError(""); // Reset password error message
    setConfirmPasswordError(""); // Reset confirm password error message

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
      console.error("Error signing in with current password:", _); // Added error logging
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
      console.error("Error updating password:", _); // Added error logging
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
        console.error("Error updating avatar:", error); // Added error logging
        toast.error("Failed to update avatar. Please try again.");
      }
    }
  };

  const handleDeleteAvatar = async () => {
    const user = auth.currentUser; // Get the current user

    if (user && user.photoURL) {
      try {
        // Create a reference to the file in Firebase Storage
        const storageRef = ref(storage, user.photoURL);

        // Delete the file from Firebase Storage
        await deleteObject(storageRef);
        // Update the user's profile to set photoURL to null (removes avatar)
        await updateProfile(user, {
          photoURL: '/avatar.svg',
        });

        // Clear the local avatar state
        setLocalAvatar(null);

        // Update the avatar in UserContext
        setAvatarFromContext(null);

        // Show success message
        toast.success("Avatar deleted successfully!");
      } catch (error) {
        console.error("Error deleting avatar:", error); // Added error logging
        toast.error("Failed to delete avatar. Please try again.");
      }
    } else {
      toast.error("User not authenticated or no avatar to delete."); // Handle case where user is not authenticated or no avatar is present
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
          console.error("Error signing in with current password:", error); // Added error logging
        }
      } else {
        setIsCurrentPasswordValid(false);
      }
    }, 1000);
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);

    // Clear previous timeout
    if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
    }

    // Set a new timeout to validate the password after 1 second
    typingTimeout.current = setTimeout(() => {
        if (!validatePassword(value)) {
            setPasswordError("New password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character.");
        } else {
            setPasswordError(""); // Clear error if valid
        }
    }, 1000);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);

    // Check if the confirm password matches the new password
    if (value !== newPassword) {
        setConfirmPasswordError("Passwords do not match.");
    } else {
        setConfirmPasswordError(""); // Clear error if they match
    }
  };

  const isPasswordUpdateButtonDisabled =
    !isCurrentPasswordValid || // Ensure current password is valid
    !validatePassword(newPassword) || // Check if new password is valid
    newPassword !== confirmPassword || // Check if new passwords match
    !currentPassword; // Ensure current password is provided


  if (loading) {
    return null;
  }

  return (
    <>
      <ToastContainer />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-dark text-light p-6 rounded-lg w-full h-full md:w-auto md:h-auto md:max-w-md overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Profile Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-light text-2xl"
            >
              &times;
            </button>
          </div>

          <div className="flex gap-5 items-center mb-4">
            <div>
              <Avatar
                src={localAvatar || "/avatar.svg"}
                alt="Avatar"
                className="w-20 h-20 rounded-full mb-2 object-cover"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => document.getElementById("avatarInput")?.click()}
                className="bg-orange hover:bg-orange-500 text-light"
              >
                Change Picture
              </Button>
              <Button
                onClick={handleDeleteAvatar}
                className="bg-light hover:bg-red-600 text-red-500 hover:text-light"
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
              onChange={handleNewPasswordChange} // Updated to include validation
              className="-ml-3 w-full rounded px-3 py-2 text-gray"
              classNames={{
                input: "text-light",
              }}
              required
            />
            {passwordError && (
              <p className="text-red-500">{passwordError}</p> // Display new password error
            )}

            <Input
              variant="bordered"
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange} // Updated to include validation
              className="-ml-3 w-full rounded px-3 py-2 text-gray"
              classNames={{
                input: "text-light",
              }}
              required
            />
            {confirmPasswordError && (
              <p className="text-red-500">{confirmPasswordError}</p> // Display confirm password error
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
        </div>
      </div>
    </>
  );
}
