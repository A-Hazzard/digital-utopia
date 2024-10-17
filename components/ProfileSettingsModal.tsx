"use client";
import React, { useState, useEffect } from "react";
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
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [isCurrentPasswordChecked, setIsCurrentPasswordChecked] =
    useState(false);
  const [hasAttemptedUpdate, setHasAttemptedUpdate] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [
    hasInteractedWithCurrentPassword,
    setHasInteractedWithCurrentPassword,
  ] = useState(false);

  const {
    setUsername: setUsernameFromContext,
    setAvatar: setAvatarFromContext,
  } = useUser();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsername(user.displayName?.trim() || "");
        setNewUsername(user.displayName?.trim() || "");
        setLocalAvatar(user.photoURL);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUsername(e.target.value.replace("@", "").trim());
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!auth.currentUser) return;

    try {
      await updateProfile(auth.currentUser, {
        displayName: newUsername,
        photoURL: localAvatar,
      });
      setUsernameFromContext(newUsername);
      toast.success("Username updated successfully!");
    } catch (error) {
      setError("Failed to update username. Please try again.");
    }
  };

  const validatePassword = (password: string) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCurrentPasswordError("");
    setHasAttemptedUpdate(true);

    const user = auth.currentUser;
    if (!user) {
      setError("User not authenticated.");
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
        setIsCurrentPasswordChecked(true);
      } else {
        throw new Error("User email is not available");
      }
    } catch (error) {
      setCurrentPasswordError("Current password is incorrect.");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError(
        "New password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      await updatePassword(user, newPassword);
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError("Failed to update password. Please try again.");
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
        
        console.log(user)

        // Clear the local avatar state
        setLocalAvatar(null);

        // Update the avatar in UserContext
        setAvatarFromContext(null);

        // Show success message
        toast.success("Avatar deleted successfully!");
      } catch (error) {
        console.error("Error deleting avatar:", error); // Log the error for debugging
        toast.error("Failed to delete avatar. Please try again."); // Show error message
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
    setHasInteractedWithCurrentPassword(true);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    setTypingTimeout(
      setTimeout(async () => {
        const user = auth.currentUser;
        if (user && value && user.email) {
          try {
            await signInWithEmailAndPassword(auth, user.email, value);
            setIsCurrentPasswordValid(true);
            setIsCurrentPasswordChecked(true);
            setCurrentPasswordError("");
          } catch (error) {
            setIsCurrentPasswordValid(false);
            setCurrentPasswordError("Current password is incorrect.");
          }
        } else {
          setIsCurrentPasswordValid(false);
        }
      }, 1000)
    );
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    setIsNewPasswordValid(validatePassword(value));
  };

  const isUpdateButtonDisabled =
    !isCurrentPasswordValid ||
    !isNewPasswordValid ||
    newPassword !== confirmPassword ||
    !currentPassword;

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

          {error && <p className="text-red-500 mb-4">{error}</p>}

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
              className="w-fit bg-gray hover:bg-orange text-light px-4 py-2 rounded"
            >
              Save Changes
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
              readOnly={!isCurrentPasswordValid}
            />
            {!isCurrentPasswordValid && hasInteractedWithCurrentPassword && (
              <p className="text-red-500 text-sm transition-opacity duration-300 ease-in-out animate-fadeIn">
                Please validate your current password first.
              </p>
            )}

            <Input
              variant="bordered"
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="-ml-3 w-full rounded px-3 py-2 text-gray"
              classNames={{
                input: "text-light",
              }}
              required
              readOnly={!isNewPasswordValid}
            />
            {!isNewPasswordValid && hasInteractedWithCurrentPassword && (
              <p className="text-red-500 text-sm transition-opacity duration-300 ease-in-out animate-fadeIn">
                New password must be at least 8 characters long, contain at
                least one uppercase letter, one lowercase letter, and one
                special character.
              </p>
            )}

            <Button
              type="submit"
              className={`px-4 py-2 rounded w-fit ${
                isUpdateButtonDisabled
                  ? "bg-gray text-light cursor-not-allowed"
                  : "bg-orange hover:bg-orange-500 text-light"
              }`}
              disabled={isUpdateButtonDisabled}
            >
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
