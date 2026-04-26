import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDisplayNameMaxLength } from '../logic/core/identity';
import { compressImageFileToDataUrl, ImageCompressError } from '../lib/imageCompress';
import {
  LOCAL_PROFILE_CHANGED_EVENT,
  PROFILE_STORAGE_KEY,
  loadProfile,
} from '../services/localStorageService';
import {
  normalizeLadderDisplayName,
  saveLadderIdentity,
  sanitizeAvatarUrlForLeaderboard,
} from '../services/ladderIdentityService';
import { useAuthStore } from '../stores/authStore';

function readIdentityFieldsFromStorage(): { displayName: string; committedAvatarUrl: string | undefined } {
  const p = loadProfile();
  return {
    displayName: p?.displayName?.trim() ?? '',
    committedAvatarUrl: sanitizeAvatarUrlForLeaderboard(p?.avatarUrl),
  };
}

export function useLadderIdentityForm() {
  const { t } = useTranslation('common');
  const [fields, setFields] = useState(() => readIdentityFieldsFromStorage());
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const savedToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayName = fields.displayName;
  const committedAvatarUrl = fields.committedAvatarUrl;

  const setDisplayName = useCallback((value: string) => {
    setFields((prev) => ({ ...prev, displayName: value }));
  }, []);

  const syncFromStorage = useCallback(() => {
    setFields(readIdentityFieldsFromStorage());
    setPendingAvatarUrl(null);
    setAvatarRemoved(false);
  }, []);

  useEffect(() => {
    const onLocalChange = () => syncFromStorage();
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PROFILE_STORAGE_KEY && e.key !== null) return;
      onLocalChange();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(LOCAL_PROFILE_CHANGED_EVENT, onLocalChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LOCAL_PROFILE_CHANGED_EVENT, onLocalChange);
    };
  }, [syncFromStorage]);

  useEffect(
    () => () => {
      if (savedToastTimerRef.current) {
        clearTimeout(savedToastTimerRef.current);
        savedToastTimerRef.current = null;
      }
    },
    []
  );

  const previewAvatarUrl = avatarRemoved
    ? undefined
    : pendingAvatarUrl ?? committedAvatarUrl ?? undefined;

  const pickAvatarFile = async (file: File | null) => {
    if (!file) return;
    setErrorKey(null);
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      setPendingAvatarUrl(dataUrl);
      setAvatarRemoved(false);
    } catch (e) {
      if (e instanceof ImageCompressError && e.code === 'too-large') {
        setErrorKey('home.ladderIdentity.errorImageTooLarge');
      } else {
        setErrorKey('home.ladderIdentity.errorImage');
      }
    }
  };

  const clearAvatar = () => {
    setPendingAvatarUrl(null);
    setAvatarRemoved(true);
    setErrorKey(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorKey(null);
    const name = normalizeLadderDisplayName(displayName);
    if (!name) {
      setErrorKey('home.ladderIdentity.errorEmptyName');
      return;
    }

    setSaving(true);
    try {
      if (avatarRemoved) {
        saveLadderIdentity({ displayName: name, clearAvatar: true });
      } else if (pendingAvatarUrl !== null) {
        saveLadderIdentity({ displayName: name, avatarUrl: pendingAvatarUrl });
      } else {
        saveLadderIdentity({ displayName: name });
      }
      useAuthStore.getState().refreshDisplayNameFromProfiles();
      setJustSaved(true);
      if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current);
      savedToastTimerRef.current = setTimeout(() => {
        setJustSaved(false);
        savedToastTimerRef.current = null;
      }, 2200);
      syncFromStorage();
    } catch {
      setErrorKey('home.ladderIdentity.errorSave');
    } finally {
      setSaving(false);
    }
  };

  return {
    t,
    displayName,
    setDisplayName,
    previewAvatarUrl,
    pickAvatarFile,
    clearAvatar,
    handleSubmit,
    saving,
    justSaved,
    errorKey,
    displayNameMax: getDisplayNameMaxLength(),
  };
}
