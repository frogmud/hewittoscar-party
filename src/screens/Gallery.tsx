import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
const BATCH_SIZE = 40;

/**
 * Build a URL to a photo in the reference directory.
 * In dev, Vite serves from the fs-allowed directory via /@fs/ prefix.
 * The manifest paths are relative to each year folder.
 */
function photoUrl(year: string, relativePath: string): string {
  const encoded = relativePath
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  if (import.meta.env.DEV) {
    return `/@fs/Users/kevin/atlas-t/_big_reference/HEWITTOSCARPARTY/${year}/${encoded}`;
  }
  return `/photos/${year}/${encoded}`;
}

function extractFilename(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export function Gallery() {
  const { year: urlYear } = useParams<{ year?: string }>();
  const navigate = useNavigate();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isAllView = urlYear === 'all';
  const selectedYear = urlYear && YEARS.includes(urlYear) ? urlYear : null;
  const showTable = !selectedYear && !isAllView;

  // Reset batch count when navigating between views
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
    setLightboxIndex(null);
  }, [urlYear]);

  const allPhotos = useMemo(
    () =>
      YEARS.slice()
        .reverse()
        .flatMap((y) =>
          (photoManifest[y] || []).map((p) => ({ year: y, path: p }))
        ),
    []
  );

  const photos = useMemo(() => {
    if (isAllView) return allPhotos;
    if (!selectedYear) return [];
    return (photoManifest[selectedYear] || []).map((p) => ({
      year: selectedYear,
      path: p,
    }));
  }, [selectedYear, isAllView, allPhotos]);

  const displayedPhotos = isAllView ? photos.slice(0, visibleCount) : photos;
  const hasMore = isAllView && visibleCount < photos.length;

  const totalAllPhotos = YEARS.reduce(
    (sum, y) => sum + (photoManifest[y]?.length || 0),
    0
  );

  const yearData = useMemo(
    () =>
      YEARS.slice()
        .reverse()
        .map((y) => ({ year: y, count: photoManifest[y]?.length || 0 })),
    []
  );

  // Random highlights — reshuffled on every page load
  const [highlightPhotos] = useState(() => {
    const pool = YEARS.flatMap((y) =>
      (photoManifest[y] || []).map((p) => ({ year: y, path: p }))
    );
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 12);
  });

  // IntersectionObserver for lazy loading in "all" view
  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + BATCH_SIZE, photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (!isAllView) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isAllView, loadMore]);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % displayedPhotos.length);
  };

  const goPrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + displayedPhotos.length) % displayedPhotos.length);
  };

  const current = lightboxIndex !== null ? displayedPhotos[lightboxIndex] : null;

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
            mb: showTable ? 0 : 2,
          }}
        >
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, color: tokens.colors.accent, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Hewitt Oscar Party
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.colors.text.muted }}>
            {isAllView
              ? `${displayedPhotos.length} of ${totalAllPhotos} photos`
              : selectedYear
                ? `${photos.length} photos`
                : `${totalAllPhotos} photos across ${YEARS.length} years`}
          </Typography>
        </Box>

        {/* Year chips — shown when viewing photos (not the table) */}
        {!showTable && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Chip
              label="All Years"
              size="small"
              onClick={() => navigate('/all')}
              sx={{
                bgcolor: isAllView ? `${tokens.colors.accent}30` : 'transparent',
                color: isAllView ? tokens.colors.accent : tokens.colors.text.muted,
                border: `1px solid ${isAllView ? tokens.colors.accent : tokens.colors.border}`,
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
        )}
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 1, md: 4 }, py: 3 }}>
        {showTable ? (
          /* Homepage — highlights + compact year listing */
          <Box sx={{ maxWidth: 720, mx: 'auto' }}>
            {/* Highlights grid */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="body2"
                sx={{
                  color: tokens.colors.text.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  mb: 1.5,
                }}
              >
                Highlights
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gridTemplateRows: 'repeat(3, 1fr)',
                  gap: 1,
                  aspectRatio: '4 / 3',
                }}
              >
                {highlightPhotos.map((photo, i) => (
                  <Box
                    key={`hl-${photo.year}-${i}`}
                    onClick={() => navigate(`/${photo.year}`)}
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 1,
                      cursor: 'pointer',
                      bgcolor: tokens.colors.paper,
                      border: `1px solid ${tokens.colors.border}`,
                      transition: 'all 150ms ease',
                      // Make first and last items span 2 cells for visual interest
                      ...(i === 0 && {
                        gridColumn: 'span 2',
                        gridRow: 'span 2',
                      }),
                      ...(i === 9 && {
                        gridColumn: 'span 2',
                      }),
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
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        px: 1,
                        py: 0.5,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: '#fff', fontSize: '0.7rem', fontWeight: 500 }}
                      >
                        {photo.year}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Year listing — compact rows */}
            <Typography
              variant="body2"
              sx={{
                color: tokens.colors.text.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.75rem',
                fontWeight: 600,
                mb: 1.5,
              }}
            >
              Browse by Year
            </Typography>
            <Stack spacing={0}>
              {yearData.map((row) => (
                <Box
                  key={row.year}
                  onClick={() => navigate(`/${row.year}`)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.25,
                    px: 2,
                    cursor: 'pointer',
                    borderBottom: `1px solid ${tokens.colors.border}`,
                    transition: 'background 100ms ease',
                    '&:first-of-type': {
                      borderTop: `1px solid ${tokens.colors.border}`,
                    },
                    '&:hover': {
                      bgcolor: tokens.colors.elevated,
                    },
                  }}
                >
                  <Typography
                    sx={{ color: tokens.colors.text.primary, fontWeight: 500, fontSize: '0.9rem' }}
                  >
                    {row.year}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      sx={{ color: tokens.colors.text.muted, fontSize: '0.85rem' }}
                    >
                      {row.count}
                    </Typography>
                    <PhotoLibraryIcon
                      sx={{ fontSize: 16, color: tokens.colors.text.muted }}
                    />
                  </Stack>
                </Box>
              ))}
            </Stack>

            {/* View all link */}
            <Box
              onClick={() => navigate('/all')}
              sx={{
                mt: 2,
                py: 1.5,
                textAlign: 'center',
                cursor: 'pointer',
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: 1,
                color: tokens.colors.accent,
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 150ms ease',
                '&:hover': {
                  bgcolor: `${tokens.colors.accent}10`,
                  borderColor: tokens.colors.accent,
                },
              }}
            >
              View all {totalAllPhotos} photos
            </Box>
          </Box>
        ) : displayedPhotos.length === 0 ? (
          <Typography
            variant="body1"
            sx={{ color: tokens.colors.text.muted, textAlign: 'center', py: 8 }}
          >
            No photos found.
          </Typography>
        ) : (
          /* Photo grid — year detail or all-years view */
          <>
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
              {displayedPhotos.map((photo, index) => (
                <Box
                  key={`${photo.year}-${photo.path}-${index}`}
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
                  {isAllView && (
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
            {/* Sentinel for infinite scroll */}
            {hasMore && (
              <Box
                ref={sentinelRef}
                sx={{ py: 4, textAlign: 'center' }}
              >
                <Typography variant="body2" sx={{ color: tokens.colors.text.muted }}>
                  Loading more...
                </Typography>
              </Box>
            )}
          </>
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
                {lightboxIndex !== null ? lightboxIndex + 1 : 0} of {displayedPhotos.length}
              </Typography>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
