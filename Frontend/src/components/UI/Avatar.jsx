import { useState } from 'react';

// Foto del usuario, o la inicial de su nombre si no tiene (o si la URL no carga)
export default function Avatar({ user, className = 'avatar' }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const name = user?.display_name || user?.username || '?';
  const showImage = user?.avatar_url && user.avatar_url !== failedUrl;

  return (
    <div className={className}>
      {showImage ? (
        <img src={user.avatar_url} alt={name} onError={() => setFailedUrl(user.avatar_url)} />
      ) : (
        name[0].toUpperCase()
      )}
    </div>
  );
}
