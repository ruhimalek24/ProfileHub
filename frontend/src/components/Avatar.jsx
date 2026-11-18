import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfilePictureUrl } from '../api/userApi';
import defaultAvatar from '../assets/avataar.jpg';

// Pixel sizes: Navbar, Sidebar, Dashboard, Profile page.
const SIZES = { sm: 32, md: 40, lg: 56, xl: 128 };

// Circular profile picture for the logged-in user.
// Shows the uploaded picture, or the default image (assets/avataar.jpg)
// when there is none or the uploaded one cannot be loaded.
// src: optional image to show instead (used for the upload preview).
function Avatar({ size = 'md', src, className = '' }) {
  const { user } = useAuth();
  const version = user?.profilePictureVersion;
  const uploadedUrl = src || (version ? getProfilePictureUrl(version) : null);

  // Remember which URL failed, so a newly uploaded picture is tried again.
  const [failedUrl, setFailedUrl] = useState(null);
  const showUploaded = uploadedUrl && failedUrl !== uploadedUrl;

  const pixels = SIZES[size] || SIZES.md;

  return (
    <img
      src={showUploaded ? uploadedUrl : defaultAvatar}
      alt={showUploaded ? `${user?.name || 'User'}'s profile picture` : 'Default profile picture'}
      width={pixels}
      height={pixels}
      className={className}
      onError={showUploaded ? () => setFailedUrl(uploadedUrl) : undefined}
      // Round and cropped (not stretched); no separate CSS file needed.
      style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }}
    />
  );
}

export default Avatar;
