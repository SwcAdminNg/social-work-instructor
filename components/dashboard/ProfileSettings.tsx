"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { IconSpinner } from "@/components/auth/shared/icons";
import {
  Save,
  UserCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { InstructorDocumentsSettings } from "./InstructorDocumentsSettings";

type ProfileUser = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  gender?: string | null;
  username?: string | null;
  profile_picture_url?: string | null;
  cv_file_name?: string | null;
};

export function ProfileSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { update } = useSession();
  const profilePhotoPrompt = searchParams.has("profile_photo");
  const photoUploadCallbackUrl = searchParams.get("callbackUrl");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [failedProfilePictureUrl, setFailedProfilePictureUrl] = useState<
    string | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoSectionRef = useRef<HTMLDivElement>(null);
  const hasScrolledToPhotoPrompt = useRef(false);

  // Profile Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");

  // Username State
  const [currentUsername, setCurrentUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );

  const fetchProfile = async (): Promise<ProfileUser> => {
    const res = await fetch("/api/proxy/users/me");
    if (!res.ok) {
      throw new Error("Failed to load profile data.");
    }
    const data = await res.json();
    return data.data;
  };

  const { data: user, isPending: loading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load profile data.");
    }
  }, [isError]);

  useEffect(() => {
    if (loading || !profilePhotoPrompt || hasScrolledToPhotoPrompt.current) {
      return;
    }

    photoSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    hasScrolledToPhotoPrompt.current = true;
  }, [loading, profilePhotoPrompt]);

  useEffect(() => {
    if (user && !hasSynced) {
      const timeout = window.setTimeout(() => {
        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
        setPhoneNumber(user.phone_number || "");
        setAddress(user.address || "");
        setGender(user.gender || "");
        setCurrentUsername(user.username || "");
        setNewUsername(user.username || "");
        setProfilePictureUrl(user.profile_picture_url || null);
        setHasSynced(true);
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [user, hasSynced]);

  // Username Availability Checker (Debounced)
  useEffect(() => {
    if (!newUsername || newUsername.length < 3) {
      const timeout = window.setTimeout(() => setUsernameAvailable(null), 0);
      return () => window.clearTimeout(timeout);
    }

    if (newUsername === currentUsername) {
      const timeout = window.setTimeout(() => setUsernameAvailable(null), 0);
      return () => window.clearTimeout(timeout);
    }

    const delayDebounceFn = setTimeout(async () => {
      setCheckingUsername(true);

      try {
        const res = await fetch(
          `/api/proxy/username/availability?username=${encodeURIComponent(newUsername)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setUsernameAvailable(data.data.available);
        } else {
          setUsernameAvailable(null);
        }
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [newUsername, currentUsername]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await fetch("/api/proxy/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          address: address,
          gender: gender || undefined, // Send undefined if empty so backend ignores or handles it
        }),
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update profile.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername || newUsername === currentUsername) return;
    if (usernameAvailable === false) {
      toast.error("This username is already taken.");
      return;
    }

    setSavingUsername(true);
    try {
      const res = await fetch("/api/proxy/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
        }),
      });

      if (res.ok) {
        toast.success("Username updated successfully!");
        setCurrentUsername(newUsername);
        setUsernameAvailable(null);
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update username.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSavingUsername(false);
    }
  };

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    setUploadingPicture(true);

    try {
      const uploadUrlRes = await fetch(
        "/api/proxy/users/me/profile-picture-upload-url",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_name: file.name,
            content_type: file.type,
          }),
        },
      );

      const uploadUrlJson = await uploadUrlRes.json().catch(() => ({}));

      if (!uploadUrlRes.ok) {
        throw new Error(
          uploadUrlJson?.message || "Could not prepare your profile picture.",
        );
      }

      const uploadUrl = uploadUrlJson?.data?.upload_url;
      const nextProfilePictureUrl = uploadUrlJson?.data?.profile_picture_url;

      if (!uploadUrl || !nextProfilePictureUrl) {
        throw new Error("Profile picture upload data was incomplete.");
      }

      const storageRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!storageRes.ok) {
        throw new Error("Upload failed. Please try choosing the image again.");
      }

      setProfilePictureUrl(nextProfilePictureUrl);
      queryClient.setQueryData<ProfileUser | undefined>(["profile"], (current) =>
        current
          ? { ...current, profile_picture_url: nextProfilePictureUrl }
          : current,
      );
      await update({ profile_picture_url: nextProfilePictureUrl });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.refresh();
      toast.success("Profile photo updated successfully!");

      if (photoUploadCallbackUrl?.startsWith("/")) {
        router.push(photoUploadCallbackUrl);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again.",
      );
    } finally {
      setUploadingPicture(false);
    }
  };

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    "Instructor";
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "L";
  const profilePictureImageUrl =
    profilePictureUrl && profilePictureUrl !== failedProfilePictureUrl
      ? profilePictureUrl
      : null;
  const hasProfilePicture = Boolean(profilePictureUrl);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <IconSpinner className="w-8 h-8 animate-spin text-[#2D6A4F]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-10 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Account Settings
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Manage your personal information and account details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Left Column: General Info */}
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-[#2D6A4F]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Personal Information
              </h2>
              <p className="text-sm text-gray-500">
                Update your personal details.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm transition-all focus:bg-white dark:focus:bg-gray-800 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 outline-none"
                  placeholder="e.g. John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm transition-all focus:bg-white dark:focus:bg-gray-800 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 outline-none"
                  placeholder="e.g. Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm transition-all focus:bg-white dark:focus:bg-gray-800 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 outline-none"
                  placeholder="e.g. 09012345678"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm transition-all focus:bg-white dark:focus:bg-gray-800 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 outline-none appearance-none"
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Home Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm transition-all focus:bg-white dark:focus:bg-gray-800 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 outline-none resize-none"
                placeholder="Enter your full address"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] px-6 text-sm font-semibold text-white transition-all hover:bg-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[#2D6A4F]/20"
              >
                {savingProfile ? (
                  <IconSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Profile
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Username & Critical Settings */}
        <div className="space-y-6">
          <div
            ref={photoSectionRef}
            className={`bg-white dark:bg-[#121212] border rounded-3xl p-6 md:p-8 shadow-sm transition ${
              profilePhotoPrompt && !hasProfilePicture
                ? "border-[#2D6A4F] ring-4 ring-[#2D6A4F]/10 dark:border-[#52b788] dark:ring-[#52b788]/10"
                : "border-gray-200 dark:border-gray-800"
            }`}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Profile Photo
                </h2>
                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Add a clear profile photo for your instructor account.
                </p>
              </div>
              <span
                className={`rounded-md px-2 py-1 text-[0.68rem] font-extrabold uppercase ${
                  hasProfilePicture
                    ? "bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]"
                    : "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-300"
                }`}
              >
                {hasProfilePicture ? "Ready" : "Required"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#2D6A4F] text-2xl font-extrabold text-white shadow-[0_18px_34px_-24px_rgba(45,106,79,0.95)] dark:bg-[#52b788] dark:text-[#06130d]">
                {profilePictureImageUrl ? (
                  <img
                    src={profilePictureImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() =>
                      setFailedProfilePictureUrl(profilePictureImageUrl)
                    }
                  />
                ) : (
                  avatarInitial
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                  {displayName}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Use a clear, professional headshot for your account and
                  community presence.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                  className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] px-4 text-sm font-semibold text-white transition-all hover:bg-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {uploadingPicture ? (
                    <IconSpinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {uploadingPicture
                    ? "Uploading..."
                    : hasProfilePicture
                      ? "Change Photo"
                      : "Add Photo"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleProfilePictureUpload}
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Username
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Your unique identifier on the platform. It must be at least 3
              characters long.
            </p>

            <div className="space-y-4">
              <div className="space-y-2 relative">
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400 font-medium select-none pointer-events-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) =>
                      setNewUsername(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      )
                    }
                    className={`w-full rounded-xl border bg-white dark:bg-gray-900 py-3 pl-9 pr-12 text-sm transition-all focus:outline-none focus:ring-2 outline-none font-medium ${
                      usernameAvailable === true
                        ? "border-green-500 focus:ring-green-500/20"
                        : usernameAvailable === false
                          ? "border-red-500 focus:ring-red-500/20 text-red-600"
                          : "border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20"
                    }`}
                    placeholder="username"
                  />
                  <div className="absolute right-4 flex items-center justify-center">
                    {checkingUsername ? (
                      <IconSpinner className="w-4 h-4 text-indigo-500 animate-spin" />
                    ) : usernameAvailable === true ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : usernameAvailable === false ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : null}
                  </div>
                </div>

                {usernameAvailable === true && (
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 px-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Username is available!
                  </p>
                )}
                {usernameAvailable === false && (
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 px-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <XCircle className="w-3.5 h-3.5" />
                    This username is already taken.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleUpdateUsername}
                disabled={
                  savingUsername ||
                  newUsername === currentUsername ||
                  usernameAvailable === false ||
                  newUsername.length < 3
                }
                className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition-all hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
              >
                {savingUsername ? (
                  <IconSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  "Claim Username"
                )}
              </button>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-orange-900 dark:text-orange-400 mb-1">
                  Important Note
                </h3>
                <p className="text-xs text-orange-800/80 dark:text-orange-300/80 leading-relaxed">
                  Changing your username will alter your public profile URL. Any
                  old links pointing to your profile will break.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InstructorDocumentsSettings />
    </div>
  );
}
