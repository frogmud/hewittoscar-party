import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Modal,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { tokens } from '../theme';
import manifest from '../data/photo-manifest.json';

type Manifest = Record<string, string[]>;
const photoManifest = manifest as Manifest;

const YEARS = Object.keys(photoManifest).sort();

/**
 * Build a URL to a photo in the reference directory.
 * In dev, Vite serves from the fs-allowed directory via /@fs/ prefix.
 * The manifest paths are relative to each year folder.
 */
function photoUrl(year: string, relativePath: string): string {
  // Encode each path segment for URLs with spaces
  const encoded = relativePath
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  return `/@fs/Users/kevin/atlas-t/_big_reference/HEWITTOSCARPARTY/${year}/${encoded}`;
}

function extractFilename(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export function Gallery() {
  const { year: urlYear } = useParams<{ year?: string }>();
  const navigate = useNavigate();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const selectedYear = urlYear && YEARS.includes(urlYear) ? urlYear : null;

  const photos = useMemo(() => {
    if (selectedYear) {
      return (photoManifest[selectedYear] || []).map((p) => ({
        year: selectedYear,
        path: p,
      }));
    }
    // Show all years, most recent first
    return YEARS.slice()
      .reverse()
      .flatMap((y) =>
        (photoManifest[y] || []).map((p) => ({ year: y, path: p }))
      );
  }, [selectedYear]);

  const totalAllPhotos = YEARS.reduce(
    (sum, y) => sum + (photoManifest[y]?.length || 0),
    0
  );

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % photos.length);
  };

  const goPrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
  };

  const current = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          bgcolor: tokens.colors.background,
          borderBottom: `1px solid ${tokens.colors.border}`,
          backdropFilter: 'blur(8px)',
          px: { xs: 2, md: 4 },
          py: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PhotoLibraryIcon sx={{ color: tokens.colors.accent }} />
            <Typography
              variant="h3"
              sx={{ fontWeight: 700, color: tokens.colors.accent, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              Hewitt Oscar Party
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: tokens.colors.text.muted }}>
            {selectedYear
              ? `${photos.length} photos`
              : `${totalAllPhotos} photos across ${YEARS.length} years`}
          </Typography>
        </Box>

        {/* Year chips */}
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          <Chip
            label="All Years"
            size="small"
            onClick={() => navigate('/')}
            sx={{
              bgcolor: !selectedYear ? `${tokens.colors.accent}30` : 'transparent',
              color: !selectedYear ? tokens.colors.accent : tokens.colors.text.muted,
              border: `1px solid ${!selectedYear ? tokens.colors.accent : tokens.colors.border}`,
              mb: 0.5,
            }}
          />
          {YEARS.map((y) => (
            <Chip
              key={y}
              label={`${y} (${photoManifest[y]?.length || 0})`}
              size="small"
              onClick={() => navigate(`/${y}`)}
              sx={{
                bgcolor: selectedYear === y ? `${tokens.colors.accent}30` : 'transparent',
                color: selectedYear === y ? tokens.colors.accent : tokens.colors.text.muted,
                border: `1px solid ${selectedYear === y ? tokens.colors.accent : tokens.colors.border}`,
                mb: 0.5,
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Photo grid */}
      <Box sx={{ px: { xs: 1, md: 4 }, py: 3 }}>
        {photos.length === 0 ? (
          <Typography
            variant="body1"
            sx={{ color: tokens.colors.text.muted, textAlign: 'center', py: 8 }}
          >
            No photos found.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(5, 1fr)',
              },
              gap: 1,
            }}
          >
            {photos.map((photo, index) => (
              <Box
                key={`${photo.year}-${photo.path}`}
                onClick={() => openLightbox(index)}
                sx={{
                  position: 'relative',
                  paddingTop: '100%',
                  overflow: 'hidden',
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: tokens.colors.paper,
                  border: `1px solid ${tokens.colors.border}`,
                  transition: 'all 150ms ease',
                  '&:hover': {
                    borderColor: tokens.colors.accent,
                    transform: 'scale(1.02)',
                    zIndex: 1,
                  },
                }}
              >
                <Box
                  component="img"
                  src={photoUrl(photo.year, photo.path)}
                  alt={extractFilename(photo.path)}
                  loading="lazy"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {!selectedYear && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      px: 1,
                      py: 0.5,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: '#fff', fontSize: '0.7rem' }}
                    >
                      {photo.year}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Lightbox */}
      <Modal open={lightboxIndex !== null} onClose={closeLightbox}>
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'Escape') closeLightbox();
          }}
          tabIndex={0}
        >
          <IconButton
            onClick={closeLightbox}
            sx={{ position: 'absolute', top: 16, right: 16, color: '#fff' }}
          >
            <CloseIcon />
          </IconButton>
          <IconButton
            onClick={goPrev}
            sx={{ position: 'absolute', left: 16, color: '#fff' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <IconButton
            onClick={goNext}
            sx={{ position: 'absolute', right: 16, color: '#fff' }}
          >
            <ArrowForwardIcon />
          </IconButton>
          {current && (
            <Box sx={{ textAlign: 'center', maxWidth: '90vw', maxHeight: '90vh' }}>
              <Box
                component="img"
                src={photoUrl(current.year, current.path)}
                alt={extractFilename(current.path)}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
              <Typography variant="body2" sx={{ color: '#fff', mt: 2 }}>
                {current.year} / {extractFilename(current.path)}
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.colors.text.muted }}>
                {lightboxIndex !== null ? lightboxIndex + 1 : 0} of {photos.length}
              </Typography>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
